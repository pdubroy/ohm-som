import test from 'ava'

import { Object, Metaclass, nil } from './kernel.mjs'

test('kernel classes', t => {
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

  //  t.is(
  //    Set.class()
  //      .methods()
  //      .size(),
  //    1
  //  )
})
