// Properties beginning with `_` or `$` are not methods; everything else is.
const isMethodName = propName => propName[0] !== '_' && propName[0] !== '$'

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
