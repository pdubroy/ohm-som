import fs from 'fs'
import ohm from 'ohm-js'
import path from 'path'

import { assert } from './assert.mjs'
import { somGrammarPath } from './paths.mjs'

// From https://262.ecma-international.org/11.0/#sec-keywords-and-reserved-words
// prettier-ignore
const jsReservedWords = [
  // Reserved words:
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instance', 'of', 'new',
  'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with', 'yield',

  // Contextually disallowed as identifiers, in strict mode code:
  'let', 'static', 'implements', 'interface', 'package', 'private', 'protected', 'public',

  // Not keywords, but subject to some restrictions in strict mode code:
  'arguments', 'eval'
]

export const grammar = ohm.grammar(fs.readFileSync(somGrammarPath))

export const semantics = grammar.createSemantics()

semantics.addOperation('className', {
  Classdef (id, eq, superclass, instSlots, sep, classSlots, end) {
    return id.sourceString
  }
})

semantics.addOperation('superclassName', {
  Classdef (id, eq, superclass, instSlots, sep, classSlots, end) {
    return superclass.superclassName()
  },
  Superclass (idOpt, _) {
    return idOpt.child(0) && idOpt.child(0).sourceString
  }
})

// Return `true` if the method is a primitive method, and `false` otherwise.
semantics.addOperation('isPrimitive', {
  Method (pattern, _, primitiveOrMethodBlock) {
    return primitiveOrMethodBlock.isPrimitive()
  },
  primitive (_) {
    return true
  },
  MethodBlock (_, blockContents, _end) {
    return false
  }
})

semantics.addAttribute(
  'lexicalVars',
  (() => {
    const envStack = [Object.create(null)]

    const withEnv = (ids, fn) => {
      const env = Object.create(envStack[envStack.length - 1])
      ids.forEach(id => {
        env[id] = id
      })
      envStack.push(env)
      fn()
      return envStack.pop()
    }

    return {
      Method (pattern, _eq, body) {
        return withEnv(pattern.identifiers(), () => {
          body.lexicalVars // eslint-disable-line no-unused-expressions
        })
      },
      BlockContents (_, localDefsOpt, _1, blockBody) {
        const localDefs = localDefsOpt.child(0)
        const ids = localDefs ? localDefs.identifiers() : []
        return withEnv(ids, () => {
          blockBody.lexicalVars // eslint-disable-line no-unused-expressions
        })
      },
      _nonterminal (children) {
        children.forEach(c => c.lexicalVars)
        return envStack[envStack.length - 1]
      },
      _terminal () {
        return envStack[envStack.length - 1]
      }
    }
  })()
)

semantics.addOperation('identifiers()', {
  UnaryPattern (selector) {
    return []
  },
  BinaryPattern (selector, ident) {
    return ident.identifiers()
  },
  KeywordPattern (keywordIter, identIter) {
    return identIter.identifiers()
  },
  _nonterminal (children) {
    return children.flatMap(c => c.identifiers())
  },
  _iter (children) {
    return children.flatMap(c => c.identifiers())
  },
  identifier (first, rest) {
    return [this.sourceString]
  }
})

semantics.addOperation('toJS()', {
  // Returns a JavaScript *expression* for a Smalltalk class definition.
  Classdef (id, _, superclass, instSlots, _sep, classSlotsOpt, _end) {
    // Calculate the `lexicalVars` attribute on all nodes.
    this.lexicalVars // eslint-disable-line no-unused-expressions

    const className = id.toJS()
    const classDecl = [
      `class ${className} extends $superclass {`,
      instSlots.toJS(),
      '}'
    ].join('')
    if (classSlotsOpt._node.hasChildren()) {
      const statics = `${classSlotsOpt.toJS()}`
      return `Object.assign(${classDecl},${statics});`
    } else {
      return classDecl
    }
  },
  identifier (first, rest) {
    const id = this.sourceString
    return jsReservedWords.includes(id) ? `_${id}` : id
  },
  InstanceSlots (_, identOpt, _end, methodIter) {
    const identifiers = identOpt.toJS()[0] || []
    return (
      identifiers.map(id => `${id}=undefined;`).join('\n') +
      methodIter.toJS().join('\n')
    )
  },
  ClassSlots (_, identOpt, _end, methodIter) {
    let props = []
    if (identOpt._node.hasChildren()) {
      props = identOpt.toJS()[0].map(name => `${name}: undefined`)
    }
    const methods = methodIter.toJS()
    return '{' + [...props, ...methods].join(',') + '}'
  },
  Method (pattern, _eq, body) {
    // Calculate the `lexicalVars` attribute on all nodes.
    this.lexicalVars // eslint-disable-line no-unused-expressions

    if (body.isPrimitive()) {
      return ''
    }
    const selector = pattern.selector()
    const paramList = pattern.params().join(', ')
    return `'${selector}'(${paramList}){${body.toJS()}}`
  },
  MethodBlock (_open, blockContentsOpt, _close) {
    return blockContentsOpt.toJS().join('')
  },
  BlockContents (_or, localDefsOpt, _, blockBody) {
    return localDefsOpt.toJS().join('') + blockBody.toJS()
  },
  LocalDefs (identifiers) {
    return `let ${identifiers.toJS().join(',')};`
  },
  BlockBody_return (_, result) {
    return `return ${result.toJS()}`
  },
  BlockBody_rec (exp, _, blockBodyIter) {
    return [exp.toJS(), ...blockBodyIter.toJS()].join(';')
  },
  Expression_assignment (ident, _, exp) {
    return `${ident.toJS()}=${exp.toJS()}`
  },
  KeywordExpression_rec (exp, message) {
    const { selector, args } = message.selectorAndArgsToJS()
    return `this.$send(${exp.toJS()},${selector},${args})`
  },
  BinaryExpression_rec (exp, message) {
    const { selector, args } = message.selectorAndArgsToJS()
    return `this.$send(${exp.toJS()},${selector},${args})`
  },
  UnaryExpression_rec (exp, message) {
    const { selector, args } = message.selectorAndArgsToJS()
    return `this.$send(${exp.toJS()},${selector},${args})`
  },
  Result (exp, _) {
    return exp.toJS()
  },
  NestedTerm (_open, exp, _close) {
    return exp.toJS()
  },
  NestedBlock (_open, blockPatternOpt, blockContentsOpt, _close) {
    return `(${blockPatternOpt.toJS()})=>{${blockContentsOpt.toJS()}}`
  },
  BlockPattern (blockArguments, _) {
    return blockArguments.toJS()
  },
  BlockArguments (_, identIter) {
    return identIter.toJS().join(',')
  },
  LiteralArray (_, _open, literalIter, _close) {
    return `[${literalIter.toJS().join(',')}]`
  },
  LiteralNumber_double (_, double) {
    return `${this.sourceString}`
  },
  LiteralNumber_int (_, integer) {
    return `this.$int(${this.sourceString})`
  },
  LiteralSymbol (_, stringOrSelector) {
    return `Symbol.for(${stringOrSelector.asString()})`
  },
  LiteralString (str) {
    return `${str.asString()}`
  },
  variable (pseudoVarOrIdent) {
    if (pseudoVarOrIdent._node.ctorName === 'identifier') {
      const id = pseudoVarOrIdent.toJS()
      return id in this.lexicalVars ? id : `this.$vars.${id}`
    }
    return pseudoVarOrIdent.toJS()
  },
  self (_) {
    return 'this'
  },
  super (_) {
    return 'super'
  },
  nil (_) {
    return 'this.$vars.nil'
  },
  true (_) {
    return 'this.$vars.true'
  },
  false (_) {
    return 'this.$vars.false'
  }
})

