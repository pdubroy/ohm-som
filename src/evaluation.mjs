import fs from 'fs'
import path from 'path'

import { compileClass, compile } from './index.mjs'
import { PrimitiveInteger } from './primitives/PrimitiveInteger.mjs'

import { somClassLibPath } from './paths.mjs'

export class ExecutionContext {
  constructor () {
    this.classes = Object.create(null)

    this.loadClass(path.join(somClassLibPath, 'Integer.som'), PrimitiveInteger)
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

  Integer (str) {
    return this.classes.Integer['fromString:'](str)
  }

  Symbol (str) {
    return Symbol.for(str)
  }

  loadClass (filename, superclass = undefined) {
    const source = fs.readFileSync(filename)
    const className = path.basename(filename, '.som')
    return this.loadClassFromSource(source, className, superclass)
  }

  loadClassFromSource (source, expectedClassName = undefined, superclass) {
    const { className, superclassName, js } = compileClass(source, this)
    if (!!expectedClassName && expectedClassName !== className) {
      throw new Error(
        `class name: expected ${expectedClassName}, got ${className}`
      )
    }
    if (superclassName && superclass) {
      throw new Error('bad superclass')
    }
    // eslint-disable-next-line no-new-func
    return (this.classes[className] = new Function('$som', '$superclass', js)(
      this,
      superclass
    ))
  }

  eval (source, startRule = 'BlockContents') {
    // eslint-disable-next-line no-new-func
    return new Function('$som', compile(source, startRule))(this)
  }
}

export function doIt (source, startRule = undefined) {
  const ctx = new ExecutionContext()
  return ctx.eval(source, startRule)
}
