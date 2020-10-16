var mat4 = require('gl-mat4')

module.exports = function (regl) {
  var camera = require('./lib/camera.js')(regl, {
    theta: 1.5,
    distance: 2.5,
    minDistance: 0.5,
    maxDistance: 10
  })
  var props = {
    tape: { img: regl.texture() }
  }
  var draw = {
    tape: tape(regl)
  }
  require('resl')({
    manifest: {
      vhs: { type: 'image', src: 'images/texture/vhs.jpg' },
    },
    onDone: (assets) => {
      props.tape.img = regl.texture(assets.vhs)
    }
  })
  return function () {
    camera.touch()
    regl.clear({ color: [0.6,0,0.4,1], depth: true })
    camera(() => {
      draw.tape(props.tape)
    })
  }
}

function tape(regl) {
  var mesh = {
    positions: [
      -0.5, +0.5, +0.5,
      +0.5, +0.5, +0.5,
      +0.5, -0.5, +0.5,
      -0.5, -0.5, +0.5,
      -0.5, +0.5, -0.5,
      +0.5, +0.5, -0.5,
      +0.5, -0.5, -0.5,
      -0.5, -0.5, -0.5,
    ],
    cells: [
      0,1,2,0,2,3,4,5,6,4,6,7,
      0,4,1,1,4,5,
      1,5,2,2,5,6,
      2,6,3,3,6,7,
      3,7,0,0,7,4
    ]
  }
  var model = new Float32Array(16)
  return regl({
    frag: `
      precision highp float;
      #extension GL_OES_standard_derivatives: enable
      uniform sampler2D img;
      varying vec3 vpos;
      void main () {
        vec3 N = normalize(cross(dFdx(vpos),dFdy(vpos)));
        vec2 uv = (vpos.xy*vec2(1,-1)+0.5)*vec2(1,0.5)
          + step(vpos.z,0.0)*vec2(0,0.5);
        vec3 rgb = texture2D(img,uv).xyz
          * step(0.49,abs(vpos.z));
        float d = 0.0;
        d = max(d,dot(N,normalize(vec3(0.1,1.0,-0.5))));
        d = max(d,0.3*dot(N,normalize(vec3(-0.3,-0.2,0.4))));
        vec3 c = mix(rgb,vec3(d),0.2);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view, model;
      uniform vec3 size;
      attribute vec3 position;
      varying vec3 vpos;
      void main () {
        vpos = position;
        gl_Position = projection * view * model * vec4(position*size,1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    uniforms: {
      img: regl.prop('img'),
      size: [1.87, 1.03, 0.25 ],
      model: ({time}) => {
        mat4.identity(model)
        mat4.rotateY(model,model,Math.sin(time*3)*0.2)
        return model
      }
    }
  })
}
