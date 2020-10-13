var glsl = require('glslify')

module.exports = function (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise3 = require('glsl-noise/simplex/3d')
      varying vec2 vpos;
      uniform float time, quality;
      uniform sampler2D signal;
      void main () {
        float x = texture2D(signal,vpos*0.5+0.5).x;
        x += snoise3(vec3(vpos*vec2(24,72),time*8.0))*0.5*(1.0-quality*0.01);
        gl_FragColor = vec4(x,0,0,1);
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      varying vec2 vpos;
      void main () {
        vpos = position;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: { position: [-4,-4,-4,+4,+4,+0] },
    elements: [0,1,2],
    uniforms: {
      time: regl.context('time'),
      quality: regl.prop('quality')
    },
    depth: { enable: false }
  })
}
