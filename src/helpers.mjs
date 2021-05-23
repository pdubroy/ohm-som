import { assert } from './assert.mjs'

export function allKeys (obj) {
  const keys = []
  for (const k in obj) {
    keys.push(k)
  }
  keys.sort((a, b) => a.localeCompare(b))
  return keys
}

// Properties beginning with `_` or `$` are not methods; everything else is.
export const isMethodName = propName =>
  propName[0] !== '_' && propName[0] !== '$'

// Properties beginning with `$` are field names.
export const isFieldName = propName => propName[0] === '$'

export function stringValue (obj) {
  return obj._checkIsKindOf(obj.$String)._str
}

export function numberValue (obj) {
  assert(
    obj._isInteger() || obj._isDouble(),
    `Expected Integer or Double, got ${stringValue(obj.class().name())}`
  )
  return obj._val
}
export function integerValue (obj) {
  assert(
    obj._isInteger(),
    `Expected Integer, got ${stringValue(obj.class().name())}`
  )
  return obj._val
}
