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

var ch = Number(location.hash.replace(/^#/,''))
if (!validCh(ch)) ch = 63

var state = {
  events: new EventEmitter,
  static: true,
  channel: {
    display: ch,
    value: ch,
    changed: 0,
    typing: 0,
    scanning: false
  },
  paused: false
}

function wrapCh(n) {
  if (n > 83) return 2
  if (n < 2) return 83
  return n
}
function validCh(n) { return n >= 2 && n <= 83 }

function unpause() {
  if (state.paused) {
    state.paused = false
    state.events.emit('frame')
  }
}
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowDown') {
    state.channel.value = wrapCh(state.channel.value - 1)
    state.channel.display = state.channel.value
    state.channel.changed = performance.now()
    state.channel.typing = 0
    state.channel.scanning = true
    location.hash = String(state.channel.value)
    unpause()
  } else if (ev.key === 'ArrowUp') {
    state.channel.value = wrapCh(state.channel.value + 1)
    state.channel.display = state.channel.value
    state.channel.changed = performance.now()
    state.channel.typing = 0
    state.channel.scanning = true
    location.hash = String(state.channel.value)
    unpause()
  } else if (/^[0-9]/.test(ev.key)) {
    if (state.channel.typing === 0) {
      state.channel.display = Number(ev.key)
      state.channel.typing++
    } else if (state.channel.typing === 1) {
      state.channel.display *= 10
      state.channel.display += Number(ev.key)
      if (validCh(state.channel.display)) {
        state.channel.value = state.channel.display
      } else {
        state.channel.display = state.channel.value
      }
      state.channel.typing = 0
      state.channel.scanning = false
      location.hash = String(state.channel.value)
    }
    state.channel.changed = performance.now()
    unpause()
  } else if (ev.key === ' ') {
    if (state.paused) {
      unpause()
    } else {
      state.paused = true
    }
  } else if (ev.key === 'q') {
    state.static = !state.static
  }
})
function check(now) {
  var ch = state.channel
  if (ch.typing > 0 && now - ch.changed >= 2000) {
    if (validCh(state.channel.display)) {
      state.channel.value = state.channel.display
    } else {
      state.channel.display = state.channel.value
    }
    state.channel.typing = 0
    state.channel.scanning = false
    state.channel.changed = now
    location.hash = String(state.channel.value)
  }
}

var draw = {
  static: require('./draw/static.js')(regl),
  img: require('./draw/img.js')(regl),
  blank: require('./draw/blank.js')(regl),
  channel: require('./draw/channel.js')(regl),
  helicalScan: require('./draw/helical-scan.js')(regl),
  headAzimuth: require('./draw/head-azimuth.js')(regl),
  vhs: require('./draw/vhs.js')(regl),
}

