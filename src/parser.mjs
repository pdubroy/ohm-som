import fs from 'fs'
import ohm from 'ohm-js'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const somGrammar = ohm.grammar(
  fs.readFileSync(path.join(__dirname, 'microSOM.ohm'))
)

export function parse (source) {}
