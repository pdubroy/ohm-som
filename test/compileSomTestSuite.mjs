import test from 'ava'
import fs from 'fs'
import path from 'path'
import walkSync from 'walk-sync'

import { compileClass } from '../src/compilation.mjs'
import { somTestSuitePath } from '../src/paths.mjs'

// An AVA "macro function" that tests that the SOM source file at `filename` can be parsed.
function testSourceFile (t, filename) {
  const source = fs.readFileSync(path.join(somTestSuitePath, filename))
  t.notThrows(() => compileClass(source))
}

// Use the filename as the title for each test case.
testSourceFile.title = (_, filename) => filename

// Test all .som files under `somTestSuitePath`.
for (const filename of walkSync(somTestSuitePath, { globs: ['**/*.som'] })) {
  test(testSourceFile, filename)
}
