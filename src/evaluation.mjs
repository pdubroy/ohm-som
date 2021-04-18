import fs from 'fs'
import path from 'path'

import { compileClass, compile } from './index.mjs'
import initObject from './classes/generated/Object.mjs'
import initInteger from './classes/generated/Integer.mjs'
import initPrimitiveInteger from './classes/primitive/PrimitiveInteger.mjs'
import initPrimitiveObject from './classes/primitive/PrimitiveObject.mjs'

export class Environment {
  constructor () {
    const g = (this.globals = Object.create(null))
    g.PrimitiveObject = initPrimitiveObject(g)
    g.Object = initObject(g)
    g.PrimitiveInteger = initPrimitiveInteger(g)
    g.Integer = initInteger(g)

    Object.assign(g.PrimitiveObject.prototype, {
      // Convenience constructor for integer literals in generated code.
      $int: str => g.Integer['fromString:'](str),
      $send: this.send
    })
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
    const self = new this.globals.Object()
    // eslint-disable-next-line no-new-func
    return new Function(js).call(self)
  }

  eval (source, startRule = 'BlockContents') {
    return this._evalJS(compile(source, startRule))
  }
}

export function doIt (source, startRule = undefined) {
  const ctx = new Environment()
  return ctx.eval(source, startRule)
}
