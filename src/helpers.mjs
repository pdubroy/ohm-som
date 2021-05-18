export function allKeys (obj) {
  const keys = []
  for (const k in obj) {
    keys.push(k)
  }
  keys.sort((a, b) => a.localeCompare(b))
  return keys
}
