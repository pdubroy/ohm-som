import { isMethodName } from '../helpers.mjs'

export default {
  Class: {
    name () {
      return this.$String._new(this._name)
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
