import fs from 'fs'
import path from 'path'
// import prettier from 'prettier-standard'

import { assert } from './assert.mjs'
import { ClassLoader } from './ClassLoader.mjs'
import { somClassLibPath } from './paths.mjs'
import { ReturnValue } from './ReturnValue.mjs'
import { createSuperProxy } from './runtime.mjs'

export class Environment {
  constructor () {
    this._classLoader = new ClassLoader()

    const Object = this._classLoader.loadClass('Object')
    const g = (this.globals = Object._prototype)
    g.$Object = Object
    g.$Class = this._classLoader.loadClass('Class')
    g.$Metaclass = this._classLoader.loadClass('Metaclass')

    this._registerStdLibClasses()

    g.$true = g.$True.new()
    g.$false = g.$False.new()
    g.$nil = g.$Nil.new()

    // Convenience constructors.
    g._int = str => g.$Integer['fromString:'](str)
    g._str = str => g.$String._new(str)
    g._block1 = fn => g.$Block1._new(fn)
    g._block2 = fn => g.$Block2._new(fn)
    g._block3 = fn => g.$Block3._new(fn)

    g._super = createSuperProxy
  }

  _registerStdLibClasses () {
    for (const entry of fs.readdirSync(somClassLibPath, {
      withFileTypes: true
    })) {
      const className = path.basename(entry.name, '.som')
      this.registerClass(className, path.join(somClassLibPath, entry.name))
    }
  }

  get (key) {
    return this.globals[`$${key}`]
  }

  set (key, val) {
    this.globals[`$${key}`] = val
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

  // Registers a class for lazy loading, if it is not already loaded.
  registerClass (className, filename = undefined) {
    if (!(`$${className}` in this.globals)) {
      if (filename) {
        this._classLoader.registerClass(className, filename)
      }
      Object.defineProperty(this.globals, `$${className}`, {
        get: () => this._classLoader.loadClass(className),
        configurable: true,
        enumberable: true
      })
    }
  }

  eval (source) {
    const UnknownObject = this._loadClassFromSource(
      `UnknownObject = (run = (${source}))`,
      false
    )
    return UnknownObject.new().run()
  }

  loadClass (filename) {
    const ext = path.extname(filename)
    assert(ext === '.som', `Expected .som file, got ${ext} (${filename})`)
    const className = path.basename(filename, ext)
    this._classLoader.registerClass(className, filename)
    return this._classLoader.loadClass(className)
  }

  _loadClassFromSource (source, save = true) {
    const { className, classObj } = this._classLoader.loadClassFromSource(
      source,
      save
    )
    if (save) {
      this.registerClass(className)
    }
    return classObj
  }
}

export function doIt (source) {
  const env = new Environment()

  try {
    return env.eval(source)
  } catch (e) {
    if (e instanceof ReturnValue) return e.v
    throw e
  }
}
