import fs from 'fs'
import path from 'path'
// import prettier from 'prettier-standard'

import { assert } from './assert.mjs'
import { ClassLoader } from './ClassLoader.mjs'
import { createKernel } from './kernel.mjs'
import { somClassLibPath } from './paths.mjs'
import { ReturnValue } from './ReturnValue.mjs'
import { createSuperProxy } from './runtime.mjs'

export class Environment {
  constructor () {
    const g = (this.globals = Object.create(null))
    const kernel = createKernel(this.globals)
    this._classLoader = new ClassLoader(kernel)

    this.registerClasspath(somClassLibPath)

    Object.assign(this.globals, {
      $true: g.$True.new(),
      $false: g.$False.new(),
      $nil: kernel.nil,
      $system: g.$System._basicNew(),

      // Convenience constructors.
      _bool: val => (val ? g.$true : g.$false),
      _block1: fn => g.$Block1._new(fn),
      _block2: fn => g.$Block2._new(fn),
      _block3: fn => g.$Block3._new(fn),

      _super: createSuperProxy,
      _symbolTable: new Map()
    })

    g.$Block._prototype['whileTrue:'] =
      g.$Block._prototype['_OVERRIDE_whileTrue:']
  }

  get (key) {
    return this.globals[`$${key}`]
  }

  set (key, val) {
    this.globals[`$${key}`] = val
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

  registerClasspath (classpath) {
    for (const filename of fs.readdirSync(classpath)) {
      if (path.extname(filename) === '.som') {
        const className = path.basename(filename, '.som')
        this.registerClass(className, path.join(classpath, filename))
      }
    }
  }

  eval (source) {
    const Snippet = this._loadClassFromSource(
      `Snippet = (doIt = (^[${source}] value))`,
      false
    )
    return Snippet.new().doIt()
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

  run (args) {
    const { $Array, $String, $system } = this.globals
    const argsArray = $Array._new(args.map(arg => $String._new(arg)))
    $system['initialize:'](argsArray)
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
