import fs from 'fs'
import path from 'path'
import prettier from 'prettier-standard'
import walkSync from 'walk-sync'
import yargs from 'yargs'

import { generateClassFromFile } from '../src/index.mjs'
import { generatedClassesPath, somClassLibPath } from '../src/paths.mjs'

const { argv } = yargs(process.argv.slice(2)).options({
  pretty: {
    type: 'boolean',
    default: true,
    description: 'pretty-print the generated code'
  }
})

for (const filename of walkSync(somClassLibPath, { globs: ['*.som'] })) {
  const { className, generatedCode } = generateClassFromFile(
    path.join(somClassLibPath, filename),
    argv.pretty ? prettier.format : undefined
  )
  const outputPath = path.join(generatedClassesPath, `${className}.mjs`)
  fs.writeFileSync(outputPath, generatedCode)
}
