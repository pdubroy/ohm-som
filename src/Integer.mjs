export class PrimitiveInteger {
  constructor (val) {
    this.val = val
  }

  // Arithmetic
  // ----------

  '+' (argument) {
    return new PrimitiveInteger(this.val + argument.val)
  }

  '-' (argument) {
    throw new Error('not implemented')
  }

  '*' (argument) {
    throw new Error('not implemented')
  }

  '/' (argument) {
    throw new Error('not implemented')
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
  // TODO: This is wrong! Should create an Integer, not PrimitiveInteger.
  return new PrimitiveInteger(parseInt(aString, 10))
}
