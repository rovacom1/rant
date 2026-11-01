// Mahalle arazisi (docs/TASARIM.md §13): kuşbakışı arazi resminin üstünde kodla çizilen 6x6 arsa, zar yüzlü satır ve
// sütun başlıkları, piyonlar ve zıplama; arsa penceresi, arsa seçme istemi, torpil ve gecekondu düğmesi.
// gameview.js klasik tahtanın yerine bunu kurar (Arazi: cells, update, placePop). Geometri arazigeom.js'te (DOM yok);
// piyonlar (board.js Tokens, zıplama dahil) ve telefon kamerası araziyi tahta görünümü sözleşmesiyle tanır (boardview.js araziView).
// Arsa resmi asla esnemez: bina kutusuna oranını koruyarak, tabanı yere oturarak sığar.
import * as E from '../engine/index.js';
import { html, raw } from './dom.js';
import { ic, money } from './icons.js';
import { pawn } from './pawns.js';
import { deed } from './deed.js';
import { play } from './sound.js';
import { app, act } from './state.js';
import { buildFx } from './boardfx.js';
import { impact } from './fx.js';
import { layout, cellRect, headRect, SIDE } from './arazigeom.js';

const I = (name, cls = '') => raw(ic(name, cls));
const M = (n, sign = false) => raw(money(n, sign));
const dark = () => document.body.classList.contains('dark');

export const LAND_SRC = { light: 'assets/mahalle/arazi-acik.webp', dark: 'assets/mahalle/arazi-koyu.webp' };
const PARK = 'assets/mahalle/park.webp';
const AVM = 'assets/mahalle/avm.webp';
const TORPIL = 'assets/mahalle/torpil.webp';

const zoneOf = (v, sq) => E.boardOf(v).groups[E.boardOf(v).squares[sq].group];

// Arsadaki resim: park, AVM, gecekondu (bölge setinin k0 resmi) ya da katlar kadar bina (üstü kaçaksa çirkin).
export function plotArt(v, sq) {
  const ps = v.props[sq];
  const g = zoneOf(v, sq).bina;
  if (ps.park) return PARK;
  if (ps.avm) return AVM;
  if (ps.gk) return `assets/bina/${g}/k0.png`;
  const L = ps.kat + ps.kacak;
  if (L <= 0) return null;
  return `assets/bina/${g}/${ps.kacak || ps.affed ? `k${L - 1}` : L}.png`;
}

// Zar yüzü (başlıklar): 3x3 noktalı küçük kare, yazısız.
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const dieFace = (n) => `<span class="dface">${[...Array(9).keys()].map((k) => `<i${PIPS[n].includes(k) ? '' : ' class="no"'}></i>`).join('')}</span>`;

// ---------- arazi ----------

export class Arazi {
  constructor(board) {
    this.board = board;
    this.L = null;
    this.listeners = [];
    board.classList.add('mh');
    const B = E.boardOf({ mode: 'mahalle' });
    const heads = [];
    for (let k = 1; k <= SIDE; k++) heads.push(`<span class="dhead" data-h="c${k}" aria-hidden="true">${dieFace(k)}</span>`, `<span class="dhead" data-h="r${k}" aria-hidden="true">${dieFace(k)}</span>`);
    const plots = B.squares.map((s, i) => `<div class="plot z-${s.group}" data-act="square" data-sq="${i}" tabindex="0" role="button" aria-label="${s.name}" style="--gc:${B.groups[s.group].color}"><span class="tint"></span><span class="bld"><img alt="" draggable="false" hidden></span><span class="strip"></span></div>`);
    board.insertAdjacentHTML('afterbegin', `<div class="arazi-bg" aria-hidden="true"><img alt="" draggable="false" src="${dark() ? LAND_SRC.dark : LAND_SRC.light}"></div>${heads.join('')}${plots.join('')}`);
    this.bg = board.querySelector('.arazi-bg');
    this.heads = [...board.querySelectorAll('.dhead')];
    this.cells = [...board.querySelectorAll('.plot')];
    new ResizeObserver(() => this.layout()).observe(board);
  }

  // Tahtanın ortası (istem, zar) tahtanın içindeyse arazinin sağında dar sütun; telefon düzeninde tahtanın dışında.
  hasPanel() {
    return !!this.board.querySelector(':scope > .center');
  }

