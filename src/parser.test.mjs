import test from 'ava'

import { parse } from './parser.mjs'

const sources = {
  Hello: `Hello = (
    "The 'run' method is called when initializing the system"
    run = ('Hello, World from SOM' println )
  )`
}

test('Hello', t => {
  t.truthy(parse(sources.Hello))
})
