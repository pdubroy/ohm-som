import test from 'ava'

import { doIt, Environment } from './evaluation.mjs'
import { stringValue } from './helpers.mjs'

test('class hierarchy', t => {
  t.is(stringValue(doIt('Object name')), 'Object')
  t.is(stringValue(doIt('Object class name')), 'Object class')
  t.is(stringValue(doIt('Object superclass asString')), 'nil')
  t.is(stringValue(doIt('Object class class name')), 'Metaclass')
  t.is(stringValue(doIt('Metaclass class class name')), 'Metaclass')
  //  t.is(doIt('Set class methods size asString'), '1')
})

test('isKindOf', t => {
  const env = new Environment()
  const Class = env.get('Class')
  const Metaclass = env.get('Metaclass')
  t.true(Class.new()._isKindOf(Class))
  t.true(Metaclass.new()._isKindOf(Class))
})

test('basic eval w/ PrimitiveInteger', t => {
  t.is(stringValue(doIt('(3 + 4) asString')), '7')
  t.is(stringValue(doIt('| x y | x := 3. y := 4. ^(x + y) asString')), '7')
})

test('full eval with real Integer class', t => {
  t.is(stringValue(doIt('4 negated asString')), '-4')
  t.is(stringValue(doIt('(3 + (1 negated - 2)) asString')), '0')

  t.is(stringValue(doIt("(Integer fromString: '42') asString")), '42')
})

test('evaluation with boolean classes', t => {
  t.is(stringValue(doIt('true asString')), 'true')
  t.is(stringValue(doIt('(true or: []) asString')), 'true')

  t.is(stringValue(doIt('false asString')), 'false')
  t.is(stringValue(doIt('(false and: []) asString')), 'false')
})

test('block value', t => {
  t.is(stringValue(doIt('[true] value asString')), 'true')
  t.is(stringValue(doIt('[[true] value] value asString')), 'true')
  t.is(stringValue(doIt('[|x| x := 3. x + 1] value asString')), '4')
})

test('non-local returns', t => {
  t.is(stringValue(doIt("[^'a'] value. 'b'")), 'a')
  t.is(stringValue(doIt("[[^'a'] value. 'b'] value. 'c'")), 'a')
  t.is(stringValue(doIt("true ifTrue: ['a'] ifFalse: ['b']")), 'a')
})

test('class methods', t => {
  const env = new Environment()
  const Thing = env._loadClassFromSource('Thing = (---- twiddle = ())')
  t.is(typeof Thing.twiddle, 'function')

  t.is(stringValue(env.eval('Thing twiddle name')), 'Thing')
  t.is(stringValue(env.eval('Thing new isNil asString')), 'false')
})

test('classes are objects too', t => {
  t.is(stringValue(doIt('True isNil asString')), 'false')
  t.is(stringValue(doIt('Integer name')), 'Integer')
  t.is(stringValue(doIt('Integer new class name')), 'Integer')
})

test('implicit self return', t => {
  const env = new Environment()
  const Thing = env._loadClassFromSource(
    "Thing = (name = (^'Thing1') yourself = ())"
  )
  t.is(env.globals.$Thing, Thing)
  t.is(stringValue(env.eval('Thing new yourself name')), 'Thing1')
})

test.failing('strings are wrapped', t => {
  t.is(doIt('(True ifNil: [3]) asString'), 'True')
})
