export default {
  Block: {
    value () {
      return this._fn()
    },
    restart () {
      // Not required
    }
  },
  'Block class': {
    _new (fn) {
      return this._newWithProps({ _fn: fn })
    }
  },
  Block1: {
    value () {
      return this._fn()
    }
  },
  Block2: {
    'value:' (arg) {
      return this._fn(arg)
    }
  },
  Block3: {
    'value:with:' (arg1, arg2) {
      return this._fn(arg1, arg2)
    }
  }
}
