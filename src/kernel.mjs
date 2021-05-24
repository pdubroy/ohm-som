import primitives from './primitives/index.mjs'

function extend (obj, props = {}) {
  return Object.assign(Object.create(obj), props)
}

// Create a new stub class object named `name` as an instance of `cls`.
export function createClassStub (cls, name, superclass, instSlots = {}) {
  const classObj = extend(cls && cls._prototype, {
    _name: name,
    _prototype: extend(superclass._prototype, instSlots)
  })
  classObj._prototype.class = () => classObj
  return classObj
}

// Returns freshly-created set of kernel classes/objects.
export function createKernel (rootProto = null) {
  // First, create stubs.
  const SomObject = createClassStub(
    null, // -> ObjectClass -- see (1), below
    'Object',
    { _prototype: rootProto }, // -> Seen as `nil` -- see (4)
    primitives.Object
  )

  const Class = createClassStub(
    null, // -> ClassClass (2)
    'Class',
    SomObject,
    primitives.Class
  )
  Class._prototype.class = () => Class

  const Metaclass = createClassStub(
    null, // -> MetaclassClass (3)
    'Metaclass',
    Class
  )

  // Now create the metaclasses and wire them up.
  // Note that SOM is different from Smalltalk-80 in that `Metaclass superclass`
  // is Class, not ClassDescription.

  const ObjectClass = createClassStub(Metaclass, 'Object class', Class)
  const ClassClass = createClassStub(Metaclass, 'Class class', ObjectClass)
  const MetaclassClass = createClassStub(
    Metaclass,
    'Metaclass class',
    ClassClass
  )

  // (1) Object is-a ObjectClass
  Reflect.setPrototypeOf(SomObject, ObjectClass._prototype)
  SomObject.class = () => ObjectClass

  // (2) Class is-a ClassClass
  Reflect.setPrototypeOf(Class, ClassClass._prototype)
  Class.class = () => ClassClass

  // (3) Metaclass is-a MetaclassClass
  Reflect.setPrototypeOf(Metaclass, MetaclassClass._prototype)
  Metaclass.class = () => MetaclassClass

  // Create `nil`, which is required for initializing other classes.
  const NilClass = createClassStub(Metaclass, 'Nil class', ObjectClass)
  const Nil = createClassStub(NilClass, 'Nil', SomObject)
  const nil = Nil.new()

  // (4) Implement superclass and ensure `Object superclass` returns `nil`.
  Class._prototype.superclass = function () {
    const parentProto = Reflect.getPrototypeOf(this._prototype)
    return parentProto === rootProto ? nil : parentProto.class()
  }

  return { Object: SomObject, Class, Metaclass, Nil, nil }
}