  layout() {
    const W = this.board.clientWidth;
    const H = this.board.clientHeight;
    if (!W || !H) return;
    const panel = this.hasPanel();
    const L = layout(W, H, panel);
    this.L = L;
    this.panel = panel;
    const put = (el, r) => Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    put(this.bg, { x: L.bg.x, y: L.bg.y, w: L.bg.size, h: L.bg.size });
    this.cells.forEach((el, i) => put(el, cellRect(L, i)));
    for (const h of this.heads) {
      const isRow = h.dataset.h[0] === 'r';
      h.hidden = !L.head;
      if (L.head) put(h, headRect(L, Number(h.dataset.h.slice(1)), isRow));
    }
    const st = this.board.style;
    st.setProperty('--cell', `${L.cell}px`);
    if (L.center) {
      st.setProperty('--mx', `${L.center.x}px`);
      st.setProperty('--my', `${L.center.y}px`);
      st.setProperty('--mw', `${L.center.w}px`);
      st.setProperty('--mh', `${L.center.h}px`);
    }
    for (const fn of this.listeners) fn(L);
    return L;
  }

  // o: { highlight, pick (parlayacak kareler: kart hedefi), open, turn: { sq, color } }. Zar atıldıysa zarın gösterdiği
  // arsalar da parlar: sıra sendeyse seçilir (pick), değilse herkes ne seçebileceğini görür (cand).
  update(v, o = {}) {
    if (this.hasPanel() !== this.panel) this.layout();
    const src = dark() ? LAND_SRC.dark : LAND_SRC.light;
    const img = this.bg.firstElementChild;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    const t = v.turn;
    const cands = v.phase === 'play' && t && t.step === 'choose' && !v.pending && !o.pick ? E.moveOptions(v) : [];
    const mine = !!t && t.p === v.you;
    const pick = o.pick || (mine && cands.length ? cands : null);
    this.board.classList.toggle('picking', !!pick);
    const B = E.boardOf(v);
    this.cells.forEach((el, i) => {
      const ps = v.props[i];
      const owner = ps.owner === null ? null : v.players[ps.owner];
      el.classList.toggle('hl', o.highlight === i);
      el.classList.toggle('pick', !!pick && pick.includes(i));
      el.classList.toggle('cand', !mine && cands.includes(i));
      el.classList.toggle('open', o.open === i);
      const turn = o.turn && o.turn.sq === i;
      el.classList.toggle('turnsq', !!turn);
      if (turn) el.style.setProperty('--tc', o.turn.color);
      el.classList.toggle('owned', !!owner);
      el.style.setProperty('--pc', owner ? owner.color : '');
      el.classList.toggle('gk', !!ps.gk);
      el.classList.toggle('site', E.inSite(v, i));
      el.classList.toggle('mort', !!ps.ipotek);
      const art = plotArt(v, i);
      const bi = el.querySelector('.bld img');
      if (art && bi.getAttribute('src') !== art) bi.setAttribute('src', art);
      bi.hidden = !art;
      el.querySelector('.bld').classList.toggle('wide', !!(ps.park || ps.avm));
      setMark(el, 'ted', ps.tedbir > 0, 'tedbir');
      setMark(el, 'imort', !!ps.ipotek, 'ipotek');
      const what = ps.park ? 'park' : ps.avm ? 'AVM' : ps.gk ? `gecekondu, ${v.players[ps.gk.p].name}` : E.level(ps) ? `${E.level(ps)} kat${ps.kacak ? ', üstü kaçak' : ''}` : '';
      const label = [B.squares[i].name, B.groups[B.squares[i].group].name, owner ? `sahibi ${owner.name}` : 'sahipsiz', what, ps.ipotek ? 'ipotekli' : ''];
      el.setAttribute('aria-label', label.filter(Boolean).join(', '));
    });
  }

  // Arsa penceresi masaüstünde tahtanın ortasının (sağ sütun) yerinde açılır, arsaları kapatmaz.
  placePop(pop) {
    const L = this.L;
    if (!L || !L.center || pop.parentElement !== this.board) return;
    Object.assign(pop.style, { left: `${L.center.x}px`, top: `${L.center.y}px`, width: `${L.center.w}px`, maxHeight: `${L.center.h}px` });
  }
}

function setMark(el, cls, on, name) {
  const cur = el.querySelector(`.${cls}`);
  if (on && !cur) el.insertAdjacentHTML('beforeend', `<span class="mk ${cls}">${ic(name)}</span>`);
  else if (!on && cur) cur.remove();
}

// ---------- arsa penceresi ----------

