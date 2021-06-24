import test from 'ava'
import path from 'path'

import { ClassLoader } from '../ClassLoader.mjs'
import { createKernel } from '../kernel.mjs'
import { testDataPath } from '../paths.mjs'
import { createKernelPrimitivesForTesting } from '../primitives/index.mjs'

function createKernelForTesting (globals) {
  const primitives = createKernelPrimitivesForTesting(globals)
  return createKernel(primitives)
}

function createClassLoaderForTesting () {
  const globals = Object.create(null)
  const loader = new ClassLoader(createKernelForTesting(globals), globals)

  globals.$Object = loader.loadClass('Object')

  // Install a fake String constructor that just returns a native string
  globals.$String = { _new: str => str }

  return loader
}

test('primitive methods', t => {
  const loader = createClassLoaderForTesting()
  loader._registerPrimitives({
    Thing: {
      primitiveMethod: () => 'primitive method'
    },
    'Thing class': {
      primitiveMethod: () => 'primitive class method'
    }
  })
  loader.registerClass('Thing', path.join(testDataPath, 'Thing.som'))
  const Thing = loader.loadClass('Thing')

  const aThing = Thing.new()
  t.is(typeof aThing.primitiveMethod, 'function')
  t.is(aThing.primitiveMethod(), 'primitive method')

  t.is(typeof Thing.primitiveMethod, 'function')
  t.is(Thing.primitiveMethod(), 'primitive class method')
})

test('compiled methods', t => {
  const loader = createClassLoaderForTesting()
  loader.registerClass('Thing', path.join(testDataPath, 'Thing.som'))
  const Thing = loader.loadClass('Thing')

  const aThing = Thing.new()
  t.is(typeof aThing.asString, 'function')
  t.is(aThing.asString(), 'a thing')

  t.is(typeof Thing.className, 'function')
  t.is(Thing.className(), 'Thing!')
})
