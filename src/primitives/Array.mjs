import { numberValue } from '../helpers.mjs'

export default {
  Array: {
    'at:' (index) {
      return this._arr[numberValue(index) - 1]
    },
    'at:put:' (index, value) {
      return (this._arr[numberValue(index) - 1] = value)
    },
    length () {
      return this.$Integer._new(this._arr.length)
    }
  },
  'Array class': {
    _new (arr = []) {
      return this._basicNew({ _arr: arr })
    },
    'new:' (length) {
      return this._new(new Array(numberValue(length)))
    }
  }
}
