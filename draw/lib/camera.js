var camera = require('./regl-camera.js')

module.exports = function(regl, opts) {
  var c = camera(regl, opts)
  c.pause()
  var iv = null
  var last = 0
  c.touch = function() {
    if (!iv) {
      c.resume()
      iv = setInterval(() => {
        if (performance.now() - last > 50) {
          clearInterval(iv)
          c.pause()
          iv = null
        }
      }, 100)
    }
    last = performance.now()
  }
  return c
}
