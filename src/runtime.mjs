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

export function sendMessage (receiver, selector, ...args) {
  logger.info(
    `sending ${receiver.class()._name} ${selector} w/ ${args.length} args`
  )
  if (selector in receiver) {
    return receiver[selector](...args)
  }
  return receiver['doesNotUnderstand:arguments:'](
    receiver.$Symbol._new(selector),
    receiver.$Array._new(args)
  )
}

export function getGlobal (globals, receiver, name) {
  // TODO: Use `globals` here.
  return receiver[name]
}

export function setGlobal (globals, receiver, name, value) {
  // TODO: Use `globals` here.
  receiver[name] = value
}
