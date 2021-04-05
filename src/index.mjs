import fs from 'fs'
import ohm from 'ohm-js'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const somGrammar = ohm.grammar(fs.readFileSync(path.join(__dirname, 'SOM.ohm')))

export function parse (source, startRule = undefined) {
  const result = somGrammar.match(source, startRule)
  if (result.failed()) {
    throw new Error(result.message)
  }
  return result.succeeded()
}

const semantics = somGrammar.createSemantics()

semantics.addOperation('toJS', {
  Classdef (
    id,
    _eq,
    superclass,
    instFields,
    instMethods,
    _sep,
    classFields,
    classMethods,
    _end
  ) {
    return `class ${id.toJS()}{` + instFields.toJS() + instMethods.toJS() + '}'
  },
  identifier (first, rest) {
    return this.sourceString
  },
  InstanceFields (_, variables, _end) {
    return variables
      .toJS()
      .map(name => `${name};`)
      .join(' ')
  },
  Method (pattern, _eq, body) {
    const symbol = pattern.toSymbol()
    const params = pattern.params()
    return `'${symbol}'(${params.join(', ')}){${body.toJS()}}`
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
  Assignation (assignments, evaluation) {
    return `${assignments.toJS()}${evaluation.toJS()}`
  },
  Assignment (identifier, _) {
    return `${identifier.toJS()}=`
  },
  Result (exp, _) {
    return exp.toJS()
  },
  Evaluation (primary, messagesOpt) {
    const target = primary.toJS()
    if (messagesOpt._node.hasChildren()) {
      // TODO: handle message send
      messagesOpt.toJS() // trigger eval
    } else {
      return target
    }
  },
  LiteralNumber (_) {
    return `Number(${this.sourceString})`
  }
})

semantics.addOperation('toSymbol', {
  UnaryPattern (selector) {
    return selector.sourceString
  },
  BinaryPattern (selector, _) {
    return selector.sourceString
  },
  KeywordPattern (keywords, _) {
    return keywords.children.map(c => c.sourceString).join('')
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
  const result = somGrammar.match(source, startRule)
  return semantics(result).toJS()
}
