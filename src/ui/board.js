// Tahta: 10x10 ızgaranın kenarındaki 36 kare (kenar derinliği her yanda aynı, köşeler kare; tahta.css) ve piyonlar. Zarlar dice.js.
// Mülk karesi: ortaya bakan kenarda setin tam doygun renginde bant, dış tarafta il adı (hiçbir şey örtmez), aradaki alanda kat kat bina resmi;
// sahibi yalnız iç kenardaki şerit gösterir (sahipsizken ince ve soluk, sahipliyken kalın ve sahibinin renginde).
// Karede fiyat/kira yazmaz; tıklayınca açılır. Piyonlar "kaldırım" düzeninde karenin iç kenarında durur (slots.js).
// İçerik (.face) dört kenarda da dik durur (baş çevirmeden okunur); bant ve şerit hep ortaya bakan kenarda (tahta.css).
// Köşe, ulaşım ve Fırsat/Sürpriz simgeleri resimdir (assets/kare, icons.js).
import { BOARD, GROUPS, inFullSet } from '../engine/index.js';
import { html, raw, sleep, esc } from './dom.js';
import { play } from './sound.js';
import { icon, ic } from './icons.js';
import { boardPawn } from './pawns.js';
import { stepDurations } from './slots.js';
import { bldSrc } from './map.js';
import { dust } from './sprite.js';
import { arcHeight, JUMP_FLY, JUMP_SETTLE } from './arazigeom.js';

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
    return `<div class="cell ${pos.side === 'c' ? 'corner side-c' : `side-${pos.side}`} ${kind}" data-act="square" data-sq="${i}" tabindex="0" role="button" aria-label="${esc(sq.name)}" style="grid-row:${pos.row};grid-column:${pos.col}${vars}">${cellStatic(sq)}</div>`;
  }).join('');
  boardEl.insertAdjacentHTML('afterbegin', cells);
  const fit = () => fitNames(boardEl);
  new ResizeObserver(fit).observe(boardEl);
  document.fonts?.ready.then(fit);
  return [...boardEl.querySelectorAll('.cell')];
}

// Ad kareye sığmazsa kelime ortasından bölünmez, kesilmez; yazısı küçülür. Yan sütunlarda da ad şeridin yanında biter.
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

// view: tahta görünümü (boardview.js); piyonların yeri ve boyu ondan gelir, Mahalle arazisinde de aynı sınıf çalışır.
export class Tokens {
  constructor(layer, view) {
    this.layer = layer;
    this.view = view;
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
      if (!this.pos.has(pl.id)) this.pos.set(pl.id, pl.pos); // yeri yürüyüşte ve settle'da değişir
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
    const size = this.view.pawnSize();
    if (size !== this.size) {
      this.size = size;
      this.sync(this.players);
    }
    const groups = new Map();
    for (const pl of this.players) {
      const sq = this.pos.get(pl.id) ?? pl.pos;
      const off = sq === null || sq === undefined; // tahtanın dışında (Mahalle'de ilk zardan önce)
      this.els.get(pl.id).classList.toggle('off', off);
      if (pl.out || off) continue;
      if (!groups.has(sq)) groups.set(sq, []);
      groups.get(sq).push(pl.id);
    }
    // Önce bütün noktalar okunur, sonra yazılır: okuma ile yazma iç içe olursa her grupta yerleşim yeniden hesaplanır.
    const pts = [...groups].map(([sq, ids]) => this.view.feet(sq, size, ids.length));
    [...groups.values()].forEach((ids, g) => {
      ids.forEach((id, k) => {
        const el = this.els.get(id);
        const f = pts[g][k];
        el.style.left = `${Math.round(f.x - size / 2)}px`;
        el.style.top = `${Math.round(f.y - size)}px`;
        el.style.zIndex = 10 + Math.round(f.y);
      });
    });
  }

