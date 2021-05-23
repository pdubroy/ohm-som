import { stringValue } from '../helpers.mjs'

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
      process.exit(errno)
    },
    'printString:' (string) {
      process.stdout.write(stringValue(string))
    },
    printNewline () {
      console.log()
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
