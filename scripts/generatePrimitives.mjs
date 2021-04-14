import fs from 'fs'

import { grammar, semantics } from '../src/index.mjs'

// Return an array of selectors representing all of the primitive methods in the class.
semantics.addOperation('primitiveMethods', {
  Classdef (id, eq, superclass, instSlots, sep, classSlots, end) {
    return [
      ...instSlots.primitiveMethods().flat(),
      ...classSlots
        .primitiveMethods()
        .flat()
        .map(o => ({ ...o, isStatic: true }))
    ]
  },
  InstanceSlots (_, identIter, _end, methodIter) {
    return methodIter.primitiveMethods()
  },
  ClassSlots (_, identIter, _end, methodIter) {
    return methodIter.primitiveMethods()
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

const inputFilename = process.argv[2]
const matchResult = grammar.match(fs.readFileSync(inputFilename))
console.log(`class ${semantics(matchResult).className()} {`)
semantics(matchResult)
  .primitiveMethods()
  .forEach(({ isStatic, selector, params }) => {
    const prefix = isStatic ? 'static ' : ''
    console.log(`  ${prefix}'${selector}'(${params}) {
    throw new Error('not implemented')
  }`)
  })
console.log('}')
