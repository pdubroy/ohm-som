import { assert } from './assert.mjs'
import somGrammar from './SOM.ohm-recipe.js'

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

export const grammar = somGrammar

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

// Return an Array of Method nodes representing the instance methods of the class.
semantics.addOperation('instanceMethods', {
  Classdef (id, eq, superclass, instSlots, sep, classSlotsOpt, end) {
    return instSlots.child(3).children
  }
})

// Return an Array of Method nodes representing the class methods.
semantics.addOperation('classMethods', {
  Classdef (id, eq, superclass, instSlots, sep, classSlotsOpt, end) {
    const classSlots = classSlotsOpt.child(0)
    return classSlots ? classSlots.child(3).children : []
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
    return [this.sourceString]
  }
})

const symbolTableScope = {
  LOCAL: 'LOCAL',
  INSTANCE: 'INSTANCE',
  GLOBAL: 'GLOBAL'
}

let currentLexicalEnv = Object.create(null)

semantics.addAttribute(
  'symbolTable',
  (() => {
    const withLocals = (ids, fn) => {
      const prevEnv = currentLexicalEnv
      try {
        currentLexicalEnv = Object.create(prevEnv)
        for (const id of ids) {
          currentLexicalEnv[id] = symbolTableScope.LOCAL
        }
        fn()
        return prevEnv
      } finally {
        currentLexicalEnv = prevEnv
      }
    }

    return {
      Method (pattern, _eq, body) {
        return withLocals(pattern._identifiers(), () => {
          body.symbolTable // eslint-disable-line no-unused-expressions
        })
      },
      BlockContents (_, localDefsOpt, _1, blockBody) {
        const localDefs = localDefsOpt.child(0)
        const ids = localDefs ? localDefs._identifiers() : []
        return withLocals(ids, () => {
          blockBody.symbolTable // eslint-disable-line no-unused-expressions
        })
      },
      NestedBlock (_, blockPatternOpt, blockContentsOpt, _1) {
        const blockPattern = blockPatternOpt.child(0)
        const ids = blockPattern ? blockPattern._identifiers() : []
        return withLocals(ids, () => {
          blockContentsOpt.symbolTable // eslint-disable-line no-unused-expressions
        })
      },
      _nonterminal (children) {
        children.forEach(c => c.symbolTable)
        return currentLexicalEnv
      },
      _iter (children) {
        children.forEach(c => c.symbolTable)
        return currentLexicalEnv
      },
      _terminal () {
        return currentLexicalEnv
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

// XXX - get rid of any implementation other than for methods.
semantics.addOperation(
  'toJS()',
  (() => {
    let isInsideBlock = false

    function handleInstanceOrClassSlots (_, identOpt, _end, methodIter) {
      const identifiers = identOpt.children.map(c => c.toJS())[0] || []
      return [
        ...identifiers.map(id => `$${id}: nil`),
        ...methodIter.children.filter(m => !m._isPrimitive()).map(m => m.toJS())
      ].join(',')
    }

    function handleMessageSendExpression (exp, message) {
      const selector = message._selector()
      const args = getMessageArgs(message)
      return `$(${exp.toJS()}, '${selector}', ${args})`
    }

    return {
      // Returns a JavaScript *expression* for a Smalltalk class definition.
      Classdef (id, _, superclass, instSlots, _sep, classSlotsOpt, _end) {
        // Calculate the `symbolTable` attribute on all nodes.
        this.symbolTable // eslint-disable-line no-unused-expressions

        const className = id.toJS()
        const superclassName = superclass.toJS() || 'Object'
        return (
          '({' +
          [
            `className:'${className}'`,
            `superclassName:'${superclassName}'`,
            `instanceSlots:{${instSlots.toJS()}}`,
            'classSlots:{' +
              `_instVarNames: [${instSlots.instanceVariableNames()}],` +
              `${classSlotsOpt.children.map(c => c.toJS())}}`
          ].join(',') +
          '})'
        )
      },
      Superclass (identOpt, _) {
        return identOpt.children.map(c => c.toJS())
      },
      identifier (first, rest) {
        return mangleIdentifier(this.sourceString)
      },
      InstanceSlots: handleInstanceOrClassSlots,
      ClassSlots: handleInstanceOrClassSlots,
      Method (pattern, _eq, body) {
        assert(
          !this._isPrimitive(),
          'toJS() not implemented on primitive methods'
        )

        // Calculate the `symbolTable` attribute on all nodes.
        this.symbolTable // eslint-disable-line no-unused-expressions

        const selector = pattern._selector()
        const paramList = pattern._params().join(', ')
        return `'${selector}'(${paramList}){${body.toJS()}}`
      },
      MethodBlock (_open, blockContentsOpt, _close) {
        const body = blockContentsOpt.children.map(c => c.toJS()).join('')
        return `const _rv={};try{${body}}catch(e){if(e===_rv)return e.v;throw e}return this`
      },
      BlockContents (_or, localDefsOpt, _, blockBody) {
        return (
          localDefsOpt.children.map(c => c.toJS()).join('') + blockBody.toJS()
        )
      },
      LocalDefs (identifiers) {
        const ids = identifiers.children.map(c => c.toJS())
        return `let ${ids.join(',')};`
      },
      BlockBody_return (_, result) {
        return `_rv.v=${result.toJS()};throw _rv`
      },
      BlockBody_rec (exp, _, blockBodyOptOpt) {
        const head = exp.toJS()
        const tail = blockBodyOptOpt.children.map(c =>
          c.children.map(x => x.toJS())
        )[0]
        if (tail === undefined) {
          return isInsideBlock ? `return ${head}` : head
        }
        return `${head};${tail}`
      },
      Expression_assignment (variable, _, exp) {
        const { sourceString } = variable
        const scope = this.symbolTable[sourceString]
        if (scope === symbolTableScope.LOCAL) {
          return `${mangleIdentifier(sourceString)}=${exp.toJS()}`
        } else if (scope === symbolTableScope.INSTANCE) {
          return `this.$${sourceString}=${exp.toJS()}`
        } else {
          // Global
          return `$setG('${sourceString}',${exp.toJS()}, this)`
        }
      },
      KeywordExpression_rec: handleMessageSendExpression,
      BinaryExpression_rec: handleMessageSendExpression,
      UnaryExpression_rec: handleMessageSendExpression,
      Result (exp, _) {
        return exp.toJS()
      },
      NestedTerm (_open, exp, _close) {
        return exp.toJS()
      },
      NestedBlock (_open, blockPatternOpt, blockContentsOpt, _close) {
        const wasInsideBlock = isInsideBlock
        isInsideBlock = true
        try {
          const arity = this._blockArity() + 1 // Block1 takes 0 args, Block2 takes 1, etc.
          const patt = blockPatternOpt.children.map(c => c.toJS())
          const contents = blockContentsOpt.children.map(c => c.toJS())
          return `$g('_block${arity}')((${patt})=>{${contents}})`
        } finally {
          isInsideBlock = wasInsideBlock
        }
      },
      BlockPattern (blockArguments, _) {
        return blockArguments.toJS()
      },
      BlockArguments (_, identIter) {
        return identIter.children.map(c => c.toJS()).join(',')
      },
      LiteralArray (_, _open, literalIter, _close) {
        const literals = literalIter.children.map(c => c.toJS())
        return `$g('Array')._new([${literals.join(',')}])`
      },
      LiteralNumber_double (_, double) {
        return `$g('Double')._new(${this.sourceString})`
      },
      LiteralNumber_int (_, integer) {
        return `$g('Integer')._new(${this.sourceString})`
      },
      LiteralSymbol (_, stringOrSel) {
        const childIdx = stringOrSel._node.ctorName === 'string' ? 1 : 0
        const contents = stringOrSel.child(childIdx).sourceString
        return `$g('Symbol')._new(\`${contents}\`)`
      },
      LiteralString (str) {
        return `$g('String')._new(\`${str.child(1).sourceString}\`)`
      },
      variable (pseudoVarOrIdent) {
        if (pseudoVarOrIdent._node.ctorName === 'identifier') {
          const { sourceString } = pseudoVarOrIdent
          const scope = this.symbolTable[sourceString]
          if (scope === symbolTableScope.LOCAL) {
            return mangleIdentifier(sourceString)
          } else if (scope === symbolTableScope.INSTANCE) {
            return `this.$${sourceString}`
          } else {
            // Global
            return `$g('${sourceString}', this)`
          }
        }
        return pseudoVarOrIdent.toJS()
      },
      self (_) {
        return 'this'
      },
      super (_) {
        return "$g('_super')(this)"
      },
      nil (_) {
        return 'nil'
      },
      true (_) {
        return "$g('true')"
      },
      false (_) {
        return "$g('false')"
      }
    }
  })()
)

function getMessageArgs (message) {
  const { ctorName } = message._node
  if (ctorName === 'KeywordMessage' || ctorName === 'BinaryMessage') {
    return message.child(1).children.map(c => c.toJS())
  } else if (ctorName === 'UnaryMessage') {
    return []
  }
  assert(false, `unexpected node type: '${ctorName}'`)
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

// Return the selector of a Method, pattern, or message node.
semantics.addOperation('_selector', {
  Method: (patt, _, body) => patt._selector(),
  UnaryPattern: sel => sel.sourceString,
  UnaryMessage: sel => sel.sourceString,
  BinaryPattern: (sel, _) => sel.sourceString,
  BinaryMessage: (sel, _) => sel.sourceString,
  KeywordPattern: (kw, _) => kw.children.map(c => c.sourceString).join(''),
  KeywordMessage: (kw, _) => kw.children.map(c => c.sourceString).join('')
})

// Return the function parameters for a Pattern node.
semantics.addOperation('_params()', {
  UnaryPattern: _ => [],
  BinaryPattern: (_, param) => [param.toJS()],
  KeywordPattern: (_, params) => params.children.map(c => c.toJS())
})

semantics.addOperation('instanceVariableNames()', {
  Classdef (id, eq, superclass, instSlots, sep, classSlots, end) {
    return instSlots.instanceVariableNames()
  },
  InstanceSlots (_, identIterOpt, _end, methodIter) {
    const identIter = identIterOpt.child(0)
    return identIter ? identIter.children.map(c => c.toJS()) : []
  }
})

semantics.addOperation('classVariableNames()', {
  Classdef (id, eq, superclass, instSlots, sep, classSlotsOpt, end) {
    const classSlots = classSlotsOpt.child(0)
    return classSlots ? classSlots.classVariableNames() : []
  },
  ClassSlots (_, identIterOpt, _end, methodIter) {
    const identIter = identIterOpt.child(0)
    return identIter ? identIter.children.map(c => c.toJS()) : []
  }
})

export function compileForTesting (source, startRule = undefined) {
  const result = grammar.match(source, startRule)
  return semantics(result).toJS()
}

function compileMethodsInClass (methods, cls) {
  const prevEnv = currentLexicalEnv
  try {
    // Set up the base lexical environment shared by the methods,
    // containing all of the instance variables.
    currentLexicalEnv = Object.create(null)
    for (const name of cls._allInstVarNames()) {
      currentLexicalEnv[name] = symbolTableScope.INSTANCE
    }

    const compiledMethods = methods
      .filter(m => !m._isPrimitive())
      .map(m => {
        // Force the symbol table to be computed (and cached) for all nodes.
        m.symbolTable // eslint-disable-line no-unused-expressions

        // ...and compile the method.
        return m.toJS()
      })
    return `{${compiledMethods.join(',')}}`
  } finally {
    currentLexicalEnv = prevEnv
  }
}

export function compileClass (source, env) {
  const result = grammar.match(source)
  if (result.failed()) {
    throw new Error(result.message)
  }
  const root = semantics(result)
  return {
    className: root.className(),
    superclassName: root.superclassName(),
    instanceVariableNames: root.instanceVariableNames(),
    classVariableNames: root.classVariableNames(),
    instanceMethodsToJS: cls =>
      compileMethodsInClass(root.instanceMethods(), cls),
    classMethodsToJS: metaclass =>
      compileMethodsInClass(root.classMethods(), metaclass)
  }
}
