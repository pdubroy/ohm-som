export default function (globals) {
  return class PrimitiveArray extends globals.$Object {
    constructor (arr = []) {
      super()
      this._value = arr
    }

    'at:' (index) {
      return this._arr[index]
    }

    'at:put:' (index, value) {
      return (this._arr[index] = value)
    }

    length () {
      return this._arr.length
    }

    static 'new:' (length) {
      return new this(new Array(length))
    }
  }
}
