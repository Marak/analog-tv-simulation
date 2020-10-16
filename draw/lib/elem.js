module.exports = function () {
  var attached = false
  var iv = null
  var last = 0
  var element = document.createElement('div')
  return {
    element,
    touch: function() {
      if (!attached) {
        document.body.appendChild(element)
        attached = true
        iv = setInterval(() => {
          var now = performance.now()
          if (now - last > 50) {
            clearInterval(iv)
            iv = null
            document.body.removeChild(element)
            attached = false
          }
        }, 100)
      }
      last = performance.now()
    }
  }
}