  // Yürüyüş: kalkışta hızlanır, ortada hızlı, varışta yavaşlar (toplam stepMs x adım); her adımda yay çizer, inişte adım
  // tıkı çalar, tık her adımda yarım ton yükselir. Varılacak kare yürüyüş boyunca altın kenarla bekler. Son inişte tok
  // vuruş, piyon ezilip toparlanır, ayağının dibinde toz bulutu (sprite.js) kalkar ve kısa durur (host PACE.step
  // bütçesinin içinde). onStep(k, ms): her adımın başında (kamera piyonu izler, camera.js).
  async walk(id, path, fast, stepMs = 150, onStep = null) {
    const el = this.els.get(id);
    if (!el || fast) {
      this.place(id, path[path.length - 1]);
      return;
    }
    const hint = this.dest(path[path.length - 1]);
    const pitch = (k) => ({ rate: 2 ** (Math.min(k, 12) / 12) });
    if (calm()) {
      for (let k = 0; k < path.length; k++) {
        this.place(id, path[k]);
        play('step', stepMs / 1000, pitch(k));
        await sleep(stepMs);
      }
      hint.end();
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
        onStep?.(k, d);
        // Yer bir kerede değişir, aradaki yol transform ile çizilir (her karede yerleşim ve boyama olmasın).
        const x0 = el.offsetLeft;
        const y0 = el.offsetTop;
        this.place(id, path[k]);
        const dx = x0 - el.offsetLeft;
        const dy = y0 - el.offsetTop;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: d, easing: 'cubic-bezier(.45,0,.55,1)' });
        fig?.animate([{ transform: 'none' }, { transform: `translateY(${-arc}px)`, offset: 0.45 }, { transform: 'none' }], { duration: d, easing: 'ease-in-out' });
        play('step', Math.min(d, 280) / 1000, { at: d / 1000, hit: true, ...pitch(k) });
        if (k === path.length - 1) play('thud', 0.3, { at: d / 1000, hit: true, vol: 0.55 });
        await sleep(d);
      }
      this.land(el);
      hint.end();
      await sleep(Math.round(stepMs * 0.8));
    } finally {
      el.classList.remove('walking');
      el.classList.add('idle');
      hint.end();
    }
  }

  // Zıplama (Mahalle arsaları, path tek kare): piyon yay çizerek uçar (yalnız transform; yükseklik mesafeyle büyür),
  // inişte tok vuruş, ezilip toparlanır, toz kalkar. Tahtanın dışından gelen piyon yukarıdan süzülüp iner. Varılacak arsa
  // uçuş boyunca altın kenarla bekler. k: oyun hızı çarpanı (JUMP_FLY + JUMP_SETTLE normal hızda host PACE.jump içinde).
  async jump(id, to, fast, k = 1, onStep = null) {
    const el = this.els.get(id);
    if (!el || fast) return this.place(id, to);
    const fly = Math.round(JUMP_FLY * k);
    const settle = Math.round(JUMP_SETTLE * k);
    const hint = this.dest(to);
    if (calm()) {
      this.place(id, to);
      play('step', fly / 1000);
      await sleep(fly);
      hint.end();
      return;
    }
    const fig = el.querySelector('.fig');
    el.classList.add('walking');
    el.classList.remove('idle');
    try {
      onStep?.(0, fly);
      const off = el.classList.contains('off');
      const x0 = el.offsetLeft;
      const y0 = el.offsetTop;
      this.place(id, to);
      play('hop', fly / 1000);
      if (off) {
        el.animate([{ transform: `translateY(${-this.size * 3}px)`, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'none', opacity: 1 }], { duration: fly, easing: 'cubic-bezier(.3,0,.7,1)' });
      } else {
        const dx = x0 - el.offsetLeft;
        const dy = y0 - el.offsetTop;
        const h = arcHeight(dx, dy, this.size);
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: fly, easing: 'cubic-bezier(.4,0,.6,1)' });
        fig?.animate([{ transform: 'none', easing: 'cubic-bezier(.2,.6,.4,1)' }, { transform: `translateY(${-h}px) scale(1.08)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.4)' }, { transform: 'none' }], { duration: fly });
      }
      play('thud', 0.3, { at: fly / 1000, hit: true, vol: 0.55 });
      await sleep(fly);
      this.land(el);
      hint.end();
      await sleep(settle);
    } finally {
      el.classList.remove('walking');
      el.classList.add('idle');
      hint.end();
    }
  }

  // Varış: piyon ezilip toparlanır, iki küçük bulut ayağın iki yanından kalkar (figürün önüne geçmez).
  land(el) {
    el.querySelector('.fig')?.animate([{ transform: 'scale(1.15, 0.85)' }, { transform: 'scale(0.97, 1.04)', offset: 0.55 }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
    const s = this.size;
    for (const side of [-1, 1]) dust(this.layer, el.offsetLeft + s * (0.5 + side * 0.52), el.offsetTop + s * 1.02, s * 0.72, 0, 420).classList.add('fx-walk');
  }

  // Varılacak karenin üstünde ince altın kenar: yürüyüş başında belirir (yalnız opacity), varışta bir an parlayıp söner.
  // Kareye yazı ya da işaret konmaz; kenar piyonların altında kalır.
  dest(sq) {
    const b = this.view.box(sq);
    const el = document.createElement('i');
    el.className = 'fx fx-dest';
    Object.assign(el.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
    this.layer.appendChild(el);
    el.animate([{ opacity: 0 }, { opacity: 0.85 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
    let done = false;
    return {
      end() {
        if (done) return;
        done = true;
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
        setTimeout(() => el.remove(), 400);
      },
    };
  }

  settle(players) {
    for (const pl of players) this.pos.set(pl.id, pl.pos);
    this.layoutAll();
  }
}
