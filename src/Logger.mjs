import Logger from 'js-logger'

import { assert } from './assert.mjs'

const isValidLoggerLevel = str => Logger[str] && Logger[str].name === str

let defaultLevel = Logger.WARN
const { LOG_LEVEL } = process.env

if (LOG_LEVEL) {
  const level = LOG_LEVEL.toUpperCase()
  assert(isValidLoggerLevel(level), `Invalid value for LOG_LEVEL: ${LOG_LEVEL}`)
  defaultLevel = Logger[level]
}

Logger.useDefaults({
  defaultLevel
})

export { Logger }
