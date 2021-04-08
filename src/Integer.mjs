export class Integer {
  constructor (val) {
    this.val = val
  }

  // Arithmetic
  // ----------

  '+' (argument) {
    return new Integer(this.val + argument.val)
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

Integer['fromString:'] = function (aString) {
  return new Integer(parseInt(aString, 10))
}
