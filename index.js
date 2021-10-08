var html = require('nanohtml')

var state = {
  cropMode: false,
  cropStartX: 0,
  cropStartY: 0,
  cropWidth: 0,
  cropHeight: 0
}

var video = html`<video style='width: 100%' controls></video>`
var cropMarker = html`<div style='position: absolute; z-index: 999; opacity: 0.5; background: #f0f; pointer-events: none'></div>`

var el = html`
  <body>
    <div>
      <label>
        Choose video: <input type="file" onchange=${onFile}>
      </label>
    </div>

    <div>
      <button onclick=${setStart}>Set Start Time</button>
      <button onclick=${setEnd}>Set End Time</button>
      <button onclick=${toggleCrop}>Crop</button>
    </div>

    <div style='width: 80%; position: relative;'>
      ${cropMarker}
      ${video}
    </div>
  </body>
`

document.body.appendChild(el)

video.addEventListener('mousedown', cropStart)
video.addEventListener('mouseup', cropEnd)
video.addEventListener('mousemove', cropUpdate)

function onFile (evt) {
  const file = evt.target.files[0]
  const filename = file.name

  video.src = URL.createObjectURL(file)
  video.load()
}

function toggleCrop () {
  video.controls = !video.controls
}

function setStart () {
  console.log('video.currentTime', toTimeStr(video.currentTime))
  console.log('video.duration', toTimeStr(video.duration))
}

function setEnd () {}

function cropStart (evt) {
  state.cropMode = true
  const { x, y, top, left, width, height } = video.getBoundingClientRect()
  state.cropStartX = event.layerX
  state.cropStartY = event.layerY

  cropMarker.style.left = state.cropStartX + 'px'
  cropMarker.style.top = state.cropStartY + 'px'
  cropMarker.style.width = 0 + 'px'
  cropMarker.style.height = 0 + 'px'
}

function cropEnd (evt) {
  cropUpdate(evt)
  if (!state.cropMode) return
  state.cropMode = false
}

function cropUpdate (evt) {
  if (!state.cropMode) return
  console.log('crop update', evt)
  state.cropWidth = evt.layerX - state.cropStartX
  state.cropHeight = evt.layerY - state.cropStartY

  cropMarker.style.width = state.cropWidth + 'px'
  cropMarker.style.height = state.cropHeight + 'px'
}

function outputCommand (opts) {
  const { title, timeStart, duration, width, height, xOffset, yOffset } = opts
  const cmd = `ffmpeg`
  const args = [
    '-ss',
    timeStart,
    '-i',
    `${input.trim()}`,
    `-filter:a`,
    'volume=0.10',
    '-filter:v',
    `crop=${width}:${height}:${xOffset}:${yOffset}`,
    '-t',
    duration,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    `${title}.mp4`
  ]
}

function toTimeStr (secs) {
  let hours = Math.floor(secs / 3600)
  let minutes = Math.floor(secs / 60 - hours * 60)
  let seconds = Math.floor(secs - minutes * 60)
  let hourValue
  let minuteValue
  let secondValue

  if (hours < 10) {
    hourValue = '0' + hours
  } else {
    hourValue = hours
  }

  if (minutes < 10) {
    minuteValue = '0' + minutes
  } else {
    minuteValue = minutes
  }

  if (seconds < 10) {
    secondValue = '0' + seconds
  } else {
    secondValue = seconds
  }

  let mediaTime = hourValue + ':' + minuteValue + ':' + secondValue

  return mediaTime
}
