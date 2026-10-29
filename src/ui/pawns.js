// Oyuncu piyonları: şeffaf zeminli resimler (assets/piyon). Panellerde oyuncunun rengi halka değil, figürün kendi kenarına
// çizilir (drop-shadow zinciri). Görünen alan eşit olsun diye ince piyonlar (Galata, leblebi) biraz daha uzun çizilir.
// Kenarlı resim her piyon, renk, boy ve tema için bir kez aynı filtreyle çizilip hazır resim olarak kullanılır:
// 9 katlı filtre her yeniden çizimde işlenince (açık artırmada her teklif, para değişince oyuncu listesi) kareler
// 100 ms'yi aşıyordu. Çizim ayrı iş parçacığında (pawnworker.js) yapılır: ana iş parçacığında tuval çizmek ya da ekran
// kartından okumak her resimde 20-60 ms takılma yapıyordu. Oyundaki piyonlar her boyda önceden çizilir (warmPawns), kart
// oynanınca ilk kez görünen boy beklemez. Hazır resim gelene kadar ve iş parçacığında tuval filtresi olmayan tarayıcıda
// CSS filtresi çizer (main.css .pawn img).
import { AVATARS, PAWN_NAMES } from '../engine/index.js';

// Resmin görünen kısmının genişlik / yükseklik oranı (resimler bu kısma kırpılı).
const ASPECT = {
  semazen: 0.766, kofte: 1.422, leblebi: 0.664, ankaray: 1.103, galata: 0.668, hitit: 0.918, atakule: 0.794, boyoz: 1.014,
  caretta: 1.33, ekmek: 1.103, hamsi: 1.212, kestane: 0.949, kizkulesi: 0.663, nasreddin: 0.771, saatkulesi: 0.587,
};

const kindOf = (avatar) => (ASPECT[avatar] ? avatar : AVATARS[0]);
const src = (k) => `assets/piyon/${k}.png`;

// ---- hazır kenarlı resimler ----

const WORKER_FILTER = typeof OffscreenCanvasRenderingContext2D !== 'undefined' && 'filter' in OffscreenCanvasRenderingContext2D.prototype;
const ready = new Map(); // anahtar -> blob adresi, çizilirken null
const shown = new Set(); // hazır olmadan istenen (ekranda CSS filtresiyle duran) anahtarlar
const waiting = new Map(); // anahtar -> çizim bitince çağrılacak
const edges = new Map(); // tema -> ince çizginin rengi
let worker = null;
let broken = false; // iş parçacığı açılamadı: CSS filtresi kalır
let onReady = null;
let notify = 0;

// Hazır resim gelince ekran yeniden çizilsin (app.js); birkaç resim aynı anda biterse bir kez.
export function onPawnsReady(fn) {
  onReady = fn;
}

function done(key, blob) {
  const fin = waiting.get(key);
  waiting.delete(key);
  if (blob) ready.set(key, URL.createObjectURL(blob));
  else ready.delete(key);
  if (shown.delete(key) && blob && !notify) notify = requestAnimationFrame(() => (notify = 0, onReady && onReady()));
  if (fin) fin();
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./pawnworker.js', import.meta.url));
  worker.onmessage = ({ data }) => done(data.key, data.blob);
  worker.onerror = () => {
    broken = true;
    for (const key of [...waiting.keys()]) done(key, null);
  };
  return worker;
}

// İnce çizginin rengi (--pedge) temaya göre değişir; anahtar temayı içerir (stil okumak her çağrıda yerleşim hesaplatırdı).
const theme = () => `${document.body.classList.contains('dark')}|${window.devicePixelRatio}`;
const keyOf = (k, color, d) => `${k}|${color}|${d.w}|${d.h}|${theme()}`;
const drawable = (color) => WORKER_FILTER && !broken && color && color !== 'transparent';

