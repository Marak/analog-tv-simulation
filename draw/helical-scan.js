var mat4 = require('gl-mat4')
var cylinder = require('primitive-cylinder')
var el = require('./lib/elem.js')()

module.exports = function (regl) {
  var camera = require('./lib/camera.js')(regl, {
    distance: 3.5,
    maxDistance: 10,
    minDistance: 2,
    phi: 0.25
  })
  var draw = {
    head: head(regl),
    roller: roller(regl),
    tape: tape(regl)
  }
  var props = {
    head: Object.assign(cylinder(1,1,1,16,1), {
      model: new Float32Array(16)
    }),
    roller: (() => {
      var mesh = cylinder(0.1,0.1,0.8,8,1)
      var models = [
        mat4.identity(new Float32Array(16)), // left loading roller
        mat4.identity(new Float32Array(16)), // left tape guide
        mat4.identity(new Float32Array(16)), // right loading roller
        mat4.identity(new Float32Array(16)), // right tape guide
      ]
      return models.map((model) => {
        return Object.assign({ model }, mesh)
      })
    })(),
    tape: (() => {
      var positions = [], cells = [], distances = []
      var n = 16, r = 1.1, y = 0.16
      positions.push(
        +0.5,+y,+2.8,
        +0.5,-y,+2.8,
        -0.5,+y,+1.8,
        -0.5,-y,+1.8,
        -0.6,+y,+1.7,
        -0.6,-y,+1.7,
        -0.6,+y,+1.6,
        -0.6,-y,+1.6,
        -0.5,+y,+1.5,
        -0.5,-y,+1.5,
      )
      for (var i = 1; i < n/2-1; i++) {
        var x = Math.sin(2*Math.PI*i/n)*r
        var z = Math.cos(2*Math.PI*i/n)*r
        positions.push(
          x,+y,z,
          x,-y,z
        )
      }
      positions.push(
        -0.5,+y,-1.5,
        -0.5,-y,-1.5,
        -0.6,+y,-1.6,
        -0.6,-y,-1.6,
        -0.6,+y,-1.7,
        -0.6,-y,-1.7,
        -0.5,+y,-1.8,
        -0.5,-y,-1.8,
        +0.5,+y,-2.8,
        +0.5,-y,-2.8,
      )
      for (var i = 0; i < positions.length/3-2; i+=2) {
        cells.push(
          i,i+1,i+2,
          i+1,i+3,i+2
        )
      }
      for (var i = 0, d = 0; i < positions.length/3-2; i+=2) {
        distances.push(d,d)
        var dx = positions[(i+2)*3] - positions[i*3+0]
        var dz = positions[(i+2)*3+2] - positions[i*3+2]
        d += Math.sqrt(dx*dx+dz*dz)
      }
      distances.push(d,d)
      return { positions, cells, distances }
    })()
  }

  update(0)
  function update (time) {
    var m = props.head.model
    mat4.identity(m)
    mat4.rotateX(m, m,
      (5+58/60+9.9/3600)/180*Math.PI, // SP
      // 5°56′48.1″ // EP/SLP
      // 5°56′07.4″ // stationary
    )
    mat4.rotateY(m, m, 1798.2/60*time*2*Math.PI) // ntsc rpm -> ~30 rotations/second

    var m = props.roller[0].model // left loading roller
    mat4.identity(m)
    mat4.translate(m, m, [-0.5,+0.0,+1.65])
    mat4.rotateY(m, m, -time*2*Math.PI*15)

    var m = props.roller[1].model // left tape guide
    mat4.identity(m)
    mat4.translate(m, m, [+0.3,+0.0,+1.2])
    mat4.rotateX(m, m, (5+58/60+9.9/3600)/180*Math.PI) // SP
    mat4.rotateY(m, m, -time*2*Math.PI*15)

    var m = props.roller[2].model // right loading roller
    mat4.identity(m)
    mat4.translate(m, m, [-0.5,+0.0,-1.65])
    mat4.rotateY(m, m, -time*2*Math.PI*15)

    var m = props.roller[3].model // right tape guide
    mat4.identity(m)
    mat4.translate(m, m, [+0.3,+0.0,-1.18])
    mat4.rotateX(m, m, (5+58/60+9.9/3600)/180*Math.PI) // SP
    mat4.rotateY(m, m, -time*2*Math.PI*15)
  }

  var html = require('choo/html')
  var app = require('choo')()

  app.route('*', function (state, emit) {
    return html`<div>
      <style>
        .slider {
          position: absolute;
          bottom: 50px;
          left: 0px;
          right: 0px;
          text-align: center;
          color: white;
          font-size: 2em;
          font-family: monospace;
        }
        .slider input[type="range"] {
          margin-left: 1ex;
          margin-right: 1ex;
        }
        .slider .ratio {
          display: inline-block;
          width: 6ex;
        }
        .slider .info {
          font-size: 0.7em;
          margin: auto;
          margin-bottom: 1em;
        }
        .slider .info th {
          padding-right: 1ex;
        }
      </style>
      <div class="slider">
        <table class="info">
          <tr>
            <th>tape speed (SP)</th>
            <td>33.35 mm/s</td>
          </tr>
          <tr>
            <th>drum speed (SP)</th>
            <td>1798.2 rpm</td>
          </tr>
        </table>
        <div>
          speed
          <input type="range" width="80%" height="2em"
            min="20" max="300" value=${state.rspeed}
            oninput=${(ev) => emit('set-rspeed', Number(ev.target.value))}>
          <span class="ratio">1/${state.rspeed}x</span>
        </div>
      </div>
    </div>`
  })

  var emitter
  app.use(function (state, em) {
    emitter = em
    state.rspeed = 100
    state.speed = 1/state.rspeed
    emitter.on('set-rspeed', function (rspeed) {
      state.rspeed = rspeed
      state.speed = 1/state.rspeed
      emitter.emit('render')
    })

    var uniforms = regl({
      uniforms: {
        speed: () => state.speed,
        mmScale: 0.4/12.7
      }
    })
    emitter.on('frame', (time) => {
      camera.touch()
      regl.clear({ color: [0.3,0.25,0.5,1], depth: true })
      camera(() => {
        uniforms(() => {
          draw.head(props.head)
          draw.roller(props.roller)
          draw.tape(props.tape) // blending, must be last
        })
      })
      update(time*state.speed)
    })
  })
  app.mount(el.element)

  return function ({time}) {
    el.touch()
    camera.touch()
    emitter.emit('frame', time)
  }

  function head(regl) {
    return regl({
      frag: `
        precision highp float;
        #extension GL_OES_standard_derivatives: enable
        varying vec3 vpos;
        void main () {
          vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
          float d = step(0.1,distance(abs(vpos.xz),vec2(1,0)));
          float h = 1.0-step(0.05,distance(abs(vpos),vec3(1,0,0)));
          gl_FragColor = vec4((N*0.5+0.5)*(0.5+d*0.5)+h,1);
        }
      `,
      vert: `
        precision highp float;
        uniform mat4 projection, view, model;
        attribute vec3 position;
        varying vec3 vpos;
        void main () {
          vpos = position;
          gl_Position = projection * view * model * vec4(position,1);
        }
      `,
      uniforms: {
        model: regl.prop('model')
      },
      attributes: {
        position: regl.prop('positions')
      },
      elements: regl.prop('cells')
    })
  }

  function tape(regl) {
    return regl({
      frag: `
        precision highp float;
        #extension GL_OES_standard_derivatives: enable
        varying vec3 vpos;
        varying float vdist;
        uniform float time, speed, mmScale;
        uniform vec3 eye;
        const float PI = ${Math.PI};
        void main () {
          vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
          float x = vdist*16.0 - vpos.y*260.0;
          float m = mod(time*speed*1798.2/30.0+0.45,1.0);
          float t = -2.0*PI*time*speed*1798.2/60.0;
          vec3 p0 = vec3(
            cos(t)*1.1,
            0.2-mod(t/(2.0*PI)+PI*0.5,1.0)*0.4-0.02,
            sin(t)*1.1
          );
          vec3 p1 = vec3(
            cos(t+PI)*1.1,
            0.2-mod(t/(2.0*PI),1.0)*0.4-0.02,
            sin(t+PI)*1.1
          );
          float w = step(0.03, min(distance(vpos,p0),distance(vpos,p1)));
          float r = 1.1;
          float d = max(
              step(75.0+5.0*step(cos(mod(t*0.5-0.2,PI))*2.5+3.6,vdist),x),
              step(75.0+5.0*step(cos(mod(t*0.5-0.2+PI*0.5,PI))*2.5+3.6,vdist),x)
            )
            * step(abs(vpos.y),0.08)
            * pow(sin(x+t*2.0+1.8)*0.5+0.5,4.0)
          ;
          vec3 c = mix(
            vec3(0,1,1),
            mix(
              vec3(1,0.7,0.4),
              vec3(1,0.4,1),
              floor(mod((x+t*2.0+1.0)*0.5/PI,2.0))
            )*d,
            //pow(N*0.5+0.5,vec3(0.5))*d,
            w
          );
          c += 0.2*pow(dot(normalize(eye),N),16.0);
          gl_FragColor = vec4(c,0.8);
        }
      `,
      vert: `
        precision highp float;
        uniform mat4 projection, view;
        attribute vec3 position;
        attribute float dist;
        varying vec3 vpos;
        varying float vdist;
        void main () {
          vpos = position;
          vdist = dist;
          gl_Position = projection * view * vec4(position,1);
        }
      `,
      uniforms: {
        time: regl.context('time')
      },
      attributes: {
        position: regl.prop('positions'),
        dist: regl.prop('distances')
      },
      elements: regl.prop('cells'),
      blend: {
        enable: true,
        func: {
          src: 'src alpha',
          dst: 'one minus src alpha'
        },
        equation: {
          rgb: 'add',
          alpha: 'max'
        }
      },
      depth: {
        mask: false
      }
    })
  }

  function roller(regl) {
    return regl({
      frag: `
        precision highp float;
        #extension GL_OES_standard_derivatives: enable
        varying vec3 vpos;
        void main () {
          vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
          gl_FragColor = vec4(N*0.5+0.5,1);
        }
      `,
      vert: `
        precision highp float;
        uniform mat4 projection, view, model;
        attribute vec3 position;
        varying vec3 vpos;
        void main () {
          vpos = position;
          gl_Position = projection * view * model * vec4(position,1);
        }
      `,
      uniforms: {
        model: regl.prop('model')
      },
      attributes: {
        position: regl.prop('positions')
      },
      elements: regl.prop('cells')
    })
  }
}
