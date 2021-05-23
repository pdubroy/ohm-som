import fnv1a from 'fnv1a'

import { assert } from '../assert.mjs'
import { stringValue } from '../helpers.mjs'

export default {
  Object: {
    objectSize () {
      throw new Error('not implemented')
    },

    '==' (other) {
      return this._bool(this === other)
    },

    hashcode () {
      if (this._hashcode === undefined) {
        this._hashcode = fnv1a(new Date().toISOString())
      }
      return this.$Integer._new(this._hashcode)
    },

    inspect () {
      throw new Error('not implemented')
    },

    halt () {
      throw new Error('not implemented')
    },

    'perform:' (aSymbol) {
      return this[stringValue(aSymbol)]()
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

    // ----- ohm-som additions -----

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
    _isInteger () {
      return false
    },
    _isDouble () {
      return false
    }
  }
}
