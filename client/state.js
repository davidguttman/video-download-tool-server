const set = require('lodash.set')
const Emitter = require('wildemitter')

module.exports = function createState () {
  return new Emitter()
}

Emitter.prototype.set = function (path, value) {
  if (typeof path === 'object') {
    return Object.keys(path).map(k => this.set(k, path[k]))
  }

  set(this, path, value)
  this.emit(path, value)
  return value
}
