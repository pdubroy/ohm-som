import test from 'ava'

import { doIt, ExecutionContext } from './evaluation.mjs'

test('basic eval w/ PrimitiveInteger', t => {
  t.is(doIt('^(3 + 4) asString', 'BlockContents'), '7')
  t.is(doIt('| x y | x := 3. y := 4. ^(x + y) asString', 'BlockContents'), '7')
})

test('full with real Integer class', t => {
  const ctx = new ExecutionContext()

  const Integer = ctx.classes.Integer
  const x = Integer['fromString:']('4')
  t.is(x.val, 4)
  t.is(typeof x.negated, 'function')

  t.is(ctx.eval('^4 negated asString'), '-4')

  /*
  TODO:
  - Expose class names (e.g. Integer) in the environment.
  - Implement true/false
 */
})
