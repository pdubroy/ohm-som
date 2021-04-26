import path from 'path'
import walkSync from 'walk-sync'

import { Environment } from '../src/evaluation.mjs'
import { somClassLibPath, somTestSuitePath } from '../src/paths.mjs'

const classpath = [somClassLibPath, somTestSuitePath]

const env = new Environment()

classpath.forEach(dir => {
  walkSync(dir, { globs: ['*.som'] }).forEach(filename => {
    const className = path.basename(filename, '.som')
    env.registerClass(className, path.join(dir, filename))
  })
})

const TestHarness = env.loadClass(
  path.join(somTestSuitePath, 'TestHarness.som')
)
new TestHarness().runAllSuites()
