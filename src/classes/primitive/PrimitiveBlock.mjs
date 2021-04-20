export default function (globals) {
  return class PrimitiveBlock extends globals.$Object {
    constructor (fn) {
      super()
      this._fn = fn
    }

    value () {
      return this._fn()
    }

    restart () {
      throw new Error('not implemented')
    }
  }
}