semantics.addOperation('selectorAndArgsToJS', {
  KeywordMessage (keywordIter, binaryExpIter) {
    return {
      selector: `'${this.selector()}'`,
      args: `[${binaryExpIter.toJS()}]`
    }
  },
  BinaryMessage (selector, exp) {
    return {
      selector: `'${this.selector()}'`,
      args: `[${exp.toJS()}]`
    }
  },
  UnaryMessage (selector) {
    return {
      selector: `'${this.selector()}'`,
      args: '[]'
    }
  }
})

semantics.addOperation('selector', {
  Method (pattern, _eq, _) {
    return pattern.selector()
  },
  UnaryPattern (selector) {
    return selector.sourceString
  },
  UnaryMessage (selector) {
    return selector.sourceString
  },
  BinaryPattern (selector, _) {
    return selector.sourceString
  },
  BinaryMessage (selector, _) {
    return selector.sourceString
  },
  KeywordPattern (keywordIter, _) {
    return keywordIter.children.map(c => c.sourceString).join('')
  },
  KeywordMessage (keywordIter, _) {
    return keywordIter.children.map(c => c.sourceString).join('')
  }
})

semantics.addOperation('asString', {
  keyword (ident, _) {
    return `'${this.sourceString}'`
  },
  unarySelector (_) {
    return `'${this.sourceString}'`
  },
  binarySelector (_) {
    return `'${this.sourceString}'`
  },
  keywordSelector (keywordIter) {
    return `'${this.sourceString}'`
  },
  string (_open, charIter, _close) {
    return this.sourceString
  }
})

semantics.addOperation('params', {
  UnaryPattern (_) {
    return []
  },
  BinaryPattern (_, param) {
    return [param.toJS()]
  },
  KeywordPattern (_, params) {
    return params.toJS()
  }
})

export function compile (source, startRule = undefined) {
  const result = grammar.match(source, startRule)
  return semantics(result).toJS()
}

export function compileClass (source, env) {
  const result = grammar.match(source)
  if (result.failed()) {
    throw new Error(result.message)
  }
  // TODO: Use `env` to ensure there are no undefined references.
  return {
    className: semantics(result).className(),
    superclassName: semantics(result).superclassName(),
    js: `${semantics(result).toJS()}`
  }
}

export function generateClass (source, expectedClassName, prettier = s => s) {
  const { className, superclassName, js } = compileClass(source)
  assert(
    expectedClassName === className,
    `class name: expected ${expectedClassName}, got ${className}`
  )
  const output = [
    `export default function ${className}(globals){`,
    generateSuperclassDecl(className, superclassName),
    `return ${js}`,
    '}'
  ].join('\n')
  return { className, generatedCode: prettier(output) }
}

function generateSuperclassDecl (className, superclassName) {
  let actualSuperclassname = superclassName || `Primitive${className}`
  /* In the SOM definition, Object claims to inherit from `nil`, but we want
     it to inherit from PrimitiveObject. */
  if (superclassName === 'nil') {
    actualSuperclassname = 'PrimitiveObject'
  }
  return `const $superclass = globals.${actualSuperclassname}`
}

export function generateClassFromFile (filename, prettier = s => s) {
  const source = fs.readFileSync(filename)
  const expectedClassName = path.basename(filename, '.som')
  return generateClass(source, expectedClassName, prettier)
}
