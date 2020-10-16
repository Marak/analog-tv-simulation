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
      img: { type: 'image', src: 'images/code.jpg' },
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
        color: lightgreen;
        text-shadow: 2px 2px purple;
      }
      .hyperlinks a:link {
        color: white;
        text-shadow: 2px 2px blue;
      }
      .hyperlinks a:visited {
        color: white;
        text-shadow: 1px 1px purple;
      }
    </style>
    <ul>
      <li><a href="https://github.com/substack/glsl-ntsc-video">glsl-ntsc-video</a></li>
      <li><a href="https://github.com/substack/ntsc-video-simulator">ntsc-video-simulator</a></li>
      <li><a href="https://github.com/substack/analog-tv-simulation">analog-tv-simulation</a></li>
    </ul>
  </div>`)
  return function() {
    el.touch()
    regl.clear({ color: [0,0,0,1], depth: true })
    draw(props)
  }
}
