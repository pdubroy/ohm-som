import fs from 'fs'
import ohm from 'ohm-js'
import path from 'path'

import { Integer } from './Integer.mjs'

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
    const selector = pattern.selector()
    const params = pattern.params()
    return `'${selector}'(${params.join(', ')}){${body.toJS()}}`
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
    return `$som.send(${exp.toJS()},${selector},${args})`
  },
  BinaryExpression_rec (exp, message) {
    const { selector, args } = message.selectorAndArgsToJS()
    return `$som.send(${exp.toJS()},${selector},${args})`
  },
  UnaryExpression_rec (exp, message) {
    const { selector, args } = message.selectorAndArgsToJS()
    return `$som.send(${exp.toJS()},${selector},${args})`
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
    return `$som.Integer(${this.sourceString})`
  },
  LiteralSymbol (_, stringOrSelector) {
    return `$som.Symbol(${stringOrSelector.asString()})`
  },
  LiteralString (str) {
    return `${str.asString()}`
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
  const result = somGrammar.match(source, startRule)
  return semantics(result).toJS()
}

export function doIt (source, startRule = undefined) {
  const main = new Function('$som', compile(source, startRule))
  return main(globalEnv)
}

const globalEnv = {
  send (receiver, selector, args) {
    const method = receiver[selector]
    if (method) {
      return method.call(receiver, ...args)
    } else {
      return send(receiver, 'doesNotUnderstand:arguments:', [
        selector,
        arguments
      ])
    }
  },
  Integer: str => Integer['fromString:'](str),
  Symbol: str => Symbol.for(str)
}
