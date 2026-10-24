// Tahta: 8x8 ızgaranın kenarındaki 28 kare ve oyuncu taşları.
import { BOARD, GROUPS, price, rentFor, fmt } from '../engine/index.js';
import { html, raw, esc, sleep } from './dom.js';
import { play } from './sound.js';

const N = BOARD.length;

export function cellPos(i) {
  if (i <= 7) return { row: 8, col: 8 - i, side: i === 0 || i === 7 ? 'c' : 'b' };
  if (i <= 13) return { row: 15 - i, col: 1, side: 'l' };
  if (i === 14) return { row: 1, col: 1, side: 'c' };
  if (i <= 20) return { row: 1, col: i - 13, side: 't' };
  if (i === 21) return { row: 1, col: 8, side: 'c' };
  return { row: i - 20, col: 8, side: 'r' };
}

const CORNER_HINT = { start: 'Geçince maaş', tapu: 'Sahipsiz arsa al', cay: 'Herkesten çay parası', zabita: 'Kaçak ihbar et' };

function cellStatic(sq, i) {
  const pos = cellPos(i);
  if (sq.kind === 'prop') {
    const g = GROUPS[sq.group];
    return html`<div class="band"></div><div class="nm">${sq.name}</div><div class="city">${g.name}</div><div class="floors"></div><div class="pr"></div>`;
  }
  if (sq.kind === 'transport') return html`<div class="ic">${sq.icon}</div><div class="nm">${raw(esc(sq.name).replace('HAVALİMANI', 'HAVA&shy;LİMANI'))}</div><div class="pr"></div>`;
  if (pos.side === 'c') return html`<div class="ic">${sq.icon}</div><div class="nm">${sq.name}</div><div class="city">${CORNER_HINT[sq.kind]}</div>`;
  return html`<div class="ic">${sq.icon}</div><div class="nm">${sq.name}</div><div class="city">2 kart çek</div>`;
}

export function buildBoard(boardEl) {
  const cells = BOARD.map((sq, i) => {
    const pos = cellPos(i);
    const side = pos.side === 'c' ? 'corner' : `side-${pos.side}`;
    const gc = sq.group ? `--gc:${GROUPS[sq.group].color};` : '';
    return `<div class="cell ${side}" data-act="square" data-sq="${i}" style="grid-row:${pos.row};grid-column:${pos.col};${gc}">${cellStatic(sq, i)}</div>`;
  }).join('');
  boardEl.insertAdjacentHTML('afterbegin', cells);
  return [...boardEl.querySelectorAll('.cell')];
}

export function updateBoard(cells, v, highlight) {
  cells.forEach((el, i) => {
    const sq = BOARD[i];
    const ps = v.props[i];
    el.classList.toggle('hl', highlight === i);
    if (!ps) return;
    const owner = ps.owner === null ? null : v.players[ps.owner];
    el.classList.toggle('owned', !!owner);
    el.classList.toggle('mortgaged', ps.ipotek);
    el.style.setProperty('--pc', owner ? owner.color : 'transparent');
    let ownerEl = el.querySelector('.owner');
    if (owner) {
      if (!ownerEl) {
        ownerEl = document.createElement('div');
        ownerEl.className = 'owner';
        el.appendChild(ownerEl);
      }
      ownerEl.textContent = owner.avatar;
      ownerEl.title = owner.name;
    } else if (ownerEl) ownerEl.remove();
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
    if (floors) floors.innerHTML = '<i></i>'.repeat(ps.kat) + '<i class="k" title="Kaçak kat"></i>'.repeat(ps.kacak);
    const pr = el.querySelector('.pr');
    if (pr) pr.textContent = owner ? (ps.ipotek ? '' : `Kira ${fmt(rentFor(v, i))}`) : fmt(price(v, i));
    el.title = `${sq.name}${sq.group ? ` (${GROUPS[sq.group].name})` : ''}${owner ? ` — ${owner.name}` : ''}`;
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

// ---- zar ----

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
export const dieHTML = (n, cls = '') => `<div class="die ${cls}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n]?.includes(i) ? 'on' : ''}"></i>`).join('')}</div>`;

export async function rollDice(el, dice, fast) {
  if (!el) return;
  if (fast) {
    el.innerHTML = dice.map((d, i) => dieHTML(d, i ? 'red' : '')).join('');
    return;
  }
  play('dice');
  for (let k = 0; k < 7; k++) {
    el.innerHTML = dice.map((_, i) => dieHTML(1 + Math.floor(Math.random() * 6), `rolling ${i ? 'red' : ''}`)).join('');
    await sleep(70);
  }
  el.innerHTML = dice.map((d, i) => dieHTML(d, i ? 'red' : '')).join('');
  await sleep(250);
}

export const squareLabel = (i) => esc(BOARD[(i + N) % N].name);
