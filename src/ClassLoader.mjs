import fs from 'fs'
import prettier from 'prettier-standard'

import { assert, checkNotNull } from './assert.mjs'
import { compileClass } from './compilation.mjs'
import { createClassStub } from './kernel.mjs'
import { Logger } from './Logger.mjs'
import { somClassLibPath } from './paths.mjs'
import primitives from './primitives/index.mjs'
import { sendMessage } from './runtime.mjs'

const logger = Logger.get('classloading')

export class ClassLoader {
  constructor (kernel) {
    this._depth = -1
    this._primitives = new Map()
    this._classMap = new Map()

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
      const spec = this._getCompiledClass(`${somClassLibPath}/${name}.som`)
      this._addCompiledMethodsToClass(
        classObj,
        spec.instanceSlots,
        spec.classSlots
      )
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
  _createClass (name, superclass, instSlots = {}, classSlots = {}) {
    const metaclass = createClassStub(
      this.loadClass('Metaclass'),
      `${name} class`,
      superclass.class(),
      classSlots
    )
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
    entry.classObj = this._loadCompiledClass(className, spec)

    this._logInfo(`✔ loaded  ${className}`)
    this._depth -= 1

    return entry.classObj
  }

  loadClassFromSource (source, save = true) {
    const { className, js } = compileClass(source)
    const spec = this._eval(js)
    const classObj = this._loadCompiledClass(className, spec)
    if (save) {
      this._classMap.set(className, { classObj })
    }
    return { className, classObj }
  }

  _loadCompiledClass (className, spec) {
    assert(
      spec.className === className,
      `Bad class name: expected '${className}', got '${spec.className}'`
    )

    const superclass = this.loadClass(spec.superclassName || 'Object')
    const classObj = this._createClass(
      className,
      superclass,
      this._getPrimitives(className),
      this._getPrimitives(`${className} class`)
    )
    this._addCompiledMethodsToClass(
      classObj,
      spec.instanceSlots,
      spec.classSlots
    )
    return classObj
  }

  _getCompiledClass (filename) {
    const jsFilename = `${filename}.js`

    let js
    if (
      Boolean(process.env.USE_PREGENERATED_CLASSES) &&
      fs.existsSync(jsFilename)
    ) {
      this._logInfo(`Reading pre-compiled class from ${jsFilename}`)

      js = fs
        .readFileSync(jsFilename)
        .toString()
        .replace(/^;/, '') // Drop leading `;`
    } else {
      this._logInfo(`Compiling ${filename}`)

      const source = fs.readFileSync(filename)
      js = compileClass(source).js

      if (process.env.DEBUG_GENERATED_CLASSES) {
        this._logInfo(`Writing pre-compiled class to ${jsFilename}`)
        fs.writeFileSync(jsFilename, prettier.format(js))
      }
    }
    return this._eval(js)
  }

  _eval (js) {
    // eslint-disable-next-line no-new-func
    return new Function('nil', '$', `return ${js}`)(this._nil, sendMessage)
  }

  _addCompiledMethodsToClass (classObj, instanceSlots, classSlots) {
    Object.assign(classObj._prototype, instanceSlots)
    Object.assign(classObj.class()._prototype, classSlots)
  }
}
