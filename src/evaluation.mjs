import fs from 'fs'
import path from 'path'

import { compileClass, compile } from './index.mjs'
import { PrimitiveInteger } from './Integer.mjs'

const globalEnv = {
  send: function send (receiver, selector, args) {
    const method = receiver[selector]
    if (method) {
      return method.call(receiver, ...args)
    } else {
      return send(receiver, 'doesNotUnderstand:arguments:', [
        selector,
        arguments
      ])
    }
  },
  Integer: str => PrimitiveInteger['fromString:'](str),
  Symbol: str => Symbol.for(str)
}

export function loadClass (filename, superclass = undefined) {
  const source = fs.readFileSync(filename)
  const className = path.basename(filename, '.som')
  return loadClassFromSource(source, className, superclass)
}

function loadClassFromSource (
  source,
  expectedClassName = undefined,
  superclass
) {
  const { className, superclassName, js } = compileClass(source, globalEnv)
  if (!!expectedClassName && expectedClassName !== className) {
    throw new Error(
      `class name: expected ${expectedClassName}, got ${className}`
    )
  }
  if (superclassName && superclass) {
    throw new Error('bad superclass')
  }
  const env = {
    ...globalEnv,
    superclass
  }
  // eslint-disable-next-line no-new-func
  globalEnv[className] = new Function('$som', `return ${js}`)(env)
  return globalEnv[className]
}

function evaluate (js) {
  // eslint-disable-next-line no-new-func
  return new Function('$som', js)(globalEnv)
}

export function doIt (source, startRule = undefined) {
  return evaluate(compile(source, startRule))
}
