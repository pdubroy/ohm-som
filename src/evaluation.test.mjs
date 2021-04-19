import test from 'ava'

import { doIt, Environment } from './evaluation.mjs'

test('prototype chain', t => {
  const env = new Environment()
  const PrimitiveObject = env.get('$PrimitiveObject')
  const o = new PrimitiveObject()
  t.is(typeof o.$int, 'function')
  t.is(o.$PrimitiveObject, PrimitiveObject)
})

test('basic eval w/ PrimitiveInteger', t => {
  t.is(doIt('^(3 + 4) asString', 'BlockContents'), '7')
  t.is(doIt('| x y | x := 3. y := 4. ^(x + y) asString', 'BlockContents'), '7')
})

test('full eval with real Integer class', t => {
  const env = new Environment()

  t.is(env.eval('^4 negated asString'), '-4')
  t.is(env.eval('^(3 + (1 negated - 2)) asString'), '0')

  t.is(env.eval("^(Integer fromString: '42') asString"), '42')
})

test('evaluation with boolean classes', t => {
  const env = new Environment()
  t.is(env.eval('^true asString'), 'true')
  t.is(env.eval('^(true or: []) asString'), 'true')

  t.is(env.eval('^false asString'), 'false')
  t.is(env.eval('^(false and: []) asString'), 'false')
})

/*
  TODO:
  - Implement true/false
      * Requires supporting non-primitive superclasses in generateClass
 */
