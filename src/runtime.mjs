import { isMethodName } from './helpers.mjs'

const superProxyHandler = {
  get (target, propName, receiver) {
    if (isMethodName(propName)) {
      const superclass = target.class().superclass()
      return superclass._prototype[propName]
    }
    return Reflect.get(...arguments)
  }
}

export function createSuperProxy (target) {
  return new Proxy(target, superProxyHandler)
}
