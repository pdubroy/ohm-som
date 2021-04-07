import test from 'ava'

import { parse, compile } from './index.mjs'

const parseMethod = source => parse(source, 'Method')

test('trivial method declarations', t => {
  t.true(parseMethod('empty = ()'))
  t.true(parseMethod('empty = primitive'))
  t.true(parseMethod('do: blah with: thing = ()'))
})

test('non-trivial method declarations', t => {
  t.true(parseMethod('three = (^3)'))
  t.true(parseMethod("greet: aPerson = (^'Hello')"))
  t.true(parseMethod('cold = (^-270.00)'))
})

test('binary method declarations', t => {
  t.true(parseMethod('+ aNumber = (^3)'))
  t.true(parseMethod('> aNumber = (^true)'))
  t.true(parseMethod('>> aNumber = (^false)'))
})

test('message sends', t => {
  t.true(parseMethod('x = (Color yellow)'), 'unary')
  t.true(parseMethod('x = (aPen go: 100.)'), 'keyword')
  t.true(parseMethod('x = (Pen new go: 100.)'), 'unary and keyword')
  t.true(parseMethod('x = (aPen go: 100 + 20.)'), 'keyword and binary')
})

test('nested terms', t => {
  t.true(parseMethod('x = (^(3 + (4)))'))
  t.true(parseMethod('x = (aPen go: (100 + 20).)'))
})

test('array and symbol literals', t => {
  t.true(parseMethod('x = (#())'))
  t.true(parseMethod('x = (#(3 4))'))
  t.true(parseMethod('x = (#(#()))'))
  t.true(parseMethod('x = (#say:to:)'))
  t.true(parseMethod("x = (#(#say:to: 'foo' 9))"))
})

test('blocks', t => {
  t.true(parseMethod('x = (blah collect: [ :x | ^x])'))
  t.true(parseMethod('x = (blah ifTrue: [^1] ifFalse: [^2])'))
})

test('comments', t => {
  t.true(parseMethod('x = ("this is heinous" blah collect: [ :x | ^x])'))
  t.true(parseMethod('x = (blah ifTrue: [^1 "it\'s rad"] ifFalse: [^2])'))
})

test('real-world methods', t => {
  t.true(
    parseMethod(`  testPerform = (
    | o |
    self assert: Integer equals: (23 perform: #class).
    self assert: (23 perform: #between:and: withArguments: (Array with: 22 with: 24)).
    
    o := SuperTest new.
    self assert: #super equals: (o perform: #something inSuperclass: SuperTestSuperClass).
    
    "Trying to see whether the stack in bytecode-based SOMs works properly"
    self assert: #a equals: ((23 perform: #class) = Integer ifTrue: [#a] ifFalse: [#b]).

    self assert: 28 equals: 5 + (23 perform: #value).
  )`)
  )
  t.true(
    parseMethod(`overviewReport = (
    ('Tests passed: ' + passes size asString) println.

    (self hasFailures or: [self hasUnsupported]) ifTrue: [
        '------------------------------' println ].

    self hasUnsupported ifTrue: [
      | lastCategory |
      ('Unsupported optional features: ' + unsupported size asString) println.
      unsupported do: [:each |
        | cat |
        cat := each at: 1.
        cat == lastCategory ifFalse: [
          lastCategory := cat.
          ('\t' + cat) println ].
        ('\t\t' + (each at: 2) asString) println.
        ('\t\t\t' + (each at: 3) value asString) println ].
    ].

    self hasFailures ifTrue: [
      ('Failures: ' + failures size asString) println.
      failures do: [:each |
        ('    ' + each key asString) println.
        ('        ' + each value asString) println ].
    ].
  )`)
  )
})

test('special cases', t => {
  t.throws(
    () => parseMethod('x = (^3. y := 4)'),
    null,
    'return not in trailing position'
  )
  t.throws(() => parseMethod('x = (^3. ^4)'), null, 'multiple returns')
  t.true(parseMethod('x = (^3.)'), 'trailing period')
})

