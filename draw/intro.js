
module.exports = function (regl) {
  return regl({
    frag: `
      precision highp float;
      varying vec2 vpos;
      uniform float time;
      void main () {
        vec2 uv = vpos*vec2(1,-1)*0.5+0.5;
        vec3 rgb = vec3(0,0,pow(1.0-uv.y*0.7,2.2));
        gl_FragColor = vec4(rgb,1);
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
      time: regl.context('time')
    },
    depth: { enable: false }
  })
}
