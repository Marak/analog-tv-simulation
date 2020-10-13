var glsl = require('glslify')
var resl = require('resl')
var regl = require('regl')({
  extensions: [ 'oes_texture_float', 'webgl_color_buffer_float' ]
})
var state = {
  channel: 63,
  scanning: false
}
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowDown') {
    state.channel -= 1
    state.scanning = true
  } else if (ev.key === 'ArrowUp') {
    state.channel += 1
    state.scanning = true
  }
})

var draw = {
  intro: require('./draw/intro.js')(regl),
  blank: require('./draw/blank.js')(regl),
  static: require('./draw/static.js')(regl), // filter
  channel: require('./draw/channel.js')(regl),
}

var tv = require('ntsc-video')({ regl })
resl({
  manifest: {
    font: { type: 'image', src: 'images/font.png' }
  },
  onDone: (assets) => {
    var font = regl.texture(assets.font)
    var channels = {
      63: { signal: draw.intro, quality: 85 },
      empty: { signal: draw.blank, quality: 0 },
    }
    frame()
    function frame() {
      var ch = channels[state.channel] || channels.empty
      regl.clear({ color: [0,0,0,1], depth: true })
      tv.modulate(ch.signal)
      tv.filter(() => {
        draw.static({ quality: ch.quality })
      })
      //tv.filter(({signal}) => {
      //  draw.static({ signal, quality: 85 })
      //})
      // tv.overlay(() => {
      //   draw.channel({ channel: state.channel, font })
      // })
      tv.demodulate()
      draw.channel({ channel: state.channel, font })
      window.requestAnimationFrame(frame)
    }
  }
})
