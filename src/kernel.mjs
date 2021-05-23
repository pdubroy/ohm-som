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
export function createKernel () {
  // First, create stubs.
  const SomObject = createClassStub(
    null /* -> ObjectClass (1) */,
    'Object',
    null,
    primitives.Object
  )
  SomObject._prototype.class = () => SomObject

  const Class = createClassStub(
    null /* -> ClassClass (2) */,
    'Class',
    SomObject,
    primitives.Class
  )
  Class._prototype.class = () => Class

  const Metaclass = createClassStub(
    null /* -> MetaclassClass (3) */,
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
  Object.setPrototypeOf(SomObject, ObjectClass._prototype)
  SomObject.class = () => ObjectClass

  // (2) Class is-a ClassClass
  Object.setPrototypeOf(Class, ClassClass._prototype)
  Class.class = () => ClassClass

  // (3) Metaclass is-a MetaclassClass
  Object.setPrototypeOf(Metaclass, MetaclassClass._prototype)
  Metaclass.class = () => MetaclassClass

  // Finally, create `Nil`, which is required for initializing other classes.
  const NilClass = createClassStub(Metaclass, 'Nil class', ObjectClass)
  const Nil = createClassStub(NilClass, 'Nil', SomObject)
  const nil = Nil.new()

  // Ensure `Object superclass` returns `nil`.
  Class._prototype.superclass = function () {
    const parentProto = Object.getPrototypeOf(this._prototype)
    return parentProto ? parentProto.class() : nil
  }

  return { Object: SomObject, Class, Metaclass, Nil, nil }
}
