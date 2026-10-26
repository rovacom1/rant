// Giriş ekranının canlı sahnesi: arkada şehir döngüsü, "Masaya otur" kartının arkasında dayı.
// Menü her durum değişiminde yeniden çizildiği için videolar ve tuval kalıcı düğümlerdir; her çizimden sonra
// yer tutucuya (.dayi-slot) taşınırlar, böylece piyon seçmek ya da yazı yazmak animasyonu baştan başlatmaz.
const DIR = 'assets/giris/';
const CLIPS = ['dayi-1.mp4', 'dayi-2.mp4', 'dayi-3.mp4', 'dayi-4.mp4'];
const N = 400;

let seen = null;
let queue = null;

// Dayı videolarının krem zeminini siler (n×n RGBA dizisi, yerinde). Kenardan başlayıp zemine benzeyen pikseller
// doldurularak şeffaf olur; dayının içindeki krem alanlar kalın lacivert çizgiyle ayrıldığı için korunur.
// Kapalı krem boşluklardan yalnız büyükler (tespih halkasının içi, kolla gövde arası) silinir; göz akı ve diş kalır.
// Çizgi kenarı zemine yakınlığı ölçüsünde yarı saydam olur.
export function keyCream(p, n, hole = n * n * 0.004) {
  if (!seen || seen.length !== n * n) {
    seen = new Uint8Array(n * n);
    queue = new Int32Array(n * n);
  }
  seen.fill(0);
  const r0 = p[0], g0 = p[1], b0 = p[2];
  const d = (k) => Math.abs(p[k * 4] - r0) + Math.abs(p[k * 4 + 1] - g0) + Math.abs(p[k * 4 + 2] - b0);
  let h = 0, t = 0, lim = 75;
  const push = (k) => {
    if (!seen[k] && d(k) < lim) {
      seen[k] = 1;
      queue[t++] = k;
    }
  };
  const fill = () => {
    while (h < t) {
      const k = queue[h++], x = k % n;
      if (x > 0) push(k - 1);
      if (x < n - 1) push(k + 1);
      if (k >= n) push(k - n);
      if (k < n * n - n) push(k + n);
    }
  };
  const clear = (from, to) => {
    for (let j = from; j < to; j++) p[queue[j] * 4 + 3] = Math.max(0, Math.min(255, (d(queue[j]) - 28) * 5));
  };
  for (let i = 0; i < n; i++) {
    push(i);
    push(n * n - n + i);
    push(i * n);
    push(i * n + n - 1);
  }
  fill();
  clear(0, t);
  lim = 28;
  for (let k = 0; k < n * n; k++) {
    if (seen[k] || d(k) >= lim) continue;
    const s = t;
    push(k);
    fill();
    if (t - s > hole) clear(s, t);
  }
}

let bg, box, cx, cur, nxt, idx = -1, on = false, last = -1;
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
  v.src = DIR + CLIPS[i];
  v.load();
}

function draw() {
  cx.clearRect(0, 0, N, N);
  cx.drawImage(cur, 0, 0, N, N);
  const img = cx.getImageData(0, 0, N, N);
  keyCream(img.data, N);
  cx.putImageData(img, 0, 0);
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
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  cx = cv.getContext('2d', { willReadFrequently: true });
  cur = video();
  nxt = video();
  cur.onended = nxt.onended = next;
  box.append(cv, cur, nxt);
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
