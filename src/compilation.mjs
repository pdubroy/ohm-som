import fs from 'fs'
import ohm from 'ohm-js'

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

const mangleIdentifier = id => (jsReservedWords.includes(id) ? `_${id}` : id)

semantics.addOperation('_identifiers()', {
  UnaryPattern (selector) {
    return []
  },
  BinaryPattern (selector, ident) {
    return ident._identifiers()
  },
  KeywordPattern (keywordIter, identIter) {
    return identIter._identifiers()
  },
  BlockPattern (blockArguments, _) {
    return blockArguments._identifiers()
  },
  BlockArguments (_, identIter) {
    return identIter._identifiers()
  },
  _nonterminal (children) {
    return children.flatMap(c => c._identifiers())
  },
  _iter (children) {
    return children.flatMap(c => c._identifiers())
  },
  identifier (first, rest) {
    return [mangleIdentifier(this.sourceString)]
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
        return withEnv(pattern._identifiers(), () => {
          body.lexicalVars // eslint-disable-line no-unused-expressions
        })
      },
      BlockContents (_, localDefsOpt, _1, blockBody) {
        const localDefs = localDefsOpt.child(0)
        const ids = localDefs ? localDefs._identifiers() : []
        return withEnv(ids, () => {
          blockBody.lexicalVars // eslint-disable-line no-unused-expressions
        })
      },
      NestedBlock (_, blockPatternOpt, blockContentsOpt, _1) {
        const blockPattern = blockPatternOpt.child(0)
        const ids = blockPattern ? blockPattern._identifiers() : []
        return withEnv(ids, () => {
          blockContentsOpt.lexicalVars // eslint-disable-line no-unused-expressions
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

// Return `true` if the method is a primitive method, and `false` otherwise.
semantics.addOperation('_isPrimitive', {
  Method (pattern, _, primitiveOrMethodBlock) {
    return primitiveOrMethodBlock._isPrimitive()
  },
  primitive (_) {
    return true
  },
  MethodBlock (_, blockContents, _end) {
    return false
  }
})

semantics.addOperation(
  'toJS(ctx)',
  (() => {
    function handleInstanceOrClassSlots (_, identOpt, _end, methodIter) {
      const { ctx } = this.args
      const identifiers = identOpt.toJS(ctx)[0] || []
      return [
        ...identifiers.map(id => `$${id}: nil`),
        ...methodIter.children
          .filter(m => !m._isPrimitive())
          .map(m => m.toJS(ctx))
      ].join(',')
    }

    function handleMessageSendExpression (exp, message) {
      const { ctx } = this.args
      const selector = message._selector()
      const args = getMessageArgs(message, ctx)
      return `$(${exp.toJS(ctx)}, '${selector}', ${args})`
    }

    return {
      // Returns a JavaScript *expression* for a Smalltalk class definition.
      Classdef (id, _, superclass, instSlots, _sep, classSlotsOpt, _end) {
        // Calculate the `lexicalVars` attribute on all nodes.
        this.lexicalVars // eslint-disable-line no-unused-expressions
        const { ctx } = this.args

        const className = id.toJS(ctx)
        const superclassName = superclass.toJS(ctx) || 'Object'
        return (
          '({' +
          [
            `className:'${className}'`,
            `superclassName:'${superclassName}'`,
            `instanceSlots:{${instSlots.toJS(ctx)}}`,
            'classSlots:{' +
              `_instVarNames: [${instSlots.instanceVariableNames()}],` +
              `${classSlotsOpt.toJS(ctx)}}`
          ].join(',') +
          '})'
        )
      },
      Superclass (ident, _) {
        return ident.toJS(this.args.ctx)
      },
      identifier (first, rest) {
        return mangleIdentifier(this.sourceString)
      },
      InstanceSlots: handleInstanceOrClassSlots,
      ClassSlots: handleInstanceOrClassSlots,
      Method (pattern, _eq, body) {
        const { ctx } = this.args
        assert(
          !this._isPrimitive(),
          'toJS() not implemented on primitive methods'
        )

        // Calculate the `lexicalVars` attribute on all nodes.
        this.lexicalVars // eslint-disable-line no-unused-expressions

        const selector = pattern._selector()
        const paramList = pattern.params(ctx).join(', ')
        return `'${selector}'(${paramList}){${body.toJS(ctx)}}`
      },
      MethodBlock (_open, blockContentsOpt, _close) {
        const body = blockContentsOpt.toJS(this.args.ctx).join('')
        return `const _rv={};try{${body}}catch(e){if(e===_rv)return e.v;throw e}return this`
      },
      BlockContents (_or, localDefsOpt, _, blockBody) {
        const { ctx } = this.args
        return localDefsOpt.toJS(ctx).join('') + blockBody.toJS(ctx)
      },
      LocalDefs (identifiers) {
        return `let ${identifiers.toJS(this.args.ctx).join(',')};`
      },
      BlockBody_return (_, result) {
        return `_rv.v=${result.toJS(this.args.ctx)};throw _rv`
      },
      BlockBody_rec (exp, _, blockBodyOptOpt) {
        const { ctx } = this.args
        const head = exp.toJS(ctx)
        const tail = blockBodyOptOpt.toJS(ctx)[0]
        if (tail === undefined) {
          return ctx.isInsideBlock ? `return ${head}` : head
        }
        return `${head};${tail}`
      },
      Expression_assignment (ident, _, exp) {
        const { ctx } = this.args
        return `${ident.toJS(ctx)}=${exp.toJS(ctx)}`
      },
      KeywordExpression_rec: handleMessageSendExpression,
      BinaryExpression_rec: handleMessageSendExpression,
      UnaryExpression_rec: handleMessageSendExpression,
      Result (exp, _) {
        return exp.toJS(this.args.ctx)
      },
      NestedTerm (_open, exp, _close) {
        return exp.toJS(this.args.ctx)
      },
      NestedBlock (_open, blockPatternOpt, blockContentsOpt, _close) {
        const ctx = { ...this.args.ctx, isInsideBlock: true }
        const arity = this._blockArity() + 1 // Block1 takes 0 args, Block2 takes 1, etc.
        return `this._block${arity}((${blockPatternOpt.toJS(
          ctx
        )})=>{${blockContentsOpt.toJS(ctx)}})`
      },
      BlockPattern (blockArguments, _) {
        return blockArguments.toJS(this.args.ctx)
      },
      BlockArguments (_, identIter) {
        return identIter.toJS(this.args.ctx).join(',')
      },
      LiteralArray (_, _open, literalIter, _close) {
        return `this.$Array._new([${literalIter
          .toJS(this.args.ctx)
          .join(',')}])`
      },
      LiteralNumber_double (_, double) {
        return `this.$Double._new(${this.sourceString})`
      },
      LiteralNumber_int (_, integer) {
        return `this.$Integer._new(${this.sourceString})`
      },
      LiteralSymbol (_, stringOrSel) {
        const childIdx = stringOrSel._node.ctorName === 'string' ? 1 : 0
        const contents = stringOrSel.child(childIdx).sourceString
        return `this.$Symbol._new(\`${contents}\`)`
      },
      LiteralString (str) {
        return `this.$String._new(\`${str.child(1).sourceString}\`)`
      },
      variable (pseudoVarOrIdent) {
        const { ctx } = this.args
        if (pseudoVarOrIdent._node.ctorName === 'identifier') {
          const id = pseudoVarOrIdent.toJS(ctx)
          return id in this.lexicalVars ? id : `this.$${id}`
        }
        return pseudoVarOrIdent.toJS(ctx)
      },
      self (_) {
        return 'this'
      },
      super (_) {
        return 'this._super(this)'
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
    }
  })()
)

function getMessageArgs (message, ctx) {
  const { ctorName } = message._node
  switch (ctorName) {
    case 'KeywordMessage':
    case 'BinaryMessage':
      return message.child(1).toJS(ctx)
    case 'UnaryMessage':
      return []
    default:
      assert(false, `unexpected node type: '${ctorName}'`)
  }
}

// Return the arity of a NestedBlock node.
semantics.addOperation('_blockArity', {
  NestedBlock (_open, blockPatternOpt, blockContentsOpt, _close) {
    const blockPattern = blockPatternOpt.child(0)
    return blockPattern ? blockPattern._blockArity() : 0
  },
  BlockPattern (blockArguments, _) {
    return blockArguments._blockArity()
  },
  BlockArguments (_, identIter) {
    return identIter._node.numChildren()
  }
})

// Return the selector of a pattern or message node.
semantics.addOperation('_selector', {
  UnaryPattern: sel => sel.sourceString,
  UnaryMessage: sel => sel.sourceString,
  BinaryPattern: (sel, _) => sel.sourceString,
  BinaryMessage: (sel, _) => sel.sourceString,
  KeywordPattern: (kw, _) => kw.children.map(c => c.sourceString).join(''),
  KeywordMessage: (kw, _) => kw.children.map(c => c.sourceString).join('')
})

semantics.addOperation('params(ctx)', {
  UnaryPattern (_) {
    return []
  },
  BinaryPattern (_, param) {
    return [param.toJS(this.args.ctx)]
  },
  KeywordPattern (_, params) {
    return params.toJS(this.args.ctx)
  }
})

semantics.addOperation('instanceVariableNames()', {
  InstanceSlots (_, identOpt, _end, methodIter) {
    return (identOpt.toJS({})[0] || []).map(id => `'${id}'`)
  }
})

export function compileForTesting (source, startRule = undefined) {
  const result = grammar.match(source, startRule)
  return semantics(result).toJS({ isInsideBlock: false })
}

export function compileClass (source, env) {
  const result = grammar.match(source)
  if (result.failed()) {
    throw new Error(result.message)
  }
  // TODO: Use `env` to ensure there are no undefined references.
  const root = semantics(result)
  const ctx = { isInsideBlock: false }
  return {
    className: root.className(),
    js: root.toJS(ctx)
  }
}
