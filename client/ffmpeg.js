module.exports = {
  getArgs
}

function getArgs (opts) {
  const {
    url,
    timeStart,
    duration,
    width,
    height,
    xOffset,
    yOffset,
    reduceVolume,
    cli
  } = opts

  const shouldCrop = width && height
  const shouldTrim = timeStart && duration

  const args = [
    shouldTrim && '-ss',
    shouldTrim && timeStart,
    '-i',
    cli ? `"${url}"` : `${url}`,
    reduceVolume && '-filter:a',
    reduceVolume && 'volume=0.10',
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
