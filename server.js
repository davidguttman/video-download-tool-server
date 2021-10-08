const cors = require('cors')
const express = require('express')
const { exec } = require('child_process')

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.get('/video', function (req, res) {
  const ytUrl = req.query.ytUrl
  console.log(ytUrl)

  const cmd = `youtube-dl -f 18 -J '${ytUrl}'`
  console.log('cmd', cmd)
  exec(cmd, function (err, stdout, stderr) {
    if (err) return console.error(err)
    console.error(stderr)
    console.log(stdout)
    // const mediaUrl = stdout
    // console.log('mediaUrl', mediaUrl)
    // res.redirect(mediaUrl)
    const meta = JSON.parse(stdout)
    console.log('meta', meta)
    res.json(meta)
  })
})

app.listen(PORT)
console.log('Server listening on port', PORT)
