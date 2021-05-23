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
      throw new Error('not implemented')
    },
    length () {
      return this.$Integer._new(this._str.length)
    },
    isWhiteSpace () {
      throw new Error('not implemented')
    },
    isLetters () {
      throw new Error('not implemented')
    },
    isDigits () {
      throw new Error('not implemented')
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
