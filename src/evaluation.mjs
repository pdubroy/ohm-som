import fs from 'fs'
import path from 'path'

import initBlock from './classes/generated/Block.mjs'
import initBoolean from './classes/generated/Boolean.mjs'
import initFalse from './classes/generated/False.mjs'
import initInteger from './classes/generated/Integer.mjs'
import initTrue from './classes/generated/True.mjs'
import initObject from './classes/generated/Object.mjs'
import initPrimitiveBlock from './classes/primitive/PrimitiveBlock.mjs'
import initPrimitiveBoolean from './classes/primitive/PrimitiveBoolean.mjs'
import initPrimitiveInteger from './classes/primitive/PrimitiveInteger.mjs'
import initPrimitiveObject from './classes/primitive/PrimitiveObject.mjs'
import { compileClass, generateClass } from './index.mjs'
import { ReturnValue } from './ReturnValue.mjs'

export class Environment {
  constructor () {
    const PrimitiveObject = initPrimitiveObject()
    const g = (this.globals = PrimitiveObject.prototype)
    g.$PrimitiveObject = PrimitiveObject
    g.$Object = initObject(g)
    g.$PrimitiveInteger = initPrimitiveInteger(g)
    g.$Integer = initInteger(g)
    g.$PrimitiveBoolean = initPrimitiveBoolean(g)
    g.$Boolean = initBoolean(g)
    g.$PrimitiveBlock = initPrimitiveBlock(g)
    g.$Block = initBlock(g)
    g.$True = initTrue(g)
    g.$False = initFalse(g)

    g.$true = new g.$True()
    g.$false = new g.$False()

    // Convenience constructors.
    g.$int = str => g.$Integer['fromString:'](str)
    g.$block = fn => new g.$Block(fn)

    g.$send = this.send
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
    const self = new this.globals.$Object()
    // eslint-disable-next-line no-new-func
    return new Function('globals', js).call(self, this.globals)
  }

  eval (source, startRule = undefined) {
    if (startRule) throw new Error('no allowed!')
    const classDef = `Main = (run = (${source}))`
    let { output } = generateClass(classDef)

    // Hack to deal with improper superclassing!
    output = output.replace('$PrimitiveMain', '$Object')

    const Main = this._evalJS(output)
    return new Main().run()
  }
}

export function doIt (source, startRule = undefined) {
  const ctx = new Environment()
  try {
    return ctx.eval(source, startRule)
  } catch (e) {
    if (e instanceof ReturnValue) return e.v
    throw e
  }
}
