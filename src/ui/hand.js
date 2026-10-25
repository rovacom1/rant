// Elde kartlar: sağ sütunda, oyuncuların altında ızgara. Kart boyu sütunda kalan yere göre ayarlanır, tahtanın önüne geçmez.
// Üstüne gelince kart büyür; oynanabilir kart tahtaya sürüklenip bırakılınca oynanır, tıklayınca ayrıntısı açılır.
// Bileşen olayları belgeye 'rant:card' olarak yollar: { uid, how: 'click' | 'drop' }.
import { CARDS, cardId } from '../engine/index.js';
import { html } from './dom.js';

export const cardArt = (id) => `assets/kart/${id}.jpg`;
const WHEN = { preroll: 'Zar atmadan önce', choose: 'Zar attıktan sonra', buy: 'Satın alırken' };

// Tek kartın yüzü (elde, pencerede ve ortadaki gösterimde aynı tasarım).
export function cardFace(id, cls = '') {
  const c = CARDS[id];
  return html`<div class="kart ${c.type} ${cls}">
    <div class="k-art"><span>${c.icon}</span><i style="background-image:url(${cardArt(id)})"></i></div>
    <div class="k-gem">${c.type === 'tepki' ? 'TEPKİ' : 'HAMLE'}</div>
    <div class="k-name"><span>${c.name}</span></div>
    <div class="k-text">${c.text}</div>
    <div class="k-foot">${c.type === 'tepki' ? 'Gerektiğinde sorulur' : WHEN[c.when] || 'Sıran sendeyken'}</div>
  </div>`;
}

const DRAG_START = 8; // px
const GAP = 8; // kartlar arası boşluk (CSS .hand-grid gap ile aynı)
const MAX_W = 128; // kartın en geniş hali
const ZOOM_W = 220; // üstüne gelince kartın genişliği
const RATIO = 1.42; // kart yüksekliği / genişliği (CSS .kart)
const NARROW = globalThis.matchMedia?.('(max-width: 1100px)'); // tahta, el ve panel alt alta (CSS ile aynı eşik)

// n kartı w x h alana en büyük boyda yerleştiren sütun sayısı ve kart genişliği.
// h yoksa (dar ekranda sütun içerik kadar uzar) yalnız genişliğe bakılır, kart 100 px'ten küçülmez.
export function fitGrid(n, w, h) {
  if (!n) return { cols: 1, w: MAX_W };
  if (!h) {
    const cols = Math.max(1, Math.min(n, Math.floor((w + GAP) / (100 + GAP))));
    return { cols, w: Math.floor(Math.min(MAX_W, (w - (cols - 1) * GAP) / cols)) };
  }
  // En büyük kart; eşitse daha az satır (ızgara dolu görünür), satır da eşitse daha az sütun (dengeli dizilir).
  let best = { cols: 1, rows: n, w: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cw = Math.min(MAX_W, (w - (cols - 1) * GAP) / cols, (h - (rows - 1) * GAP) / rows / RATIO);
    if (cw > best.w + 0.5 || (cw > best.w - 0.5 && rows < best.rows)) best = { cols, rows, w: cw };
  }
  return { cols: best.cols, w: Math.floor(best.w) };
}

export class Hand {
  // el: kartların ızgarası; drop: üzerine bırakılınca kartın oynandığı alan (tahta).
  constructor(el, drop) {
    this.el = el;
    this.drop = drop;
    this.items = new Map(); // uid -> element
    this.order = [];
    this.drag = null;
    el.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    new ResizeObserver(() => this.layout()).observe(el);
    NARROW?.addEventListener('change', () => this.layout());
  }

  // uids: eldeki kartlar; state(uid) -> { playable, selected }; fresh: yeni gelenler (belirerek gelir).
  render(uids, state, fresh = []) {
    for (const [uid, el] of this.items) {
      if (!uids.includes(uid)) {
        el.remove();
        this.items.delete(uid);
      }
    }
    uids.forEach((uid) => {
      let el = this.items.get(uid);
      if (!el) {
        el = document.createElement('div');
        el.className = 'hslot';
        el.dataset.uid = uid;
        el.innerHTML = String(cardFace(cardId(uid)));
        if (fresh.includes(uid)) {
          el.classList.add('drawn');
          setTimeout(() => el.classList.remove('drawn'), 900);
        }
        this.items.set(uid, el);
        this.el.appendChild(el);
      }
      const st = state(uid);
      el.classList.toggle('playable', !!st.playable);
      el.classList.toggle('selected', !!st.selected);
    });
    // Sıra yalnız değiştiyse yeniden dizilir; yerinden oynayan kartın parıltısı baştan başlar.
    if ([...this.el.children].some((c, i) => c.dataset.uid !== uids[i])) for (const uid of uids) this.el.appendChild(this.items.get(uid));
    this.order = uids;
    this.layout();
  }

  layout() {
    const n = this.order.length;
    const { cols, w } = fitGrid(n, this.el.clientWidth, NARROW?.matches ? 0 : this.el.clientHeight);
    this.el.style.setProperty('--cols', cols);
    this.el.style.setProperty('--hw', `${w}px`);
    this.el.style.setProperty('--zoom', Math.max(1, ZOOM_W / w).toFixed(3));
    const rows = Math.ceil(n / cols);
    // Büyüyen kart ızgaranın içine doğru açılır: kenardaki kart dışarı taşmaz.
    this.order.forEach((uid, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols === 1 ? 'center' : col === 0 ? 'left' : col === cols - 1 ? 'right' : 'center';
      const y = rows > 1 && row === 0 ? 'top' : 'bottom';
      this.items.get(uid).style.transformOrigin = `${x} ${y}`;
    });
  }

  rectOf(uid) {
    const el = this.items.get(uid);
    return el ? el.querySelector('.kart').getBoundingClientRect() : null;
  }

  overDrop(e) {
    const r = this.drop.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  down(e) {
    if (e.button !== 0) return;
    const el = e.target.closest('.hslot');
    if (!el) return;
    this.drag = { el, uid: el.dataset.uid, x0: e.clientX, y0: e.clientY, moving: false };
  }

  move(e) {
    const d = this.drag;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moving) {
      if (Math.hypot(dx, dy) < DRAG_START || !d.el.classList.contains('playable')) return;
      d.moving = true;
      d.el.classList.add('dragging');
    }
    d.el.style.setProperty('--dx', `${dx}px`);
    d.el.style.setProperty('--dy', `${dy}px`);
    d.el.classList.toggle('armed', this.overDrop(e));
  }

  up(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const armed = d.moving && this.overDrop(e);
    d.el.classList.remove('dragging', 'armed');
    d.el.style.removeProperty('--dx');
    d.el.style.removeProperty('--dy');
    if (d.moving && !armed) return;
    document.dispatchEvent(new CustomEvent('rant:card', { detail: { uid: d.uid, how: armed ? 'drop' : 'click' } }));
  }
}

// Kartı bir noktadan tahtanın ortasına uçurup söndürür (oynanan kart).
export function flyToCenter(face, from, to) {
  const ghost = document.createElement('div');
  ghost.className = 'kart-ghost';
  ghost.innerHTML = String(face);
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  document.body.appendChild(ghost);
  const dx = to.x - (from.left + from.width / 2);
  const dy = to.y - (from.top + from.height / 2);
  ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy - 20}px) scale(1.9)`, opacity: 0 },
    ],
    { duration: 1100, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
  ).onfinish = () => ghost.remove();
}
