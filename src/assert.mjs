export function assert (cond, message = undefined) {
  if (!cond) {
    throw new Error(message || 'assertion failed')
  }
}
