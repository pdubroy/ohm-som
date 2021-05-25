import test from 'ava'

import { Environment } from '../src/evaluation.mjs'

test('SOM test suite', t => {
  const env = new Environment()
  env.registerClasspath('third_party/SOM-st/SOM/TestSuite')
  t.notThrows(() => env.run(['TestHarness']))
})
