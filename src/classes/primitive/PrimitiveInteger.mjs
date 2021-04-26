export default function (globals) {
  class PrimitiveInteger extends globals.$Object {
    constructor (val) {
      super()
      this._val = val
    }

    // Arithmetic
    // ----------

    '+' ({ _val }) {
      return new this.constructor(this._val + _val)
    }

    '-' ({ _val }) {
      return new this.constructor(this._val - _val)
    }

    '*' ({ _val }) {
      return new this.constructor(this._val * _val)
    }

    '/' ({ _val }) {
      return new this.constructor(this._val / _val)
    }

    '//' (argument) {
      throw new Error('not implemented')
    }

    '%' (argument) {
      throw new Error('not implemented')
    }

    'rem:' (argument) {
      throw new Error('not implemented')
    }

    '&' (argument) {
      throw new Error('not implemented')
    }

    '<<' (argument) {
      throw new Error('not implemented')
    }

    '>>>' (argument) {
      throw new Error('not implemented')
    }

    'bitXor:' (argument) {
      throw new Error('not implemented')
    }

    sqrt () {
      throw new Error('not implemented')
    }

    // Random numbers
    atRandom () {
      throw new Error('not implemented')
    }

    // Comparing
    '=' ({ _val }) {
      return this._val === _val ? this.$true : this.$false
    }

    '<' ({ _val }) {
      return this._val < _val ? this.$true : this.$false
    }

    // Converting
    // ----------

    asString () {
      return `${this._val}`
    }

    as32BitSignedValue () {
      throw new Error('not implemented')
    }

    as32BitUnsignedValue () {
      throw new Error('not implemented')
    }
  }

  PrimitiveInteger['fromString:'] = function (aString) {
    return new this(parseInt(aString, 10))
  }

  return PrimitiveInteger
}
