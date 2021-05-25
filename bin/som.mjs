import minimist from 'minimist'

import { Environment } from '../src/evaluation.mjs'

const argv = minimist(process.argv.slice(2), {
  string: ['classpath']
})

const classpath = Array.isArray(argv.classpath)
  ? argv.classpath
  : [argv.classpath]

const env = new Environment()
classpath.forEach(p => env.registerClasspath(p))
env.run(argv._)
