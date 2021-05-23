import path from 'path'
import { fileURLToPath } from 'url'
import walkSync from 'walk-sync'

import { Environment } from '../src/evaluation.mjs'
import { somClassLibPath, somTestSuitePath } from '../src/paths.mjs'

export function runSomTestSuite () {
  const classpath = [somClassLibPath, somTestSuitePath]
  const env = new Environment()

  classpath.forEach(dir => {
    walkSync(dir, { globs: ['*.som'] }).forEach(filename => {
      const className = path.basename(filename, '.som')
      env.registerClass(className, path.join(dir, filename))
    })
  })

  // TODO: Actually use System to load and run the main class.
  const TestHarness = env.loadClass(
    path.join(somTestSuitePath, 'TestHarness.som')
  )
  const args = env.get('Array')._new(['TestHarness'])
  TestHarness.new()['run:'](args)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSomTestSuite()
}
