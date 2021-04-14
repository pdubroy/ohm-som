import fs from 'fs'
import path from 'path'

import { compileClass, compile } from './index.mjs'
import { Integer } from './classes/generated/Integer.mjs'

export class Environment {
  constructor () {
    this.bindings = new Map([['Integer', Integer(this)]])

    // Convenience constructor for integer literals in generated code.
    this.Integer = str => this.get('Integer')['fromString:'](str)
  }

  get (key) {
    return this.bindings.get(key)
  }

  set (key, val) {
    this.bindings.set(key, val)
  }

  send (receiver, selector, args) {
    const method = receiver[selector]
    if (method) {
      return method.call(receiver, ...args)
    } else {
      // TODO: Implement doesNotUnderstand:arguments:
      throw new Error(`doesNotUnderstand: #${selector} args: [${args}]`)
    }
  }

  loadClass (filename, superclass = undefined) {
    const source = fs.readFileSync(filename)
    const className = path.basename(filename, '.som')
    return this._loadClassFromSource(source, className, superclass)
  }

  _loadClassFromSource (source, expectedClassName = undefined, superclass) {
    const { className, superclassName, js } = compileClass(source, this)
    if (!!expectedClassName && expectedClassName !== className) {
      throw new Error(
        `class name: expected ${expectedClassName}, got ${className}`
      )
    }
    if (superclassName && superclass) {
      throw new Error('bad superclass')
    }

    const loadedClass = this._evalJS(js, { $superclass: superclass })
    this.set(className, loadedClass)
    return loadedClass
  }

  _evalJS (js, extraBindings = {}) {
    // TODO: Find a cleaner way to expose the environment, so that it's totally separate
    // from the JS env.
    const argNames = [
      '$som',
      ...this.bindings.keys(),
      ...Object.keys(extraBindings)
    ]
    const args = [
      this,
      ...this.bindings.values(),
      ...Object.values(extraBindings)
    ]

    // eslint-disable-next-line no-new-func
    return new Function(...argNames, js)(...args)
  }

  eval (source, startRule = 'BlockContents') {
    return this._evalJS(compile(source, startRule))
  }
}

export function doIt (source, startRule = undefined) {
  const ctx = new Environment()
  return ctx.eval(source, startRule)
}