const num = (x) => x.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
// Kira çarpanlarının simgesi ve adı (ipucu). Resimli olanlar arsadaki resmin küçüğü.
const EFFECT = {
  kiyi: { icon: 'wave', name: 'Kıyı' },
  site: { icon: 'star', name: 'Site: 2x2 blok, hepsi katlı' },
  blok: { icon: 'house', name: 'Blok: iki komşu arsa senin' },
  park: { img: PARK, name: 'Park komşusu' },
  gecekondu: { img: 'assets/bina/corum/k0.png', name: 'Gecekondu komşusu' },
  metro: { icon: 'up', name: 'Metro Müjdesi' },
  turizm: { icon: 'sun', name: 'Turizm Sezonu' },
  kiraTavani: { icon: 'down', name: 'Kira tavanı' },
  kiraArtisi: { icon: 'up', name: 'Kira artışı' },
  iflas: { icon: 'iflas', name: 'Son kalan: kiralar artıyor' },
};
const fxIcon = (e) => (e.img ? html`<img class="fxi" src="${e.img}" alt="">` : I(e.icon));
const chip = (e, text, cls = '') => html`<span class="fxchip ${cls}" data-tip="${e.name}" tabindex="0" aria-label="${e.name} ${text}">${fxIcon(e)}<b class="num">${text}</b></span>`;

// Kira ve işleyen etkiler: büyük kira, altında çarpan çipleri (simge ve x1,5; adı ipucunda).
function rentHTML(v, sq) {
  const r = E.rentBreakdown(v, sq);
  const ps = v.props[sq];
  if (r.none === 'park') return html`<span class="note"><img class="fxi" src="${PARK}" alt="">Park kira almaz; dört komşusunun kirası +%50.</span>`;
  if (r.none === 'sahipsiz') return '';
  const chips = r.items.map((x) => chip(EFFECT[x.key], `×${num(x.mult)}`, x.mult < 1 ? 'neg' : ''));
  const cuts = r.none ? [] : E.avmCuts(v, sq, r.amount);
  if (cuts.length) chips.push(chip({ img: AVM, name: 'AVM payı: çevredeki AVM kiradan pay alır' }, `−%${cuts.length * 20}`, 'neg'));
  if (ps.avm) chips.push(chip({ img: AVM, name: 'AVM: çevredeki 8 arsanın kirasından %20 pay' }, '+%20'));
  const none = r.none === 'ipotek' ? 'İpotekli: kira yok' : r.none === 'tedbir' ? `İhtiyati tedbir: ${ps.tedbir} sıra kira yok` : '';
  return html`<div class="mh-rent">${none ? html`<span class="note">${I(r.none === 'ipotek' ? 'ipotek' : 'tedbir')}${none}</span>` : html`<span class="muted">Kira</span><span class="h22 num">${M(r.amount)}</span>`}${chips.length ? html`<div class="fxrow">${chips}</div>` : ''}</div>`;
}

