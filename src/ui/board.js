// Tahta: 10x10 ızgaranın kenarındaki 36 kare (genişliği yüksekliğinden fazla), piyonlar ve 3 boyutlu zarlar.
// Mülk: şehrin tek rengindeki buzlu cam ve aynı renkte set çerçevesi; sahibi yalnız iç kenardaki şerit gösterir
// (sahipsizken ince ve soluk, sahipliyken kalın ve sahibinin renginde). Karede fiyat/kira yazmaz; tıklayınca açılır.
import { BOARD, GROUPS, inFullSet } from '../engine/index.js';
import { html, raw, sleep } from './dom.js';
import { play } from './sound.js';
import { icon, ic } from './icons.js';
import { pawn } from './pawns.js';
import { PAWN, laneTop, pawnXs } from './slots.js';
import { PACE } from '../net/host.js';

// Izgara kenarı G kare; köşeler 0, K, 2K, 3K. Kare 0 sağ altta, sıra saat yönünde.
export const G = BOARD.length / 4 + 1;
const K = G - 1;

export function cellPos(i) {
  if (i <= K) return { row: G, col: G - i, side: i === 0 || i === K ? 'c' : 'b' };
  if (i < 2 * K) return { row: G - (i - K), col: 1, side: 'l' };
  if (i === 2 * K) return { row: 1, col: 1, side: 'c' };
  if (i < 3 * K) return { row: 1, col: 1 + i - 2 * K, side: 't' };
  if (i === 3 * K) return { row: 1, col: G, side: 'c' };
  return { row: 1 + i - 3 * K, col: G, side: 'r' };
}

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
// Açık renk zeminde koyu yazı, koyu renk zeminde beyaz yazı.
export const inkFor = (hex) => (lum(hex) > 0.62 ? '#1b2233' : '#ffffff');
export const isLight = (hex) => lum(hex) > 0.55;

const artOf = (sq) => (sq.kind === 'transport' ? sq.mode : sq.kind);

function cellStatic(sq) {
  const name = html`<span class="nm">${sq.name}</span>`;
  if (sq.kind === 'prop') return html`<span class="strip"></span>${name}<span class="floors"></span>`;
  const art = html`<span class="art">${raw(icon(artOf(sq)))}</span>`;
  return sq.kind === 'transport' ? html`<span class="strip"></span>${art}${name}` : html`${art}${name}`;
}

export function buildBoard(boardEl) {
  const cells = BOARD.map((sq, i) => {
    const pos = cellPos(i);
    const kind = sq.kind === 'prop' || sq.kind === 'transport' ? `buyable k-${sq.kind}${sq.mode ? ` k-${sq.mode}` : ''}` : `special k-${sq.kind}`;
    const g = sq.kind === 'prop' ? GROUPS[sq.group] : null;
    const vars = g ? `;--gc:${g.color}` : '';
    const dk = g && !isLight(g.color) ? ' dk' : '';
    return `<div class="cell ${pos.side === 'c' ? 'corner side-c' : `side-${pos.side}`} ${kind}${dk}" data-act="square" data-sq="${i}" style="grid-row:${pos.row};grid-column:${pos.col}${vars}">${cellStatic(sq)}</div>`;
  }).join('');
  boardEl.insertAdjacentHTML('afterbegin', cells);
  const fit = () => fitNames(boardEl);
  new ResizeObserver(fit).observe(boardEl);
  document.fonts?.ready.then(fit);
  return [...boardEl.querySelectorAll('.cell')];
}

// Uzun semt adı kareye sığmazsa kelime ortasından bölünmez, yazısı küçülür.
function fitNames(boardEl) {
  for (const n of boardEl.querySelectorAll('.cell.k-prop .nm')) {
    n.style.fontSize = '';
    const c = n.parentElement;
    const cs = getComputedStyle(c);
    const room = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 6;
    if (n.offsetWidth > room) n.style.fontSize = `${((parseFloat(getComputedStyle(n).fontSize) * room) / n.offsetWidth).toFixed(2)}px`;
  }
}

// o: { highlight, pick: parlayacak kareler ya da null, open: penceresi açık kare, turn: { sq, color } sırası gelenin karesi,
//      steps: { kare: '5' } gidilebilecek karelerde sayı rozeti }
export function updateBoard(cells, v, o = {}) {
  const pick = o.pick || null;
  cells[0].parentElement.classList.toggle('picking', !!pick);
  cells.forEach((el, i) => {
    const sq = BOARD[i];
    const ps = v.props[i];
    el.classList.toggle('hl', o.highlight === i);
    el.classList.toggle('pick', !!pick && pick.includes(i));
    el.classList.toggle('open', o.open === i);
    const turn = o.turn && o.turn.sq === i;
    el.classList.toggle('turnsq', !!turn);
    if (turn) el.style.setProperty('--tc', o.turn.color);
    let step = el.querySelector('.stepn');
    const want = o.steps && o.steps[i];
    if (want && !step) el.insertAdjacentHTML('beforeend', `<span class="stepn">${want}</span>`);
    else if (!want && step) step.remove();
    else if (want && step) step.textContent = want;
    if (!ps) {
      el.setAttribute('aria-label', sq.name);
      return;
    }
    const owner = ps.owner === null ? null : v.players[ps.owner];
    const full = !!owner && inFullSet(v, i);
    el.classList.toggle('owned', !!owner);
    el.style.setProperty('--pc', owner ? owner.color : '');
    setPart(el, 'fullstar', full && sq.kind === 'prop', () => ic('star'));
    setPart(el, 'mort', ps.ipotek, () => ic('ipotek'));
    setPart(el, 'ted', ps.tedbir > 0, () => ic('tedbir'));
    const floors = el.querySelector('.floors');
    if (floors) {
      const f = (ps.kat ? `${ic('house')}×${ps.kat}` : '') + (ps.kacak ? ic('kacak') : '');
      if (floors.innerHTML !== f) floors.innerHTML = f;
    }
    const tip = [sq.name, owner ? `sahibi ${owner.name}` : 'sahipsiz', full ? 'tam set' : '', ps.kat ? `${ps.kat} kat` : '', ps.kacak ? 'kaçak kat' : '', ps.ipotek ? 'ipotekli' : '', ps.tedbir > 0 ? 'ihtiyati tedbir' : ''];
    el.setAttribute('aria-label', tip.filter(Boolean).join(', '));
  });
}

