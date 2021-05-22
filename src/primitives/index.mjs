import arrayPrimitives from './Array.mjs'
import blockPrimitives from './Block.mjs'
import classPrimitives from './Class.mjs'
import doublePrimitives from './Double.mjs'
import integerPrimitives from './Integer.mjs'
import methodPrimitives from './Method.mjs'
import objectPrimitives from './Object.mjs'
import stringPrimitives from './String.mjs'
import symbolPrimitives from './Symbol.mjs'
import systemPrimitives from './System.mjs'

export default {
  ...arrayPrimitives,
  ...blockPrimitives,
  ...classPrimitives,
  ...doublePrimitives,
  ...integerPrimitives,
  ...methodPrimitives,
  ...objectPrimitives,
  ...stringPrimitives,
  ...symbolPrimitives,
  ...systemPrimitives
}
