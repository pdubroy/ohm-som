export class PrimitiveInteger {
  constructor (val) {
    this.val = val
  }

  // Arithmetic
  // ----------

  '+' (argument) {
    return new this.constructor(this.val + argument.val)
  }

  '-' (argument) {
    return new this.constructor(this.val - argument.val)
  }

  '*' (argument) {
    return new this.constructor(this.val * argument.val)
  }

  '/' (argument) {
    return new this.constructor(this.val / argument.val)
  }

  '//' (argument) {
    throw new Error('not implemented')
  }

  '%' (argument) {
    throw new Error('not implemented')
  }

  'rem:' (argument) {
    throw new Error('not implemented')
  }

  '&' (argument) {
    throw new Error('not implemented')
  }

  '<<' (argument) {
    throw new Error('not implemented')
  }

  '>>>' (argument) {
    throw new Error('not implemented')
  }

  'bitXor:' (argument) {
    throw new Error('not implemented')
  }

  sqrt () {
    throw new Error('not implemented')
  }

  // Random numbers
  atRandom () {
    throw new Error('not implemented')
  }

  // Comparing
  '=' (argument) {
    throw new Error('not implemented')
  }

  '<' (argument) {
    throw new Error('not implemented')
  }

  // Converting
  // ----------

  asString () {
    return `${this.val}`
  }

  as32BitSignedValue () {
    throw new Error('not implemented')
  }

  as32BitUnsignedValue () {
    throw new Error('not implemented')
  }
}

PrimitiveInteger['fromString:'] = function (aString) {
  return new this(parseInt(aString, 10))
}
