const html = require('nanohtml')
const morph = require('nanomorph')
const linmap = require('linmap')

const state = require('./state')()

module.exports = function renderPlayer ({ onCrop, onDuration, onTimeUpdate }) {
  const video = html`<video class='w-100' controls />`
  const cropMarker = renderCropMarker()
  const el = html`
    <div class='relative tc'>
      ${cropMarker}
      ${video}
    </div>
  `
  video.isSameNode = () => true

  video.addEventListener('mousedown', cropStart)
  video.addEventListener('mouseup', cropEnd)
  video.addEventListener('mousemove', cropUpdate)
  video.addEventListener('durationchange', () => onDuration(video.duration))
  video.addEventListener('timeupdate', () => onTimeUpdate(video.currentTime))

  state.on('cropWidth', onCropUpdate)
  state.on('isCropping', onCropChange)

  return {
    el,
    resetCrop,
    showCrop,
    hideCrop,
    updateUrl
  }

  function onCropUpdate () {
    morph(cropMarker, renderCropMarker())
  }

  function onCropChange () {
    if (state.isCropping) return

    const { width, height } = video.getBoundingClientRect()
    const { videoHeight, videoWidth } = video

    onCrop({
      xOffset: Math.round(linmap(0, width, 0, videoWidth, state.cropStartX)),
      yOffset: Math.round(linmap(0, height, 0, videoHeight, state.cropStartY)),
      width: Math.round(linmap(0, width, 0, videoWidth, state.cropWidth)),
      height: Math.round(linmap(0, height, 0, videoHeight, state.cropHeight))
    })
  }

  function showCrop () {
    video.controls = false
  }

  function hideCrop () {
    video.controls = true
  }

  function updateUrl (url) {
    if (!url) return

    video.src = url
    video.load()
    video.play()
  }
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
}

function cropUpdate (evt) {
  if (!state.isCropping) return
  state.set('cropWidth', evt.layerX - state.cropStartX)
  state.set('cropHeight', evt.layerY - state.cropStartY)
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