test('minimized source code', t => {
  t.true(
    parseMethod(
      "overviewReport=(('Tests passed:'+passes size asString)println.(self hasFailures or:[self hasUnsupported])ifTrue:['------------------------------'println].self hasUnsupported ifTrue:[|lastCategory|('Unsupported optional features: '+unsupported size asString)println.unsupported do:[:each||cat|cat:=each at:1.cat==lastCategory ifFalse:[lastCategory:=cat.('\t'+cat)println].('\t\t'+(each at: 2)asString)println.('\t\t\t' + (each at: 3)value asString)println]].self hasFailures ifTrue:[('Failures: ' + failures size asString)println.failures do:[:each|('    '+each key asString)println.('        '+each value asString)println]])"
    )
  )
})

test('codegen: class and method definitions', t => {
  t.is(compile('Dog = (run = ())'), "class Dog{'run'(){}}")
  t.is(
    compile('Dog = (barkAt: x and: y = ())'),
    "class Dog{'barkAt:and:'(x, y){}}"
  )
  t.is(compile('Dog = (>> dist = ())'), "class Dog{'>>'(dist){}}")
})

test('codgen: method bodies', t => {
  t.is(compile('doIt = (^3)', 'Method'), "'doIt'(){return $Integer(3)}")
  t.is(compile('do: x = (^x)', 'Method'), "'do:'(x){return x}")
  t.is(compile('doIt = (| a b | ^a)', 'Method'), "'doIt'(){let a,b;return a}")
  t.is(
    compile('doIt = (| x | x := 3. ^x)', 'Method'),
    "'doIt'(){let x;x=$Integer(3);return x}"
  )
})

test('codegen: message sends', t => {
  //  '4 between: 1 + 1 and: 64 sqrt', 'BlockBody'),
  t.is(
    compile('4 between: 2 and: 3', 'BlockBody'),
    "send($Integer(4),'between:and:',[$Integer(2),$Integer(3)])"
  )
  t.is(
    compile('4 + 1 between: 2 and: 3', 'BlockBody'),
    "send(send($Integer(4),'+',[$Integer(1)]),'between:and:',[$Integer(2),$Integer(3)])"
  )
  t.is(
    compile('16 sqrt + 1 between: 2 negated and: 8 + 1 ', 'BlockBody'),
    "send(send(send($Integer(16),'sqrt',[]),'+',[$Integer(1)]),'between:and:',[send($Integer(2),'negated',[]),send($Integer(8),'+',[$Integer(1)])])"
  )
})

test('codegen: literals', t => {
  t.is(compile('#between:and:', 'Expression'), "$Symbol('between:and:')")
  t.is(compile("#'x'", 'Expression'), "$Symbol('x')")

  t.is(compile("''", 'Expression'), "''")

  t.is(compile('4', 'Expression'), '$Integer(4)')
  t.is(compile('-3.14', 'Expression'), '-3.14')

  t.is(compile("#(4 'hey')", 'Expression'), "[$Integer(4),'hey']")
})

test('codegen: blocks', t => {
  // TODO: Implement non-local return.
  t.is(compile('[]', 'Expression'), '()=>{}')
  t.is(compile('[:x|]', 'Expression'), '(x)=>{}')
  t.is(compile('[:x:y|]', 'Expression'), '(x,y)=>{}')
  t.is(compile('[:x:y|]', 'Expression'), '(x,y)=>{}')
  t.is(compile('[:x:y|^3.0]', 'Expression'), '(x,y)=>{return 3.0}')
})

test('codegen: other expressions', t => {
  t.is(compile('x:=y := 3.0', 'Expression'), 'x=y=3.0', 'assignment')
  t.is(
    compile('x:=(3.0) + ((4.0))', 'Expression'),
    "x=send(3.0,'+',[4.0])",
    'nested terms'
  )
})
