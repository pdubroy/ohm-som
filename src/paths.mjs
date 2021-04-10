import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export const somTestSuitePath = path.join(
  __dirname,
  '../third_party/SOM-st/SOM/TestSuite'
)

export const somGrammarPath = path.join(__dirname, 'som.ohm')

export const somClassLibPath = path.join(
  __dirname,
  '../third_party/SOM-st/SOM/Smalltalk'
)

export const testDataPath = path.join(__dirname, '../test/data')
