var glsl = require('glslify')

module.exports = function (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise3 = require('glsl-noise/simplex/3d')
      varying vec2 vpos;
      uniform float quality, n_lines, tick;
      uniform sampler2D signal;
      const float L_TIME = 6.356e-5;
      void main () {
        vec2 uv = vpos*0.5+0.5;
        float ft = uv.x*L_TIME + floor(uv.y*(n_lines-1.0)+0.5)*L_TIME;
        float t = tick*L_TIME*n_lines + ft;
        float ht = mod(tick*L_TIME*n_lines,4.0) + ft;
        float q = pow(1.0-quality*0.01,2.2);
        float n = snoise3(vec3(vpos*vec2(24,72),t*8.0));
        vec2 tuv = (vpos*0.5+0.5) + vec2(sin(ht*8.121e5+n*q)*0.02*q,0);
        float x = texture2D(signal,tuv).x * pow(quality*0.015,0.15);
        x *= max(quality*0.01,1.0-pow(n*0.5+0.5,2.0)) * (2.0-pow(quality*0.01,0.8));
        x += pow(n*0.5+0.5,2.0)*sign(n)*q*1.2;
        x += sin(8.40743e5*ht+tick*1e2)*q*0.5;
        x += sin(5555.55*ht)*0.2*q;
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
      tick: regl.context('tick'),
      quality: regl.prop('quality')
    },
    depth: { enable: false }
  })
}
