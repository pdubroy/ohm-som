export function assert (cond, message = undefined) {
  if (!cond) {
    throw new Error(message || 'assertion failed')
  }
}

export function checkNotNull (x, message = undefined) {
  assert(x != null, message || `expected non-null value: ${x}`)
  return x
}
