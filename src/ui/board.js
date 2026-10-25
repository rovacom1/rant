// Tahta: 8x8 ızgaranın kenarındaki 28 kare, oyuncu taşları ve 3 boyutlu zarlar.
// Karenin iç kenarındaki şerit sahipsizken gri, alınınca sahibinin rengi; karede fiyat/kira yazmaz (kareye tıklayınca açılır).
import { BOARD, GROUPS, inFullSet } from '../engine/index.js';
import { html, raw, esc, sleep } from './dom.js';
import { play } from './sound.js';

export function cellPos(i) {
  if (i <= 7) return { row: 8, col: 8 - i, side: i === 0 || i === 7 ? 'c' : 'b' };
  if (i <= 13) return { row: 15 - i, col: 1, side: 'l' };
  if (i === 14) return { row: 1, col: 1, side: 'c' };
  if (i <= 20) return { row: 1, col: i - 13, side: 't' };
  if (i === 21) return { row: 1, col: 8, side: 'c' };
  return { row: i - 20, col: 8, side: 'r' };
}

// Açık renkli oyuncuda koyu yazı, koyu renkli oyuncuda beyaz yazı.
export function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#1b2233' : '#ffffff';
}

function cellStatic(sq) {
  if (sq.kind === 'prop') return html`<div class="band"></div><div class="nm">${sq.name}</div><div class="city">${GROUPS[sq.group].name}</div><div class="floors"></div>`;
  const name = raw(esc(sq.name).replace('HAVALİMANI', 'HAVA&shy;LİMANI'));
  if (sq.kind === 'transport') return html`<div class="band"></div><div class="ic">${sq.icon}</div><div class="nm">${name}</div>`;
  return html`<div class="ic">${sq.icon}</div><div class="nm">${name}</div>`;
}

export function buildBoard(boardEl) {
  const cells = BOARD.map((sq, i) => {
    const pos = cellPos(i);
    const kind = sq.kind === 'prop' || sq.kind === 'transport' ? 'buyable' : 'special';
    return `<div class="cell ${pos.side === 'c' ? 'corner' : `side-${pos.side}`} ${kind}" data-act="square" data-sq="${i}" style="grid-row:${pos.row};grid-column:${pos.col}">${cellStatic(sq)}</div>`;
  }).join('');
  boardEl.insertAdjacentHTML('afterbegin', cells);
  return [...boardEl.querySelectorAll('.cell')];
}

// pick: tahtadan hedef seçilirken parlayacak kareler (yoksa null). open: bilgi penceresi açık kare.
export function updateBoard(cells, v, highlight, pick = null, open = null) {
  cells[0].parentElement.classList.toggle('picking', !!pick);
  cells.forEach((el, i) => {
    const sq = BOARD[i];
    const ps = v.props[i];
    el.classList.toggle('hl', highlight === i);
    el.classList.toggle('pick', !!pick && pick.includes(i));
    el.classList.toggle('open', open === i);
    if (!ps) return;
    const owner = ps.owner === null ? null : v.players[ps.owner];
    el.classList.toggle('owned', !!owner);
    el.classList.toggle('mortgaged', ps.ipotek);
    el.classList.toggle('fullset', !!owner && inFullSet(v, i));
    el.style.setProperty('--pc', owner ? owner.color : '');
    el.style.setProperty('--ink', owner ? inkFor(owner.color) : '');
    let badge = el.querySelector('.badge');
    if (ps.tedbir > 0) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'badge';
        el.appendChild(badge);
      }
      badge.textContent = '⚖️';
      badge.title = `İhtiyati tedbir (${ps.tedbir} tur)`;
    } else if (badge) badge.remove();
    const floors = el.querySelector('.floors');
    if (floors) floors.innerHTML = '<i></i>'.repeat(ps.kat) + '<i class="k"></i>'.repeat(ps.kacak);
    el.title = `${sq.name}${owner ? ` — ${owner.name}` : ' — sahipsiz'}${ps.ipotek ? ' (ipotekli)' : ''}`;
  });
}

// ---- taşlar ----

