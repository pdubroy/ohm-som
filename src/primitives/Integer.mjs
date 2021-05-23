import { numberValue, stringValue } from '../helpers.mjs'

export default {
  Integer: {
    // ----- Arithmetic -----

    '+' (other) {
      const cls = other._isInteger() ? this.$Integer : this.$Double
      return cls._new(this._val + numberValue(other))
    },
    '-' (other) {
      const cls = other._isInteger() ? this.$Integer : this.$Double
      return cls._new(this._val - numberValue(other))
    },
    '*' (other) {
      const cls = other._isInteger() ? this.$Integer : this.$Double
      return cls._new(this._val * numberValue(other))
    },
    // Integer division
    '/' (other) {
      return this.$Integer._new(Math.floor(this._val / numberValue(other)))
    },
    // Double division
    '//' (argument) {
      // Same as Double
      return this.$Double._new(this._val / numberValue(argument))
    },
    // modulo with sign of divisor
    '%' (divisor) {
      const cls = divisor._isInteger() ? this.$Integer : this.$Double
      const divisorVal = numberValue(divisor)
      return cls._new(
        (Math.abs(this._val) % Math.abs(divisorVal)) * Math.sign(divisorVal)
      )
    },
    // modulo with sign of dividend
    'rem:' (divisor) {
      const cls = divisor._isInteger() ? this.$Integer : this.$Double
      const divisorVal = numberValue(divisor)
      return cls._new(
        (Math.abs(this._val) % Math.abs(divisorVal)) * Math.sign(divisorVal)
      )
    },
    '&' (argument) {
      throw new Error('not implemented: Integer>>&')
    },
    '<<' (argument) {
      throw new Error('not implemented: Integer>><<')
    },
    '>>>' (argument) {
      throw new Error('not implemented: Integer>>>>>')
    },
    'bitXor:' (argument) {
      throw new Error('not implemented: Integer>>bitXor:')
    },
    sqrt () {
      // Same as Double
      return this.$Double._new(Math.sqrt(this._val))
    },

    // ----- Random numbers -----
    atRandom () {
      throw new Error('not implemented')
    },

    // ----- Comparing -----

    '=' (other) {
      return this._bool(
        (other._isInteger() || other._isDouble()) &&
          this._val === numberValue(other)
      )
    },
    '<' (other) {
      return this._bool(
        (other._isInteger() || other._isDouble()) &&
          this._val < numberValue(other)
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
    },

    // ----- ohm-som additions -----

    _isInteger () {
      return true
    }
  },

  'Integer class': {
    _new (val) {
      return this._basicNew({ _val: val })
    },
    _newFromString (str) {
      return this._new(parseInt(str, 10))
    },
    'fromString:' (aString) {
      return this._newFromString(stringValue(aString))
    }
  }
}
