export default {
  Class: {
    name () {
      return this._name
    },
    superclass () {
      return Object.getPrototypeOf(this).class()
    },
    _newWithProps (props) {
      return Object.assign(this.new(), props)
    },
    new () {
      return Object.create(this._prototype)
    },
    fields () {
      throw new Error('not implemented')
    },
    methods () {
      throw new Error('not implemented')
    }
  }
}