var tv = require('ntsc-video')({ regl })
resl({
  manifest: {
    font: { type: 'image', src: 'images/font.png' },
    intro: { type: 'image', src: 'images/intro.jpg' },
    questions: { type: 'image', src: 'images/questions.jpg' },
    why: { type: 'image', src: 'images/why.jpg' },
    television0: { type: 'image', src: 'images/television0.jpg' },
    television1: { type: 'image', src: 'images/television1.jpg' },
    crt: { type: 'image', src: 'images/crt.jpg' },
    shadowMask: { type: 'image', src: 'images/shadow-mask.jpg' },
    world: { type: 'image', src: 'images/world.jpg' },

    frames: { type: 'image', src: 'images/frames.jpg' },
    interlacing: { type: 'image', src: 'images/interlacing.jpg' },
    radioWaves: { type: 'image', src: 'images/radio-waves.jpg' },
    line: { type: 'image', src: 'images/line.jpg' },
    field: { type: 'image', src: 'images/field.jpg' },

    yiq: { type: 'image', src: 'images/yiq.jpg' },
    rgbToYiq: { type: 'image', src: 'images/rgb-to-yiq.jpg' },
    yiqToRgb: { type: 'image', src: 'images/yiq-to-rgb.jpg' },
    qamEq: { type: 'image', src: 'images/qam-eq.jpg' },
    qamLine: { type: 'image', src: 'images/qam-line.jpg' },

    simGoals: { type: 'image', src: 'images/sim-goals.jpg' },
    sponsors: { type: 'image', src: 'images/sponsors.jpg' },
    simModDemod: { type: 'image', src: 'images/sim-mod-demod.jpg' },
    modulate: { type: 'image', src: 'images/modulate.jpg' },
    demodulate: { type: 'image', src: 'images/demodulate.jpg' },
    demodulateIq: { type: 'image', src: 'images/demodulate-iq.jpg' },
    demodulateCode1: { type: 'image', src: 'images/demodulate-code-1.jpg' },
    demodulateCode2: { type: 'image', src: 'images/demodulate-code-2.jpg' },
    maskCode: { type: 'image', src: 'images/mask-code.jpg' },

  },
  onDone: (assets) => {
    var font = regl.texture(assets.font)
    var img = {
      intro: regl.texture(assets.intro),
      questions: regl.texture(assets.questions),
      why: regl.texture(assets.why),
      television0: regl.texture(assets.television0),
      television1: regl.texture(assets.television1),
      crt: regl.texture(assets.crt),
      shadowMask: regl.texture(assets.shadowMask),
      world: regl.texture(assets.world),

      frames: regl.texture(assets.frames),
      interlacing: regl.texture(assets.interlacing),
      radioWaves: regl.texture(assets.radioWaves),
      line: regl.texture(assets.line),
      field: regl.texture(assets.field),

      yiq: regl.texture(assets.yiq),
      rgbToYiq: regl.texture(assets.rgbToYiq),
      yiqToRgb: regl.texture(assets.yiqToRgb),
      qamEq: regl.texture(assets.qamEq),
      qamLine: regl.texture(assets.qamLine),
    }
    var channels = {
      empty: { signal: draw.blank, quality: 0 },
      72: {
        signal: draw.headAzimuth,
        quality: (now) => 80 - Math.floor(Math.pow(Math.sin(now/2000)*0.5+0.5,8)*4)/4*15
      },
      69: {
        signal: draw.vhs,
        quality: (now) => 80 - Math.floor(
          Math.pow(Math.sin(now/1000*2)*0.5+0.5,8.0)*10
        )/10*50
      },
      68: { signal: draw.helicalScan, quality: 75 },
      63: { signal: () => draw.img({ img: img.intro }), quality: 85 },
      62: {
        signal: () => draw.img({ img: img.questions }),
        quality: (now) => 70 + Math.floor(Math.sin(now/2000)*4)/4*10
      },
      61: {
        signal: () => draw.img({ img: img.why }),
        quality: (now) => 70 - Math.pow(Math.sin(now/1000*2)*0.5+0.5,3)*55
      },
      60: {
        signal: ({time}) => {
          return draw.img({ img: time%1<0.5 ? img.television0 : img.television1 })
        },
        quality: (now) => 85 - Math.pow(Math.sin(now/1000*0.5)*0.5+0.5,3)*30
      },
      58: { signal: () => draw.img({ img: img.crt }), quality: 90 },
      57: { signal: () => draw.img({ img: img.shadowMask }), quality: 85 },
      56: { signal: () => draw.img({ img: img.world }), quality: 80 },

      54: { signal: () => draw.img({ img: img.frames }), quality: 75 },
      53: { signal: () => draw.img({ img: img.interlacing }), quality: 80 },
      52: { signal: () => draw.img({ img: img.radioWaves }), quality: 70 },
      51: { signal: () => draw.img({ img: img.line }), quality: 85 },
      50: { signal: () => draw.img({ img: img.field }), quality: 95 },
    }
    state.events.on('frame', () => window.requestAnimationFrame(frame))
    frame()
    window.addEventListener('resize', () => window.requestAnimationFrame(frame))
    function frame() {
      var now = performance.now()
      var ch = channels[state.channel.value] || channels.empty
      regl.clear({ color: [0,0,0,1], depth: true })
      tv.modulate(ch.signal)
      tv.filter(() => {
        var q = typeof ch.quality === 'function' ? ch.quality(now) : ch.quality
        draw.static({ quality: state.static ? q : 100 })
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