function start(key, k, color, d) {
  const t = theme();
  if (!edges.has(t)) edges.set(t, getComputedStyle(document.body).getPropertyValue('--pedge').trim());
  ready.set(key, null);
  return new Promise((fin) => {
    waiting.set(key, fin);
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    getWorker().postMessage({ key, url: new URL(src(k), document.baseURI).href, color, edge: edges.get(t), dpr, ...d });
  });
}

function outlined(k, color, d) {
  if (!drawable(color)) return null;
  const key = keyOf(k, color, d);
  if (!ready.has(key)) start(key, k, color, d);
  const url = ready.get(key);
  if (!url) shown.add(key);
  return url;
}

// s: piyonun kutusu (px). Kenar kalınlığı küçük boyda 2,5, büyükte 3 px; boydan bağımsız.
// pad: kenar, ince çizgi ve yumuşak gölge için resmin çevresinde boşluk.
function dims(k, s) {
  const a = ASPECT[k];
  let h = Math.min(s * Math.sqrt(0.72 / a), s * 1.15);
  let w = h * a;
  if (w > s * 1.05) {
    w = s * 1.05;
    h = w / a;
  }
  const o = s <= 28 ? 2.5 : 3;
  return { w: Number(w.toFixed(1)), h: Number(h.toFixed(1)), o, pad: Math.ceil(o + 8) };
}

// Oyun ekranındaki boylar (gameview.js PW çağrıları), sık görünen önce; yeni boy eklenirse buraya da yazılır.
const SIZES = [30, 32, 24, 28, 40, 64, 56, 26, 20, 34, 84];
const idle = (fn) => (globalThis.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 50));
let warmSig = '';
let warmQ = [];
let warming = false;

function warmNext() {
  let job;
  while ((job = warmQ.shift()) && ready.has(keyOf(job.k, job.color, job.d)));
  if (!job) return (warming = false);
  start(keyOf(job.k, job.color, job.d), job.k, job.color, job.d).finally(() => idle(warmNext));
}

// Oyuncuların kenarlı piyonlarını bütün boylarda, birer birer ve boş zamanda çizer. Her güncellemede çağrılabilir:
// oyuncular, tema ve ekran ölçeği değişmedikçe bir şey yapmaz.
export function warmPawns(players) {
  if (!WORKER_FILTER || broken) return;
  const list = players.filter((p) => drawable(p.color)).map((p) => [kindOf(p.avatar), p.color]);
  const sig = `${list.join(';')}|${theme()}`;
  if (sig === warmSig) return;
  warmSig = sig;
  warmQ = SIZES.flatMap((s) => list.map(([k, color]) => ({ k, color, d: dims(k, s) })));
  if (!warming) {
    warming = true;
    idle(warmNext);
  }
}

// plain: kenarsız resim (tahtadaki piyon ve etiketleri kendi CSS filtresini kullanır).
export function pawn(avatar, color, s, cls = '', plain = false) {
  const k = kindOf(avatar);
  const { w, h, o, pad } = dims(k, s);
  const url = plain ? null : outlined(k, color, { w, h, o, pad });
  const img = url
    ? `<img class="ol" src="${url}" alt="" draggable="false" style="width:${w + 2 * pad}px;height:${h + 2 * pad}px;margin:-${pad}px">`
    : `<img src="${src(k)}" alt="" draggable="false" style="width:${w}px;height:${h}px">`;
  return `<span class="pawn ${cls}" style="--s:${s}px;--pc:${color};--o:${o}px" aria-label="${PAWN_NAMES[k]}" role="img">${img}</span>`;
}

// Tahtadaki piyon: figür (ilk çocuk; boardfx onu zıplatır), ayağın altında oyuncu renginde beyaz halkalı oval kaide
// ve yumuşak gölge. Figürün kenarı tahtada beyazdır (tahta.css); oyuncunun rengi kaidededir.
export const boardPawn = (avatar, color, s) => `<span class="fig">${pawn(avatar, color, s, '', true)}</span><i class="base"></i><i class="sh"></i>`;
