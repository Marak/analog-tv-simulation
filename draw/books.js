var html = require('choo/html')
var resl = require('resl')
var el = require('./lib/elem.js')()

module.exports = function(regl) {
  var draw = regl({
    frag: `
      precision highp float;
      varying vec2 vpos;
      uniform sampler2D img;
      void main () {
        vec2 uv = vpos*vec2(1,-1)*0.5+0.5;
        vec3 rgb = texture2D(img,uv).xyz;
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
      img: regl.prop('img')
    },
    depth: { enable: false }
  })
  var props = { img: regl.texture() }
  resl({
    manifest: {
      img: { type: 'image', src: 'images/books.jpg' },
    },
    onDone: (assets) => {
      props.img = regl.texture(assets.img)
    }
  })
  el.element.appendChild(html`<div class="hyperlinks">
    <style>
      .hyperlinks {
        position: absolute;
        top: 20%;
        left: 5%;
        right: 10%;
        bottom: 10%;
        font-size: 2em;
        font-family: monospace;
        color: white;
        text-shadow: 2px 2px magenta;
      }
    </style>
    <ul>
      <li>digital video and dsp. keith jack [chapter 6]</li>
      <li>modern cable television technology. ciciora, farmer, large, adams. [chapter 2]</li>
      <li>television engineering and video systems. gupta</li>
    </ul>
  </div>`)
  return function() {
    el.touch()
    regl.clear({ color: [0,0,0,1], depth: true })
    draw(props)
  }
}
