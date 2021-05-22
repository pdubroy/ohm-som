import { numberValue } from '../helpers.mjs'

export default {
  Double: {
    '+' (argument) {
      return this.$Double._new(this._val + numberValue(argument))
    },
    '-' (argument) {
      return this.$Double._new(this._val - numberValue(argument))
    },
    '*' (argument) {
      return this.$Double._new(this._val * numberValue(argument))
    },
    '//' (argument) {
      return this.$Integer._new(Math.floor(this._val / numberValue(argument)))
    },
    '%' (argument) {
      return this.$Double._new(this._val % numberValue(argument))
    },
    sqrt () {
      return this.$Double._new(Math.sqrt(this._val))
    },
    round () {
      return this.$Integer._new(Math.round(this._val))
    },
    asInteger () {
      return this.$Integer._new(Math.trunc(this._val))
    },
    cos () {
      return this.$Double._new(Math.cos(this._val))
    },
    sin () {
      return this.$Double._new(Math.sin(this._val))
    },
    '=' (argument) {
      return this._bool(this._val === numberValue(argument))
    },
    '<' (argument) {
      return this._bool(this._val < numberValue(argument))
    },
    asString () {
      return this._str(`${this._val}`)
    }
  },
  'Double class': {
    _new (val) {
      return this._basicNew({ _val: val })
    },
    PositiveInfinity () {
      return this.$Double._new(Number.POSITIVE_INFINITY)
    }
  }
}
