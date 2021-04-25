export default function (globals) {
  return class PrimitiveClass extends globals.$Object {
    name () {
      return this._name
    }

    new () {
      return new this()
    }

    superclass () {
      throw new Error('not implemented')
    }

    fields () {
      throw new Error('not implemented')
    }

    methods () {
      throw new Error('not implemented')
    }
  }
}
