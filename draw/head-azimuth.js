var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var quat = require('gl-quat')
var extrudeByPath = require('extrude-by-path')

var html = require('choo/html')
var app = require('choo')()

var rstate = {
  azimuth: 0
}

app.use((state, emitter) => {
  state.azimuth = 0
  emitter.on('set-azimuth', (az) => {
    state.azimuth = az
    rstate.azimuth = az/180*Math.PI
    emitter.emit('render')
  })
})

app.route('*', (state, emit) => {
  return html`<div class="ui">
    <style>
      .ui {
        position: absolute;
        left: 0px;
        right: 0px;
        bottom: 1em;
        text-align: center;
        z-index: 5000;
        color: white;
        font-size: 3em;
        font-family: monospace;
      }
      .ui input {
        margin-right: 1ex;
      }
      .ui .az {
        display: inline-block;
        width: 3ex;
        text-align: right;
      }
    </style>
    azimuth
    <input type="range" min="-45" max="45" step="1" value="${state.azimuth}"
      oninput=${(ev) => emit('set-azimuth', Number(ev.target.value))}>
    <span class="az">${state.azimuth}</span> degrees
  </div>`
})
var root = document.createElement('div')
app.mount(root)

var tmpq = [0,0,0,1]
var tmpv = [0,0,0]
var tmpm = new Float32Array(16)
var forward = [0,0,1]

var props = {
  solid: [],
  wave: []
}

