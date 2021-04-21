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
    const body = blockContentsOpt.toJS().join('')
    return `const _rv={};try{${body}}catch(e){if(e===_rv)return e.v;throw e}`
  },
  BlockContents (_or, localDefsOpt, _, blockBody) {
    return localDefsOpt.toJS().join('') + blockBody.toJS()
  },
  LocalDefs (identifiers) {
    return `let ${identifiers.toJS().join(',')};`
  },
  BlockBody_return (_, result) {
    return `_rv.v=${result.toJS()};throw _rv`
  },
  BlockBody_rec (exp, _, blockBodyOptOpt) {
    const head = exp.toJS()
    const tail = blockBodyOptOpt.toJS()[0]
    if (tail === undefined) {
      return `return ${head}`
    }
    return `${head};${tail}`
  },
  Expression_assignment (ident, _, exp) {
    return `${ident.toJS()}=${exp.toJS()}`
  },
  KeywordExpression_rec (exp, message) {
    const selector = message.selector()
    const args = getMessageArgs(message)
    return `${exp.toJS()}['${selector}'](${args})`
  },
  BinaryExpression_rec (exp, message) {
    const selector = message.selector()
    const args = getMessageArgs(message)
    return `${exp.toJS()}['${selector}'](${args})`
  },
  UnaryExpression_rec (exp, message) {
    const selector = message.selector()
    const args = getMessageArgs(message)
    return `${exp.toJS()}.${selector}(${args})`
  },
  Result (exp, _) {
    return exp.toJS()
  },
  NestedTerm (_open, exp, _close) {
    return exp.toJS()
  },
  NestedBlock (_open, blockPatternOpt, blockContentsOpt, _close) {
    return `this._block((${blockPatternOpt.toJS()})=>{${blockContentsOpt.toJS()}})`
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
    return `this._int(${this.sourceString})`
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
      return id in this.lexicalVars ? id : `this.$${id}`
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
    return 'this.$nil'
  },
  true (_) {
    return 'this.$true'
  },
  false (_) {
    return 'this.$false'
  }
})

function getMessageArgs (message) {
  const { ctorName } = message._node
  switch (ctorName) {
    case 'KeywordMessage':
    case 'BinaryMessage':
      return message.child(1).toJS()
    case 'UnaryMessage':
      return []
    default:
      assert(false, `unexpected node type: '${ctorName}'`)
  }
}

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

export function generateClass (source, prettyFn = s => s) {
  const { className, superclassName, js } = compileClass(source)
  const superclassDecl = generateSuperclassDecl(className, superclassName)
  const output = `${superclassDecl};\nreturn ${js}`
  return {
    className,
    output: prettyFn(output)
  }
}

function generateClassExport (generatedCode) {
  return `export default function (globals) {\n${generatedCode}\n}`
}

function generateSuperclassDecl (className, superclassName) {
  let actualSuperclassname = superclassName || `Primitive${className}`
  /* In the SOM definition, Object claims to inherit from `nil`, but we want
     it to inherit from PrimitiveObject. */
  if (superclassName === 'nil') {
    actualSuperclassname = 'PrimitiveObject'
  }
  return `const $superclass = globals.$${actualSuperclassname}`
}

export function generateClassFromFile (filename, prettyFn = s => s) {
  const source = fs.readFileSync(filename)
  const expectedClassName = path.basename(filename, '.som')
  const { className, output } = generateClass(source, prettyFn)
  assert(
    expectedClassName === className,
    `class name: expected ${expectedClassName}, got ${className}`
  )
  return { className, output: generateClassExport(output) }
}
