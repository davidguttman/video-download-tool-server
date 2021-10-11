const insert = require('insert-css')

require('./tachyons')
require('./loaders')

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
