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
      return this.$Array._new(
        Object.keys(this._prototype)
          .filter(isFieldName)
          .map(name => name.slice(1))
      )
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
