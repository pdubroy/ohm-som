import { integerValue } from '../helpers.mjs'

export default {
  Array: {
    'at:' (index) {
      return this._arr[integerValue(index) - 1]
    },
    'at:put:' (index, value) {
      return (this._arr[integerValue(index) - 1] = value)
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
      const arr = []
      const primitiveLength = integerValue(length)
      for (let i = 0; i < primitiveLength; i++) {
        arr.push(this.$nil)
      }
      return this._new(arr)
    }
  }
}
