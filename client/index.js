require('./style')
const downloader = require('./downloader')

document.title = 'Video Download Tool'

document.body.appendChild(downloader())
