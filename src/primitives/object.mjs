import { assert } from '../assert.mjs'

export default {
  Object: {
    objectSize () {
      throw new Error('not implemented')
    },

    '==' (other) {
      return this === other
    },

    hashcode () {
      throw new Error('not implemented')
    },

    inspect () {
      throw new Error('not implemented')
    },

    halt () {
      throw new Error('not implemented')
    },

    'perform:' (aSymbol) {
      throw new Error('not implemented')
    },

    'perform:withArguments:' (aSymbol, args) {
      throw new Error('not implemented')
    },

    'perform:inSuperclass:' (aSymbol, cls) {
      throw new Error('not implemented')
    },

    'perform:withArguments:inSuperclass:' (aSymbol, args, cls) {
      throw new Error('not implemented')
    },

    'instVarAt:' (idx) {
      throw new Error('not implemented')
    },

    'instVarAt:put:' (idx, obj) {
      throw new Error('not implemented')
    },

    'instVarNamed:' (sym) {
      throw new Error('not implemented')
    },

    _isKindOf (cls) {
      let proto = this
      while ((proto = Object.getPrototypeOf(proto))) {
        if (proto === cls._prototype) {
          return true
        }
      }
      return false
    },
    _checkIsKindOf (cls) {
      const className = cls._name
      assert(this._isKindOf(cls), `Not a ${className}`)
      return this
    },
    _checkIsInteger () {
      return this._checkIsKindOf(this.$Integer)
    }
  }
}
