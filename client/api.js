const API_HOST = 'https://video-download-tool.herokuapp.com'

module.exports = { getFormats, getDownloadUrl }

function getFormats (ytUrl) {
  const urlMeta = `${API_HOST}/video?ytUrl=${encodeURIComponent(ytUrl)}`

  return window
    .fetch(urlMeta)
    .then(res => res.json())
    .then(meta => {
      meta.formats = meta.formats.filter(function (f) {
        return f.ext === 'mp4' && f.acodec !== 'none'
      })

      return meta
    })
}

function getDownloadUrl ({ title, args }) {
  const filename = encodeURIComponent(title + '.mkv')
  const argsQuery = encodeURIComponent(args.join(','))
  return `${API_HOST}/ffmpeg?filename=${filename}&args=${argsQuery}`
}
