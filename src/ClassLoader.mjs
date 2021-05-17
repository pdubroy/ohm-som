import fs from 'fs'

import { assert, checkNotNull } from './assert.mjs'
import { compileClass } from './index.mjs'
import { createKernelClasses, createClassStub } from './kernel.mjs'
import { somClassLibPath } from './paths.mjs'
import primitives from './primitives/index.mjs'

export class ClassLoader {
  constructor () {
    this._primitives = new Map()
    this._classMap = new Map()
    this.registerPrimitives(primitives)
    this._initializeKernelClasses()
  }

  _initializeKernelClasses () {
    const kernel = createKernelClasses()

    // Load the compiled methods for the kernel classes.
    for (const name of ['Object', 'Class', 'Metaclass']) {
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

  registerPrimitives (primitives) {
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
      return entry.classObj // The class is already loaded; return it.
    }
    assert(
      entry.filename !== undefined,
      `no known filename for class '${className}'`
    )
    const spec = this._getCompiledClass(entry.filename)
    entry.classObj = this._loadCompiledClass(className, spec)
    return entry.classObj
  }

  loadClassFromSource (source, save = true) {
    const { className, js } = compileClass(source)
    // eslint-disable-next-line no-new-func
    const spec = new Function(`return ${js}`)()
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
    const source = fs.readFileSync(filename)
    const { js } = compileClass(source)
    // eslint-disable-next-line no-new-func
    return new Function(`return ${js}`)()
  }

  _addCompiledMethodsToClass (classObj, instanceSlots, classSlots) {
    Object.assign(classObj._prototype, instanceSlots)
    Object.assign(classObj.class()._prototype, classSlots)
  }
}
