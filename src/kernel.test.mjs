import test from 'ava'

import { createKernelClasses } from './kernel.mjs'

const { Object, Metaclass } = createKernelClasses()

test('kernel classes', t => {
  const nil = (Object._prototype.$nil = null)

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
})
