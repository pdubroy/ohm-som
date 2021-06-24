export default g => ({
  Block: {
    value () {
      return this._fn()
    },
    restart () {
      throw new Error('Not supported: Block>>restart')
    },
    '_OVERRIDE_whileTrue:' (block) {
      while (this.value() === g.$true) {
        block.value()
      }
      return g.$nil
    }
  },
  'Block class': {
    _new (fn) {
      return this._basicNew({ _fn: fn })
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
})
