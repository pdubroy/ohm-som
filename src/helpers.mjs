import { assert } from './assert.mjs'

export function allKeys (obj) {
  const keys = []
  for (const k in obj) {
    keys.push(k)
  }
  keys.sort((a, b) => a.localeCompare(b))
  return keys
}

// Properties beginning with '$' are field names.
export const isFieldName = propName => propName[0] === '$'

// Properties beginning with '_' are internal properties.
export const isInternalProperty = propName => propName[0] === '_'

// A selector is any property that is not a field name or an internal property.
export const isSelector = propName =>
  !isFieldName(propName) && !isInternalProperty(propName)

export function arrayValue (obj) {
  return obj._checkIsKindOf('Array')._arr
}

export function integerValue (obj) {
  assert(
    obj._isInteger(),
    `Expected Integer, got ${stringValue(obj.class().name())}`
  )
  return obj._val
}

export function numberValue (obj) {
  assert(
    obj._isInteger() || obj._isDouble(),
    `Expected Integer or Double, got ${stringValue(obj.class().name())}`
  )
  return obj._val
}

export function stringValue (obj) {
  return obj._checkIsKindOf('String')._str
}
