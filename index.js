const html = require('nanohtml')
const linmap = require('linmap')
const urlParse = require('url-parse')

require('./style')
const state = require('./state')

state.set({
  filename: '',
  url: '',
  cropMode: false,
  cropStartX: 0,
  cropStartY: 0,
  cropWidth: 0,
  cropHeight: 0,
  crop: {}
})

const video = html`<video style='display: none; width: 100%' controls />`
const cropMarker = html`<div style='position: absolute; z-index: 999; opacity: 0.5; background: #f0f; pointer-events: none' />`
const textarea = html`<textarea style='width: 100%; height: 200px' />`
const downloadButton = html`<button style='display: none' />`

const el = html`
  <div class='sans-serif white-90 pa5'>
    ${renderHeader()}

    ${renderInput()}

    ${renderActions()}

    <div style='width: 100%; position: relative;'>
      ${cropMarker}
      ${video}
    </div>

    <div>
      ${textarea}
    </div>
  </div>
`

function renderHeader () {
  return html`
    <div>
      <h1>Video Download Helper</h1>
    </div>
  `
}

function renderInput () {
  return html`
    <div class='mv4'>
      <label class='white-90'>
        Video URL:
        <input
          type='text'
          placeholder='https://www.youtube.com/watch?v=...'
          class='input-reset bg-dark-gray white-90 w-100 pa2 ba b--black-20'
          onchange=${onYTUrlChange} />
      </label>
    </div>
  `
}

function renderActions () {
  const btnClass = 'f6 grow br-pill ph3 pv2 mb2 dib white bg-hot-pink'
  return html`
    <div>
      <a class=${btnClass} onclick=${setStart}>Set Start Time</a>
      <a class=${btnClass} onclick=${setEnd}>Set End Time</a>
      <a class=${btnClass} onclick=${toggleCrop}>Crop</a>
      ${downloadButton}
    </div>
  `
}

document.body.appendChild(el)

video.addEventListener('mousedown', cropStart)
video.addEventListener('mouseup', cropEnd)
video.addEventListener('mousemove', cropUpdate)

function onYTUrlChange (evt) {
  const orig = evt.target.value
  const parsed = urlParse(orig, true)
  console.log('parsed', parsed)
  parsed.set('query', { v: parsed.query.v })

  console.log('parsed.href', parsed.href)

  const urlMeta = `//localhost:3000/video?ytUrl=${encodeURIComponent(parsed.href)}`
  window.fetch(urlMeta)
    .then(res => res.json())
    .then(data => onMeta(data))

  function onMeta (meta) {
    console.log('meta', meta)
    state.set('title', meta.title)
    state.set('url', meta.url)

    video.src = state.url
    video.load()
    video.play()
    video.style.display = 'block'
  }
}

function updateOutput () {
  const opts = {
    url: state.url,
    title: state.title,
    timeStart: toTimeStr(state.secsStart),
    duration: toTimeStr((state.secsEnd || video.duration) - state.secsStart),
    width: state.crop.width,
    height: state.crop.height,
    xOffset: state.crop.xOffset,
    yOffset: state.crop.yOffset,
    stream: true
  }

  textarea.value = 'ffmpeg ' + outputArgs(opts).join(' ')

  opts.stream = true
  downloadButton.innerHTML = `<a href='//localhost:3000/ffmpeg?filename=${encodeURIComponent(state.title + '.mkv')}&args=${encodeURIComponent(outputArgs(opts).join(','))}'>Download</a>`
  downloadButton.style.display = 'inline'
}

function toggleCrop () {
  video.controls = !video.controls
}

function setStart () {
  state.set('secsStart', video.currentTime)
  console.log('video.currentTime', toTimeStr(video.currentTime))
  console.log('video.duration', toTimeStr(video.duration))
  updateOutput()
}

function setEnd () {
  state.set('secsEnd', video.currentTime)
  updateOutput()
}

function cropStart (evt) {
  state.set('cropMode', true)

  state.set('cropStartX', evt.layerX)
  state.set('cropStartY', evt.layerY)

  cropMarker.style.left = state.cropStartX + 'px'
  cropMarker.style.top = state.cropStartY + 'px'
  cropMarker.style.width = 0 + 'px'
  cropMarker.style.height = 0 + 'px'
}

function cropEnd (evt) {
  cropUpdate(evt)
  if (!state.cropMode) return
  state.set('cropMode', false)

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
  state.set('cropWidth', evt.layerX - state.cropStartX)
  state.set('cropHeight', evt.layerY - state.cropStartY)

  cropMarker.style.width = state.cropWidth + 'px'
  cropMarker.style.height = state.cropHeight + 'px'
}

function outputArgs (opts) {
  const { url, timeStart, duration, width, height, xOffset, yOffset, stream } = opts

  const args = [
    '-ss',
    timeStart,
    '-i',
    stream ? `${url}` : `"${url}"`,
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
    '-f',
    'matroska',
    'pipe:1'
  ]

  return args
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
