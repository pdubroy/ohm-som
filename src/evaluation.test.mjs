import test from 'ava'

import { doIt, Environment } from './evaluation.mjs'

test('class hierarchy', t => {
  t.is(doIt('Object name'), 'Object')
  t.is(doIt('Object class name'), 'Object class')
  t.is(doIt('Object superclass asString'), 'nil')
  t.is(doIt('Object class class name'), 'Metaclass')
  t.is(doIt('Metaclass class class name'), 'Metaclass')
  //  t.is(doIt('Set class methods size asString'), '1')
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

test('class methods', t => {
  const env = new Environment()
  const Thing = env._loadClassFromSource('Thing = (---- twiddle = ())')
  t.is(typeof Thing.twiddle, 'function')

  t.is(env.eval('Thing twiddle name'), 'Thing')
  t.is(env.eval('Thing new isNil asString'), 'false')
})

test('classes are objects too', t => {
  t.is(doIt('True isNil asString'), 'false')
  t.is(doIt('Integer name'), 'Integer')
  t.is(doIt('Integer new class name'), 'Integer')
})

test('implicit self return', t => {
  const env = new Environment()
  const Thing = env._loadClassFromSource(
    "Thing = (name = (^'Thing1') yourself = ())"
  )
  t.is(env.globals.$Thing, Thing)
  t.is(env.eval('Thing new yourself name'), 'Thing1')
})

test.failing('strings are wrapped', t => {
  t.is(doIt('(True ifNil: [3]) asString'), 'True')
})
