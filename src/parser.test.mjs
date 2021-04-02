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

test('message sends', t => {
  t.true(parse('x = (Color yellow)'), 'unary')
  t.true(parse('x = (aPen go: 100.)'), 'keyword')
  t.true(parse('x = (Pen new go: 100.)'), 'unary and keyword')
  t.true(parse('x = (aPen go: 100 + 20.)'), 'keyword and binary')
})

test('nested terms', t => {
  t.true(parse('x = (^(3 + (4)))'))
  t.true(parse('x = (aPen go: (100 + 20).)'))
})

test('array and symbol literals', t => {
  t.true(parse('x = (#())'))
  t.true(parse('x = (#(3 4))'))
  t.true(parse('x = (#(#()))'))
  t.true(parse('x = (#say:to:)'))
  t.true(parse("x = (#(#say:to: 'foo' 9))"))
})

test('blocks', t => {
  t.true(parse('x = (blah collect: [ :x | ^x])'))
  t.true(parse('x = (blah ifTrue: [^1] ifFalse: [^2])'))
})

test('comments', t => {
  t.true(parse('x = ("this is heinous" blah collect: [ :x | ^x])'))
  t.true(parse('x = (blah ifTrue: [^1 "it\'s rad"] ifFalse: [^2])'))
})
