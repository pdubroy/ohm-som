import primitives from './primitives/index.mjs'

function extend (superclass, props = {}) {
  return Object.assign(
    Object.create(superclass && superclass._prototype),
    props
  )
}

// Create a new stub class object named `name` which delegates to `proto`.
// This does not create the associated metaclass.
export function createClassStub (proto, name, superclass, instSlots = {}) {
  const classObj = extend(proto, {
    _name: name,
    _prototype: extend(superclass, instSlots)
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
    rootProto, // -> Seen as `nil` -- see (4)
    primitives.Object
  )
  SomObject._prototype.class = () => SomObject

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
  Metaclass._prototype.class = () => Metaclass

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
    return parentProto ? parentProto.class() : nil
  }

  return { Object: SomObject, Class, Metaclass, Nil, nil }
}
