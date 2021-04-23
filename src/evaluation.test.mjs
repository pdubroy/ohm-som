import test from 'ava'

import { doIt, Environment } from './evaluation.mjs'

test('prototype chain', t => {
  const env = new Environment()
  const PrimitiveObject = env.get('$PrimitiveObject')
  const o = new PrimitiveObject()
  t.is(typeof o._int, 'function')
  t.is(o.$PrimitiveObject, PrimitiveObject)
})

test('basic eval w/ PrimitiveInteger', t => {
  t.is(doIt('(3 + 4) asString'), '7')
  t.is(doIt('| x y | x := 3. y := 4. ^(x + y) asString'), '7')
})

test('full eval with real Integer class', t => {
  t.is(doIt('4 negated asString'), '-4')
  t.is(doIt('(3 + (1 negated - 2)) asString'), '0')

  t.is(doIt("(Integer fromString: '42') asString"), '42')
})

test('evaluation with boolean classes', t => {
  t.is(doIt('true asString'), 'true')
  t.is(doIt('(true or: []) asString'), 'true')

  t.is(doIt('false asString'), 'false')
  t.is(doIt('(false and: []) asString'), 'false')
})

test('block value', t => {
  t.is(doIt('[true] value asString'), 'true')
  t.is(doIt('[[true] value] value asString'), 'true')
  t.is(doIt('[|x| x := 3. x + 1] value asString'), '4')
})

test('non-local returns', t => {
  t.is(doIt("[^'a'] value. 'b'"), 'a')
  t.is(doIt("[[^'a'] value. 'b'] value. 'c'"), 'a')
  t.is(doIt("true ifTrue: ['a'] ifFalse: ['b']"), 'a')
})
