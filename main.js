var glsl = require('glslify')
var resl = require('resl')
var regl = require('regl')({
  extensions: [
    'oes_standard_derivatives',
    'oes_element_index_uint',
    'ext_blend_minmax'
  ]
})
var { EventEmitter } = require('events')

var state = {
  events: new EventEmitter,
  channel: {
    display: 63,
    value: 63,
    changed: 0,
    typing: 0,
    scanning: false
  },
  paused: false
}
function unpause() {
  if (state.paused) {
    state.paused = false
    state.events.emit('frame')
  }
}
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowDown') {
    state.channel.value -= 1
    state.channel.display = state.channel.value
    state.channel.changed = performance.now()
    state.channel.typing = 0
    state.channel.scanning = true
    unpause()
  } else if (ev.key === 'ArrowUp') {
    state.channel.value += 1
    state.channel.display = state.channel.value
    state.channel.changed = performance.now()
    state.channel.typing = 0
    state.channel.scanning = true
    unpause()
  } else if (/^[0-9]/.test(ev.key)) {
    if (state.channel.typing === 0) {
      state.channel.display = Number(ev.key)
      state.channel.typing++
    } else if (state.channel.typing === 1) {
      state.channel.display *= 10
      state.channel.display += Number(ev.key)
      state.channel.value = state.channel.display
      state.channel.typing = 0
      state.channel.scanning = false
    }
    state.channel.changed = performance.now()
    unpause()
  } else if (ev.key === ' ') {
    if (state.paused) {
      unpause()
    } else {
      state.paused = true
    }
  }
})
function check(now) {
  var ch = state.channel
  if (ch.typing > 0 && now - ch.changed >= 2000) {
    state.channel.value = state.channel.display
    state.channel.typing = 0
    state.channel.scanning = false
    state.channel.changed = now
  }
}

var draw = {
  static: require('./draw/static.js')(regl),
  img: require('./draw/img.js')(regl),
  blank: require('./draw/blank.js')(regl),
  channel: require('./draw/channel.js')(regl),
  helicalScan: require('./draw/helical-scan.js')(regl),
}

var tv = require('ntsc-video')({ regl })
resl({
  manifest: {
    font: { type: 'image', src: 'images/font.png' },
    intro: { type: 'image', src: 'images/intro.jpg' },
    questions: { type: 'image', src: 'images/questions.jpg' },
    world: { type: 'image', src: 'images/world.jpg' },
    television0: { type: 'image', src: 'images/television0.jpg' },
    television1: { type: 'image', src: 'images/television1.jpg' },
  },
  onDone: (assets) => {
    var font = regl.texture(assets.font)
    var img = {
      intro: regl.texture(assets.intro),
      questions: regl.texture(assets.questions),
      television0: regl.texture(assets.television0),
      television1: regl.texture(assets.television1),
      world: regl.texture(assets.world),
    }
    var channels = {
      empty: { signal: draw.blank, quality: 0 },
      64: { signal: draw.helicalScan, quality: 75 },
      63: { signal: () => draw.img({ img: img.intro }), quality: 85 },
      62: {
        signal: () => draw.img({ img: img.questions }),
        quality: (now) => 70 + Math.floor(Math.sin(now/2000)*4)/4*10
      },
      61: {
        signal: ({time}) => {
          return draw.img({ img: time%1<0.5 ? img.television0 : img.television1 })
        },
        quality: 87
      },
      60: { signal: () => draw.img({ img: img.world }), quality: 80 },
    }
    state.events.on('frame', () => window.requestAnimationFrame(frame))
    frame()
    function frame() {
      var now = performance.now()
      var ch = channels[state.channel.value] || channels.empty
      regl.clear({ color: [0,0,0,1], depth: true })
      tv.modulate(ch.signal)
      tv.filter(() => {
        draw.static({
          quality: typeof ch.quality === 'function'
            ? ch.quality(now) : ch.quality
        })
      })
      tv.demodulate()
      if (now - state.channel.changed < 2000) {
        draw.channel({ channel: state.channel.display, font })
      }
      check(now)
      if (!state.paused) window.requestAnimationFrame(frame)
    }
  }
})
