import { performance } from 'perf_hooks'

import { stringValue } from '../helpers.mjs'

export default g => ({
  System: {
    'global:' (aSymbol) {
      return this._global(stringValue(aSymbol))
    },
    _global (name) {
      return this._globals[name]
    },
    'global:put:' (aSymbol, value) {
      const name = stringValue(aSymbol)
      this._globals[name] = value
      return this
    },
    'hasGlobal:' (aSymbol) {
      const name = stringValue(aSymbol)
      return g._bool(name in this._globals)
    },
    'load:' (symbol) {
      return this._load(stringValue(symbol))
    },
    _load (className) {
      return this._classLoader.loadClass(className)
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
      return g.Integer._new(Math.round(performance.now() * 1000))
    },
    fullGC () {
      return g.false
    }
  },
  'System class': {
    _new (globals, classLoader) {
      return this._basicNew({ _globals: globals, _classLoader: classLoader })
    }
  }
})
