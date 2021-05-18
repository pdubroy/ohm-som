import fs from 'fs'

import { grammar, semantics } from '../src/index.mjs'

// Return an array of selectors representing all of the primitive methods in the class.
semantics.addOperation('primitiveMethods', {
  Classdef (id, eq, superclass, instSlots, sep, classSlotsOpt, end) {
    const methods = instSlots.primitiveMethods().flat()
    const classSlots = classSlotsOpt.child(0)
    if (classSlots) {
      methods.push(
        ...classSlots
          .primitiveMethods()
          .flat()
          .map(o => ({ ...o, isStatic: true }))
      )
    }
    return methods
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
const root = semantics(matchResult)
console.log(`${root.className()}: {`)
root.primitiveMethods().forEach(({ isStatic, selector, params }) => {
  const prefix = isStatic ? 'static ' : ''
  console.log(`  ${prefix}'${selector}'(${params}) {
    throw new Error('not implemented')
  }`)
})
console.log('}')
