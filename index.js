const cors = require('cors')
const express = require('express')
const { exec, spawn } = require('child_process')

const PORT = process.env.PORT || 3000

const app = express()

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
    if (err) return console.error(err)
    if (stderr) console.error(stderr)

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
