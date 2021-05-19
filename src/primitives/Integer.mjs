import { getIntegerValue } from '../helpers.mjs'

export default {
  Integer: {
    // ----- Arithmetic -----

    '+' (other) {
      return this.class()._new(this._val + getIntegerValue(other))
    },
    '-' (other) {
      return this.class()._new(this._val - getIntegerValue(other))
    },
    '*' (other) {
      return this.class()._new(this._val * getIntegerValue(other))
    },
    '/' (other) {
      return this.class()._new(this._val / getIntegerValue(other))
    },
    '//' (argument) {
      throw new Error('not implemented')
    },
    '%' (argument) {
      throw new Error('not implemented')
    },
    'rem:' (argument) {
      throw new Error('not implemented')
    },
    '&' (argument) {
      throw new Error('not implemented')
    },
    '<<' (argument) {
      throw new Error('not implemented')
    },
    '>>>' (argument) {
      throw new Error('not implemented')
    },
    'bitXor:' (argument) {
      throw new Error('not implemented')
    },
    sqrt () {
      throw new Error('not implemented')
    },

    // ----- Random numbers -----
    atRandom () {
      throw new Error('not implemented')
    },

    // ----- Comparing -----

    '=' (other) {
      return this._bool(
        other._isKindOf(this.$Integer) && this._val === getIntegerValue(other)
      )
    },
    '<' (other) {
      return this._bool(
        other._isKindOf(this.$Integer) && this._val < getIntegerValue(other)
      )
    },

    // ----- Converting -----

    asString () {
      return this.$String._new(`${this._val}`)
    },
    as32BitSignedValue () {
      throw new Error('not implemented')
    },
    as32BitUnsignedValue () {
      throw new Error('not implemented')
    }
  },

  'Integer class': {
    _new (val) {
      return this._basicNew({ _val: val })
    },
    'fromString:' (aString) {
      return this._new(parseInt(aString, 10))
    }
  }
}
