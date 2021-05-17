export default {
  Block: {
    value () {
      return this._fn()
    },
    restart () {
      throw new Error('not implemented')
    }
  },
  'Block class': {
    _new (fn) {
      return this._newWithProps({ _fn: fn })
    }
  }
}
