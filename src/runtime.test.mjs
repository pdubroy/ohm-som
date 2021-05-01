import test from 'ava'

import { createSuperProxy } from './runtime.mjs'

test('createSuperProxy', t => {
  class Upper {
    constructor () {
      this._name = 'Upper'
    }

    getName () {
      return this._name.toUpperCase()
    }
  }
  class Lower extends Upper {
    constructor () {
      super()
      this._name = 'Lower'
    }

    getName () {
      return this._name.toLowerCase()
    }
  }
  const lower = new Lower()
  t.is(lower.getName(), 'lower')
  t.is(createSuperProxy(lower).getName(), 'LOWER')
  t.is(createSuperProxy(lower)._name, 'Lower')
  t.throws(() => createSuperProxy(new Upper()).getName())
})
