// Tahta: 10x10 ızgaranın kenarındaki 36 kare (kenar derinliği her yanda aynı, köşeler kare; tahta.css) ve piyonlar. Zarlar dice.js.
// Mülk karesi: üstte setin tam doygun renginde bant, altta il adı (hiçbir şey örtmez), aradaki alanda kat kat bina resmi;
// sahibi yalnız iç kenardaki şerit gösterir (sahipsizken ince ve soluk, sahipliyken kalın ve sahibinin renginde).
// Karede fiyat/kira yazmaz; tıklayınca açılır. Piyonlar "kaldırım" düzeninde karenin iç kenarında durur (slots.js).
// Monopoly gibi her kenarın kareleri dıştan içe bakar: içerik (.face) alt sırada dik, sol sütunda 90, üst sırada 180,
// sağ sütunda -90 derece döner; bant hep ortaya bakan kenarda, ad dış kenarda.
import { BOARD, GROUPS, inFullSet } from '../engine/index.js';
import { html, raw, sleep } from './dom.js';
import { play } from './sound.js';
import { icon, ic } from './icons.js';
import { boardPawn } from './pawns.js';
import { PAWN, feet, stepDurations } from './slots.js';
import { bldSrc } from './map.js';

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

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const artOf = (sq) => (sq.kind === 'transport' ? sq.mode : sq.kind);

// İki kelimelik ad (İstanbul Anadolu) iki satıra yazılır; ad hiç kesilmez, sığmazsa yazısı küçülür (fitNames).
const nameHTML = (name) => {
  const w = name.split(' ');
  return w.length === 2 ? html`<span class="nm two"><span>${w[0]}</span> <span>${w[1]}</span></span>` : html`<span class="nm">${name}</span>`;
};

const CORNERS = new Set(['start', 'tapu', 'cay', 'zabita']);

// Ulaşım ve Fırsat/Sürpriz kareleri mülk karesinin düzenini izler: simge binanın yerinde, ad aynı yerde ve aynı yazıyla.
function cellInner(sq) {
  if (sq.kind === 'prop') return html`<span class="band"></span><span class="strip"></span><span class="bld"><img alt="" draggable="false" hidden></span>${nameHTML(sq.name)}`;
  const art = html`<span class="art">${raw(icon(artOf(sq)))}</span>`;
  if (sq.kind === 'transport') return html`<span class="strip"></span>${art}${nameHTML(sq.name)}`;
  return CORNERS.has(sq.kind) ? html`${art}<span class="nm">${sq.name}</span>` : html`${art}${nameHTML(sq.name)}`;
}
const cellStatic = (sq) => `<div class="face">${cellInner(sq)}</div>`;

export function buildBoard(boardEl) {
  // Set renkleri tahtada değişken olarak da durur (haritadaki halkalar için).
  for (const [g, x] of Object.entries(GROUPS)) boardEl.style.setProperty(`--g-${g}`, x.color);
  const cells = BOARD.map((sq, i) => {
    const pos = cellPos(i);
    const kind = sq.kind === 'prop' || sq.kind === 'transport' ? `buyable k-${sq.kind}${sq.mode ? ` k-${sq.mode}` : ''}` : `special k-${sq.kind}`;
    const g = sq.kind === 'prop' ? GROUPS[sq.group] : null;
    const vars = g ? `;--gc:${g.color}` : '';
    return `<div class="cell ${pos.side === 'c' ? 'corner side-c' : `side-${pos.side}`} ${kind}" data-act="square" data-sq="${i}" style="grid-row:${pos.row};grid-column:${pos.col}${vars}">${cellStatic(sq)}</div>`;
  }).join('');
  boardEl.insertAdjacentHTML('afterbegin', cells);
  const fit = () => fitNames(boardEl);
  new ResizeObserver(fit).observe(boardEl);
  document.fonts?.ready.then(fit);
  return [...boardEl.querySelectorAll('.cell')];
}

