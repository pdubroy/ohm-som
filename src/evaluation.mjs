import fs from 'fs'
import path from 'path'
// import prettier from 'prettier-standard'

import * as primitiveClasses from './classes/primitive/index.mjs'
import { assert } from './assert.mjs'
import { generateClass } from './index.mjs'
import { somClassLibPath } from './paths.mjs'
import { ReturnValue } from './ReturnValue.mjs'

export class Environment {
  constructor () {
    const PrimitiveObject = primitiveClasses.PrimitiveObject()
    delete PrimitiveObject.name
    const g = (this.globals = PrimitiveObject.prototype)
    g.$PrimitiveObject = PrimitiveObject

    // Register the classes required for bootstrapping.
    ;['Object', 'Class', 'Boolean', 'True', 'False'].forEach(className => {
      const filename = path.join(somClassLibPath, `${className}.som`)
      this.registerClass(className, filename)
    })
    ;['Block', 'Boolean', 'Class', 'Integer'].forEach(className => {
      // TODO: Filename is not appropriate here, fix this!
      this.registerClass(
        `Primitive${className}`,
        `Primitive${className}.mjs`,
        true
      )
    })
    // The PrimitiveObject class is an instance of `Class`.
    Object.setPrototypeOf(g.$PrimitiveObject, g.$Class.prototype)

    g.$true = new g.$True()
    g.$false = new g.$False()

    // Convenience constructors.
    g._int = str => g.$Integer['fromString:'](str)
    g._block = fn => new g.$Block(fn)
  }

  get (key) {
    return this.globals[key]
  }

  set (key, val) {
    this.globals[key] = val
  }

  // TODO: Could we actually implement message sends as regular JS method calls,
  // with a Proxy object in the prototype chain? That would be cool!
  send (receiver, selector, args) {
    const method = receiver[selector]
    if (method) {
      return method.call(receiver, ...args)
    } else {
      // TODO: Implement doesNotUnderstand:arguments:
      throw new Error(
        `${receiver} doesNotUnderstand: #${selector} args: [${args}]`
      )
    }
  }

  loadClass (filename) {
    const source = fs.readFileSync(filename)
    const className = path.basename(filename, '.som')
    return this._loadClassFromSource(source, className)
  }

  _loadClassFromSource (source, expectedClassName = undefined) {
    const { className, output } = generateClass(source)
    assert(
      !expectedClassName || className === expectedClassName,
      `bad class name - expected ${expectedClassName}, got ${className}`
    )
    const theClass = this._evalJS(output)
    return this._finishLoadingClass(className, theClass)
  }

  _loadPrimitiveClass (filename) {
    const className = path.basename(filename, '.mjs')
    const theClass = primitiveClasses[className](this.globals)
    return this._finishLoadingClass(className, theClass)
  }

  _finishLoadingClass (className, value) {
    Object.defineProperty(this.globals, `$${className}`, {
      value,
      configurable: true,
      enumberable: true
    })
    // Delete the built-in Function.name as it conflicts with Class>>#name.
    // TODO: Consider wrapping the native classes.
    delete value.name
    return value
  }

  // Registers a class for lazy loading, if it is not already loaded.
  registerClass (className, filename, isPrimitive = false) {
    if (!(`$${className}` in this.globals)) {
      Object.defineProperty(this.globals, `$${className}`, {
        get: () =>
          isPrimitive
            ? this._loadPrimitiveClass(filename)
            : this.loadClass(filename),
        configurable: true,
        enumberable: true
      })
    }
  }

  _evalJS (js, extraBindings = {}) {
    // eslint-disable-next-line no-new-func
    return new Function('globals', js)(this.globals)
  }

  eval (source) {
    const UnknownObject = this._loadClassFromSource(
      `UnknownObject = (run = (${source}))`
    )
    const result = new UnknownObject().run()
    delete this.globals.$UnknownObject
    return result
  }
}

// TODO: Factor out all this stuff into separate a class loader module.
function registerStdlibClasses (env) {
  for (const entry of fs.readdirSync(somClassLibPath, {
    withFileTypes: true
  })) {
    const className = path.basename(entry.name, '.som')
    env.registerClass(className, path.join(somClassLibPath, entry.name))
  }
}

export function doIt (source) {
  const env = new Environment()
  registerStdlibClasses(env)

  try {
    return env.eval(source)
  } catch (e) {
    if (e instanceof ReturnValue) return e.v
    throw e
  }
}
