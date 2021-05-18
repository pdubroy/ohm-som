import test from 'ava'

import { allKeys } from './helpers.mjs'
import { grammar, compile, semantics } from './index.mjs'

function parseMethod (source) {
  const result = grammar.match(source, 'Method')
  if (result.failed()) {
    throw new Error(result.message)
  }
  return result.succeeded()
}

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

test('operations: superclassName', t => {
  t.is(
    semantics(grammar.match('Dog = Animal(run = ())')).superclassName(),
    'Animal'
  )
  t.is(semantics(grammar.match('Dog = (run = ())')).superclassName(), undefined)
})

test('codegen: class and method definitions', t => {
  t.snapshot(compile('Dog = (run = ())'))
  t.snapshot(compile('Dog = (barkAt: x and: y = ())'))
  t.snapshot(compile('Dog = (>> dist = ())'))
})

test('codegen: method bodies', t => {
  t.snapshot(compile('doIt = (^3)', 'Method'))
  t.snapshot(compile('do: x = (^x)', 'Method'))
  t.snapshot(compile('doIt = (| a b | ^a)', 'Method'))
  t.snapshot(compile('doIt = (| x | x := 3. ^x)', 'Method'))
})

test('codegen: message sends', t => {
  //  '4 between: 1 + 1 and: 64 sqrt', 'BlockBody'),
  t.snapshot(compile('4 between: 2 and: 3', 'BlockBody'))
  t.snapshot(compile('4 + 1 between: 2 and: 3', 'BlockBody'))
  t.snapshot(compile('16 sqrt + 1 between: 2 negated and: 8 + 1 ', 'BlockBody'))
})

test('codegen: literals', t => {
  t.snapshot(compile('#between:and:', 'Expression'))
  t.snapshot(compile("#'x'", 'Expression'))

  t.snapshot(compile("''", 'Expression'))

  t.snapshot(compile('4', 'Expression'))
  t.snapshot(compile('-3.14', 'Expression'))

  t.snapshot(compile("#(4 'hey')", 'Expression'))
})

test('codegen: blocks', t => {
  // TODO: Implement non-local return.
  t.snapshot(compile('[]', 'Expression'))
  t.snapshot(compile('[:x|]', 'Expression'))
  t.snapshot(compile('[:x:y|]', 'Expression'))
  t.snapshot(compile('[:x:y|]', 'Expression'))
  t.snapshot(compile('[:x:y|^3.0]', 'Expression'))
})

test('codegen: other expressions', t => {
  t.snapshot(compile('x:=y := 3.0', 'Expression'))
  t.snapshot(compile('x:=(3.0) + ((4.0))', 'Expression'))
})

test('semantics: lexicalVars', t => {
  const root = semantics(grammar.match(`Dog = (
    run: speed = (
      | a b |
      xxx1 do: [:c :d| | d e | ^xxx2]
    )
    bark = (xxx3)
  )`))

  // Calculate the `lexicalVars` attribute on all nodes.
  root.lexicalVars // eslint-disable-line no-unused-expressions

  // An operation that returns the value of `lexicalVars` for the variable
  // node whose text is `str`.
  semantics.addOperation(
    'lexicalVarsAt(str)',
    (() => {
      function handleInternalNode (children) {
        for (const c of children) {
          const vars = c.lexicalVarsAt(this.args.str)
          if (vars) return vars
        }
      }
      return {
        _nonterminal: handleInternalNode,
        _iter: handleInternalNode,
        variable (_) {
          return this.sourceString === this.args.str
            ? this.lexicalVars
            : undefined
        },
        _terminal () {
          return undefined
        }
      }
    })()
  )

  t.deepEqual(allKeys(root.lexicalVarsAt('xxx1')), ['a', 'b', 'speed'])
  t.deepEqual(allKeys(root.lexicalVarsAt('xxx2')), [
    'a',
    'b',
    'c',
    'd',
    'e',
    'speed'
  ])
  t.deepEqual(allKeys(root.lexicalVarsAt('xxx3')), [])
})