// Ad kareye sığmazsa kelime ortasından bölünmez, kesilmez; yazısı küçülür.
function fitNames(boardEl) {
  for (const n of boardEl.querySelectorAll('.cell .nm')) {
    n.style.fontSize = '';
    for (let k = 0; k < 4 && n.scrollWidth > n.clientWidth + 0.5; k++) {
      const f = parseFloat(getComputedStyle(n).fontSize);
      n.style.fontSize = `${((f * n.clientWidth * 0.97) / n.scrollWidth).toFixed(2)}px`;
    }
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
    const face = el.firstElementChild;
    setPart(face, 'fullstar', full && sq.kind === 'prop', () => ic('star'));
    setPart(face, 'mort', ps.ipotek, () => ic('ipotek'));
    setPart(face, 'ted', ps.tedbir > 0, () => ic('tedbir'));
    // Bina resmi: aynı img öğesi kalır (yıkım canlandırması onu gizlerken resmi değişebilir).
    const img = el.querySelector('.bld img');
    if (img) {
      const src = bldSrc(sq.group, ps);
      if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.hidden = !src;
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
        el.className = 'token idle';
        this.layer.appendChild(el);
        this.els.set(pl.id, el);
      }
      const size = this.size || 36;
      const key = `${pl.avatar}|${pl.color}|${size}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.innerHTML = boardPawn(pl.avatar, pl.color, size);
        el.style.setProperty('--s', `${size}px`);
        el.style.setProperty('--pc', pl.color);
      }
      el.classList.toggle('out', !!pl.out); // iflas eden oyuncunun piyonu tahtadan kalkar
      this.pos.set(pl.id, this.pos.get(pl.id) ?? pl.pos);
    });
    this.players = players;
  }

  // Sırası gelen oyuncunun piyonu biraz büyük durur ve hafifçe zıplar (hareket azaltmada durur).
  setActive(id) {
    for (const [pid, el] of this.els) el.classList.toggle('act', pid === id);
  }

  place(id, sq) {
    this.pos.set(id, sq);
    this.layoutAll();
  }

  layoutAll() {
    if (!this.players) return;
    const size = Math.round(this.cells[1].offsetHeight * PAWN);
    if (size !== this.size) {
      this.size = size;
      this.sync(this.players);
    }
    const W = this.layer.clientWidth;
    const H = this.layer.clientHeight;
    const groups = new Map();
    for (const pl of this.players) {
      if (pl.out) continue;
      const sq = this.pos.get(pl.id) ?? pl.pos;
      if (!groups.has(sq)) groups.set(sq, []);
      groups.get(sq).push(pl.id);
    }
    for (const [sq, ids] of groups) {
      const c = this.cells[sq];
      const box = { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
      const fs = feet(cellPos(sq).side, box, size, ids.length, W, H);
      ids.forEach((id, k) => {
        const el = this.els.get(id);
        el.style.left = `${Math.round(fs[k].x - size / 2)}px`;
        el.style.top = `${Math.round(fs[k].y - size)}px`;
        el.style.zIndex = 10 + Math.round(fs[k].y);
      });
    }
  }

  // Yürüyüş: kalkışta hızlanır, ortada hızlı, varışta yavaşlar (toplam stepMs x adım); her adımda yay çizer, inişte adım
  // sesi çalar. Son inişte ezilir, altında toz halkası açılır ve kısa durur (host PACE.step bütçesinin içinde).
  async walk(id, path, fast, stepMs = 150) {
    const el = this.els.get(id);
    if (!el || fast) {
      this.place(id, path[path.length - 1]);
      return;
    }
    if (calm()) {
      for (const sq of path) {
        this.place(id, sq);
        play('step', stepMs / 1000);
        await sleep(stepMs);
      }
      return;
    }
    const fig = el.querySelector('.fig');
    const ds = stepDurations(path.length, stepMs * path.length);
    const arc = Math.round(this.size * 0.42);
    el.classList.add('walking');
    el.classList.remove('idle');
    try {
      for (let k = 0; k < path.length; k++) {
        const d = Math.round(ds[k]);
        // Yer bir kerede değişir, aradaki yol transform ile çizilir (her karede yerleşim ve boyama olmasın).
        const x0 = el.offsetLeft;
        const y0 = el.offsetTop;
        this.place(id, path[k]);
        const dx = x0 - el.offsetLeft;
        const dy = y0 - el.offsetTop;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: d, easing: 'cubic-bezier(.45,0,.55,1)' });
        fig?.animate([{ transform: 'none' }, { transform: `translateY(${-arc}px)`, offset: 0.45 }, { transform: 'none' }], { duration: d, easing: 'ease-in-out' });
        play('step', Math.min(d, 280) / 1000, { at: d / 1000, hit: true });
        await sleep(d);
      }
      fig?.animate([{ transform: 'scale(1.14, 0.82)' }, { transform: 'scale(0.96, 1.05)', offset: 0.5 }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
      const dust = document.createElement('i');
      dust.className = 'dust';
      Object.assign(dust.style, { left: `${el.offsetLeft + this.size / 2}px`, top: `${el.offsetTop + this.size}px` });
      dust.style.setProperty('--s', `${this.size}px`);
      this.layer.appendChild(dust);
      setTimeout(() => dust.remove(), 560);
      await sleep(Math.round(stepMs * 0.8));
    } finally {
      el.classList.remove('walking');
      el.classList.add('idle');
    }
  }

  settle(players) {
    for (const pl of players) this.pos.set(pl.id, pl.pos);
    this.layoutAll();
  }
}
