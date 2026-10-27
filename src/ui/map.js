// Tahtanın ortasındaki soluk Türkiye haritası (assets/harita/turkiye.svg, viewBox 1040x461). Her mülkün ili dolu yuvarlakla
// işaretli: sahipsizse set renginde, sahipliyse daha büyük ve sahibinin renginde. Katlı ilin binası (karedekinin aynısı, daha
// büyük) ilin yerinde durur. Harita normalde çok soluktur ve arkada durur (hiçbir şey parlamaz); istem ve zar önde okunur.
// Köşedeki harita düğmesine gelince (ya da basınca) ortadaki yazılar çekilir, harita bütün canlılığıyla öne çıkar; bu
// harita modunda bir ilin noktasına ya da binasına gelince o ilin tapu kartı açılır.
// Saf kısımlar (koordinatlar, bina resmi, sığdırma) DOM'suz; testler bunları kullanır.
import { BOARD } from '../engine/index.js';
import { ic } from './icons.js';
import { deed } from './deed.js';

export const VB = { w: 1040, h: 461 };

// Kare -> ilin harita noktası (viewBox birimi). docs/TASARIM.md, tasks/yenilikler-plani.md madde 8.
export const CITY_XY = {
  1: [550.7, 117], 2: [504.7, 123.7], 5: [684.3, 99.5], 6: [795.6, 92.1], 8: [753.8, 93.5],
  10: [135.5, 184.2], 12: [197.1, 147.9], 14: [456.6, 270.2], 15: [492.2, 253.4], 17: [375.7, 303.8],
  19: [524, 362.3], 20: [488.5, 375], 23: [282.7, 369.7], 24: [273.3, 175.5], 26: [395.5, 165.4],
  28: [133.4, 305.8], 30: [112, 254.1], 32: [96.8, 266.8], 33: [207, 94.8], 35: [183.5, 88.8],
};

// Birbirine yakın illerin binaları biraz ayrılır ve küçülür: [dx, dy, ölçek] (viewBox birimi).
const SPREAD = {
  32: [-22, 6, 0.82], 30: [6, -8, 0.82], 28: [6, 4, 0.82],
  33: [12, 4, 0.85], 35: [-14, -2, 0.85],
  5: [-4, 0, 0.88], 8: [-8, 2, 0.88], 6: [10, 0, 0.88],
  14: [-8, 4, 0.92], 15: [8, -4, 0.92], 19: [8, -2, 0.92], 20: [-8, 4, 0.92],
};
export const bldAnchor = (q) => {
  const [x, y] = CITY_XY[q];
  const [dx, dy, k] = SPREAD[q] || [0, 0, 1];
  return { x: x + dx, y: y + dy, k };
};

// Bina resmi: seviye L = yasal + kaçak. L=0 resim yok; üst kat kaçaksa (ya da İmar Affı'yla yasallaştıysa) k{L-1}, değilse L.
export function bldSrc(group, ps) {
  const L = ps ? ps.kat + ps.kacak : 0;
  if (!group || L <= 0) return null;
  return `assets/bina/${group}/${ps.kacak || ps.affed ? `k${L - 1}` : L}.png`;
}

// Haritanın w x h kutuya oranı bozulmadan sığdığı yer (ortalı, kenarlarda boşluk).
export function letterbox(w, h) {
  const k = Math.min(w / VB.w, h / VB.h);
  const mw = VB.w * k;
  const mh = VB.h * k;
  return { x: (w - mw) / 2, y: (h - mh) / 2, w: mw, h: mh };
}

