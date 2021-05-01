// Helpers
// -------

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

// Create a new class named `name` which inherits from `superclass`.
// Also creates the associated metaclass.
export function createClass (
  name,
  superclass,
  instSlots = {},
  classSlots = {}
) {
  const metaclass = createClassStub(
    Metaclass,
    `${name} class`,
    superclass.class(),
    classSlots
  )
  return createClassStub(metaclass, name, superclass, instSlots)
}

// Kernel classes
// --------------

// First, create stubs for nil, Object, Class, and Metaclass.

const SomObject = createClassStub(null /* -> ObjectClass (1) */, 'Object', null)
SomObject._prototype.class = () => SomObject

const Class = createClassStub(
  null /* -> ClassClass (2) */,
  'Class',
  SomObject,
  {
    name () {
      return this._name
    },
    superclass () {
      return Object.getPrototypeOf(this).class()
    },
    new () {
      return Object.create(this._prototype)
    }
  }
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
const MetaclassClass = createClassStub(Metaclass, 'Metaclass class', ClassClass)

// (1) Object is-a ObjectClass
Object.setPrototypeOf(SomObject, ObjectClass._prototype)
SomObject.class = () => ObjectClass

// (2) Class is-a ClassClass
Object.setPrototypeOf(Class, ClassClass._prototype)
Class.class = () => ClassClass

// (3) Metaclass is-a MetaclassClass
Object.setPrototypeOf(Metaclass, MetaclassClass._prototype)
Metaclass.class = () => MetaclassClass

// Ensure `Object superclass` returns `nil`.
const Nil = createClass('Nil', SomObject)
const nil = Nil.new()
ObjectClass._prototype.superclass = () => nil

export { SomObject as Object, Class, Metaclass, Nil, nil }
