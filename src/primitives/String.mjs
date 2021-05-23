import fnv1a from 'fnv1a'

import { integerValue, stringValue } from '../helpers.mjs'

export default {
  String: {
    'concatenate:' (argument) {
      return this.$String._new(this._str + stringValue(argument.asString()))
    },
    asSymbol () {
      return this.$Symbol._new(this._str)
    },
    hashcode () {
      if (this._hashcode === undefined) {
        this._hashcode = fnv1a(this._str)
      }
      return this.$Integer._new(this._hashcode)
    },
    length () {
      return this.$Integer._new(this._str.length)
    },
    isWhiteSpace () {
      return this._bool(/^\s+$/.test(this._str))
    },
    isLetters () {
      return this._bool(/^\p{L}+$/u.test(this._str))
    },
    isDigits () {
      return this._bool(/^[0-9]+$/.test(this._str))
    },
    '=' (argument) {
      return this._bool(
        argument._isKindOf(this.$String) && argument._str === this._str
      )
    },
    'primSubstringFrom:to:' (start, end) {
      const startVal = integerValue(start) - 1
      const endVal = integerValue(end)
      return this.$String._new(this._str.slice(startVal, endVal))
    },
    [Symbol.toPrimitive] (hint) {
      return this._str
    }
  },
  'String class': {
    _new (str) {
      return this._basicNew({ _str: str })
    }
  }
}
