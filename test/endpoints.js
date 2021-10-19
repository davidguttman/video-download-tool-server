process.env.NODE_ENV = 'test'

const test = require('ava')
const request = require('supertest')

const server = require('../index')

test.serial.cb('should return error if command execution failed on /video',
  function (t) {
    const youtubeVideoUrl = 'https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3'
    const url = `/video?ytUrl=${youtubeVideoUrl}`
    request(server)
      .get(url)
      .expect(500)
      .end(function (err, res) {
        t.falsy(err)
        t.is(
          res.body.error.split('\n').join(' '),
          `Command failed: yt-dlp -J '${youtubeVideoUrl}' /bin/sh: yt-dlp: command not found `
        )
        return t.end()
      })
  })