// o: { manage (sıra sende, işlem yapılabilir) }
export function plotPopHTML(v, sq, o = {}) {
  const me = v.you;
  const ps = v.props[sq];
  const B = E.boardOf(v);
  const z = B.groups[B.squares[sq].group];
  const owner = ps.owner === null ? null : v.players[ps.owner];
  const close = html`<button class="btn S sq ton" data-act="popClose" aria-label="Kapat">${I('close')}</button>`;
  const head = owner
    ? html`<div class="row" style="gap:8px">${raw(pawn(owner.avatar, owner.color, 24))}<span class="h16">${ps.owner === me ? 'Senin' : owner.name}</span><span class="grow"></span>${close}</div>`
    : html`<div class="row" style="gap:8px"><span class="h16">Sahipsiz</span><span class="grow"></span>${close}</div>`;
  const L = E.level(ps);
  const card = deed(v, sq, { w: 250, ladder: true, level: owner ? (ps.avm ? 4 : L) : undefined });
  const out = [head, card, rentHTML(v, sq)];
  if (ps.gk) {
    const g = v.players[ps.gk.p];
    const fee = E.evictCost(v, sq, me);
    out.push(html`<span class="note"><img class="fxi" src="${plotArt(v, sq)}" alt="">${g.id === v.players[me]?.id ? 'Senin gecekondun' : html`Gecekondu: ${g.name}`}${fee ? html`<span class="grow"></span><span data-tip="Arsayı alan kondurana öder">Tahliye ${M(fee)}</span>` : ''}</span>`);
  }
  if (ps.owner !== me || me < 0) return html`<div class="mh-pop">${out}</div>`;
  const manage = !!o.manage;
  const legal = E.buildBlock(v, me, sq, false);
  const kacak = E.buildBlock(v, me, sq, true);
  const dis = (block) => (!manage || block ? raw(`disabled data-tip="${block || 'Sıra sendeyken'}"`) : '');
  const acts = [];
  if (!ps.park && !ps.avm) {
    acts.push(html`<button class="btn pri full" data-act="build" data-sq="${sq}" ${dis(legal)}>${I('house')}Kat dik ${M(E.katCost(v, sq))}</button>`);
    acts.push(html`<button class="btn sec full" data-act="buildKacak" data-sq="${sq}" ${dis(kacak)}>${I('kacak')}Kaçak kat ${M(E.kacakCost(v, sq))}</button>`);
  }
  if (!ps.park && !ps.avm && L === 0) {
    const b = E.parkBlock(v, me, sq);
    acts.push(html`<button class="btn sec full" data-act="park" data-sq="${sq}" ${dis(b)}><img class="fxi" src="${PARK}" alt="">Park ${M(E.katCost(v, sq))}</button>`);
  }
  if (!ps.avm && ps.kat === 4) {
    const b = E.avmBlock(v, me, sq);
    acts.push(html`<button class="btn sec full" data-act="avm" data-sq="${sq}" ${dis(b)}><img class="fxi" src="${AVM}" alt="">AVM ${M(E.katCost(v, sq))}</button>`);
  }
  const sell = L > 0 ? html`<button class="btn ton flex" data-act="sellFloor" data-sq="${sq}" ${manage ? '' : 'disabled'}>Kat sat ${M(Math.round(E.katValue(v, sq) / (ps.kacak ? 20 : 10)) * 5, true)}</button>` : '';
  acts.push(html`<div class="row" style="gap:6px">${sell}${ps.park ? '' : mortBtn(v, sq, manage)}</div>`);
  // En sık engel (piyonun yanında değil, komşu arsa yok) bir satırla görünür; öbürleri düğmenin ipucunda.
  const why = manage && legal && !ps.park && !ps.avm && L < 4 ? legal : '';
  if (why) acts.push(html`<span class="muted small">${why}</span>`);
  if (!manage) acts.push(html`<span class="note">${I('timer')}İnşaat ve ipotek sıra sendeyken.</span>`);
  return html`<div class="mh-pop">${out}<div class="col" style="gap:8px">${acts}</div></div>`;
}

function mortBtn(v, sq, manage) {
  const ps = v.props[sq];
  if (ps.ipotek) {
    const cost = E.unmortgageCost(v, sq);
    const poor = v.players[v.you].cash < cost;
    return html`<button class="btn ton flex" data-act="unmortgage" data-sq="${sq}" ${!manage || poor ? 'disabled' : ''} data-tip="${poor ? 'Paran yetmiyor.' : ''}">${I('ipotek')}Kaldır ${M(-cost)}</button>`;
  }
  const floors = E.level(ps) > 0;
  return html`<button class="btn ton flex" data-act="mortgage" data-sq="${sq}" ${!manage || floors ? 'disabled' : ''} data-tip="${floors ? 'Önce katları sat.' : ''}">${I('ipotek')}İpotek ${M(E.mortgageValue(v, sq), true)}</button>`;
}

// ---------- istemler ----------

// Zar atıldı, sıra sende: zarın gösterdiği arsalardan birini seç (tahtada parlar). Torpil ve Kestirme burada.
// timer: gameview'in süre çubuğu.
export function choosePromptHTML(v, timer) {
  const me = v.you;
  const t = v.turn;
  const pl = v.players[me];
  const opts = E.moveOptions(v);
  const B = E.boardOf(v);
  const [a, b] = t.dice;
  const pickBtns = a === b
    ? html`<span class="hint">${I('target')}${a}. satırda ya da sütunda bir arsa seç</span><span class="muted small">Çift: +1 kart</span>`
    : html`<div class="col" style="gap:8px;width:100%">${opts.map((q, k) => html`<button class="btn L ${k === 0 ? 'pri' : 'sec'} full" data-act="pickPlot" data-sq="${q}" ${k === 0 ? raw('data-primary') : ''}>${B.squares[q].name}</button>`)}</div>`;
  const tor = torpilHTML(v);
  const kes = !t.hamle && pl.hand.find((u) => E.cardId(u) === 'kestirme');
  const kesRow = kes
    ? html`<div class="mh-kes" data-card="kestirme"><span class="row muted small" style="gap:4px">${I('fork')}Kestirme</span>${[0, 1].map((d) => html`<button class="btn S sec" data-act="kestirme" data-die="${d}" data-uid="${kes}" aria-label="${d + 1}. zarı yeniden at">${raw(dieFace(t.dice[d]))}${I('refresh')}</button>`)}</div>`
    : '';
  return html`<div class="stagebox mh-choose"><div class="who">${I('dice')}Arsanı seç</div>${pickBtns}${tor}${kesRow}<div style="width:100%">${timer}</div></div>`;
}

