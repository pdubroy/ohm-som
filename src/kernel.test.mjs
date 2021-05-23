import test from 'ava'

import { createKernel } from './kernel.mjs'

const { Object, Class, Metaclass, Nil, nil } = createKernel()

test('kernel classes', t => {
  // Fake the Symbol constructor to make it return a native string.
  Object._prototype.$Symbol = {
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
  t.is(Metaclass.superclass(), Class)
  t.is(Class.superclass(), Object)
})
