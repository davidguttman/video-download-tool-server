const html = require('nanohtml')
const morph = require('nanomorph')
const linmap = require('linmap')
const urlParse = require('url-parse')

require('./style')
const state = require('./state')

const API_HOST = 'https://video-download-tool.herokuapp.com'

document.title = 'Video Download Tool'

state.set({
  // debug: true,
  isLoading: false,
  title: '',
  filename: '',
  url: '',
  cropMode: false,
  isCropping: false,
  cropStartX: 0,
  cropStartY: 0,
  cropWidth: 0,
  cropHeight: 0,
  crop: {},
  duration: 0,
  currentTime: 0,
  ytUrl: '',
  ffmpegCommand: '',
  downloadLocation: '',
  reduceVolume: false,
  secsStart: 0,
  secsEnd: 0,
  formats: [],
  showFormats: false
})

const video = renderPlayer()
document.body.appendChild(morphify(render))

function render () {
  return html`
    <div class='sans-serif white-90 pa5'>
      ${renderHeader()}
      ${renderInput()}
      ${renderDisplay()}
      ${renderActions()}
      ${renderDebug()}
    </div>
  `
}

function renderHeader () {
  return html`
    <div>
      <h1>Video Download Tool</h1>
    </div>
  `
}

function renderInput () {
  const btnClass = 'f6 grow br-pill ph3 pv2 mb2 dib white bg-hot-pink no-underline pointer ba b--black-20 hover-bg-pink'
  return html`
    <div class='mv4 ${state.isLoading || state.url ? 'dn' : ''}'>
      <form action='#' onsubmit=${onYTLoad}>
        <label class='white-90'>
          Video URL:
          <input
            type='text'
            placeholder='https://www.youtube.com/watch?v=...'
            class='input-reset bg-dark-gray white-90 w-70 pa2 ba b--black-20 mr3'
            onchange=${onYTUrlChange} />
        </label>
        <button class=${btnClass} type='submit'>Load</button>
      </form>
    </div>
  `
}

function renderActions () {
  const btnClass = 'f6 grow br-pill ph3 pv2 mb2 mr2 dib white bg-hot-pink no-underline pointer hover-bg-pink'

  return html`
    <div class='mv3 tc' style=${!state.url ? 'display: none' : ''}>
      <div class='center'>
        <a class=${btnClass} onclick=${setStart}>
          ${state.secsStart
            ? `Start: ${toTimeStr(state.secsStart)}`
            : 'Set Start Time'}
        </a>
        <a class=${btnClass} onclick=${setEnd}>
          ${state.secsEnd
            ? `End: ${toTimeStr(state.secsEnd)}`
            : 'Set End Time'}
        </a>
        <a class=${btnClass} onclick=${toggleCrop}>
          ${state.cropMode ? 'Show Controls' : 'Crop'}
        </a>
        <a class=${btnClass} onclick=${toggleReduceVolume}>
          Reduce Volume ${state.reduceVolume ? '☑' : '☐'}
        </a>
        <a
          class=${btnClass}
          style=${!state.downloadLocation ? 'display: none' : ''}
          href=${state.downloadLocation}>
          Download
        </a>
      </div>
    </div>
  `
}

function renderDisplay () {
  return html`

    <div>
      ${renderLoader()}

      ${renderMeta()}

      <div class='relative tc'>
        <div class='${!state.url ? 'dn' : ''}'>
          ${renderCropMarker()}
          ${video}
        </div>
      </div>
    </div>
  `
}

function renderMeta () {
  // ▼ ◀
  if (!state.title || !state.formats.length) return blank()

  return html`
    <div class='flex justify-between items-center mb2'>
      <h2 class='f4 white'>${state.title}</h2>
      <div class='tr'>
        <a class='gray pb1 pointer' onclick=${onToggleShowFormats}>
          ${state.formats.length} Formats ${state.showFormats
    ? '\u25BC'
    : '\u25C0'}
        </a>
        <div class=${!state.showFormats ? 'dn' : ''}>
          ${state.formats.map(renderFormat)}
        </div>
      </div>

    </div>
  `
}

function renderFormat (format) {
  const selectedFormat = state.format || {}

  return html`
    <div>
      <a class='pointer hover-hot-pink' onclick=${() => onSelectFormat(format)}>
        <span class='hot-pink'>
          ${selectedFormat.format_note === format.format_note ? '\u2713 ' : ''}
        </span>
        ${format.format_note}
      </a>
    </div>
  `
}

function renderCropMarker () {
  return html`
    <div
      style='
        position: absolute;
        z-index: 999;
        opacity: 0.5;
        background: #f0f;
        pointer-events: none;
        left: ${state.cropStartX}px;
        top: ${state.cropStartY}px;
        width: ${state.cropWidth}px;
        height: ${state.cropHeight}px'
      />`
}

