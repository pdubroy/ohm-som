import fnv1a from 'fnv1a'

import { integerValue, stringValue } from '../helpers.mjs'

export default g => ({
  String: {
    'concatenate:' (argument) {
      return g.String._new(this._str + stringValue(argument.asString()))
    },
    asSymbol () {
      return g.Symbol._new(this._str)
    },
    hashcode () {
      if (this._hashcode === undefined) {
        this._hashcode = fnv1a(this._str)
      }
      return g.Integer._new(this._hashcode)
    },
    length () {
      return g.Integer._new(this._str.length)
    },
    isWhiteSpace () {
      return g._bool(/^\s+$/.test(this._str))
    },
    isLetters () {
      return g._bool(/^\p{L}+$/u.test(this._str))
    },
    isDigits () {
      return g._bool(/^[0-9]+$/.test(this._str))
    },
    '=' (argument) {
      return g._bool(
        argument._isKindOf(g.String) && argument._str === this._str
      )
    },
    'primSubstringFrom:to:' (start, end) {
      const startVal = integerValue(start) - 1
      const endVal = integerValue(end)
      return g.String._new(this._str.slice(startVal, endVal))
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
})
