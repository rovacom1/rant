// Saydam dayı videoları: her karenin üst yarısı renk, alt yarısı saydamlık (gri; tools/dayi_video.js üretir). İki yarı
// ekran kartında birleşir, tarayıcı her karede piksel işlemez. WebGL yoksa tuvalde piksel piksel birleşir.
const VS = 'attribute vec2 p; varying vec2 v; void main() { v = vec2(p.x, -p.y) * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
// Sıkıştırma gürültüsü zeminde soluk bir kutu bırakmasın diye maskenin iki ucu kırpılır.
const FS = `precision mediump float; uniform sampler2D t; varying vec2 v;
void main() {
  vec3 c = texture2D(t, vec2(v.x, v.y * 0.5)).rgb;
  float a = clamp((texture2D(t, vec2(v.x, 0.5 + v.y * 0.5)).r - 0.03) / 0.94, 0.0, 1.0);
  gl_FragColor = vec4(c * a, a);
}`;

function webgl(cv) {
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, x] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, x);
  return (vid) => {
    gl.viewport(0, 0, cv.width, cv.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}

function canvas2d(cv) {
  const cx = cv.getContext('2d');
  const tmp = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  return (vid) => {
    const w = cv.width;
    tmp.canvas.width = w;
    tmp.canvas.height = w * 2;
    tmp.drawImage(vid, 0, 0, w, w * 2);
    const img = tmp.getImageData(0, 0, w, w * 2);
    const d = img.data;
    // Alt yarının gri değeri üst yarının alfası olur; uçlar WebGL'deki gibi kırpılır.
    for (let k = 3, m = w * w * 4; k < w * w * 4; k += 4, m += 4) d[k] = (d[m] - 8) * 1.07;
    cx.putImageData(img, 0, 0);
  };
}

// Videonun karesini çizen tuval; draw(video) o anki kareyi çizer (tuval videonun bir yarısı boyunda).
export function alphaCanvas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 640;
  let paint = null;
  return {
    canvas: cv,
    draw(vid) {
      if (!vid.videoWidth) return;
      if (cv.width !== vid.videoWidth) cv.width = cv.height = vid.videoWidth;
      paint ||= webgl(cv) || canvas2d(cv);
      paint(vid);
    },
  };
}
