const html = require('nanohtml')
const linmap = require('linmap')
const urlParse = require('url-parse')

require('./style')
const state = require('./state')

document.title = 'Video Download Helper'

state.set({
  // debug: true,
  isLoading: false,
  title: '',
  cropMode: false,
  filename: '',
  url: '',
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
  secsStart: 0,
  secsEnd: 0
})

const el = html`
  <div class='sans-serif white-90 pa5'>
    ${renderHeader()}
    ${renderInput()}
    ${renderVideo()}
    ${renderActions()}
    ${renderDebug()}
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
  const btnClass =
    'f6 grow br-pill ph3 pv2 mb2 dib white bg-hot-pink no-underline pointer ba b--black-20'
  return html`
    <div class='mv4'>
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
  const btnClass =
    'f6 grow br-pill ph3 pv2 mb2 mr2 dib white bg-hot-pink no-underline pointer'

  const cropButton = html`<a class=${btnClass} onclick=${toggleCrop}>Crop</a>`

  state.on('cropMode', function (cropMode) {
    cropButton.innerText = cropMode ? 'Show Controls' : 'Crop'
  })

  const downloadButton = html`<a class=${btnClass}>Download</a>`
  downloadButton.style.display = 'none'

  state.on('downloadLocation', function (downloadLocation) {
    downloadButton.href = downloadLocation
    downloadButton.style.display = 'inline-block'
  })

  const section = html`
    <div class='dn mv3 tc'>
      <div class='center'>
        <a class=${btnClass} onclick=${setStart}>Set Start Time</a>
        <a class=${btnClass} onclick=${setEnd}>Set End Time</a>
        ${cropButton}
        ${downloadButton}
      </div>
    </div>
  `

  state.on('url', function () {
    section.classList.remove('dn')
  })

  return section
}

function renderVideo () {
  const loader = html`
    <div class='flex items-center justify-center h5'>
      <div class='loader-inner ball-scale-ripple-multiple'>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  `

  loader.style.display = 'none'
  state.on('isLoading', function () {
    loader.style.display = state.isLoading ? 'flex' : 'none'
  })

  const video = html`<video style='display: none; width: 100%' controls />`
  const cropMarker = html`<div style='position: absolute; z-index: 999; opacity: 0.5; background: #f0f; pointer-events: none' />`

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
    video.style.display = 'block'
  })

  state.on('cropMode', function () {
    video.controls = !state.cropMode
  })

  state.on('cropStart*', function () {
    cropMarker.style.left = state.cropStartX + 'px'
    cropMarker.style.top = state.cropStartY + 'px'
    cropMarker.style.width = 0 + 'px'
    cropMarker.style.height = 0 + 'px'
  })

  state.on('cropWidth', function () {
    cropMarker.style.width = state.cropWidth + 'px'
  })

  state.on('cropHeight', function () {
    cropMarker.style.height = state.cropHeight + 'px'
  })

  state.on('isCropping', function () {
    if (state.isCropping) return

    const { width, height } = video.getBoundingClientRect()
    const { videoHeight, videoWidth } = video

    state.crop = {
      xOffset: Math.round(linmap(0, width, 0, videoWidth, state.cropStartX)),
      yOffset: Math.round(linmap(0, height, 0, videoHeight, state.cropStartY)),
      width: Math.round(linmap(0, width, 0, videoWidth, state.cropWidth)),
      height: Math.round(linmap(0, height, 0, videoHeight, state.cropHeight))
    }
  })

  return html`
    <div class='w-100 relative tc'>
      ${loader}
      ${cropMarker}
      ${video}
    </div>
  `
}

function renderDebug () {
  if (!state.debug) return

  const textarea = html`
    <textarea
      class='code input-reset bg-dark-gray white-80 w-100 pa2 ba b--black-20 h5' />`

  state.on('ffmpegCommand', function (cmd) {
    textarea.value = cmd
  })

  return html`
    <div>
      ${textarea}
    </div>
  `
}

document.body.appendChild(el)

function onYTUrlChange (evt) {
  const orig = evt.target.value
  const parsed = urlParse(orig, true)
  parsed.set('query', { v: parsed.query.v })
  state.set('ytUrl', parsed.href)
}

function onYTLoad (evt) {
  evt.preventDefault()

  state.set('isLoading', true)
  const urlMeta = `//localhost:3000/video?ytUrl=${encodeURIComponent(
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
    `//localhost:3000/ffmpeg?filename=${encodeURIComponent(
      state.title + '.mkv'
    )}&args=${encodeURIComponent(outputArgs(opts).join(','))}`
  )
}

function toggleCrop () {
  state.set('cropMode', !state.cropMode)
}

function setStart () {
  state.set('secsStart', state.currentTime)
  console.log('state.currentTime', toTimeStr(state.currentTime))
  console.log('state.duration', toTimeStr(state.duration))
  updateOutput()
}

function setEnd () {
  state.set('secsEnd', state.currentTime)
  updateOutput()
}

function cropStart (evt) {
  state.set('isCropping', true)

  state.set('cropStartX', evt.layerX)
  state.set('cropStartY', evt.layerY)
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

  const args = [
    shouldTrim && '-ss',
    shouldTrim && timeStart,
    '-i',
    cli ? `"${url}"` : `${url}`,
    '-filter:a',
    'volume=0.10',
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

  return args
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