// Karedeki küçük işaret (yıldız, ipotek, tedbir): gerekiyorsa ekler, gerekmiyorsa kaldırır.
function setPart(el, cls, on, make) {
  const cur = el.querySelector(`.${cls}`);
  if (on && !cur) el.insertAdjacentHTML('beforeend', `<span class="${cls}">${make()}</span>`);
  else if (!on && cur) cur.remove();
}

// ---- piyonlar ----

export class Tokens {
  constructor(layer, cells) {
    this.layer = layer;
    this.cells = cells;
    this.els = new Map();
    this.pos = new Map();
    this.size = 0;
    new ResizeObserver(() => this.layoutAll()).observe(layer);
  }

  sync(players) {
    players.forEach((pl) => {
      let el = this.els.get(pl.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'token';
        this.layer.appendChild(el);
        this.els.set(pl.id, el);
      }
      const key = `${pl.avatar}|${pl.color}|${this.size}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.innerHTML = pawn(pl.avatar, pl.color, this.size || 36);
      }
      el.classList.toggle('out', !!pl.out); // iflas eden oyuncunun piyonu tahtadan kalkar
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
    const ch = this.cells[1].offsetHeight;
    const size = Math.round(ch * PAWN);
    if (size !== this.size) {
      this.size = size;
      this.sync(this.players);
    }
    const groups = new Map();
    for (const pl of this.players) {
      if (pl.out) continue;
      const sq = this.pos.get(pl.id) ?? pl.pos;
      if (!groups.has(sq)) groups.set(sq, []);
      groups.get(sq).push(pl.id);
    }
    for (const [sq, ids] of groups) {
      const c = this.cells[sq];
      const xs = pawnXs(ids.length, c.offsetWidth, size);
      const top = c.offsetTop + laneTop(cellPos(sq).side, c.offsetHeight);
      ids.forEach((id, k) => {
        const el = this.els.get(id);
        el.style.left = `${c.offsetLeft + xs[k]}px`;
        el.style.top = `${top}px`;
        el.style.zIndex = 5 + k;
      });
    }
  }

  async walk(id, path, fast, stepMs = 150) {
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
      play('step', stepMs / 1000);
      await sleep(stepMs);
    }
  }

  settle(players) {
    for (const pl of players) this.pos.set(pl.id, pl.pos);
    this.layoutAll();
  }
}

// ---- 3 boyutlu zar ----

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Küpün o yüzü öne bakması için gereken dönüş (derece): [x, y]. Sonra küp öne doğru 90 derece yatırılır: değer üst yüze gelir.
const FACE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
const ROLL_MS = PACE.roll; // zarın dönme süresi (normal hızda); ses de bu kadar sürer
const face = (n) => `<div class="face f${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'on' : ''}"></i>`).join('')}</div>`;
// Zarlara yukarıdan bakılır: geçerli yüz üstteki yüzdür, ön ve yan yüzler biraz görünür (3 boyutlu durduğu belli olsun).
const TILT = 'rotateX(-52deg) rotateY(-28deg) rotateX(90deg)';

export class Dice {
  constructor(el) {
    this.el = el;
    this.turns = [
      [0, 0],
      [0, 0],
    ];
    el.innerHTML = [0, 1].map(() => `<div class="die3d"><div class="cube">${[1, 2, 3, 4, 5, 6].map(face).join('')}</div><div class="dshadow"></div></div>`).join('');
    this.cubes = [...el.querySelectorAll('.cube')];
    this.wraps = [...el.querySelectorAll('.die3d')];
    this.values = null;
  }

  orient(i, value, animate) {
    const [x, y] = FACE_ROT[value];
    const c = this.cubes[i];
    c.style.transition = animate ? '' : 'none';
    c.style.transform = `${TILT} rotateX(${x + this.turns[i][0] * 360}deg) rotateY(${y + this.turns[i][1] * 360}deg)`;
  }

  // Anlık gösterim (null: gizle).
  show(values) {
    this.el.classList.toggle('off', !values);
    const key = values ? values.join() : '';
    if (!values || key === this.values) return;
    this.values = key;
    values.forEach((v, i) => this.orient(i, v, false));
  }

  // cap: zarın üstünde kısa açıklama (ör. dava zarları); boşsa yok. k: oyun hızı çarpanı.
  async roll(values, fast, waitMs = 1250, cap = '', k = 1) {
    if (cap) this.el.dataset.cap = cap;
    else delete this.el.dataset.cap;
    if (fast) return this.show(values);
    this.el.classList.remove('off');
    this.values = values.join();
    const ms = Math.round(ROLL_MS * k);
    this.el.style.setProperty('--roll', `${ms}ms`);
    play('dice', ms / 1000);
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
    await sleep(waitMs);
  }
}
