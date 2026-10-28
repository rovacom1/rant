// Oyuncu piyonları: şeffaf zeminli resimler (assets/piyon). Panellerde oyuncunun rengi halka değil, figürün kendi kenarına
// çizilir (drop-shadow zinciri). Görünen alan eşit olsun diye ince piyonlar (Galata, leblebi) biraz daha uzun çizilir.
// Kenarlı resim her piyon, renk, boy ve tema için bir kez tuvalde aynı filtreyle çizilip hazır resim olarak kullanılır:
// 9 katlı filtre her yeniden çizimde işlenince (açık artırmada her teklif, para değişince oyuncu listesi) kareler
// 100 ms'yi aşıyordu. Hazır resim gelene kadar ve tuval filtresi olmayan tarayıcıda CSS filtresi çizer (main.css .pawn img).
import { AVATARS, PAWN_NAMES } from '../engine/index.js';

// Resmin görünen kısmının genişlik / yükseklik oranı (resimler bu kısma kırpılı).
const ASPECT = {
  semazen: 0.766, kofte: 1.422, leblebi: 0.664, ankaray: 1.103, galata: 0.668, hitit: 0.918, atakule: 0.794, boyoz: 1.014,
  caretta: 1.33, ekmek: 1.103, hamsi: 1.212, kestane: 0.949, kizkulesi: 0.663, nasreddin: 0.771, saatkulesi: 0.587,
};

const kindOf = (avatar) => (ASPECT[avatar] ? avatar : AVATARS[0]);
const src = (k) => `assets/piyon/${k}.png`;

// ---- hazır kenarlı resimler ----

const CANVAS_FILTER = typeof document !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
const ready = new Map(); // anahtar -> blob adresi, çizilirken null
let onReady = null;
let notify = 0;

// Hazır resim gelince ekran yeniden çizilsin (app.js); birkaç resim aynı anda biterse bir kez.
export function onPawnsReady(fn) {
  onReady = fn;
}

// main.css .pawn img filtresinin aynısı; uzunluklar tuval pikseli (d: cihaz piksel oranı).
const chain = (color, edge, o, d) =>
  [[o, 0, color], [-o, 0, color], [0, o, color], [0, -o, color], [1, 0, edge], [-1, 0, edge], [0, 1, edge], [0, -1, edge]]
    .map(([x, y, c]) => `drop-shadow(${x * d}px ${y * d}px 0 ${c})`)
    .concat(`drop-shadow(0 ${2 * d}px ${3 * d}px rgba(0, 0, 0, 0.35))`)
    .join(' ');

async function render(key, k, color, w, h, o, pad) {
  const edge = getComputedStyle(document.body).getPropertyValue('--pedge').trim();
  const img = new Image();
  img.src = src(k);
  await img.decode();
  const d = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((w + 2 * pad) * d);
  cv.height = Math.ceil((h + 2 * pad) * d);
  const cx = cv.getContext('2d');
  cx.filter = chain(color, edge, o, d);
  cx.drawImage(img, pad * d, pad * d, w * d, h * d);
  const blob = await new Promise((r) => cv.toBlob(r));
  if (!blob) throw new Error('toBlob');
  ready.set(key, URL.createObjectURL(blob));
  if (!notify) notify = requestAnimationFrame(() => (notify = 0, onReady && onReady()));
}

function outlined(k, color, w, h, o, pad) {
  if (!CANVAS_FILTER || !color || color === 'transparent') return null;
  // İnce çizginin rengi (--pedge) temaya göre değişir; anahtar temayı içerir (stil okumak her çağrıda yerleşim hesaplatırdı).
  const key = `${k}|${color}|${w}|${h}|${document.body.classList.contains('dark')}|${window.devicePixelRatio}`;
  if (!ready.has(key)) {
    ready.set(key, null);
    render(key, k, color, w, h, o, pad).catch(() => ready.delete(key));
  }
  return ready.get(key);
}

// s: piyonun kutusu (px). Kenar kalınlığı küçük boyda 2,5, büyükte 3 px; boydan bağımsız.
// plain: kenarsız resim (tahtadaki piyon ve etiketleri kendi CSS filtresini kullanır).
export function pawn(avatar, color, s, cls = '', plain = false) {
  const k = kindOf(avatar);
  const a = ASPECT[k];
  let h = Math.min(s * Math.sqrt(0.72 / a), s * 1.15);
  let w = h * a;
  if (w > s * 1.05) {
    w = s * 1.05;
    h = w / a;
  }
  w = Number(w.toFixed(1));
  h = Number(h.toFixed(1));
  const o = s <= 28 ? 2.5 : 3;
  const pad = Math.ceil(o + 8); // kenar, ince çizgi ve yumuşak gölge için resmin çevresinde boşluk
  const url = plain ? null : outlined(k, color, w, h, o, pad);
  const img = url
    ? `<img class="ol" src="${url}" alt="" draggable="false" style="width:${w + 2 * pad}px;height:${h + 2 * pad}px;margin:-${pad}px">`
    : `<img src="${src(k)}" alt="" draggable="false" style="width:${w}px;height:${h}px">`;
  return `<span class="pawn ${cls}" style="--s:${s}px;--pc:${color};--o:${o}px" aria-label="${PAWN_NAMES[k]}" role="img">${img}</span>`;
}

// Tahtadaki piyon: figür (ilk çocuk; boardfx onu zıplatır), ayağın altında oyuncu renginde beyaz halkalı oval kaide
// ve yumuşak gölge. Figürün kenarı tahtada beyazdır (tahta.css); oyuncunun rengi kaidededir.
export const boardPawn = (avatar, color, s) => `<span class="fig">${pawn(avatar, color, s, '', true)}</span><i class="base"></i><i class="sh"></i>`;
