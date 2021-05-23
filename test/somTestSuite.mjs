import test from 'ava'

import { runSomTestSuite } from '../scripts/runSomTestSuite.mjs'

test('SOM test suite', t => {
  t.notThrows(runSomTestSuite())
})
