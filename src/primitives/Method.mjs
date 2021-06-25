import { assert } from '../assert.mjs'

export default g => ({
  Method: {
    signature () {
      return g.String._new(this._signature)
    },
    holder () {
      return this._holder
    },
    'invokeOn:with:' (obj, args) {
      this._nativeMethod.apply(obj, args)
    }
  },
  'Method class': {
    _new (classObj, signature) {
      const nativeMethod = classObj._prototype[signature]
      assert(
        nativeMethod,
        `No such method '${signature}' on ${classObj.name()}`
      )
      return this._basicNew({
        _signature: signature,
        _holder: classObj,
        _nativeMethod: nativeMethod
      })
    }
  }
})
