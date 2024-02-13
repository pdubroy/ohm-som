import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const somTestSuitePath = path.join(
  __dirname,
  '../third_party/SOM-st/SOM/TestSuite'
)

export const somClassLibPath = path.join(
  __dirname,
  '../third_party/SOM-st/SOM/Smalltalk'
)

export const generatedClassesPath = path.join(__dirname, 'classes/generated')

export const testDataPath = path.join(__dirname, '../test/data')
