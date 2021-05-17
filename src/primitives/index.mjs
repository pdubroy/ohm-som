import arrayPrimitives from './Array.mjs'
import blockPrimitives from './Block.mjs'
import classPrimitives from './Class.mjs'
import integerPrimitives from './Integer.mjs'
import objectPrimitives from './Object.mjs'
import systemPrimitives from './System.mjs'

export default {
  ...arrayPrimitives,
  ...blockPrimitives,
  ...classPrimitives,
  ...integerPrimitives,
  ...objectPrimitives,
  ...systemPrimitives
}
