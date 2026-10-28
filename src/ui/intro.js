// Giriş ekranının canlı sahnesi: arkada şehir döngüsü, "Masaya otur" kartının arkasında dayı.
// Menü her durum değişiminde yeniden çizildiği için videolar ve tuval kalıcı düğümlerdir; her çizimden sonra
// yer tutucuya (.dayi-slot) taşınırlar, böylece piyon seçmek ya da yazı yazmak animasyonu baştan başlatmaz.
// Dayı videolarının saydamlığı videonun içinde hazırdır (alphavideo.js).
import { alphaCanvas } from './alphavideo.js';
import { APP_VERSION } from '../version.js';

const DIR = 'assets/giris/';
const CLIPS = ['dayi-1.mp4', 'dayi-2.mp4', 'dayi-3.mp4', 'dayi-4.mp4'];

let bg, box, art, cur, nxt, idx = -1, on = false, last = -1;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function video(cls) {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  if (cls) v.className = cls;
  return v;
}

const pick = () => {
  let i;
  do i = Math.floor(Math.random() * CLIPS.length);
  while (i === idx);
  return i;
};

function load(v, i) {
  v.dataset.i = i;
  v.src = `${DIR}${CLIPS[i]}?v=${APP_VERSION}`; // sürüm: önbellekteki eski (maskesiz) video gelmesin
  v.load();
}

function draw() {
  art.draw(cur);
  last = cur.currentTime;
}

// Senaryolar aynı karede başlayıp bittiği için biri bitince rastgele bir başkası boşluksuz başlar.
function next() {
  if (!on) return;
  nxt.currentTime = 0;
  nxt.play().catch(() => {});
  cur.pause();
  [cur, nxt] = [nxt, cur];
  idx = +cur.dataset.i;
  load(nxt, pick());
}

let ticking = false;
function tick() {
  if (!on) return (ticking = false);
  if (cur.readyState >= 2 && cur.currentTime !== last) draw();
  requestAnimationFrame(tick);
}

function build() {
  bg = video('intro-bg');
  bg.loop = true;
  bg.poster = DIR + 'sehir.jpg';
  const shade = document.createElement('div');
  shade.className = 'intro-shade';
  document.body.prepend(bg, shade);
  box = document.createElement('div');
  box.className = 'dayi';
  box.setAttribute('aria-hidden', 'true');
  art = alphaCanvas();
  cur = video();
  nxt = video();
  cur.onended = nxt.onended = next;
  box.append(art.canvas, cur, nxt);
  idx = pick();
  load(cur, idx);
  load(nxt, pick());
  cur.addEventListener('loadeddata', () => last < 0 && draw(), { once: true });
  if (!still()) bg.src = DIR + 'sehir.mp4';
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : on && run()));
  // Giriş animasyonu yalnız ilk açılışta; sonraki çizimlerde başlık yeniden düşmesin.
  document.body.classList.add('intro-play');
  setTimeout(() => document.body.classList.remove('intro-play'), 2500);
}

function run() {
  if (still()) return;
  bg.play().catch(() => {});
  cur.play().catch(() => {});
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}

function halt() {
  if (!bg) return;
  bg.pause();
  cur.pause();
  nxt.pause();
}

// Her çizimden sonra çağrılır: menüdeyse sahneyi gösterip dayıyı yerine taşır, değilse durdurup gizler.
export function mountIntro(root) {
  const slot = root && root.querySelector('.dayi-slot');
  if (!slot) {
    if (on) {
      on = false;
      document.body.classList.remove('intro-on');
      halt();
    }
    return;
  }
  if (!box) build();
  if (box.parentNode !== slot) slot.append(box);
  if (!on) {
    on = true;
    document.body.classList.add('intro-on');
    run();
  }
}
