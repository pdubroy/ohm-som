import { checkNotNull } from './assert.mjs'
import { isSelector } from './helpers.mjs'
import { Logger } from './Logger.mjs'

const logger = Logger.get('runtime')

const superProxyHandler = {
  get (target, propName, _receiver) {
    if (isSelector(propName)) {
      const superclass = target.class().superclass()
      return superclass._prototype[propName]
    }
    return Reflect.get(...arguments)
  }
}

export function createSuperProxy (target) {
  return new Proxy(target, superProxyHandler)
}

export function sendMessage (globals, receiver, selector, ...args) {
  checkNotNull(receiver, `receiver of #${selector} is null`)
  logger.info(
    `sending ${receiver.class()._name}>>#${selector} w/ ${args.length} args`
  )
  if (selector in receiver) {
    return receiver[selector](...args)
  }
  return receiver['doesNotUnderstand:arguments:'](
    globals.Symbol._new(selector),
    globals.Array._new(args)
  )
}

export function getGlobal (globals, name, receiver) {
  if (name in globals) {
    return globals[name]
  }
  return receiver['unknownGlobal:'](globals.Symbol._new(name))
}

export function setGlobal (globals, name, value, receiver) {
  globals[name] = value
}
