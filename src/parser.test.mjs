import test from 'ava'

import { parse } from './parser.mjs'

test('method declarations', t => {
  t.true(parse(`empty = ()`))
  t.true(parse(`empty = primitive`))
  t.true(parse(`do: blah with: thing = ()`))
})
