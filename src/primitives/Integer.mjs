export default {
  Integer: {
    // ----- Arithmetic -----

    '+' ({ _val }) {
      return this.class()._new(this._val + _val)
    },
    '-' ({ _val }) {
      return this.class()._new(this._val - _val)
    },
    '*' ({ _val }) {
      return this.class()._new(this._val * _val)
    },
    '/' ({ _val }) {
      return this.class()._new(this._val / _val)
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

    '=' ({ _val }) {
      return this._val === _val ? this.$true : this.$false
    },
    '<' ({ _val }) {
      return this._val < _val ? this.$true : this.$false
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
      return this._newWithProps({ _val: val })
    },
    'fromString:' (aString) {
      return this._new(parseInt(aString, 10))
    }
  }
}
