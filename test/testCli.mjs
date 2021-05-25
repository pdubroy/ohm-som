import test from 'ava'
import childProcess from 'child_process'

test.cb('HelloWorld', t => {
  const cmd = 'node bin/som.mjs --classpath test/data HelloWorld'
  childProcess.exec(cmd, (err, stdout, stderr) => {
    t.is(err, null)
    t.is(stdout, 'Hello SOM!\n')
    t.is(stderr, '')
    t.end()
  })
})
