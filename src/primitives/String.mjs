import { getIntegerValue, stringValue } from '../helpers.mjs'

export default {
  String: {
    'concatenate:' (argument) {
      return this.$String._new(this._str + stringValue(argument.asString()))
    },
    asSymbol () {
      throw new Error('not implemented')
    },
    hashcode () {
      throw new Error('not implemented')
    },
    length () {
      return this._int(this._str.length)
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
      const startVal = getIntegerValue(start) - 1
      const endVal = getIntegerValue(end)
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
