import { numberValue } from '../helpers.mjs'

export default g => ({
  Double: {
    '+' (argument) {
      return g.$Double._new(this._val + numberValue(argument))
    },
    '-' (argument) {
      return g.$Double._new(this._val - numberValue(argument))
    },
    '*' (argument) {
      return g.$Double._new(this._val * numberValue(argument))
    },
    '//' (argument) {
      return g.$Double._new(this._val / numberValue(argument))
    },
    '%' (argument) {
      return g.$Double._new(this._val % numberValue(argument))
    },
    sqrt () {
      return g.$Double._new(Math.sqrt(this._val))
    },
    round () {
      return g.$Integer._new(Math.round(this._val))
    },
    asInteger () {
      return g.$Integer._new(Math.trunc(this._val))
    },
    cos () {
      return g.$Double._new(Math.cos(this._val))
    },
    sin () {
      return g.$Double._new(Math.sin(this._val))
    },
    '=' (argument) {
      return g._bool(this._val === numberValue(argument))
    },
    '<' (argument) {
      return g._bool(this._val < numberValue(argument))
    },
    asString () {
      return g.$String._new(`${this._val}`)
    },

    // ----- ohm-som additions -----
    _isDouble () {
      return true
    }
  },
  'Double class': {
    _new (val) {
      return this._basicNew({ _val: val })
    },
    PositiveInfinity () {
      return g.$Double._new(Number.POSITIVE_INFINITY)
    }
  }
})
