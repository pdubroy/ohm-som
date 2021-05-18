export default {
  Symbol: {
    asString () {
      return this.$String.new(this._str)
    }
  },
  'Symbol class': {
    _new (str) {
      return this._newWithProps({ _str: str })
    }
  }
}