function renderPlayer () {
  const video = html`<video class='w-100' controls />`
  video.isSameNode = () => true

  video.addEventListener('mousedown', cropStart)
  video.addEventListener('mouseup', cropEnd)
  video.addEventListener('mousemove', cropUpdate)

  video.addEventListener('durationchange', function () {
    state.set('duration', video.duration)
  })

  video.addEventListener('timeupdate', function () {
    state.set('currentTime', video.currentTime)
  })

  state.on('url', function () {
    video.src = state.url
    video.load()
    video.play()
  })

  state.on('cropMode', function () {
    video.controls = !state.cropMode
  })

  state.on('isCropping', function () {
    if (state.isCropping) return

    const { width, height } = video.getBoundingClientRect()
    const { videoHeight, videoWidth } = video

    state.set('crop', {
      xOffset: Math.round(linmap(0, width, 0, videoWidth, state.cropStartX)),
      yOffset: Math.round(linmap(0, height, 0, videoHeight, state.cropStartY)),
      width: Math.round(linmap(0, width, 0, videoWidth, state.cropWidth)),
      height: Math.round(linmap(0, height, 0, videoHeight, state.cropHeight))
    })
  })

  return video
}

function renderLoader () {
  if (!state.isLoading) return blank()

  return html`
    <div class='flex items-center justify-center h5'>
      <div class='loader-inner ball-scale-ripple-multiple'>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  `
}

function renderDebug () {
  if (!state.debug) return blank()

  return html`
    <div>
      <textarea
        class='code input-reset bg-dark-gray white-80 w-100 pa2 ba b--black-20 h5'>
        ${state.ffmpegCommand}
      </textarea>
    </div>
  `
}

function onYTUrlChange (evt) {
  const orig = evt.target.value
  const parsed = urlParse(orig, true)
  parsed.set('query', { v: parsed.query.v })
  state.set('ytUrl', parsed.href)
}

function onYTLoad (evt) {
  evt && evt.preventDefault()

  state.set('isLoading', true)
  const urlMeta = `${API_HOST}/video?ytUrl=${encodeURIComponent(
    state.ytUrl
  )}`

  window
    .fetch(urlMeta)
    .then(res => res.json())
    .then(meta => {
      const formats = meta.formats.filter(function (f) {
        return f.ext === 'mp4' && f.acodec !== 'none'
      })

      const format = formats[0]

      state.set('title', meta.title)
      state.set('formats', formats)
      state.set('format', format)
      state.set('url', format.url)
      state.set('isLoading', false)
    })
}

function onToggleShowFormats () {
  state.set('showFormats', !state.showFormats)
}

function onSelectFormat (format) {
  state.set('format', format)
  state.set('url', format.url)
  resetCrop()
  updateOutput()
}

function resetCrop () {
  state.set({
    cropMode: false,
    isCropping: false,
    cropStartX: 0,
    cropStartY: 0,
    cropWidth: 0,
    cropHeight: 0,
    crop: {}
  })
}

function updateOutput () {
  const opts = {
    url: state.url,
    title: state.title,
    timeStart: toTimeStr(state.secsStart),
    duration: toTimeStr((state.secsEnd || state.duration) - state.secsStart),
    width: state.crop.width,
    height: state.crop.height,
    xOffset: state.crop.xOffset,
    yOffset: state.crop.yOffset
  }

  state.set(
    'ffmpegCommand',
    'ffmpeg ' + outputArgs({ cli: true, ...opts }).join(' ')
  )

  state.set(
    'downloadLocation',
    `${API_HOST}/ffmpeg?filename=${encodeURIComponent(
      state.title + '.mkv'
    )}&args=${encodeURIComponent(outputArgs(opts).join(','))}`
  )
}

function toggleCrop () {
  state.set('cropMode', !state.cropMode)
}

function toggleReduceVolume () {
  state.set('reduceVolume', !state.reduceVolume)
}

function setStart () {
  state.set('secsStart', state.currentTime)
  if (state.secsEnd < state.secsStart) state.set('secsEnd', state.secsStart)
  console.log('state.currentTime', toTimeStr(state.currentTime))
  console.log('state.duration', toTimeStr(state.duration))
  updateOutput()
}

function setEnd () {
  state.set('secsEnd', state.currentTime)
  if (state.secsStart > state.secsEnd) state.set('secsStart', state.secsEnd)
  updateOutput()
}

function cropStart (evt) {
  state.set('isCropping', true)

  state.set('cropStartX', evt.layerX)
  state.set('cropStartY', evt.layerY)
  state.set('cropWidth', 0)
  state.set('cropHeight', 0)
}

function cropEnd (evt) {
  cropUpdate(evt)
  if (!state.isCropping) return
  state.set('isCropping', false)

  updateOutput()
}

function cropUpdate (evt) {
  if (!state.isCropping) return
  state.set('cropWidth', evt.layerX - state.cropStartX)
  state.set('cropHeight', evt.layerY - state.cropStartY)
}

function outputArgs (opts) {
  const {
    url,
    timeStart,
    duration,
    width,
    height,
    xOffset,
    yOffset,
    cli
  } = opts

  const shouldCrop = width && height
  const shouldTrim = timeStart && duration
  const shouldVolume = state.reduceVolume

  const args = [
    shouldTrim && '-ss',
    shouldTrim && timeStart,
    '-i',
    cli ? `"${url}"` : `${url}`,
    shouldVolume && '-filter:a',
    shouldVolume && 'volume=0.10',
    shouldCrop && '-filter:v',
    shouldCrop && `crop=${width}:${height}:${xOffset}:${yOffset}`,
    shouldTrim && '-t',
    shouldTrim && duration,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-f',
    'matroska',
    'pipe:1'
  ]

  return args.filter(a => a)
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

function morphify (fn) {
  const tree = fn()

  state.on('*', function (key, val) {
    if (key === 'currentTime') return
    morph(tree, fn())
  })

  return tree
}

function blank () {
  return html`<span />`
}