const pct = (x, y) => `left:${((x / VB.w) * 100).toFixed(3)}%;top:${((y / VB.h) * 100).toFixed(3)}%`;
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class CityMap {
  // Tahtanın içinde, ortadaki alanın (.center) arkasına yerleşir.
  constructor(boardEl) {
    const el = document.createElement('div');
    el.className = 'citymap';
    el.setAttribute('aria-hidden', 'true');
    const qs = Object.keys(CITY_XY).map(Number);
    const blds = qs.map((q) => {
      const a = bldAnchor(q);
      return `<img class="mb" data-q="${q}" alt="" draggable="false" hidden style="${pct(a.x, a.y)};--k:${a.k};z-index:${Math.round(a.y)}">`;
    });
    const dots = qs.map((q) => `<i class="city" data-q="${q}" style="${pct(...CITY_XY[q])};--gc:var(--g-${BOARD[q].group})"></i>`);
    el.innerHTML = `<div class="mapbox"><i class="land"></i>${blds.join('')}${dots.join('')}</div>`;
    boardEl.insertBefore(el, boardEl.querySelector('.center'));
    this.el = el;
    this.box = el.firstElementChild;
    this.imgs = new Map([...el.querySelectorAll('.mb')].map((n) => [Number(n.dataset.q), n]));
    this.dots = new Map([...el.querySelectorAll('.city')].map((n) => [Number(n.dataset.q), n]));
    this.level = new Map();
    this.ready = false;
    new ResizeObserver(() => this.fit()).observe(el);

    // Harita düğmesi: yalnız basınca harita öne çıkar ve öyle kalır (bir daha basınca ya da Esc ile geri çekilir).
    const btn = document.createElement('button');
    btn.className = 'map-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Haritaya bak');
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.tip = 'Harita';
    btn.innerHTML = ic('map');
    boardEl.appendChild(btn);
    this.board = boardEl;
    this.btn = btn;
    this.pinned = false;
    btn.addEventListener('click', () => this.pin(!this.pinned));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.pinned && this.pin(false));

    // Harita modunda ile gelince tapusu açılır.
    const card = document.createElement('div');
    card.className = 'map-deed';
    card.hidden = true;
    boardEl.appendChild(card);
    this.card = card;
    this.cardQ = null;
    el.addEventListener('pointerover', (e) => {
      const n = e.target.closest('[data-q]');
      this.showCard(n ? Number(n.dataset.q) : null);
    });
    el.addEventListener('pointerleave', () => this.showCard(null));
  }

  pin(on) {
    this.pinned = on;
    this.btn.setAttribute('aria-pressed', String(on));
    this.board.classList.toggle('mapfocus', on);
    if (!on) this.showCard(null);
  }

  // q ilinin tapusu, noktasının yanında (tahtanın alt yarısındaysa üstünde, üst yarısındaysa altında); null: kapat.
  showCard(q) {
    if (!this.v || !this.board.classList.contains('mapfocus') || !CITY_XY[q]) q = null;
    if (q === this.cardQ) return;
    this.cardQ = q;
    this.card.hidden = q === null;
    if (q === null) return;
    this.card.innerHTML = deed(this.v, q, { w: 210, ladder: true });
    const b = this.board.getBoundingClientRect();
    const d = this.dots.get(q).getBoundingClientRect();
    const x = d.left + d.width / 2 - b.left;
    const y = d.top + d.height / 2 - b.top;
    const w = this.card.offsetWidth;
    const h = this.card.offsetHeight;
    const m = this.el.offsetLeft;
    const left = Math.min(this.board.clientWidth - m - w, Math.max(m, x - w / 2));
    const top = y > this.board.clientHeight / 2 ? y - h - 18 : y + 18;
    Object.assign(this.card.style, { left: `${left}px`, top: `${Math.max(this.el.offsetTop, top)}px` });
  }

  fit() {
    const r = letterbox(this.el.clientWidth, this.el.clientHeight);
    Object.assign(this.box.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    this.box.style.setProperty('--mw', `${r.w}px`);
  }

  update(v) {
    this.v = v;
    for (const [q, dot] of this.dots) {
      const ps = v.props[q];
      const owner = ps && ps.owner !== null ? v.players[ps.owner] : null;
      dot.classList.toggle('owned', !!owner);
      dot.style.setProperty('--pc', owner ? owner.color : 'transparent');
      const img = this.imgs.get(q);
      const src = owner ? bldSrc(BOARD[q].group, ps) : null;
      const L = src ? ps.kat + ps.kacak : 0;
      if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.hidden = !src;
      if (this.ready && L > (this.level.get(q) || 0) && !calm()) {
        img.animate([{ transform: 'translate(-50%, -100%) scaleY(0.2)' }, { transform: 'translate(-50%, -100%)' }], { duration: 600, easing: 'cubic-bezier(.3,1.45,.5,1)' });
      }
      this.level.set(q, L);
    }
    // Açık tapu yeni durumla yeniden çizilir.
    const open = this.cardQ;
    this.cardQ = null;
    if (open !== null) this.showCard(open);
    this.ready = true;
  }
}
