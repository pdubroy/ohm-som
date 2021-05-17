export default {
  Object: {
    objectSize () {
      throw new Error('not implemented')
    },

    '==' (other) {
      return this === other
    },

    hashcode () {
      throw new Error('not implemented')
    },

    inspect () {
      throw new Error('not implemented')
    },

    halt () {
      throw new Error('not implemented')
    },

    'perform:' (aSymbol) {
      throw new Error('not implemented')
    },

    'perform:withArguments:' (aSymbol, args) {
      throw new Error('not implemented')
    },

    'perform:inSuperclass:' (aSymbol, cls) {
      throw new Error('not implemented')
    },

    'perform:withArguments:inSuperclass:' (aSymbol, args, cls) {
      throw new Error('not implemented')
    },

    'instVarAt:' (idx) {
      throw new Error('not implemented')
    },

    'instVarAt:put:' (idx, obj) {
      throw new Error('not implemented')
    },

    'instVarNamed:' (sym) {
      throw new Error('not implemented')
    }
  }
}
