import { isMethodName } from '../helpers.mjs'

export default {
  Class: {
    name () {
      return this.$String._new(this._name)
    },
    superclass () {
      return Object.getPrototypeOf(this).class()
    },
    _newWithProps (props) {
      const self = Object.create(this._prototype)
      return Object.assign(self, props)
    },
    new () {
      return Object.create(this._prototype)
    },
    fields () {
      throw new Error('not implemented')
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