;(function() { // ferrous ring
  var path = []
  var N = 64, gap = 1/64
  for (var i = 0; i <= N; i++) {
    var theta = i/N*2*Math.PI*(1-gap)
    var r = 0.3
    path.push([
      Math.cos(theta)*r,
      0,
      Math.sin(theta)*r
    ])
  }
  var m = extrudeByPath({
    positions: [
      [+0.1,-0.15],
      [+0.1,+0.15],
      [-0.1,+0.15],
      [-0.1,-0.15]
    ],
    cells: [[0,1,2],[0,2,3]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    path
  })
  m.colors = m.positions.map(p => {
    return [0,0,0]
  })
  m.model = mat4.identity(new Float32Array(16))
  props.solid.push(m)
})()

;(function() { // tape
  props.solid.push({
    positions: [
      -0.15, +0.0, -5,
      +0.15, +0.0, -5,
      +0.15, +0.0, +5,
      -0.15, +0.0, +5,
    ],
    colors: [ 0.7,0,1, 0.7,0,1, 0.7,0,1, 0.7,0,1 ],
    cells: [0,1,2,0,2,3],
    model: mat4.identity(new Float32Array(16))
  })
})()

;(function() { // coil
  var path = []
  var R = 0.29, r = 0.18, i = 0, m = 32, n = 32*2, l = 1
  for (var k = m-1; k <= m*3-2; k++) {
    var t = 2*Math.PI*(k+0.5)/(4*n)
    path.push([ 
      Math.cos(t)*(R-r*Math.cos(2*Math.PI*i/m+l*n*t)),
      Math.sin(t)*(R-r*Math.cos(2*Math.PI*i/m+l*n*t)),
      r*Math.sin(2*Math.PI*i/m+l*n*t)*1.25
    ])
  }
  path.unshift(
    [
      path[0][0]+1,
      path[0][1],
      path[0][2]-0.25,
    ],
    [
      path[0][0],
      path[0][1],
      path[0][2]-0.25,
    ]
  )
  var k = path.length-1
  path.push(
    [
      path[k][0],
      path[k][1],
      path[k][2]-0.25,
    ],
    [
      path[k][0]+1.4,
      path[k][1],
      path[k][2]-0.25,
    ]
  )
  var m = extrudeByPath({
    positions: [
      [+0.01,-0.01],
      [+0.01,+0.01],
      [-0.01,+0.01],
      [-0.01,-0.01]
    ],
    cells: [[0,1,2],[0,2,3]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    path
  })
  m.colors = m.positions.map(p => {
    return [1,0,0.2]
  })
  m.model = mat4.identity(new Float32Array(16))
  props.solid.push(m)
})()

;(function() { // wave
  var path = []
  for (var i = 0; i <= 64; i++) {
    path.push([ 0, 0, -1-i/64*2 ])
  }
  var m = extrudeByPath({
    positions: [
      [+0.01,-0.01],
      [+0.01,+0.01],
      [-0.01,+0.01],
      [-0.01,-0.01]
    ],
    cells: [[0,1,2],[0,2,3]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
    path
  })
  m.colors = m.positions.map(p => {
    return [0,1,0]
  })
  m.model = mat4.identity(new Float32Array(16))
  props.wave.push(m)
})()

;(function () { // arrows
  for (var i = 0; i < 100; i++) {
    props.solid.push({
      positions: [
        +0.0,+0.0,+0.8,
        +0.1,+0.1,+0.5,
        -0.1,+0.1,+0.5,
        -0.1,-0.1,+0.5,
        +0.1,-0.1,+0.5,
        +0.05,+0.05,+0.5,
        -0.05,+0.05,+0.5,
        -0.05,-0.05,+0.5,
        +0.05,-0.05,+0.5,
        +0.05,+0.05,+0.0,
        -0.05,+0.05,+0.0,
        -0.05,-0.05,+0.0,
        +0.05,-0.05,+0.0,
      ],
      cells: [
        0,1,2,0,2,3,0,3,4,0,4,1,1,2,3,1,3,4,
        5,6,9,6,9,10, 6,7,10,7,10,11,
        7,8,11,8,11,12, 8,5,12,5,12,9,
        9,10,11,9,11,12
      ],
      colors: [
        0,1,1, 0,1,1, 0,1,1, 0,1,1, 0,1,1,
        0,1,1, 0,1,1, 0,1,1, 0,1,1, 0,1,1,
        0,1,1, 0,1,1, 0,1,1
      ],
      model: mat4.identity(new Float32Array(16)),
      pose: {
        position: [(Math.random()*2-1)*0.15,0,-0.5-i/50*5],
        magnitude: Math.random(),
        direction: vec3.random([])
      }
    })
  }
})()

function update(time) {
  var m
  m = props.solid[0].model
  mat4.identity(m)
  mat4.translate(m,m,vec3.set(tmpv,0,0.425,0))
  mat4.rotateY(m,m,rstate.azimuth)
  mat4.rotateZ(m,m,-Math.PI/2)

  m = props.solid[1].model
  mat4.identity(m)
  mat4.translate(m,m,vec3.set(tmpv,0,-0.12,0))

  m = props.solid[2].model
  mat4.identity(m)
  mat4.rotateY(m,m,Math.PI*0.5 + rstate.azimuth)
  mat4.translate(m,m,vec3.set(tmpv,0,0.425,0))

  m = props.wave[0].model
  mat4.identity(m)
  mat4.rotateY(m,m,rstate.azimuth)
  mat4.translate(m,m,vec3.set(tmpv,-0.4,0.65,-0.2))

  for (var i = 0; i < 100; i++) {
    var p = props.solid[i+3]
    m = p.model
    mat4.identity(m)
    mat4.translate(m,m,p.pose.position)
    var prevZ = p.pose.position[2]
    p.pose.position[2] += 0.01
    if (p.pose.position[2] > 5) {
      p.pose.position[2] -= 10
      vec3.random(p.pose.direction)
    } else if (p.pose.position[2] > 0 && prevZ <= 0) {
      var s = Math.sin(time*2)
      vec3.set(p.pose.direction,
        Math.sin(rstate.azimuth)*Math.sign(s),
        0,
        Math.cos(rstate.azimuth)*Math.sign(s)
      )
      p.pose.magnitude = Math.abs(s)
    }
    quat.rotationTo(tmpq,forward,p.pose.direction)
    mat4.fromQuat(tmpm,tmpq)
    mat4.multiply(m,m,tmpm)
    mat4.scale(m,m,vec3.set(tmpv,0.2,0.1,0.15*p.pose.magnitude+0.05))
  }
}
update(0)

module.exports = function (regl) {
  var camera = require('regl-camera')(regl, {
    distance: 3, theta: 0.7, phi: 0.5
  })
  var draw = {
    solid: solid(regl),
    wave: wave(regl)
  }
  var attached = false
  var iv = null
  var last = 0
  return function ({time}) {
    if (!attached) {
      document.body.appendChild(root)
      attached = true
      iv = setInterval(() => {
        if (performance.now() - last > 50) {
          clearInterval(iv)
          iv = null
          document.body.removeChild(root)
          attached = false
        }
      }, 100)
    }
    regl.clear({ color: [0.35,0,0.35,1], depth: true })
    camera(() => {
      draw.solid(props.solid)
      draw.wave(props.wave)
    })
    update(time)
  }
}

function solid(regl) {
  return regl({
    frag: `
      precision highp float;
      #extension GL_OES_standard_derivatives: enable
      varying vec3 vpos, vcolor;
      void main () {
        vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
        vec3 c = mix(N*0.5+0.5,vcolor,0.8);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view, model;
      attribute vec3 position, color;
      varying vec3 vpos, vcolor;
      void main () {
        vpos = position;
        vcolor = color;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      color: regl.prop('colors')
    },
    elements: regl.prop('cells'),
    uniforms: {
      model: regl.prop('model')
    }
  })
}

function wave(regl) {
  return regl({
    frag: `
      precision highp float;
      #extension GL_OES_standard_derivatives: enable
      varying vec3 vpos, vcolor;
      void main () {
        vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
        vec3 c = mix(N*0.5+0.5,vcolor,0.8);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, color;
      varying vec3 vpos, vcolor;
      void main () {
        vpos = position;
        vcolor = color;
        vec3 p = position + vec3(0,sin(position.z*8.0+time*2.0)*0.2,0);
        gl_Position = projection * view * model * vec4(p,1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      color: regl.prop('colors')
    },
    elements: regl.prop('cells'),
    uniforms: {
      model: regl.prop('model'),
      time: regl.context('time')
    }
  })
}
