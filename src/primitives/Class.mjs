import { isFieldName, isSelector } from '../helpers.mjs'

export default g => ({
  Class: {
    name () {
      return g.$Symbol._new(this._name)
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
      const fieldNames = this._allInstVarNames()
      return g.$Array._new(fieldNames.map(name => g.$String._new(name)))
    },
    methods () {
      return g.$Array._new(
        Object.keys(this._prototype)
          .filter(isSelector)
          .map(name => g.$Method._new(this, name))
      )
    },

    // ----- Additions in ohm-som -----
    _allInstVarNames () {
      const names = []

      // We need to manually walk up the prototype chain because Object.keys()
      // will see all of the global symbols ($nil, etc.) on Object._prototype.
      let proto = this._prototype
      while (proto != null) {
        for (const name of Object.getOwnPropertyNames(proto)) {
          if (isFieldName(name)) {
            names.push(name.slice(1)) // Strip the '$'
          }
        }
        proto = Object.getPrototypeOf(proto)
      }
      return names
    }
  }
})
