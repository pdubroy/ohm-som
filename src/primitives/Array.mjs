export default {
  Array: {
    'at:' (index) {
      return this._arr[index]
    },
    'at:put:' (index, value) {
      return (this._arr[index._val] = value)
    },
    length () {
      return this._arr.length
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
