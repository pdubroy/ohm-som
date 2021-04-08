import fs from 'fs'

import { grammar, semantics } from '../src/index.mjs'

// Return an array of selectors representing all of the primitive methods in the class.
semantics.addOperation('primitiveMethods', {
  Classdef (id, eq, superclass, instFields, methodIter, _, cf, cm, _end) {
    return methodIter.primitiveMethods().flat()
  },
  Method (pattern, _, body) {
    if (body._node.ctorName === 'primitive') {
      return {
        selector: pattern.selector(),
        params: pattern.params()
      }
    }
    return []
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

semantics.addOperation('className', {
  Classdef (id, eq, superclass, instFields, methodIter, _, cf, cm, _end) {
    return id.sourceString
  }
})

const inputFilename = process.argv[2]
const matchResult = grammar.match(fs.readFileSync(inputFilename))
console.log(`class ${semantics(matchResult).className()} {`)
semantics(matchResult)
  .primitiveMethods()
  .forEach(({ selector, params }) => {
    console.log(`  '${selector}'(${params}) {
    throw new Error('not implemented')
  }`)
  })
console.log('}')