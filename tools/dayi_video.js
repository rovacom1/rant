// Dayı videolarını ham Higgsfield dosyalarından saydam hale getirir: node tools/dayi_video.js [ham klasörü]
// Her kare S px'e küçültülür, krem zemin keycream.js ile silinir ve kare iki katı yükseklikte yazılır: üst yarı renk,
// alt yarı saydamlık (gri). Oyun iki yarıyı ekran kartında birleştirir (src/ui/alphavideo.js); tarayıcı her karede
// piksel işlemez. ffmpeg gerekir (PATH'te ya da FFMPEG ortam değişkeninde). Ham videolar 24 kare/sn.
import { spawn } from 'node:child_process';
import { keyCream } from './keycream.js';

const S = 640; // ekranda en çok 340 px; yüksek çözünürlüklü ekranda keskin kalsın
const FPS = 24;
const CRF = 18;
const FF = process.env.FFMPEG || 'ffmpeg';
const SRC = process.argv[2] || 'tasks/gorsel-ham';
const JOBS = [
  ...[1, 2, 3, 4].map((i) => [`giris/senaryo-${i}`, `assets/giris/dayi-${i}`]),
  ...['gurur', 'alkis', 'para', 'kayip'].map((n) => [`sonu/${n}`, `assets/sonu/${n}`]),
];
const BT709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

function run(args, input) {
  const p = spawn(FF, ['-v', 'error', '-y', ...args], { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'inherit'] });
  p.done = new Promise((ok, fail) => p.on('close', (c) => (c ? fail(new Error(`ffmpeg ${c}`)) : ok())));
  return p;
}

async function convert(src, dst) {
  const dec = run(['-i', src, '-an', '-vf', `scale=${S}:${S}:flags=lanczos`, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-']);
  const enc = run([
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${S}x${S * 2}`, '-r', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation',
    '-crf', String(CRF), '-pix_fmt', 'yuv420p', ...BT709, '-movflags', '+faststart', dst,
  ], true);
  const size = S * S * 4;
  let buf = Buffer.alloc(0);
  let frames = 0;
  for await (const chunk of dec.stdout) {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= size) {
      const px = new Uint8ClampedArray(buf.subarray(0, size));
      buf = buf.subarray(size);
      keyCream(px, S);
      const out = Buffer.alloc(S * S * 6);
      for (let k = 0; k < S * S; k++) {
        out[k * 3] = px[k * 4];
        out[k * 3 + 1] = px[k * 4 + 1];
        out[k * 3 + 2] = px[k * 4 + 2];
        out.fill(px[k * 4 + 3], (S * S + k) * 3, (S * S + k) * 3 + 3);
      }
      if (!enc.stdin.write(out)) await new Promise((r) => enc.stdin.once('drain', r));
      frames++;
    }
  }
  enc.stdin.end();
  await Promise.all([dec.done, enc.done]);
  return frames;
}

for (const [src, dst] of JOBS) {
  const n = await convert(`${SRC}/${src}.mp4`, `${dst}.mp4`);
  console.log(`${dst}.mp4: ${n} kare`);
}
