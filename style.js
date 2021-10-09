const load = require('loads-css')
const insert = require('insert-css')

load('https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css', function () {
  insert(`
    body {
      background: #1c1c1c
    }
  `)
})
