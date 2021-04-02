import test from 'ava'

import { parse } from './parser.mjs'

test('trivial method declarations', t => {
  t.true(parse('empty = ()'))
  t.true(parse('empty = primitive'))
  t.true(parse('do: blah with: thing = ()'))
})

test('non-trivial method declarations', t => {
  t.true(parse('three = (^3)'))
  t.true(parse("greet: aPerson = (^'Hello')"))
  t.true(parse('cold = (^-270.00)'))
})

test('binary method declarations', t => {
  t.true(parse('+ aNumber = (^3)'))
  t.true(parse('> aNumber = (^true)'))
  t.true(parse('>> aNumber = (^false)'))
})
