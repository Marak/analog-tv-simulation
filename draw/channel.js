module.exports = function (regl) {
  var positions = [], cells = [], digits = []
  var ndigits = 2
  for (var n = 0; n < ndigits; n++) {
    var k = positions.length/2
    positions.push(-1,-1, -1,+1, +1,+1, +1,-1)
    digits.push(n,n,n,n)
    cells.push(k+0,k+1,k+2,k+0,k+2,k+3)
  }
  return regl({
    frag: `
      precision highp float;
      varying vec2 vpos;
      varying float vdigit;
      uniform float time, channel;
      uniform sampler2D font;

      float text(sampler2D font, vec2 uv, vec2 t) {
        return length(texture2D(font,uv/vec2(32,3)+vec2(t.x/32.0,t.y/3.0)).xyz)
          * (1.0/sqrt(3.0));
      }
      vec3 shadow(vec2 v, vec2 r) {
        float sy = floor(mod(v.x*r.x,2.0))/r.x*0.5;
        return vec3(
          step(mod(v.x*r.x*3.0+2.0,3.0),1.0),
          step(mod(v.x*r.x*3.0+1.0,3.0),1.0),
          step(mod(v.x*r.x*3.0+0.0,3.0),1.0)
        ) * (1.0-step(mod(((v.y+sy)*r.y)*3.0,3.0),0.5));
      }
      void main () {
        vec2 uv = vpos*vec2(1,-1)*0.5+0.5;
        float d = mod(floor(channel/pow(10.0,vdigit)),10.0);
        vec2 c = vec2(15.0+d,0.0);
        vec3 rgb = text(font, uv, c)*vec3(0,1,0.5);
        vec2 r = vec2(720,485);
        vec3 mrgb = mix(rgb,rgb*shadow(uv,r),0.1);
        gl_FragColor = vec4(mrgb,clamp(0.0,1.0,length(rgb)*step(vdigit-0.5,d)));
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      attribute float digit;
      varying vec2 vpos;
      varying float vdigit;
      void main () {
        vpos = position;
        vdigit = digit;
        gl_Position = vec4(position*vec2(0.07,0.2)+vec2(0.8-0.13*digit,0.8),0,1);
      }
    `,
    attributes: {
      position: positions,
      digit: digits
    },
    elements: cells,
    uniforms: {
      time: regl.context('time'),
      channel: regl.prop('channel'),
      font: regl.prop('font')
    },
    depth: { enable: false },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}
