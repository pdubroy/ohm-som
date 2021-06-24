import { integerValue, numberValue, stringValue } from '../helpers.mjs'

// From https://2ality.com/2012/02/js-integers.html (danke @rauschma)
const modulo = (a, b) => a - Math.floor(a / b) * b
const toUint32 = x => modulo(x - (x % 1), Math.pow(2, 32))
const toInt32 = x => {
  const uint32 = toUint32(x)
  return uint32 >= Math.pow(2, 31) ? uint32 - Math.pow(2, 32) : uint32
}

export default g => ({
  Integer: {
    // ----- Arithmetic -----

    '+' (other) {
      const cls = other._isInteger() ? g.$Integer : g.$Double
      return cls._new(this._val + numberValue(other))
    },
    '-' (other) {
      const cls = other._isInteger() ? g.$Integer : g.$Double
      return cls._new(this._val - numberValue(other))
    },
    '*' (other) {
      const cls = other._isInteger() ? g.$Integer : g.$Double
      return cls._new(this._val * numberValue(other))
    },
    // Integer division
    '/' (other) {
      return g.$Integer._new(Math.floor(this._val / numberValue(other)))
    },
    // Double division
    '//' (argument) {
      // Same as Double
      return g.$Double._new(this._val / numberValue(argument))
    },
    // modulo
    '%' (divisor) {
      const cls = divisor._isInteger() ? g.$Integer : g.$Double
      return cls._new(modulo(this._val, numberValue(divisor)))
    },
    // remainder
    'rem:' (divisor) {
      const cls = divisor._isInteger() ? g.$Integer : g.$Double
      return cls._new(this._val % numberValue(divisor))
    },
    '&' (argument) {
      return g.$Integer._new(this._val & integerValue(argument))
    },
    '<<' (argument) {
      // Avoid using the native `<<` operator, because that converts to int32.
      return g.$Integer._new(this._val * Math.pow(2, integerValue(argument)))
    },
    '>>>' (argument) {
      return g.$Integer._new(this._val >>> integerValue(argument))
    },
    'bitXor:' (argument) {
      return g.$Integer._new(this._val ^ integerValue(argument))
    },
    sqrt () {
      // Almost the same as Double, but uses Integer if possible.
      const val = Math.sqrt(this._val)
      return Number.isInteger(val) ? g.$Integer._new(val) : g.$Double._new(val)
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
    // Integers are always compared by value (not reference) equality.
    // Note that this is not actually specified as a primitive in Integer.som.
    // See https://github.com/SOM-st/SOM/pull/75
    '==' (other) {
      return this['='](other)
    },
    '<' (other) {
      return this._bool(
        (other._isInteger() || other._isDouble()) &&
          this._val < numberValue(other)
      )
    },

    // ----- Converting -----

    asString () {
      return g.$String._new(`${this._val}`)
    },
    as32BitSignedValue () {
      return g.$Integer._new(toInt32(this._val))
    },
    as32BitUnsignedValue () {
      return g.$Integer._new(toUint32(this._val))
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
})
