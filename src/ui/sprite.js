// Efekt resimleri (assets/fx, docs/GORSEL_STIL.md "Efektler"): jeton, toz, konfeti ve kare şeritleri (sprite sheet).
// Şerit, taşanı gizleyen bir kutunun içinde n kare yan yana duran resimdir; kareler resmin transform ile kaymasıyla
// oynar (background-position değil). Jetonlar yeniden kullanılan bir havuzdan gelir; uçan her şey yalnız transform
// ve opacity ile canlanır.

import { arcPeak } from './coins.js';

const DIR = 'assets/fx/';
export const ART = {
  coinA: `${DIR}jeton-a.webp`, // düz para
  coinB: `${DIR}jeton-b.webp`, // dönerken eğik para
  dust: `${DIR}toz-sayfa.webp`, // 8 kare, kare 181x160, ortak taban
  puff: `${DIR}toz.webp`, // tek toz bulutu, 256x121
  confetti: `${DIR}konfeti.webp`, // 12 parça, parça 45x64
};
const DUST = { n: 8, w: 181, h: 160 };

// Oyun açılınca resimler önceden çözülür: ilk uçuşta jeton boş kare göstermesin.
export function preloadFx() {
  for (const src of Object.values(ART)) {
    const img = new Image();
    img.src = src;
    img.decode?.().catch(() => {});
  }
}

// Kare şeridinin HTML'i (CSS ile oynayanlar için, ör. açık artırma tokmağı): kutu .spr, içinde n kare genişliğinde resim.
// Resmin genişliği satır içinde verilir: karelerin içindeki genel img kuralları (ör. .cell .bld img) onu ezmesin.
const stripImg = (src, n, extra = '') => `<img src="${src}" alt="" draggable="false" style="width:${n * 100}%;height:100%;max-width:none;filter:none;${extra}">`;
export const stripHTML = (src, n, cls = '') => `<span class="spr ${cls}" aria-hidden="true">${stripImg(src, n)}</span>`;

// parent içinde box kutusunda (px) bir şeridi bir kez oynatır: n kare ms'de, delay ms sonra; sonunda kutu söner ve kalkar.
export function strip(parent, { src, n, box, ms, delay = 0, fade = 0.25 }) {
  const el = document.createElement('span');
  el.className = 'fx spr';
  Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  el.innerHTML = stripImg(src, n);
  parent.appendChild(el);
  el.firstElementChild.animate([{ transform: 'none' }, { transform: `translateX(${(-100 * (n - 1)) / n}%)` }], { duration: ms, delay, easing: `steps(${n}, jump-none)`, fill: 'both' });
  el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.01 }, { opacity: 1, offset: 1 - fade }, { opacity: 0 }], { duration: ms, delay, fill: 'both' });
  setTimeout(() => el.remove(), delay + ms + 60);
  return el;
}

// Toz bulutu: tabanı (cx, base) noktasında, w genişliğinde, sekiz karelik şerit.
export function dust(parent, cx, base, w, delay = 0, ms = 480) {
  const h = (w * DUST.h) / DUST.w;
  return strip(parent, { src: ART.dust, n: DUST.n, box: { x: cx - w / 2, y: base - h, w, h }, ms, delay });
}

// Küçük toz: tek bulut ortasından büyüyüp söner (kat dikilince binanın dibinde).
export function puff(parent, cx, base, w, delay = 0, ms = 420) {
  const h = (w * 121) / 256;
  const el = document.createElement('span');
  el.className = 'fx fx-puff';
  el.innerHTML = `<img src="${ART.puff}" alt="" draggable="false">`;
  Object.assign(el.style, { left: `${cx - w / 2}px`, top: `${base - h}px`, width: `${w}px`, height: `${h}px` });
  parent.appendChild(el);
  el.animate([{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(0.9)', opacity: 0.9, offset: 0.3 }, { transform: 'scale(1.35)', opacity: 0 }], { duration: ms, delay, easing: 'ease-out', fill: 'both' });
  setTimeout(() => el.remove(), delay + ms + 60);
  return el;
}

// Konfeti parçası k (0-11): şeridin bir karesini gösteren kutu; düşüşünü çağıran canlandırır.
export function confettiPiece(k) {
  const el = document.createElement('span');
  el.className = 'spr confetti';
  el.innerHTML = stripImg(ART.confetti, 12, `transform:translateX(${(-100 * (k % 12)) / 12}%)`);
  return el;
}

// ---- jetonlar ----

const pool = []; // { el, busy }
function takeCoin(src) {
  let c = pool.find((p) => !p.busy && p.src === src);
  if (!c) {
    const el = document.createElement('img');
    el.className = 'coin';
    el.alt = '';
    el.draggable = false;
    el.src = src;
    el.hidden = true;
    document.body.appendChild(el);
    c = { el, src, busy: false };
    pool.push(c);
  }
  c.busy = true;
  c.el.hidden = false;
  return c;
}
const freeCoin = (c) => {
  c.el.hidden = true;
  c.busy = false;
};

export const LAND = 0.92; // jeton varış noktasına uçuşun bu oranında gelir

// a'dan b'ye (ekran noktaları) kavis çizerek uçan n jeton. gap: jetonlar arası (ms), ms: bir jetonun uçuşu, size: boy
// çarpanı, spread: tepe noktasında jetonların yayılması (px; büyük kirada sağanak gibi açılır).
export function flyCoins(a, b, { n, delay = 0, ms, gap, size = 1, spread = 0 }) {
  const m = arcPeak(a, b);
  for (let i = 0; i < n; i++) {
    const c = takeCoin(i % 2 ? ART.coinB : ART.coinA);
    // Sırayla değişen, rastgele olmayan küçük sapmalar: aynı olay her ekranda aynı görünür.
    const jx = spread * (((i * 7) % 5) - 2) * 0.5;
    const jy = spread * (((i * 3) % 5) - 2) * 0.35;
    const spin = (i % 2 ? -1 : 1) * (160 + ((i * 37) % 120));
    const at = (q, s, r, dx = 0, dy = 0) => `translate(${(q.x + dx).toFixed(1)}px, ${(q.y + dy).toFixed(1)}px) translate(-50%, -50%) rotate(${r}deg) scale(${(s * size).toFixed(3)})`;
    const k = c.el.animate([
      { transform: at(a, 0.6, 0), opacity: 0 },
      { transform: at(m, 1.15, spin / 2, jx, jy), opacity: 1, offset: 0.5 },
      { transform: at(b, 0.8, spin), opacity: 1, offset: LAND },
      { transform: at(b, 0.4, spin), opacity: 0 },
    ], { duration: ms, delay: delay + i * gap, easing: 'ease-in-out', fill: 'both' });
    k.onfinish = k.oncancel = () => freeCoin(c);
  }
}
