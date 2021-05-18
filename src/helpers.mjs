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

export function getIntegerValue (obj) {
  return obj._checkIsKindOf(obj.$Integer)._val
}

export function stringValue (obj) {
  return obj._checkIsKindOf(obj.$String)._str
}
