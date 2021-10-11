module.exports = {
  toTimeStr,
  pad
}

function toTimeStr (secs) {
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor(secs / 60 - hours * 60)
  const seconds = Math.floor(secs - minutes * 60 - hours * 3600)

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function pad (n) {
  return n < 10 ? '0' + n : n
}
