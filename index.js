const cors = require('cors')
const express = require('express')
const http = require('http')
const { exec, spawn } = require('child_process')

const PORT = process.env.PORT || 3000

const app = express()

module.exports = app

app.use(cors())
app.get('/', home)
app.get('/video', video)
app.get('/ffmpeg', ffmpeg)

app.listen(PORT)
console.log('Server listening on port', PORT)

function home (req, res) {
  res.redirect(`https://videodownloadtool.io/?host=${req.headers.host}`)
}

function video (req, res) {
  console.log(req.url)
  const ytUrl = req.query.ytUrl

  const cmd = `yt-dlp -J '${ytUrl}'`
  exec(cmd, function (err, stdout, stderr) {
    if (err || stderr) return onError(res, err || stderr)

    const meta = JSON.parse(stdout)
    res.json(meta)
  })
}

function ffmpeg (req, res) {
  console.log(req.url)
  const { args, filename } = req.query
  res.setHeader('Content-disposition', `attachment; filename=${filename}`)
  const child = spawn('ffmpeg', args.split(','))

  child.stdout.pipe(res)
  child.stderr.on('data', d => process.stderr.write(d))
  res.on('close', () => child.kill())
}

function onError (res, err) {
  res.statusCode = err.statusCode || 500
  logError(res, err)

  const body = {
    error: err.message || http.STATUS_CODES[res.statusCode]
  }

  if (err instanceof SyntaxError) {
    body.detail = err.detail
    body.name = err.name
  }

  res.json(body)
}

function logError (res, err) {
  const logType = res.statusCode >= 500 ? 'error' : 'warn'

  console[logType]({
    err: err,
    statusCode: res.statusCode
  }, err.message)
}
