import test from 'ava'
import path from 'path'

import { doIt, loadClass } from './evaluation.mjs'
import { PrimitiveInteger } from './Integer.mjs'
import { testDataPath } from './paths.mjs'

test('basic eval', t => {
  t.is(doIt('^(3 + 4) asString', 'BlockContents'), '7')
  t.is(doIt('| x y | x := 3. y := 4. ^(x + y) asString', 'BlockContents'), '7')
})

test('class loading', t => {
  const Integer = loadClass(
    path.join(testDataPath, 'Integer.som'),
    PrimitiveInteger
  )
  const int = Integer['fromString:']('4')
  t.is(int.val, 4)
})
