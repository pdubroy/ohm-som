import { isSelector } from './helpers.mjs'

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
  if (selector in receiver) {
    return receiver[selector](...args)
  }
  return receiver['doesNotUnderstand:arguments:'](
    receiver.$Symbol._new(selector),
    receiver.$Array._new(args)
  )
}
