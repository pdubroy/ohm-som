import test from 'ava'

import { createKernelClasses } from './kernel.mjs'

const { Object, Metaclass } = createKernelClasses()

test('kernel classes', t => {
  const nil = (Object._prototype.$nil = null)

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
  //  t.is(nil.class().name(), 'Nil')

  //  t.is(
  //    Set.class()
  //      .methods()
  //      .size(),
  //    1
  //  )
})
