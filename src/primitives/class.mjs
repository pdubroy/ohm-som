import { isFieldName, isMethodName } from '../helpers.mjs'

export default {
  Class: {
    name () {
      return this.$Symbol._new(this._name)
    },
    superclass () {
      throw new Error('should not be called — overridden in kernel.mjs')
    },
    _basicNew (props) {
      const self = Object.create(this._prototype)
      return Object.assign(self, props)
    },
    new () {
      return Object.create(this._prototype)
    },
    fields () {
      const fieldNames = []

      // We need to manually walk up the prototype chain because Object.keys()
      // will see all of the global symbols ($nil, etc.) on Object._prototype.
      let proto = this._prototype
      while (proto !== this.$Object._prototype) {
        for (const name of Object.getOwnPropertyNames(proto)) {
          if (isFieldName(name)) {
            fieldNames.push(name.slice(1)) // Strip the '$'
          }
        }
        proto = Object.getPrototypeOf(proto)
      }
      return this.$Array._new(fieldNames.map(name => this.$String._new(name)))
    },
    methods () {
      return this.$Array._new(
        Object.keys(this._prototype)
          .filter(isMethodName)
          .map(name => this.$Method._new(this, name))
      )
    }
  }
}