// Torpil jetonu: bir zarı 1 artır ya da azalt (1-6), sırada en çok bir kez. Jeton resmi ve kaç tane olduğu.
function torpilHTML(v) {
  const t = v.turn;
  const n = v.players[v.you].torpil || 0;
  if (!n && !t.torpil) return '';
  const used = !!t.torpil;
  const btn = (die, delta) => {
    const val = t.dice[die] + delta;
    const ok = !used && n > 0 && val >= 1 && val <= 6;
    return html`<button class="btn S sec sq" data-act="torpil" data-die="${die}" data-delta="${delta}" ${ok ? '' : 'disabled'} aria-label="${die + 1}. zar ${delta > 0 ? 'bir artır' : 'bir azalt'}">${I(delta > 0 ? 'plus' : 'minus')}</button>`;
  };
  return html`<div class="mh-torpil ${used ? 'used' : ''}"><span class="tjet" data-tip="Torpil: bir zarı 1 oynat" tabindex="0" aria-label="Torpil jetonu: ${n}"><img src="${TORPIL}" alt=""><b class="num">${n}</b></span>
    ${[0, 1].map((d) => html`<span class="tdie">${btn(d, -1)}${raw(dieFace(t.dice[d]))}${btn(d, 1)}</span>`)}</div>`;
}

// Satın alma isteminde üçüncü yol: gecekondu kondur. Gecekondulu arsada tahliye bedeli de yazar.
export function buyExtraHTML(v, pd) {
  const me = v.you;
  const block = E.gecekonduBlock(v, me, pd.sq);
  const fee = E.evictCost(v, pd.sq, me);
  const art = `assets/bina/${zoneOf(v, pd.sq).bina}/k0.png`;
  const gk = v.props[pd.sq].gk ? '' : html`<button class="btn sec full" data-act="gecekondu" ${block ? raw(`disabled data-tip="${block}"`) : ''}><img class="fxi" src="${art}" alt="">Gecekondu ${M(E.gecekonduCost(v, pd.sq))}</button>`;
  return html`${gk}${fee ? html`<span class="note"><img class="fxi" src="${art}" alt="">Tahliye bedeli ${M(fee)} da ödenir</span>` : ''}`;
}

// ---------- hamleler ve olaylar ----------

export const ACTIONS = {
  pickPlot: (el) => act({ type: 'pick', sq: Number(el.dataset.sq) }),
  torpil: (el) => act({ type: 'torpil', die: Number(el.dataset.die), delta: Number(el.dataset.delta) }),
  park: (el) => act({ type: 'park', sq: Number(el.dataset.sq) }),
  avm: (el) => act({ type: 'avm', sq: Number(el.dataset.sq) }),
  gecekondu: () => act({ type: 'gecekondu' }),
};

// Arsaya tıklama: sıra sendeyse ve zarın gösterdiği arsaysa seçer (true), değilse pencere açılır (false).
export function squareClick(v, sq) {
  if (!v || !E.isMahalle(v) || app.ui.pick) return false;
  const t = v.turn;
  if (v.phase !== 'play' || !t || t.p !== v.you || t.step !== 'choose' || v.pending) return false;
  if (!E.moveOptions(v).includes(sq)) return false;
  act({ type: 'pick', sq });
  return true;
}

// Mahalle'ye özgü olayların tahta efekti: park, AVM ve gecekondu kat gibi yukarıdan iner.
export function araziEvent(ev, { live, post, board, cells, me }) {
  if (!['park', 'avm', 'gecekondu'].includes(ev.type)) return;
  if (!live) return play('build');
  post.push(() => buildFx(board, cells[ev.sq]));
  post.push(() => setTimeout(() => board.isConnected && impact('medium', board, { me: ev.p === me }), 440));
}
