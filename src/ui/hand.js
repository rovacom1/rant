// Elde kartlar: ekranın altında Hearthstone tarzı yelpaze.
// Üstüne gelince kart büyür; oynanabilir kart yukarı sürüklenip bırakılınca oynanır, tıklayınca ayrıntısı açılır.
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
const DROP_LINE = 90; // elin üst kenarından bu kadar yukarı bırakılırsa oynanır

export class Hand {
  constructor(el) {
    this.el = el;
    this.items = new Map(); // uid -> element
    this.order = [];
    this.pos = []; // her kartın dinlenme konumunun merkezi (elin ortasına göre px)
    this.hover = null;
    this.drag = null;
    this.raf = 0;
    el.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => {
      this.move(e);
      this.last = e;
      if (!this.raf) this.raf = requestAnimationFrame(() => ((this.raf = 0), this.track(this.last)));
    });
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('resize', () => this.layout());
  }

  // uids: eldeki kartlar; state(uid) -> { playable, selected }; fresh: yeni gelenler (desteden uçar).
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
        this.el.appendChild(el);
        this.items.set(uid, el);
        if (fresh.includes(uid)) {
          el.classList.add('drawn');
          setTimeout(() => el.classList.remove('drawn'), 900);
        }
      }
      const st = state(uid);
      el.classList.toggle('playable', !!st.playable);
      el.classList.toggle('selected', !!st.selected);
    });
    this.order = uids;
    if (!uids.includes(this.hover)) this.hover = null;
    this.layout();
  }

  layout() {
    const n = this.order.length;
    // Yelpaze, soldaki gizli hedef ile sağdaki deste arasına sığar.
    const width = Math.max(260, (this.el.clientWidth || 700) - 340);
    const step = n > 1 ? Math.min(96, (width - 128) / (n - 1)) : 0;
    this.step = step;
    const h = this.order.indexOf(this.hover);
    this.pos = this.order.map((uid, i) => {
      const el = this.items.get(uid);
      const k = i - (n - 1) / 2;
      // Üstüne gelinen kartın komşuları biraz kenara açılır.
      const spread = h < 0 || i === h ? 0 : i < h ? -28 : 28;
      el.style.setProperty('--x', `${k * step + spread}px`);
      el.style.setProperty('--y', `${Math.abs(k) * Math.abs(k) * 3.5}px`);
      el.style.setProperty('--r', `${k * 4.5}deg`);
      el.style.zIndex = String(i === h ? 100 : 10 + i);
      el.classList.toggle('hover', i === h);
      return k * step;
    });
    this.el.classList.toggle('open', h >= 0);
  }

  // Fare elin hizasındaysa en yakın kart seçilir; kart yukarı kalksa da seçim titremez.
  track(e) {
    if (!e || this.drag?.moving) return;
    const r = this.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    let next = null;
    const lifted = this.hover && this.items.get(this.hover)?.querySelector('.kart').getBoundingClientRect();
    const onLifted = lifted && e.clientX >= lifted.left && e.clientX <= lifted.right && e.clientY >= lifted.top && e.clientY <= lifted.bottom;
    if (onLifted) next = this.hover;
    else if (this.order.length && e.clientY >= r.top - 6 && e.clientY <= window.innerHeight) {
      const half = 64 + 4;
      let best = Infinity;
      this.pos.forEach((x, i) => {
        const d = Math.abs(e.clientX - (cx + x));
        if (d < best && d <= Math.max(half, this.step / 2 + 8)) {
          best = d;
          next = this.order[i];
        }
      });
    }
    if (next !== this.hover) {
      this.hover = next;
      this.layout();
    }
  }

  rectOf(uid) {
    const el = this.items.get(uid);
    return el ? el.querySelector('.kart').getBoundingClientRect() : null;
  }

  down(e) {
    if (e.button !== 0) return;
    const el = (this.hover && this.items.get(this.hover)) || e.target.closest('.hslot');
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
      this.el.classList.add('has-drag');
    }
    d.el.style.setProperty('--dx', `${dx}px`);
    d.el.style.setProperty('--dy', `${dy}px`);
    d.el.classList.toggle('armed', e.clientY < this.el.getBoundingClientRect().top - DROP_LINE);
  }

  up(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const armed = d.moving && e.clientY < this.el.getBoundingClientRect().top - DROP_LINE;
    d.el.classList.remove('dragging', 'armed');
    this.el.classList.remove('has-drag');
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
