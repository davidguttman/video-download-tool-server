const html = require('nanohtml')
const linmap = require('linmap')

const state = {
  filename: '',
  url: '',
  cropMode: false,
  cropStartX: 0,
  cropStartY: 0,
  cropWidth: 0,
  cropHeight: 0,
  crop: {}
}

const video = html`<video style='display: none; width: 100%' controls></video>`
const cropMarker = html`<div style='position: absolute; z-index: 999; opacity: 0.5; background: #f0f; pointer-events: none'></div>`
const textarea = html`<textarea style='width: 100%; height: 200px'></textarea>`

const el = html`
  <body>

    <div>
      <input type="text" onchange=${onYTUrlChange}></input>
    </div>

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

    <div style='width: 100%; position: relative;'>
      ${cropMarker}
      ${video}
    </div>

    <div>
      ${textarea}
    </div>
  </body>
`

document.body.appendChild(el)

video.addEventListener('mousedown', cropStart)
video.addEventListener('mouseup', cropEnd)
video.addEventListener('mousemove', cropUpdate)

function onYTUrlChange (evt) {
  // video.src = `//localhost:3000/video?ytUrl=${encodeURIComponent(evt.target.value)}`
  // video.load()
  // video.play()
  // video.style.display = 'block'

  const urlMeta = `//localhost:3000/video?ytUrl=${encodeURIComponent(evt.target.value)}`
  window.fetch(urlMeta)
    .then(res => res.json())
    .then(data => onMeta(data))

  function onMeta (meta) {
    console.log('meta', meta)
    state.title = meta.title
    state.url = meta.url

    video.src = state.url
    video.load()
    video.play()
    video.style.display = 'block'
  }
}

function updateOutput () {
  textarea.value = outputCommand({
    url: state.url,
    title: state.title,
    timeStart: toTimeStr(state.secsStart),
    duration: toTimeStr((state.secsEnd || video.duration) - state.secsStart),
    width: state.crop.width,
    height: state.crop.height,
    xOffset: state.crop.xOffset,
    yOffset: state.crop.yOffset
  })
}

function onFile (evt) {
  const file = evt.target.files[0]
  state.title = file.name

  video.src = URL.createObjectURL(file)
  video.load()
  video.style.display = 'block'
}

function toggleCrop () {
  video.controls = !video.controls
}

function setStart () {
  state.secsStart = video.currentTime
  console.log('video.currentTime', toTimeStr(video.currentTime))
  console.log('video.duration', toTimeStr(video.duration))
  updateOutput()
}

function setEnd () {
  state.secsEnd = video.currentTime
  updateOutput()
}

function cropStart (evt) {
  state.cropMode = true

  state.cropStartX = evt.layerX
  state.cropStartY = evt.layerY

  cropMarker.style.left = state.cropStartX + 'px'
  cropMarker.style.top = state.cropStartY + 'px'
  cropMarker.style.width = 0 + 'px'
  cropMarker.style.height = 0 + 'px'
}

function cropEnd (evt) {
  cropUpdate(evt)
  if (!state.cropMode) return
  state.cropMode = false

  const { width, height } = video.getBoundingClientRect()
  const { videoHeight, videoWidth } = video

  state.crop = {
    xOffset: Math.round(linmap(0, width, 0, videoWidth, state.cropStartX)),
    yOffset: Math.round(linmap(0, height, 0, videoHeight, state.cropStartY)),
    width: Math.round(linmap(0, width, 0, videoWidth, state.cropWidth)),
    height: Math.round(linmap(0, height, 0, videoHeight, state.cropHeight))
  }

  updateOutput()
}

function cropUpdate (evt) {
  if (!state.cropMode) return
  state.cropWidth = evt.layerX - state.cropStartX
  state.cropHeight = evt.layerY - state.cropStartY

  cropMarker.style.width = state.cropWidth + 'px'
  cropMarker.style.height = state.cropHeight + 'px'
}

function outputCommand (opts) {
  const { url, title, timeStart, duration, width, height, xOffset, yOffset } = opts

  const args = [
    '-ss',
    timeStart,
    '-i',
    `"${url}"`,
    '-filter:a',
    'volume=0.10',
    '-filter:v',
    `crop=${width}:${height}:${xOffset}:${yOffset}`,
    '-t',
    duration,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    `"${title}-cropped.mp4"`
  ]

  return `ffmpeg ${args.join(' ')}`
}

function toTimeStr (secs) {
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor(secs / 60 - hours * 60)
  const seconds = Math.floor(secs - (minutes * 60) - (hours * 3600))

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function pad (n) {
  return n < 10 ? '0' + n : n
}
