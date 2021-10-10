const cors = require('cors')
const express = require('express')
const { exec, spawn } = require('child_process')

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.get('/video', function (req, res) {
  const ytUrl = req.query.ytUrl

  const cmd = `yt-dlp -J '${ytUrl}'`
  exec(cmd, function (err, stdout, stderr) {
    if (err) return console.error(err)
    if (stderr) console.error(stderr)

    const meta = JSON.parse(stdout)
    res.json(meta)
  })
})

app.get('/ffmpeg', function (req, res) {
  const { args, filename } = req.query
  res.setHeader('Content-disposition', `attachment; filename=${filename}`)
  res.setHeader('content-type', 'video/mp4')
  const child = spawn('ffmpeg', args.split(','))

  child.stdout.pipe(res)
  console.log('ffmpeg', args.split(',').join(' '))
  child.stderr.on('data', d => process.stderr.write(d))
  res.on('close', () => child.kill())
  console.log(args.split(','))
})

app.listen(PORT)
console.log('Server listening on port', PORT)
