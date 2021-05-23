import { performance } from 'perf_hooks'

import { stringValue } from '../helpers.mjs'

export default {
  System: {
    'global:' (aSymbol) {
      const name = stringValue(aSymbol)
      return this.$Object._prototype[`$${name}`]
    },
    'global:put:' (aSymbol, value) {
      const name = stringValue(aSymbol)
      this.$Object._prototype[`$${name}`] = value
      return this
    },
    'hasGlobal:' (aSymbol) {
      const name = stringValue(aSymbol)
      return this._bool(Reflect.has(this.$Object._prototype, `$${name}`))
    },
    'load:' (symbol) {
      throw new Error('not implemented')
    },
    'exit:' (errno) {
      process.exit(errno)
    },
    'printString:' (string) {
      process.stdout.write(stringValue(string))
      return this
    },
    printNewline () {
      console.log()
      return this
    },
    time () {
      throw new Error('not implemented')
    },
    ticks () {
      return this.$Integer._new(Math.round(performance.now() * 1000))
    },
    fullGC () {
      return this.$false
    }
  }
}
