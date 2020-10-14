module.exports = function (regl) {
  return regl({
    frag: `
      precision highp float;
      varying vec2 vpos;
      uniform float time;
      void main () {
        gl_FragColor = vec4(vec3(0),1);
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
