import fs from 'fs'
import prettier from 'prettier-standard'

import { assert, checkNotNull } from './assert.mjs'
import { compileClass } from './compilation.mjs'
import { createClassStub } from './kernel.mjs'
import { Logger } from './Logger.mjs'
import { somClassLibPath } from './paths.mjs'
import primitives from './primitives/index.mjs'
import { getGlobal, setGlobal, sendMessage } from './runtime.mjs'

const logger = Logger.get('classloading')

export class ClassLoader {
  constructor (kernel, globals) {
    this._depth = -1
    this._primitives = new Map()
    this._classMap = new Map()

    this._setGlobal = (...args) => setGlobal(globals, ...args)
    this._getGlobal = (...args) => getGlobal(globals, ...args)

    this._registerPrimitives(primitives)
    this._initializeKernelClasses(kernel)
    this._nil = kernel.nil
  }

  _logInfo (msg) {
    const indent = new Array(this._depth + 1).join('  ')
    logger.info(`${indent}${msg}`)
  }

  _initializeKernelClasses (kernel) {
    // Load the compiled methods for the kernel classes.
    for (const name of ['Object', 'Class', 'Metaclass', 'Nil']) {
      const classObj = kernel[name]
      const filename = `${somClassLibPath}/${name}.som`
      const spec = this._getCompiledClass(filename)
      this._addMethodsToClass(classObj, spec, filename)
      this._classMap.set(name, { classObj })
    }
  }

  _getPrimitives (name, defaultValue = {}) {
    return this._primitives.get(name) || defaultValue
  }

  _registerPrimitives (primitives) {
    for (const name in primitives) {
      assert(
        !this._primitives.has(name),
        `'${name}' primitives already registered`
      )
      this._primitives.set(name, primitives[name])
    }
  }

  // Create a new class named `name` which inherits from `superclass`.
  // Also creates the associated metaclass.
  _createClass (
    name,
    superclass,
    instVarNames,
    instMethods,
    classVarNames = [],
    classMethods = {}
  ) {
    const classSlots = { ...classMethods, _instVarNames: classVarNames }
    const metaclass = createClassStub(
      this.loadClass('Metaclass'),
      `${name} class`,
      superclass.class(),
      classSlots
    )
    const instSlots = { ...instMethods, _instVarNames: instVarNames }
    return createClassStub(metaclass, name, superclass, instSlots)
  }

  registerClass (className, filename) {
    const entry = this._classMap.get(className) || {}
    this._classMap.set(className, { ...entry, filename })
  }

  loadClass (className) {
    const entry = checkNotNull(
      this._classMap.get(className),
      `no class map entry for '${className}'`
    )

    if (entry.classObj) {
      return entry.classObj // Already loaded; return it.
    }

    this._depth += 1
    this._logInfo(`loadClass ${className}...`)
    assert(
      entry.filename !== undefined,
      `no known filename for class '${className}'`
    )

    const spec = this._getCompiledClass(entry.filename)
    entry.classObj = this._loadCompiledClass(entry.filename, className, spec)

    this._logInfo(`✔ loaded  ${className}`)
    this._depth -= 1

    return entry.classObj
  }

  loadClassFromSource (source, save = true) {
    const spec = compileClass(source)
    const { className } = spec
    const classObj = this._loadCompiledClass(undefined, className, spec)
    if (save) {
      this._classMap.set(className, { classObj })
    }
    return { className, classObj }
  }

  _loadCompiledClass (filename, className, spec) {
    assert(
      spec.className === className,
      `Bad class name: expected '${className}', got '${spec.className}'`
    )
    const superclass = this.loadClass(spec.superclassName || 'Object')
    const cls = this._createClass(
      className,
      superclass,
      spec.instanceVariableNames,
      this._getPrimitives(className),
      spec.classVariableNames,
      this._getPrimitives(`${className} class`)
    )

    this._addMethodsToClass(cls, spec, filename)
    return cls
  }

  _getCompiledClass (filename) {
    const jsFilename = `${filename}.js`

    if (
      Boolean(process.env.USE_PREGENERATED_CLASSES) &&
      fs.existsSync(jsFilename)
    ) {
      this._logInfo(`Reading pre-compiled class from ${jsFilename}`)
      // Read in the source, dropping any leading `;` added by prettier.
      const jsSource = fs.readFileSync(jsFilename, 'utf-8').replace(/^;/, '')
      return this._eval(jsSource)
    }

    this._logInfo(`Compiling ${filename}`)
    const source = fs.readFileSync(filename, 'utf-8')
    return compileClass(source)
  }

  _eval (jsExpr) {
    // eslint-disable-next-line no-new-func
    return new Function('nil', '$', '$g', '$setG', `return ${jsExpr}`)(
      this._nil,
      sendMessage,
      this._getGlobal,
      this._setGlobal
    )
  }

  _addMethodsToClass (cls, spec, filenameForDebugging) {
    if (spec.instanceMethods != null) {
      // This is a pregenerated class -- no need to eval, just copy the methods.
      Object.assign(cls._prototype, spec.instanceMethods)
      Object.assign(cls.class()._prototype, spec.classMethods)
      return
    }

    const instMethods = spec.instanceMethodsToJS(cls)
    const classMethods = spec.classMethodsToJS(cls.class())
    Object.assign(cls._prototype, this._eval(instMethods))
    Object.assign(cls.class()._prototype, this._eval(classMethods))

    // Optionally write the serialized, compiled class to disk for debugging.
    if (filenameForDebugging && Boolean(process.env.DEBUG_GENERATED_CLASSES)) {
      const jsFilename = `${filenameForDebugging}.js`
      this._logInfo(`Writing pre-compiled class to ${jsFilename}`)
      const prettyInstMethods = prettier.format(`(${instMethods})`)
      const prettyClassMethods = prettier.format(`(${classMethods})`)
      const output = `
        ({
          className: ${JSON.stringify(spec.className)},
          superclassName: ${JSON.stringify(spec.superclassName)},
          instanceVariableNames: ${JSON.stringify(spec.instanceVariableNames)},
          classVariableNames: ${JSON.stringify(spec.classVariableNames)},
          instanceMethods: ${prettyInstMethods.replace(/^;/, '')},
          classMethods: ${prettyClassMethods.replace(/^;/, '')}
        })
      `
      fs.writeFileSync(jsFilename, prettier.format(output))
    }
  }
}
