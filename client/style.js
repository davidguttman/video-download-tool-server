const load = require('loads-css')
const insert = require('insert-css')

require('./loaders')

load('https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css', function () {
  insert(`
    body {
      background: #1c1c1c
    }

    .ball-scale-ripple-multiple > div {
      border-color: #ff41b4;
      border-radius: 0;
      transform: scale(3);
    }
  `)
})
