import test from 'ava'

import { createKernel } from './kernel.mjs'

const { Object, Metaclass, Nil, nil } = createKernel()

test('kernel classes', t => {
  // Fake the string constructor and make it return a native string.
  Object._prototype.$String = {
    _new: str => str
  }

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
})
