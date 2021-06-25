import test from 'ava'

import { createKernelPrimitivesForTesting } from '../primitives/index.mjs'
import { createKernel } from '../kernel.mjs'

function createKernelForTesting () {
  const globals = Object.create(null)

  // Fake the Symbol constructor to make it return a native string.
  globals.Symbol = { _new: str => str }

  const primitives = createKernelPrimitivesForTesting(globals)
  return createKernel(primitives)
}

test('kernel classes', t => {
  const { Object, Class, Metaclass, Nil, nil } = createKernelForTesting()

  t.is(Object.name(), 'Object')
  t.is(Object.class().name(), 'Object class')
  t.is(Object.superclass(), nil)
  t.is(
    Object.class()
      .class()
      .name(),
    'Metaclass'
  )
  t.is(
    Metaclass.class()
      .class()
      .name(),
    'Metaclass'
  )
  t.is(nil.class(), Nil)
  t.is(Metaclass.superclass(), Class)
  t.is(Class.superclass(), Object)
})
