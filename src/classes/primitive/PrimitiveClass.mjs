export default function (globals) {
  return class PrimitiveClass extends globals.$Object {
    name () {
      // TODO: This should be wrapped.
      return this.constructor.name
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
