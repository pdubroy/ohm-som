export default {
  System: {
    'global:' (name) {
      throw new Error('not implemented')
    },
    'global:put:' (name, value) {
      throw new Error('not implemented')
    },
    'hasGlobal:' (name) {
      throw new Error('not implemented')
    },
    'load:' (symbol) {
      throw new Error('not implemented')
    },
    'exit:' (errno) {
      throw new Error('not implemented')
    },
    'printString:' (string) {
      throw new Error('not implemented')
    },
    printNewline () {
      throw new Error('not implemented')
    },
    time () {
      throw new Error('not implemented')
    },
    ticks () {
      throw new Error('not implemented')
    },
    fullGC () {
      throw new Error('not implemented')
    }
  }
}
