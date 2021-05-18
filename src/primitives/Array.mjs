import { assert } from '../assert.mjs'

export default {
  Array: {
    'at:' (index) {
      assert(index.class().name() === 'Integer')
      return this._arr[index._val - 1]
    },
    'at:put:' (index, value) {
      assert(index.class().name() === 'Integer')
      return (this._arr[index._val - 1] = value)
    },
    length () {
      return this._int(this._arr.length)
    }
  },
  'Array class': {
    _new (arr = []) {
      return this._newWithProps({ _arr: arr })
    },
    'new:' (length) {
      return this._new(new Array(length.val))
    }
  }
}