export class Tokens {
  constructor(layer, cells) {
    this.layer = layer;
    this.cells = cells;
    this.els = new Map();
    this.pos = new Map();
    new ResizeObserver(() => this.layoutAll()).observe(layer);
  }

  sync(players, active) {
    players.forEach((pl, i) => {
      let el = this.els.get(pl.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'token';
        this.layer.appendChild(el);
        this.els.set(pl.id, el);
      }
      el.textContent = pl.avatar;
      el.title = pl.name;
      el.style.setProperty('--pc', pl.color);
      el.classList.toggle('active', i === active);
      this.pos.set(pl.id, this.pos.get(pl.id) ?? pl.pos);
    });
    this.players = players;
  }

  place(id, sq) {
    this.pos.set(id, sq);
    this.layoutAll();
  }

  layoutAll() {
    if (!this.players) return;
    const groups = new Map();
    for (const pl of this.players) {
      const sq = this.pos.get(pl.id) ?? pl.pos;
      if (!groups.has(sq)) groups.set(sq, []);
      groups.get(sq).push(pl.id);
    }
    for (const [sq, ids] of groups) {
      const c = this.cells[sq];
      const cx = c.offsetLeft + c.offsetWidth / 2;
      const cy = c.offsetTop + c.offsetHeight / 2;
      const r = ids.length > 1 ? c.offsetWidth * 0.22 : 0;
      ids.forEach((id, k) => {
        const a = (k / ids.length) * Math.PI * 2 - Math.PI / 2;
        const el = this.els.get(id);
        el.style.left = `${cx + Math.cos(a) * r}px`;
        el.style.top = `${cy + Math.sin(a) * r}px`;
      });
    }
  }

  async walk(id, path, fast) {
    const el = this.els.get(id);
    if (!el || fast) {
      this.place(id, path[path.length - 1]);
      return;
    }
    for (const sq of path) {
      this.place(id, sq);
      el.classList.remove('hop');
      void el.offsetWidth;
      el.classList.add('hop');
      play('step');
      await sleep(150);
    }
  }

  settle(players) {
    for (const pl of players) this.pos.set(pl.id, pl.pos);
    this.layoutAll();
  }
}

// ---- 3 boyutlu zar ----

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Küpün o yüzü öne bakması için gereken dönüş (derece): [x, y].
const FACE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
const face = (n) => `<div class="face f${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'on' : ''}"></i>`).join('')}</div>`;

export class Dice {
  constructor(el) {
    this.el = el;
    this.turns = [
      [0, 0],
      [0, 0],
    ];
    el.innerHTML = [0, 1]
      .map((i) => `<div class="die3d ${i ? 'red' : ''}"><div class="cube">${[1, 2, 3, 4, 5, 6].map(face).join('')}</div><div class="dshadow"></div></div>`)
      .join('');
    this.cubes = [...el.querySelectorAll('.cube')];
    this.wraps = [...el.querySelectorAll('.die3d')];
    this.values = null;
  }

  orient(i, value, animate) {
    const [x, y] = FACE_ROT[value];
    const c = this.cubes[i];
    c.style.transition = animate ? '' : 'none';
    c.style.transform = `rotateX(${x + this.turns[i][0] * 360}deg) rotateY(${y + this.turns[i][1] * 360}deg)`;
  }

  // Anlık gösterim (null: gizle).
  show(values) {
    this.el.classList.toggle('off', !values);
    const key = values ? values.join() : '';
    if (!values || key === this.values) return;
    this.values = key;
    values.forEach((v, i) => this.orient(i, v, false));
  }

  async roll(values, fast) {
    if (fast) return this.show(values);
    this.el.classList.remove('off');
    this.values = values.join();
    play('dice');
    values.forEach((v, i) => {
      this.turns[i][0] += 2 + Math.floor(Math.random() * 2);
      this.turns[i][1] += 1 + Math.floor(Math.random() * 2);
      const w = this.wraps[i];
      w.classList.remove('throw');
      this.cubes[i].style.transition = 'none';
      void w.offsetWidth;
      w.classList.add('throw');
      this.orient(i, v, true);
    });
    await sleep(1250);
  }
}
