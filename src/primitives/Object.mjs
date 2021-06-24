import fnv1a from 'fnv1a'

import { assert, checkNotNull } from '../assert.mjs'
import { integerValue, arrayValue, stringValue } from '../helpers.mjs'

export default g => ({
  Object: {
    objectSize () {
      throw new Error('not implemented')
    },

    '==' (other) {
      return g._bool(this === other)
    },

    hashcode () {
      if (this._hashcode === undefined) {
        this._hashcode = fnv1a(new Date().toISOString())
      }
      return g.$Integer._new(this._hashcode)
    },

    inspect () {
      throw new Error('not implemented')
    },

    halt () {
      throw new Error('not implemented')
    },

    'perform:' (selector) {
      return this[stringValue(selector)]()
    },

    'perform:withArguments:' (selector, args) {
      return this[stringValue(selector)](...arrayValue(args))
    },

    'perform:inSuperclass:' (selector, cls) {
      assert(cls === this.class().superclass())
      return cls._prototype[stringValue(selector)].call(this)
    },

    'perform:withArguments:inSuperclass:' (selector, args, cls) {
      assert(cls === this.class().superclass())
      return cls._prototype[stringValue(selector)].apply(this, arrayValue(args))
    },

    'instVarAt:' (idx) {
      const name = this._instVarNames[integerValue(idx) - 1]
      return this[`$${name}`]
    },

    'instVarAt:put:' (idx, obj) {
      const name = this._instVarNames[integerValue(idx) - 1]
      return (this[`$${name}`] = obj)
    },

    'instVarNamed:' (sym) {
      return this[`$${stringValue(sym)}`]
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
    _checkIsKindOf (className) {
      const cls = checkNotNull(
        g[`$${className}`],
        `No class named '${className}'`
      )
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
})
