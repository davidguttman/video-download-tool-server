const set = require('lodash.set')
const unset = require('lodash.unset')
const Emitter = require('wildemitter')

const state = module.exports = new Emitter()

state.set = function (path, value) {
  if (typeof path === 'object') {
    return Object.keys(path).map(k => this.set(k, path[k]))
  }

  set(this, path, value)
  this.emit(path, value)
  return value
}

state.unset = function (path) {
  unset(this, path)
  this.emit(path, undefined)
}
