import { assert } from '../assert.mjs'

export default {
  Method: {
    signature () {
      return this._str(this._signature)
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
      return this._newWithProps({
        _signature: signature,
        _holder: classObj,
        _nativeMethod: nativeMethod
      })
    }
  }
}
