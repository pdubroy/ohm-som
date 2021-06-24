export default g => ({
  Symbol: {
    asString () {
      return g.$String._new(this._str)
    }
  },
  'Symbol class': {
    _new (str) {
      let sym = this._symbolTable.get(str)
      if (!sym) {
        sym = this._basicNew({ _str: str })
        this._symbolTable.set(str, sym)
      }
      return sym
    }
  }
})
