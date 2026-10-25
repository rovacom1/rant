// Oyun ekranı: tahta, orta alan, yan panel, pencereler ve olay efektleri.
import * as E from '../engine/index.js';
import { html, raw, esc, $, setHTML, sleep } from './dom.js';
import { play, isMuted, getAudio, startMusic, stopMusic } from './sound.js';
import { Hand, cardFace, flyToCenter } from './hand.js';
import { isNotifyOn, notifySupported } from './notify.js';
import { buildBoard, updateBoard, Tokens, Dice, inkFor, cellPos } from './board.js';
import { app, act, send, isHost } from './state.js';
import { RULES_HTML } from './rules.js';
import { initTips } from './tip.js';
import { SPEEDS } from '../net/host.js';
import { isBoardPickable, pickSquares, tapuSquares } from './pick.js';
import { coinFlights, arcPeak, COIN_GAP } from './coins.js';
import { worthLines } from './chart.js';

const { BOARD, CARDS, GROUPS, GROUP_SQUARES, GUNDEM, HEDEF, fmt, cardId } = E;
const N = BOARD.length;

let els = null;
let cells = null;
let tokens = null;
let dice = null;
let hand = null;
let animating = false;

// ---------- iskelet ----------


export function mountGame(root) {
  root.innerHTML = `
  <div class="game">
    <header class="topbar">
      <div class="mini-logo">RANT</div>
      <div class="stat" data-tip="Kaçıncı turdayız (tur sayısıyla bitişte: toplam tur)">Tur<b id="tRound"></b></div>
      <div class="stat hidden" id="tTarget" data-tip="Biri bu değere ulaşınca o tur biter, Seçim Günü gelir">Hedef<b></b></div>
      <div class="stat" data-tip="Fiyat ve kiraların çarpanı: 115 = her şey %15 pahalı. Enflasyon gündemiyle artar">Endeks<b id="tIndex"></b></div>
      <div class="stat" data-tip="Başlangıç Noktası'ndan geçince ya da gelince alınan para">Maaş<b id="tSalary"></b></div>
      <div class="spacer"></div>
      <span class="conn" id="tConn"></span>
      <button class="iconbtn" data-act="copyLink" id="tCode" title="Davet linkini kopyala"></button>
      <button class="iconbtn" data-act="rules">❓ Kurallar</button>
      <button class="iconbtn" data-act="theme" id="tTheme" title="Karanlık / aydınlık tahta"></button>
      <button class="iconbtn" data-act="audio" id="tAudio" title="Müzik ve ses ayarları"></button>
      <button class="iconbtn${notifySupported() ? '' : ' hidden'}" data-act="notify" id="tNotify" title="Sekme arkadayken sıra sana gelince masaüstü bildirimi"></button>
      <button class="iconbtn" data-act="leave">Çık</button>
    </header>
    <main class="table">
      <section class="board-wrap">
        <div class="board" id="board">
          <div class="board-center">
            <div id="gundem"></div>
            <div class="prompt" id="prompt"></div>
            <div class="dice off" id="dice"></div>
            <div class="board-feed" id="feed" data-act="history" title="Tüm olaylar"></div>
          </div>
          <div class="tokens" id="tokens"></div>
          <div id="pop"></div>
        </div>
        <div class="hand-dock" id="handDock"><div class="quest hidden" id="quest"></div><div class="deck" id="deck"></div></div>
      </section>
      <aside class="side">
        <div class="seats-panel" id="players"></div>
      </aside>
    </main>
  </div>
  <div id="modal"></div><div class="toasts" id="toasts"></div><div id="stage"></div><div id="audioPop"></div>`;
  const g = (id) => document.getElementById(id);
  els = {
    round: g('tRound'), target: g('tTarget'), index: g('tIndex'), salary: g('tSalary'), conn: g('tConn'), code: g('tCode'), audio: g('tAudio'), notify: g('tNotify'),
    board: g('board'), gundem: g('gundem'), prompt: g('prompt'), dice: g('dice'), tokens: g('tokens'), pop: g('pop'),
    players: g('players'), feed: g('feed'), handDock: g('handDock'), quest: g('quest'), deck: g('deck'), audioPop: g('audioPop'), theme: g('tTheme'),
    modal: g('modal'), stage: g('stage'),
  };
  cells = buildBoard(els.board);
  tokens = new Tokens(els.tokens, cells);
  dice = new Dice(els.dice);
  hand = new Hand(els.handDock);
  initTips();
  startMusic();
}

export const gameMounted = () => !!els && document.body.contains(els.board);
export const unmountGame = () => {
  els = null;
  stopMusic();
};

// ---------- yardımcılar ----------

const P = (v, i) => v.players[i];
const who = (v, i) => (i === v.you ? 'Sen' : P(v, i).name);
const av = (pl, cls = '') => html`<span class="av ${cls}" style="--c:${pl.color}">${pl.avatar}</span>`;
const cityOf = (sq) => (BOARD[sq].group ? GROUPS[BOARD[sq].group].name : E.TRANSPORT_LABEL[BOARD[sq].mode]);
const sqChip = (sq) => html`<span class="chip">${BOARD[sq].name}<small class="muted">${cityOf(sq)}</small></span>`;
// Endeks ve şehir çarpanıyla ölçeklenmiş tutar (kira tablosu için).
const scaled = (v, sq, x) => Math.round((x * (v.index / 100) * (BOARD[sq].group ? v.groupMult[BOARD[sq].group] || 1 : 1)) / 5) * 5;
const destOf = (v, steps, backward) => (v.players[v.you].pos + (backward ? -steps : steps) + N * 2) % N;
const myTurnFree = (v) => v.phase === 'play' && !v.pending && v.turn && v.turn.p === v.you;
export const canManage = (v) => myTurnFree(v) && ['preroll', 'free'].includes(v.turn.step);

function canPlay(v, uid) {
  const id = cardId(uid);
  const c = CARDS[id];
  if (!c || c.type !== 'hamle' || v.phase !== 'play' || !v.turn || v.turn.p !== v.you || v.turn.hamle) return false;
  const pd = v.pending;
  if (c.when === 'buy') {
    if (!(pd && pd.type === 'buy' && pd.p === v.you)) return false;
  } else {
    if (pd) return false;
    if (c.when === 'preroll' && v.turn.step !== 'preroll') return false;
    if (c.when === 'choose' && v.turn.step !== 'choose') return false;
    if (!c.when && !['preroll', 'free'].includes(v.turn.step)) return false;
  }
  return E.cardTargets(v, v.you, id).length > 0;
}

// Oyun hızı çarpanı (lobi ayarı); animasyon süreleri ev sahibinin beklemesiyle aynı oranda uzar.
const spd = () => SPEEDS[app.lobby?.config?.speed] || 1;
const hostNow = () => Date.now() + (app.clockOffset || 0);

// Süre çubuğu: toplam süre (span) ev sahibinden gelir, işaretleme her çizimde aynı kalır, çubuk zıplamaz.
function timerHTML(v, ids) {
  const dl = app.meta && app.meta.deadlines;
  if (!dl) return '';
  const ds = ids.map((i) => dl[P(v, i)?.id]).filter((d) => d && d.at);
  if (!ds.length) return '';
  const d = ds.reduce((a, b) => (b.at < a.at ? b : a));
  return html`<div class="timer" data-deadline="${d.at}" data-span="${d.span}"><i></i></div><div class="muted" style="font-size:12px" data-countdown="${d.at}"></div>`;
}

// ---------- üst çubuk ----------

export { canPlay };

const MOD_LABEL = {
  turizm: '🏖️ Turizm', ulasimZam: '🎫 Ulaşım x2', kiraTavani: '🧯 Kira yarı', kiraArtisi: '🔥 Kira x1,5', grev: '🪧 Maaş yok',
  durgunluk: '🥶 Kat yok', kampanya: '🏷️ Kat yarı fiyat', faizIndirimi: '📉 İpotek indirimi', zabitaIzinde: '🏝️ Zabıta izinde',
};

function updateTopbar(v) {
  const goal = v.config.targetScore;
  els.round.textContent = v.round ? (goal ? `${v.round}` : `${v.round}/${v.config.maxRounds}`) : '-';
  els.target.classList.toggle('hidden', !goal);
  if (goal) els.target.lastElementChild.textContent = fmt(goal);
  els.index.textContent = v.index;
  els.salary.textContent = fmt(v.salary);
  els.code.textContent = app.mode === 'local' ? '🤖 Yerel oyun' : `🔗 Oda ${app.code}`;
  els.audio.textContent = isMuted() ? '🔇' : '🔊';
  els.theme.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  els.notify.textContent = isNotifyOn() ? '🔔' : '🔕';
  const st = app.status;
  els.conn.textContent = st === 'reconnecting' ? '⚠ Bağlantı koptu, yeniden bağlanılıyor…' : st === 'online' ? '● Bağlı' : '';
  els.conn.classList.toggle('bad', st === 'reconnecting');
}

// ---------- orta alan ----------

const ringHTML = (p, big, small, tip = '') => html`<div class="ring" style="--p:${p}" data-tip="${tip}"><div><b>${big}</b><span>${small}</span></div></div>`;

// Bitişe ne kaldı: tur sayısında kalan tur, değer hedefinde en zengin oyuncunun hedefe yakınlığı.
function progressRing(v) {
  const max = v.config.maxRounds;
  const goal = v.config.targetScore;
  if (v.finalRound || (v.round && v.round >= max)) return ringHTML(100, 'SON', 'TUR', 'Bu tur bitince Seçim Günü');
  if (goal) {
    const worth = v.players.map((_, p) => E.netWorth(v, p));
    const lead = worth.indexOf(Math.max(...worth));
    const pct = Math.min(99, Math.round((worth[lead] / goal) * 100));
    return ringHTML(pct, `%${pct}`, 'HEDEFE', `En zengin ${P(v, lead).name}: değeri ${fmt(worth[lead])} / ${fmt(goal)}`);
  }
  return v.round ? ringHTML(Math.round((v.round / max) * 100), max - v.round, 'TUR KALDI', `${max} turun ${v.round}. turu`) : ringHTML(0, max, 'TUR');
}

function gundemHTML(v) {
  const max = v.config.maxRounds;
  const goal = v.config.targetScore ? `İlk ${fmt(v.config.targetScore)} değer turu bitirir` : '';
  const ring = progressRing(v);
  if (!v.gundem) {
    const left = max - v.round;
    const road = v.finalRound || !left ? 'Son tur: Seçim Günü geliyor' : goal || `Seçime ${left} tur var`;
    const t = v.round ? html`<div class="nb-k">${v.round}. TUR</div><div class="nb-t">${road}</div><div class="nb-x">Bu masada gündem kartları kapalı.</div>`
      : html`<div class="nb-k">SEÇİM YOLU</div><div class="nb-t">${goal || `Seçime ${max} tur var`}</div><div class="nb-x">Herkes gizli hedefini seçiyor.</div>`;
    return html`<div class="news-bar"><div class="nb-ic">🗳️</div><div>${t}</div>${ring}</div>`;
  }
  const g = GUNDEM[v.gundem.id];
  const modTip = (m) => Object.values(GUNDEM).find((x) => x.mod === m)?.text || '';
  const mods = Object.keys(v.mods).map((m) => html`<span class="chip" data-tip="${modTip(m)}">${MOD_LABEL[m] || m}</span>`);
  return html`<div class="news-bar"><div class="nb-ic">${g.icon}</div>
    <div><div class="nb-k">GÜNDEM · ${v.round}. TUR</div><div class="nb-t">${g.name}</div><div class="nb-x">${g.text}${v.gundem.detail ? ` ${v.gundem.detail}` : ''}</div>${mods.length ? html`<div class="nb-mods">${mods}</div>` : ''}</div>
    ${ring}</div>`;
}

const SPECIAL_INFO = {
  start: 'Buradan geçince ya da buraya gelince maaş alırsın.',
  chance: 'Buraya gelince 2 Hamle kartı çekersin.',
  surpriz: 'Rastgele bir sürpriz hemen uygulanır: miras, ceza, düğün, ışınlanma, kapkaç…',
  tapu: 'Tahtadaki sahipsiz herhangi bir arsayı fiyatına alabilirsin.',
  cay: 'Diğer herkes sana çay parası öder.',
  zabita: 'Kaçak katı olan bir rakibi ihbar edersin: kaçakları yıkılır.',
};

const TRANSPORT_NOTE = { air: 'Her yeni havalimanı kirayı ikiye katlar.', rail: 'Kira elindeki gar sayısıyla orantılı artar.' };

// Kareye tıklayınca açılan küçük bilgi penceresi: kaç katta kaç kira.
function popHTML(v, sq) {
  const s = BOARD[sq];
  const ps = v.props[sq];
  const close = html`<button class="x" data-act="popClose" title="Kapat">✕</button>`;
  if (!ps) return html`<div class="ph" style="--pc:#34405f;--ink:#fff"><b>${s.icon} ${s.name}</b>${close}</div><div class="pn" style="padding-top:9px">${SPECIAL_INFO[s.kind]}</div>`;
  const owner = ps.owner === null ? null : P(v, ps.owner);
  const head = owner ? `--pc:${owner.color};--ink:${inkFor(owner.color)}` : '--pc:#8a8d96;--ink:#fff';
  let rows;
  if (s.kind === 'prop') {
    const L = E.level(ps);
    const full = owner && E.ownsGroup(v, ps.owner, s.group);
    const list = [[full ? 'Arsa (tam set ★)' : 'Arsa', s.rents[0] * (full ? 2 : 1)], ['1 kat', s.rents[1]], ['2 kat', s.rents[2]], ['3 kat', s.rents[3]], ['4 kat', s.rents[4]]];
    // Set tamamlanmadan katların kirası yarıdır; tablo bu mülkün şu anki durumuna göre.
    rows = list.map(([k, x], l) => html`<tr class="${owner && L === l ? 'cur' : ''}"><td>${k}</td><td>${fmt(Math.max(5, scaled(v, sq, l > 0 && !full ? x / 2 : x)))}</td></tr>`);
  } else {
    const n = owner ? E.transportCount(v, ps.owner, s.mode) : 0;
    const label = E.TRANSPORT_LABEL[s.mode].toLowerCase();
    rows = E.TRANSPORT_RENT[s.mode].slice(1).map((x, l) => html`<tr class="${n === l + 1 ? 'cur' : ''}"><td>${l + 1} ${label}</td><td>${fmt(E.money(v, x))}</td></tr>`);
  }
  const status = owner
    ? html`<span class="dot" style="--c:${owner.color}"></span> ${owner.name}${ps.ipotek ? ' · ipotekli' : ''}${ps.tedbir ? ` · tedbir ${ps.tedbir} tur` : ''}`
    : html`Sahipsiz · fiyatı <b>${fmt(E.price(v, sq))}</b>`;
  const note = s.kind === 'prop' ? `Kat ${fmt(E.katCost(v, sq))}, kaçak kat ${fmt(E.kacakCost(v, sq))}. Kat sayısına kaçak kat da girer.${owner && !E.ownsGroup(v, ps.owner, s.group) ? ' Set tamamlanmadığı için kat kiraları yarı.' : ''}` : TRANSPORT_NOTE[s.mode];
  const legend = [];
  if (s.kind === 'prop') {
    if (ps.kat || ps.kacak) legend.push(`Şu an: ${[ps.kat ? `${ps.kat} yasal kat 🏠` : '', ps.kacak ? '1 kaçak kat 🚧' : ''].filter(Boolean).join(' + ')}`);
    legend.push('🏠 Yasal kat: şehrin tüm mülkleri sende olmalı.');
    legend.push('🚧 Kaçak kat: set istemez, yarı fiyat; İhbar, Zabıta ve Belediye operasyonu yıkar.');
    legend.push('★ Tam set: şehrin tümü tek kişide, arsa kirası 2 katı.');
  }
  if (ps.ipotek) legend.push(`🔒 İpotekli: kira alınmaz. Kaldırmak ${fmt(E.unmortgageCost(v, sq))}.`);
  else if (owner) legend.push(`İpotek değeri ${fmt(E.mortgageValue(v, sq))}.`);
  if (ps.tedbir) legend.push(`⚖️ İhtiyati tedbir: ${ps.tedbir} tur kira yok, kat dikilmez.`);
  const acts = [...propActions(v, sq)];
  if (tapuSquares(v)?.includes(sq)) acts.push(html`<button class="btn tiny turq" data-act="tapuBuy" data-sq="${sq}">📜 Tapudan al</button>`);
  return html`<div class="ph" style="${head}"><b>${s.name}</b><span>${cityOf(sq)}</span>${close}</div>
    <div class="po">${status}</div><table>${rows}</table><div class="pn">${note}</div>${legend.length ? html`<ul class="pl">${legend.map((x) => html`<li>${x}</li>`)}</ul>` : ''}${acts.length ? html`<div class="pa">${acts}</div>` : ''}`;
}

function renderPop(v) {
  const sq = app.ui.popSq;
  if (sq === null || sq === undefined) {
    setHTML(els.pop, '');
    els.pop.className = '';
    return;
  }
  setHTML(els.pop, popHTML(v, sq));
  els.pop.className = 'pop';
  const c = cells[sq];
  const pw = els.pop.offsetWidth;
  const ph = els.pop.offsetHeight;
  const bw = els.board.clientWidth;
  const bh = els.board.clientHeight;
  const side = cellPos(sq).side;
  // Pencere karenin tahta ortasına bakan tarafında açılır.
  const toward = (pos, size, len, total) => (pos < total / 2 ? pos + size + 6 : pos - len - 6);
  let x = c.offsetLeft + c.offsetWidth / 2 - pw / 2;
  let y = c.offsetTop + c.offsetHeight / 2 - ph / 2;
  if (side === 'b' || side === 't' || side === 'c') y = toward(c.offsetTop, c.offsetHeight, ph, bh);
  if (side === 'l' || side === 'r' || side === 'c') x = toward(c.offsetLeft, c.offsetWidth, pw, bw);
  els.pop.style.left = `${Math.max(6, Math.min(bw - pw - 6, x))}px`;
  els.pop.style.top = `${Math.max(6, Math.min(bh - ph - 6, y))}px`;
}

// Satın alma ve ihale istemi için sade kart: ad, şehir, temel kira, şehirdeki diğer sahipler.
function buyCard(v, sq) {
  const s = BOARD[sq];
  const others = s.group ? GROUP_SQUARES[s.group].filter((q) => q !== sq && v.props[q].owner !== null).map((q) => P(v, v.props[q].owner)) : [];
  const rent = s.kind === 'transport' ? E.money(v, E.TRANSPORT_RENT[s.mode][1]) : scaled(v, sq, s.rents[0]);
  const grows = s.kind === 'prop' ? ', katlarla artar' : s.mode === 'air' ? ', her yeni havalimanıyla 2 katı' : ', gar başına artar';
  return html`<div class="buycard"><div class="bn">${s.icon || ''} ${s.name}</div><div class="bc">${cityOf(sq)}</div>
    <div class="bp">Kira ${fmt(rent)}${grows}</div>
    ${others.length ? html`<div class="bo">Şehrin diğer sahipleri: ${others.map((o) => html`<span class="dot" style="--c:${o.color}" title="${o.name}"></span>`)}</div>` : ''}</div>`;
}

function hedefCard(id, act) {
  const h = HEDEF[id];
  return html`<button class="targets-btn bigcard" style="text-align:left;cursor:pointer;max-width:320px" data-act="${act}" data-id="${id}">
    <div class="ci">${h.icon}</div><div><div class="cn">${h.name}</div><div class="ct">${h.text}</div><div class="chip" style="margin-top:6px">+${h.bonus} puan</div></div></button>`;
}

function promptHTML(v) {
  const me = v.you;
  const pd = v.pending;
  if (v.phase === 'over') {
    const w = P(v, v.results.ranking[0]);
    return html`<div class="who">🏆 ${av(w)} ${w.name} kazandı!</div><p>Seçim Günü geldi, sandıklar açıldı.</p>
      <div class="row center"><button class="btn primary big" data-act="results">Sonuçları Gör</button>${isHost() ? html`<button class="btn turq" data-act="newGame">Yeni Oyun</button>` : ''}</div>`;
  }
  if (v.phase === 'setup') {
    if (me >= 0 && !pd.chosen[me]) {
      return html`<h3>Gizli hedefini seç</h3><p>Kimse göremez. Oyun sonunda tutarsa bonus puan alırsın.</p>
        <div class="row center">${P(v, me).hedefChoices.map((h) => hedefCard(h, 'hedef'))}</div>${timerHTML(v, [me])}`;
    }
    const rest = E.waitingFor(v).map((i) => P(v, i).name).join(', ');
    return html`<h3>Hedefler seçiliyor…</h3><p>Bekleniyor: ${rest}</p>${timerHTML(v, E.waitingFor(v))}`;
  }
  if (app.ui.pick) {
    const c = CARDS[cardId(app.ui.pick.uid)];
    const step = c.target === 'swap' ? (app.ui.swapMine === null ? ' 1) Vereceğin mülkü seç.' : ` 2) ${BOARD[app.ui.swapMine].name} karşılığı alacağın mülkü seç.`) : '';
    return html`<h3>${c.icon} ${c.name}</h3><p>Parlayan karelerden birine tıkla.${step}</p>
      <button class="btn" data-act="pickCancel">Vazgeç</button>${timerHTML(v, [me])}`;
  }
  if (pd) return pendingHTML(v, pd);
  const t = v.turn;
  const cur = P(v, t.p);
  if (t.p !== me) {
    const doing = { preroll: 'zar atmak üzere', choose: 'yolunu seçiyor', free: 'işlerini hallediyor' }[t.step];
    return html`<div class="who">${av(cur)} ${cur.name} ${doing}…</div>${timerHTML(v, [t.p])}`;
  }
  const pl = P(v, me);
  if (t.step === 'preroll') {
    return html`<h3>Sıra sende!</h3>${t.backward ? html`<p>↩️ Geri vitestesin, bu tur geri gideceksin.</p>` : ''}
      <button class="btn primary big" data-act="roll" data-primary>🎲 Zar At</button>${timerHTML(v, [me])}`;
  }
  if (t.step === 'choose') {
    const [a, b] = t.dice;
    const kes = pl.hand.find((u) => cardId(u) === 'kestirme');
    const opt = (steps, label, actName, extra = '') =>
      html`<button class="btn ${actName === 'moveSum' ? 'primary big' : 'gold'}" data-act="${actName}" ${raw(extra)}>${label}: ${steps} kare → ${BOARD[destOf(v, steps, t.backward)].name}</button>`;
    return html`<h3>Nereye gidiyorsun?</h3>
      <div class="row center">${opt(a + b, 'Toplam', 'moveSum', 'data-primary')}</div>
      ${kes ? html`<p>🛵 Kestirme kartınla zarlardan birini seçebilirsin:</p><div class="row center">${opt(a, '1. zar', 'kestirme', `data-die="0" data-uid="${kes}"`)}${opt(b, '2. zar', 'kestirme', `data-die="1" data-uid="${kes}"`)}</div>` : ''}${timerHTML(v, [me])}`;
  }
  // serbest evre
  if (pl.cash < 0) {
    return html`<h3>Borçtasın: ${fmt(pl.cash)}</h3><p>Sıranı bitirmeden borcunu kapat.</p>
      <div class="row center"><button class="btn primary big" data-act="settleDebt" data-primary>Borcu Kapat (otomatik)</button><button class="btn ghost" data-act="manage">Mülklerim</button></div>`;
  }
  const hints = [];
  if (!t.hamle && pl.hand.some((u) => canPlay(v, u))) hints.push('yeşil parlayan bir kartı yukarı sürükleyip ya da tıklayıp oynayabilir');
  if (E.propsOf(v, me).some((q) => !E.buildBlock(v, me, q, false) || !E.buildBlock(v, me, q, true))) hints.push('kat dikebilirsin');
  return html`<h3>${BOARD[pl.pos].icon || ''} ${BOARD[pl.pos].name}</h3>${hints.length ? html`<p>İstersen ${hints.join(' ya da ')}.</p>` : ''}
    <div class="row center"><button class="btn primary big" data-act="endTurn" data-primary>Turu Bitir ➜</button></div>${timerHTML(v, [me])}`;
}

function pendingHTML(v, pd) {
  const me = v.you;
  switch (pd.type) {
    case 'buy': {
      if (pd.p !== me) return html`<div class="who">${av(P(v, pd.p))} ${P(v, pd.p).name}</div><p>${BOARD[pd.sq].name} için karar veriyor: ${v.config.rules.ihale ? 'alacak mı, açık artırmaya mı çıkaracak?' : 'alacak mı?'}</p>${timerHTML(v, [pd.p])}`;
      const cost = E.price(v, pd.sq);
      const cash = P(v, me).cash;
      const paz = P(v, me).hand.find((u) => cardId(u) === 'pazarlik');
      return html`${buyCard(v, pd.sq)}
        <div class="row center"><button class="btn green big" data-act="buy" data-primary ${cash < cost ? 'disabled' : ''}>Satın Al ${fmt(cost)}</button>
        <button class="btn ghost" data-act="decline">${v.config.rules.ihale ? '🔨 Açık Artırmaya Çıkar' : 'Alma'}</button>
        ${paz && !v.turn.hamle && cash >= Math.round(cost / 10) * 5 ? html`<button class="btn gold" data-act="pazarlik" data-uid="${paz}">🤝 Pazarlık Ustası: ${fmt(Math.round(cost / 10) * 5)}</button>` : ''}</div>
        ${cash < cost ? html`<p class="reason">${v.config.rules.ihale ? 'Nakdin yetmiyor; açık artırmaya çıkarabilirsin.' : 'Nakdin yetmiyor.'}</p>` : ''}${timerHTML(v, [me])}`;
    }
    case 'auction': {
      // Açık artırma: herkes en yüksek teklifi ve kimin çekildiğini görür; sırası gelen artırır ya da çekilir.
      const step = E.auctionStep(v);
      const min = pd.high + step;
      const lead = pd.leader !== null ? P(v, pd.leader) : null;
      const who = (i) => (i === me ? 'Sen' : P(v, i).name);
      const people = pd.order.map((i) => {
        const st = i === pd.leader ? `en yüksek ${fmt(pd.high)}` : pd.out.includes(i) ? 'çekildi' : i === pd.turn ? 'sırada' : 'bekliyor';
        return html`<span class="abid ${pd.out.includes(i) ? 'out' : ''} ${i === pd.leader ? 'lead' : ''} ${i === pd.turn ? 'now' : ''}" style="--c:${P(v, i).color}">${P(v, i).avatar} ${who(i)} · ${st}</span>`;
      });
      const head = html`<h3>🔨 Açık artırma · ${BOARD[pd.sq].name} <small class="muted">${cityOf(pd.sq)} · liste ${fmt(E.price(v, pd.sq))}</small></h3>
        <div class="ahigh">${lead ? html`En yüksek teklif <b>${fmt(pd.high)}</b> · ${who(pd.leader)}` : 'Henüz teklif yok'}</div>
        <div class="abids">${people}</div>`;
      if (pd.turn !== me) return html`${head}<p>${P(v, pd.turn).name} düşünüyor: artıracak mı, çekilecek mi?</p>${timerHTML(v, [pd.turn])}`;
      const cash = P(v, me).cash;
      const quick = [...new Set([min, pd.high + step * 5, pd.high + step * 10].filter((x) => x <= cash))];
      app.ui.binds ||= {};
      if (!(Number(app.ui.binds.raise) >= min)) app.ui.binds.raise = String(min);
      return html`${head}
        <div class="row center">${quick.map((q) => html`<button class="btn primary" data-act="raise" data-amt="${q}">${fmt(q)} ver</button>`)}<button class="btn ghost" data-act="auctionPass">Çekil</button></div>
        <div class="moneybox abox"><div class="row"><span class="muted">Özel tutar</span><b class="amount" data-show="raise"></b><div class="grow"></div><button class="btn small" data-act="raiseCustom">Ver</button></div>
          <input type="range" class="slider" min="${min}" max="${cash}" step="5" data-bind="raise" style="--c:${P(v, me).color}"></div>${timerHTML(v, [me])}`;
    }
    case 'react': {
      const c = pd.card;
      const card = CARDS[c.id];
      const attacker = P(v, c.by);
      const victim = P(v, pd.victim);
      const what = c.target && c.target.sq !== undefined ? ` (${BOARD[c.target.sq].name})` : c.target && c.target.theirs !== undefined ? ` (${BOARD[c.target.mine].name} ↔ ${BOARD[c.target.theirs].name})` : '';
      const desc = html`<div class="react-card">${cardFace(c.id)}<div><b>${attacker.name} → ${victim.name}</b><div class="muted">${card.name}${what}${pd.chain ? ` · ${pd.chain} itiraz` : ''}</div></div></div>`;
      if (pd.responder !== me) return html`${desc}<p>${P(v, pd.responder).name} karar veriyor…</p>${timerHTML(v, [pd.responder])}`;
      const it = P(v, me).hand.find((u) => cardId(u) === 'itiraz');
      const counter = me === c.by;
      return html`${desc}<h3>${counter ? `${victim.name} itiraz etti! Karşı itiraz?` : `${attacker.name} sana ${card.name} oynadı!`}</h3>
        <div class="row center"><button class="btn primary big" data-act="react" data-uid="${it}" data-primary>✋ ${counter ? 'Karşı İtiraz' : 'İtiraz Et'}</button><button class="btn ghost" data-act="react" data-uid="">${counter ? 'Vazgeç' : 'Kabul Et'}</button></div>${timerHTML(v, [me])}`;
    }
    case 'rent': {
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} ${BOARD[pd.sq].name} kirası için karar veriyor…</p>${timerHTML(v, [pd.p])}`;
      const dayi = P(v, me).hand.find((u) => cardId(u) === 'dayi');
      return html`<h3>Kira: ${fmt(pd.amount)}</h3><p>${BOARD[pd.sq].name} → ${P(v, pd.owner).name}${pd.zam ? ' (Kira Zammı!)' : ''}</p>
        <div class="row center"><button class="btn gold big" data-act="react" data-uid="${dayi}" data-primary>🧔 Dayın Çıktı!</button><button class="btn ghost" data-act="react" data-uid="">Öde</button></div>${timerHTML(v, [me])}`;
    }
    case 'tapu': {
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} Tapu Dairesi'nde arsa bakıyor…</p>${timerHTML(v, [pd.p])}`;
      return html`<h3>📜 Tapu Dairesi</h3><p>Parlayan arsalardan birine tıkla, fiyatını gör ve tapudan al.</p>
        <button class="btn ghost" data-act="tapuBuy" data-sq="">Bir şey alma</button>${timerHTML(v, [me])}`;
    }
    case 'zabita': {
      if (pd.p !== me) return html`<p>🚨 ${P(v, pd.p).name} zabıtaya kimi ihbar edecek?</p>${timerHTML(v, [pd.p])}`;
      return html`<h3>🚨 Zabıta geldi</h3><p>Kimin kaçak katlarını ihbar ediyorsun? Hepsi yıkılır, kat başı ceza öder.</p>
        <div class="row center">${pd.options.map((o) => html`<button class="btn primary" data-act="zabita" data-p="${o}">${P(v, o).avatar} ${P(v, o).name} (${E.floorsOf(v, o).kacak} kaçak)</button>`)}</div>${timerHTML(v, [me])}`;
    }
    case 'trade': {
      const desc = tradeDesc(v, pd);
      if (pd.to === me) {
        return html`<h3>🤝 ${P(v, pd.from).name} sana teklif yaptı</h3>${desc}
          <div class="row center"><button class="btn green big" data-act="tradeAccept" data-primary>Kabul</button><button class="btn ghost" data-act="tradeReject">Reddet</button></div>${timerHTML(v, [me])}`;
      }
      if (pd.from === me) return html`<h3>Teklifin gönderildi</h3>${desc}<p>${P(v, pd.to).name} düşünüyor…</p><button class="btn ghost" data-act="tradeCancel">Teklifi geri çek</button>${timerHTML(v, [pd.to])}`;
      return html`<h3>🤝 Pazarlık</h3><p>${P(v, pd.from).name} → ${P(v, pd.to).name}</p>${desc}`;
    }
    case 'discard': {
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} elindeki fazla kartları atıyor…</p>${timerHTML(v, [pd.p])}`;
      const n = app.ui.selected.length;
      return html`<h3>Elinde fazla kart var</h3><p>Sağdaki elinden <b>${pd.count}</b> kart seç ve at (seçili: ${n}).</p>
        <button class="btn primary big" data-act="discardGo" ${n !== pd.count ? 'disabled' : ''} data-primary>Seçilenleri At</button>${timerHTML(v, [me])}`;
    }
    default:
      return '';
  }
}

function tradeDesc(v, pd) {
  const side = (x) => [...x.props.map((q) => sqChip(q)), x.cash ? html`<span class="chip">💵 ${fmt(x.cash)}</span>` : ''].filter(Boolean);
  const give = side(pd.give);
  const take = side(pd.take);
  return html`<div class="trade-cols" style="width:min(520px,100%)">
    <div class="trade-col"><h4>${P(v, pd.from).name} verir</h4><div class="row">${give.length ? give : html`<span class="muted">hiçbir şey</span>`}</div></div>
    <div class="trade-col"><h4>${P(v, pd.to).name} verir</h4><div class="row">${take.length ? take : html`<span class="muted">hiçbir şey</span>`}</div></div></div>`;
}

// Kaydırma çubuğu: değer app.ui.binds[bind] içinde, yanındaki [data-show] canlı güncellenir.
function slider(bind, max, color, step = 10) {
  const top = Math.max(0, max);
  return html`<input type="range" class="slider" min="0" max="${top}" step="${step}" data-bind="${bind}" style="--c:${color}" ${top ? '' : 'disabled'}>
    <div class="row slider-scale"><span>0</span><div class="grow"></div><span>${fmt(top)}</span></div>`;
}

// ---------- yan panel ----------

function playersHTML(v) {
  const waiting = new Set(E.waitingFor(v));
  const conn = (app.meta && app.meta.connected) || {};
  const manage = canManage(v);
  return v.players
    .map((pl, i) => {
      const turn = v.phase === 'play' && v.turn && v.turn.p === i;
      const flags = [
        pl.bot ? html`<span data-tip="Bot oynuyor">🤖</span>` : conn[pl.id] === false ? html`<span data-tip="Bağlantısı koptu, süre dolunca bot oynar">📴</span>` : '',
        pl.konkordato ? html`<span data-tip="Konkordato: oyun sonunda ${pl.konkordato * v.config.konkordatoPenalty} puan ceza">⚠️${pl.konkordato}</span>` : '',
        pl.kiraZammi ? html`<span data-tip="Kira Zammı: tahsil edeceği ilk kira 2 katı">📈</span>` : '',
        waiting.has(i) && !turn && v.phase !== 'over' ? html`<span class="s-wait" data-tip="Karar vermesi bekleniyor"></span>` : '',
      ];
      const tags = [i === v.you ? html`<span class="s-tag me">SEN</span>` : '', turn ? html`<span class="s-tag">SIRADA</span>` : ''];
      const acts =
        i === v.you
          ? html`<div class="s-acts"><button class="btn small ghost" data-act="manage">🏠 Mülklerim</button><button class="btn small turq" data-act="trade" ${manage ? '' : 'disabled'} title="Sıra sendeyken pazarlık teklif edebilirsin">🤝 Pazarlık</button></div>`
          : '';
      return html`<div class="seat2 ${turn ? 'turn' : ''}" style="--c:${pl.color}" data-act="player" data-p="${i}">
        <div class="s-av">${pl.avatar}</div>
        <div><div class="s-name">${pl.name} ${tags} ${flags}</div>
          <div class="s-meta"><span data-tip="Mülk sayısı (gar ve havalimanı dahil)">📜 ${E.propsOf(v, i).length} mülk</span><span class="s-backs" data-tip="Elindeki kart sayısı"><i></i>${pl.handCount} kart</span></div></div>
        <div class="s-cash ${pl.cash < 0 ? 'neg' : ''}" data-cash="${i}"><span data-tip="Nakit">${fmt(pl.cash)}</span><small data-tip="Net değer: nakit + mülk + katlar. Oyun sonu puanı buna gizli hedef bonusu eklenip konkordato cezası düşülerek bulunur">değer ${fmt(E.netWorth(v, i))}</small></div>${acts}</div>`;
    })
    .join('');
}

// Ekranın altındaki el, gizli hedef kartı ve deste.
function renderHand(v) {
  const me = v.you;
  if (me < 0) {
    hand.render([], () => ({}));
    els.quest.classList.add('hidden');
    return;
  }
  const pl = P(v, me);
  const discard = v.pending && v.pending.type === 'discard' && v.pending.p === me;
  hand.render(pl.hand, (u) => ({ playable: !discard && canPlay(v, u), selected: app.ui.selected.includes(u) }), app.ui.newCards || []);
  app.ui.newCards = [];
  const h = pl.hedef && HEDEF[pl.hedef];
  els.quest.classList.toggle('hidden', !h);
  if (h) setHTML(els.quest, html`<div class="q-k">GİZLİ HEDEF</div><div class="q-n">${h.icon} ${h.name}</div><div class="q-t">${h.text} (+${h.bonus} puan)</div>${E.hedefMet(v, me, pl.hedef) ? html`<div class="q-ok">✓ şu an tutuyor</div>` : ''}`);
  setHTML(els.deck, html`<i></i><i></i><i></i><b title="Destede kalan kart">${v.deck}</b>`);
}

function renderAudioPop() {
  if (!app.ui.audioOpen) return setHTML(els.audioPop, '');
  const a = getAudio();
  const row = (k, label, color) =>
    html`<div class="audio-row"><label><input type="checkbox" data-act="audioToggle" data-k="${k}" ${a[`${k}On`] ? 'checked' : ''}> ${label}</label><span class="muted small" data-audio-show="${k}">%${Math.round(a[k] * 100)}</span>
      <input type="range" class="slider" min="0" max="100" step="5" value="${Math.round(a[k] * 100)}" data-audio="${k}" style="--c:${color}"></div>`;
  setHTML(els.audioPop, html`<div class="audio-pop"><h4>🎵 Ses ayarları</h4>${row('music', '🎶 Müzik', '#00798c')}${row('sfx', '🔔 Efektler', '#d1495b')}</div>`);
}

// Olaylar: sade, büyük yazı; zar, yürüme, maaş gibi gürültü gizlenir. Her tur bir başlıkla ayrılır.
const FEED_ICON = { target: '🏁', surpriz: '❓', collapse: '🏚️', card: '🃏', own: '🏠', auction: '🔨', build: '🏗️', demolish: '🚜', konkordato: '⚠️', tradeDone: '🤝', over: '🏆', summary: '📊' };
const FEED_HIDE = new Set(['dice', 'move', 'bid', 'draw', 'turn', 'trade', 'auctionStart']);

function feedItem(l) {
  if (l.type === 'gundem' || l.type === 'round') {
    const m = /Gündem: ([^.]+)\./.exec(l.text);
    return html`<div class="ev-round"><b>${l.r}. TUR</b>${m ? html`<span>${m[1]}</span>` : ''}</div>`;
  }
  let icon = FEED_ICON[l.type] || '•';
  if (l.type === 'money') icon = / \+/.test(l.text) ? '💰' : '💸';
  return html`<div class="ev t-${l.type}"><span class="ev-i">${icon}</span><span>${feedText(l)}</span></div>`;
}

// Kart adı türüne göre renkli bir çip olur (Hamle kırmızı, Tepki mavi); üzerine gelince kartın kendisi görünür.
const cardChip = (id) => html`<span class="cchip ${CARDS[id].type}" data-card="${id}">${CARDS[id].icon} ${CARDS[id].name}</span>`;

function feedText(l) {
  const c = l.card && CARDS[l.card];
  if (!c) return l.text;
  const i = l.text.indexOf(c.name);
  return i < 0 ? html`${l.text} ${cardChip(l.card)}` : html`${l.text.slice(0, i)}${cardChip(l.card)}${l.text.slice(i + c.name.length)}`;
}

const feedRows = () => app.view.log.filter((l) => l.text && !FEED_HIDE.has(l.type) && !/\((Maaş|Kat|Kaçak kat)\)$/.test(l.text));
const feedHTML = () => feedRows().slice(-60).reverse().map(feedItem).join('');

// Tahtanın ortasında son olaylar: en yenisi üstte, aşağı doğru solarak kaybolur. Tıklayınca tüm geçmiş açılır.
export function renderFeed() {
  if (!els) return;
  setHTML(els.feed, feedRows().filter((l) => l.type !== 'gundem' && l.type !== 'round').slice(-6).reverse().map(feedItem).join(''));
}

// ---------- pencereler ----------

function cardDialog(v, uid) {
  const id = cardId(uid);
  const c = CARDS[id];
  const me = v.you;
  const playable = canPlay(v, uid);
  const big = cardFace(id, 'big');
  if (!playable) {
    let why = 'Bu kart şu an oynanamaz.';
    if (c.type === 'tepki') why = 'Bu bir tepki kartı; zamanı gelince sana sorulacak.';
    else if (v.turn && v.turn.p === me && v.turn.hamle) why = 'Bu tur zaten bir Hamle kartı oynadın.';
    else if (v.turn && v.turn.p === me && !v.pending && E.cardTargets(v, me, id).length === 0) why = 'Bu kart için uygun hedef yok.';
    return html`<div class="cdlg">${big}<div class="cdlg-r"><h2>${c.name}</h2><p class="reason">${why}</p></div></div>`;
  }
  const targets = E.cardTargets(v, me, id);
  const play = (t, label) => html`<button data-act="play" data-uid="${uid}" data-t="${JSON.stringify(t)}">${label}</button>`;
  let body;
  switch (c.target) {
    case 'steps':
      body = html`<p>Kaç kare gideceksin?</p><div class="steps">${targets.map((t) => html`<button data-act="play" data-uid="${uid}" data-t="${JSON.stringify(t)}"><b>${t.steps}</b>${BOARD[destOf(v, t.steps, false)].name}</button>`)}</div>`;
      break;
    case 'die':
      body = html`<div class="row center">${targets.map((t) => html`<button class="btn gold" data-act="play" data-uid="${uid}" data-t="${JSON.stringify(t)}">${t.die + 1}. zar: ${v.turn.dice[t.die]} kare → ${BOARD[destOf(v, v.turn.dice[t.die], v.turn.backward)].name}</button>`)}</div>`;
      break;
    case 'opp-prop':
    case 'self-prop':
      body = html`<p>Hangi mülk?</p><div class="targets">${targets.map((t) => {
        const o = v.props[t.sq].owner;
        const extra = id === 'kamulastirma' ? `Bedel ${fmt(E.price(v, t.sq))}` : id === 'tedbir' ? `Kira ${fmt(E.rentFor(v, t.sq))}` : `${E.level(v.props[t.sq])} kat`;
        return play(t, html`${sqChip(t.sq)}<span class="muted">${o !== me ? P(v, o).name : ''} · ${extra}</span>`);
      })}</div>`;
      break;
    case 'opp-player':
      body = html`<p>Kime?</p><div class="targets">${targets.map((t) => play(t, html`<b>${P(v, t.player).avatar} ${P(v, t.player).name}</b><span class="muted">${fmt(P(v, t.player).cash)}${id === 'ihbar' ? ` · ${E.floorsOf(v, t.player).kacak} kaçak` : ''}</span>`))}</div>`;
      break;
    case 'swap': {
      const mine = [...new Set(targets.map((t) => t.mine))];
      const sel = app.ui.swapMine;
      body = html`<p>1) Vereceğin mülk:</p><div class="targets">${mine.map((q) => html`<button class="${sel === q ? 'on' : ''}" data-act="swapMine" data-sq="${q}">${sqChip(q)}</button>`)}</div>
        ${sel !== null && mine.includes(sel) ? html`<p>2) Alacağın mülk:</p><div class="targets">${targets.filter((t) => t.mine === sel).map((t) => play(t, html`${sqChip(t.theirs)}<span class="muted">${P(v, v.props[t.theirs].owner).name}</span>`))}</div>` : ''}`;
      break;
    }
    default:
      body = html`<div class="row center"><button class="btn primary big" data-act="play" data-uid="${uid}" data-t="{}">Oyna</button></div>`;
  }
  const fromBoard = isBoardPickable(uid) ? html`<div class="row center"><button class="btn turq" data-act="pickBoard" data-uid="${uid}">🎯 Tahtadan seç</button></div>` : '';
  return html`<div class="cdlg">${big}<div class="cdlg-r"><h2>${c.name}</h2>${body}${fromBoard}</div></div>`;
}

function propActions(v, sq) {
  const me = v.you;
  const ps = v.props[sq];
  if (!ps || ps.owner !== me) return '';
  const manage = canManage(v);
  const b = (actName, label, block) => html`<button class="btn tiny ${actName === 'buildKacak' ? 'gold' : actName === 'build' ? 'green' : ''}" data-act="${actName}" data-sq="${sq}" ${!manage || block ? 'disabled' : ''} title="${block || ''}">${label}</button>`;
  const out = [];
  if (BOARD[sq].kind === 'prop') {
    out.push(b('build', `+ Kat ${fmt(E.katCost(v, sq))}`, E.buildBlock(v, me, sq, false)));
    out.push(b('buildKacak', `+ Kaçak ${fmt(E.kacakCost(v, sq))}`, E.buildBlock(v, me, sq, true)));
    if (E.level(ps) > 0) out.push(b('sellFloor', `Kat sat +${fmt(Math.round(E.katValue(v, sq) / (ps.kacak ? 20 : 10)) * 5)}`, null));
  }
  if (!ps.ipotek) out.push(b('mortgage', `İpotek +${fmt(E.mortgageValue(v, sq))}`, E.level(ps) > 0 ? 'Önce katları sat.' : null));
  else out.push(b('unmortgage', `İpotek kaldır ${fmt(E.unmortgageCost(v, sq))}`, P(v, me).cash < E.unmortgageCost(v, sq) ? 'Paran yetmiyor.' : null));
  return out;
}

function manageDialog(v) {
  const me = v.you;
  const mine = E.propsOf(v, me).sort((a, b) => a - b);
  const note = canManage(v) ? '' : html`<p class="notice">Kat dikmek ve ipotek işlemleri yalnız sıra sendeyken yapılır.</p>`;
  if (!mine.length) return html`<h2>🏠 Mülklerim</h2>${note}<p class="muted">Henüz mülkün yok. Sahipsiz bir arsaya gelince satın alabilirsin.</p>`;
  const rows = mine.map((q) => {
    const ps = v.props[q];
    const lvl = [ps.kat ? `🏠×${ps.kat}` : '', ps.kacak ? '🚧' : ''].join(' ').trim();
    return html`<tr><td>${sqChip(q)}${ps.ipotek ? html` <span class="chip">ipotekli</span>` : ''}${ps.tedbir ? html` <span class="chip">⚖️</span>` : ''}</td><td>${lvl || '-'}</td><td class="money">${ps.ipotek ? '-' : fmt(E.rentFor(v, q))}</td><td class="acts">${propActions(v, q)}</td></tr>`;
  });
  return html`<h2>🏠 Mülklerim</h2>${note}<table class="mgr"><tr><th>Mülk</th><th>Kat</th><th>Kira</th><th></th></tr>${rows}</table>
    <p class="muted" style="font-size:12px">🏠 yasal kat, 🚧 kaçak kat. Yasal kat için şehrin tüm mülkleri sende olmalı. Kaçak kat yarı fiyat ama yıkılabilir.</p>`;
}

function tradeDialog(v) {
  const me = v.you;
  const t = app.ui.trade;
  const opps = v.players.map((_, i) => i).filter((i) => i !== me);
  if (t.to === null || !opps.includes(t.to)) t.to = opps[0];
  const chips = (owner, side) => {
    const qs = E.propsOf(v, owner).sort((a, b) => a - b);
    if (!qs.length) return html`<div class="muted small">Mülk yok</div>`;
    return html`<div class="tchips">${qs.map((q) => {
      const ok = E.level(v.props[q]) === 0;
      return html`<button class="tchip ${t[side].props.includes(q) ? 'on' : ''}" data-act="tradePick" data-side="${side}" data-sq="${q}" ${ok ? '' : 'disabled'} title="${ok ? '' : 'Katlı mülk takas edilemez'}">${BOARD[q].name}<small>${cityOf(q)}</small></button>`;
    })}</div>`;
  };
  const col = (i, label, side, bind) => {
    const pl = P(v, i);
    return html`<div class="trade-col" style="--c:${pl.color}"><h4>${av(pl, 'sm')} ${label}</h4>${chips(i, side)}
      <div class="moneybox"><div class="row"><span class="muted">Para</span><div class="grow"></div><b class="amount" data-show="${bind}"></b></div>${slider(bind, pl.cash, pl.color)}</div></div>`;
  };
  const block = E.tradeBlock(v, me, tradeOffer());
  return html`<h2>🤝 Pazarlık</h2>
    <div class="tpartners">${opps.map((i) => html`<button class="tpartner ${t.to === i ? 'on' : ''}" data-act="tradeTo" data-p="${i}" style="--c:${P(v, i).color}">${av(P(v, i), 'sm')} ${P(v, i).name}</button>`)}</div>
    <div class="trade-cols">${col(me, 'Sen veriyorsun', 'give', 'tradeGive')}${col(t.to, `${P(v, t.to).name} veriyor`, 'take', 'tradeTake')}</div>
    <p class="reason" data-trade-reason>${block || ''}</p>
    <div class="row"><div class="grow"></div><button class="btn ghost" data-act="close">Vazgeç</button><button class="btn primary" data-act="sendTrade" ${block ? 'disabled' : ''}>Teklifi Gönder</button></div>`;
}

// Kaydırma çubuğu oynarken pencereyi yeniden çizmeden uyarıyı ve düğmeyi günceller.
function refreshTrade() {
  const v = app.view;
  const block = E.tradeBlock(v, v.you, tradeOffer());
  const reason = els.modal.querySelector('[data-trade-reason]');
  const btn = els.modal.querySelector('[data-act="sendTrade"]');
  if (reason) reason.textContent = block || '';
  if (btn) btn.disabled = !!block;
}

export function tradeOffer() {
  const t = app.ui.trade;
  const b = app.ui.binds || {};
  const cash = (x) => Math.max(0, Math.floor(Number(x) || 0));
  return { to: t.to, give: { cash: cash(b.tradeGive), props: t.give.props }, take: { cash: cash(b.tradeTake), props: t.take.props } };
}

function playerDialog(v, p) {
  const pl = P(v, p);
  const byGroup = {};
  for (const q of E.propsOf(v, p)) {
    const g = BOARD[q].group || BOARD[q].mode;
    (byGroup[g] ||= []).push(q);
  }
  const groups = Object.entries(byGroup).map(
    ([g, qs]) =>
      html`<div class="row"><b style="min-width:90px">${GROUPS[g] ? GROUPS[g].name : E.TRANSPORT_LABEL[g]}${GROUPS[g] && E.ownsGroup(v, p, g) ? ' ★' : ''}</b>${qs.map((q) => html`<span class="chip">${BOARD[q].name}${v.props[q].kat ? ` 🏠×${v.props[q].kat}` : ''}${v.props[q].kacak ? ' 🚧' : ''}${v.props[q].ipotek ? ' (ipotek)' : ''}</span>`)}</div>`,
  );
  return html`<h2>${av(pl)} ${pl.name}</h2>
    <div class="row"><span class="chip">💵 ${fmt(pl.cash)}</span><span class="chip">Net değer ${fmt(E.netWorth(v, p))}</span><span class="chip">🂠 ${pl.handCount} kart</span>${pl.konkordato ? html`<span class="chip">Konkordato ×${pl.konkordato}</span>` : ''}</div>
    ${groups.length ? groups : html`<p class="muted">Mülkü yok.</p>`}
    <p class="muted" style="font-size:12px">★ tamamlanmış şehir seti. Gizli hedefler oyun sonunda açılır.</p>`;
}

function resultsDialog(v) {
  const r = v.results;
  const rows = r.ranking.map((p, k) => {
    const sc = r.scores[p];
    const pl = P(v, p);
    const h = pl.hedef && HEDEF[pl.hedef];
    return html`<div class="res ${k === 0 ? 'win' : ''}"><div class="rank">${['🥇', '🥈', '🥉'][k] || k + 1}</div>${av(pl)}
      <div><b>${pl.name}</b><div class="rb">Nakit ${fmt(sc.nakit)} · Mülk ${fmt(sc.mulk)} · Kat ${fmt(sc.katlar)}${sc.ceza ? ` · Ceza -${fmt(sc.ceza)}` : ''}</div>
      <div class="rb">${h ? html`${h.icon} ${h.name}: ${sc.hedefOk ? html`<b>tuttu +${sc.hedefBonus}</b>` : 'tutmadı'}` : ''}</div></div>
      <div class="rt money">${fmt(sc.total)}</div></div>`;
  });
  return html`<h2>🗳️ Seçim Günü sonuçları</h2><div class="results">${rows}</div>${worthChart(v)}
    ${isHost() ? html`<div class="row"><div class="grow"></div><button class="btn turq" data-act="newGame">Aynı masayla yeni oyun</button></div>` : ''}`;
}

// Tur tur net değer çizgisi (hedef bonusu ve ceza yok; kazananın çizgisi kalın).
function worthChart(v) {
  const W = 420;
  const H = 150;
  const c = worthLines(v.worth, W, H);
  if (!c) return '';
  const win = v.results.ranking[0];
  const order = [...c.lines.keys()].sort((a, b) => (a === win) - (b === win));
  const lines = order.map((p) => html`<polyline points="${c.lines[p]}" style="--c:${P(v, p).color}" class="${p === win ? 'win' : ''}"><title>${P(v, p).name}</title></polyline>`);
  return html`<div class="worth"><div class="worth-h">📈 Tur tur net değer <span class="muted">${fmt(c.hi)} en yüksek</span></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tur tur net değer grafiği">
      <line x1="0" x2="${W}" y1="${c.zero}" y2="${c.zero}" class="zero"></line>${lines}</svg>
    <div class="worth-x"><span>Başlangıç</span><span>${c.rounds}. tur</span></div></div>`;
}

export function renderModal() {
  if (!els) return;
  const v = app.view;
  const d = app.ui.dialog;
  if (!d || !v) {
    setHTML(els.modal, '');
    return;
  }
  let body = '';
  let wide = false;
  switch (d.type) {
    case 'card':
      if (!v.players[v.you]?.hand.includes(d.uid)) {
        app.ui.dialog = null;
        return renderModal();
      }
      body = cardDialog(v, d.uid);
      break;
    case 'manage':
      body = manageDialog(v);
      wide = true;
      break;
    case 'trade':
      if (!canManage(v)) {
        app.ui.dialog = null;
        return renderModal();
      }
      body = tradeDialog(v);
      wide = true;
      break;
    case 'player':
      body = playerDialog(v, d.p);
      break;
    case 'results':
      body = resultsDialog(v);
      wide = true;
      break;
    case 'rules':
      body = html`<h2>❓ Nasıl oynanır?</h2>${raw(RULES_HTML)}`;
      break;
    case 'history':
      body = html`<h2>📜 Olay geçmişi</h2><div class="feed-list">${raw(feedHTML())}</div>`;
      break;
    default:
  }
  renderKeep(els.modal, html`<div class="modal-back" data-act="backdrop"><div class="modal ${wide ? 'wide' : ''}"><button class="x" data-act="close">✕</button>${body}</div></div>`);
}

// İçerik değişince girişleri (teklif, para) kaybetmeden yeniden çizer.
function renderKeep(el, content) {
  const focused = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.bind : null;
  const scrollers = () => el.querySelectorAll('.modal, .feed-list, .mgr');
  const tops = [...scrollers()].map((n) => n.scrollTop);
  setHTML(el, content);
  [...scrollers()].forEach((n, i) => tops[i] && (n.scrollTop = tops[i]));
  app.ui.binds ||= {};
  for (const inp of el.querySelectorAll('[data-bind]')) {
    const key = inp.dataset.bind;
    let val = app.ui.binds[key];
    if (inp.type === 'range' && (val === undefined || val === '')) val = app.ui.binds[key] = '0';
    if (val !== undefined && inp.value !== String(val)) inp.value = val;
    if (focused && key === focused && document.activeElement !== inp) inp.focus();
  }
  for (const out of el.querySelectorAll('[data-show]')) out.textContent = fmt(Number(app.ui.binds[out.dataset.show]) || 0);
}

// ---------- ana çizim ----------

function highlightOf(v) {
  const pd = v.pending;
  if (pd && (pd.type === 'buy' || pd.type === 'auction')) return pd.sq;
  if (pd && pd.type === 'rent') return pd.sq;
  return -1;
}

export function updateGame() {
  const v = app.view;
  if (!v || !els) return;
  updateTopbar(v);
  if (app.ui.pick && !(v.players[v.you]?.hand.includes(app.ui.pick.uid) && canPlay(v, app.ui.pick.uid))) app.ui.pick = null;
  if (app.ui.pick) app.ui.popSq = null;
  updateBoard(cells, v, highlightOf(v), app.ui.pick ? pickSquares(v, app.ui.pick.uid, app.ui.swapMine) : tapuSquares(v), app.ui.popSq);
  tokens.sync(v.players, v.turn ? v.turn.p : -1);
  if (!animating) tokens.settle(v.players);
  setHTML(els.gundem, gundemHTML(v));
  renderKeep(els.prompt, promptHTML(v));
  if (!animating) dice.show(v.pending || !v.turn ? null : v.turn.dice);
  renderPop(v);
  setHTML(els.players, playersHTML(v));
  renderHand(v);
  renderAudioPop();
  renderFeed();
  renderModal();
  tickTimers();
  if (v.phase === 'over' && !app.ui.seenOver) {
    app.ui.seenOver = true;
    app.ui.dialog = { type: 'results' };
    renderModal();
  }
}

export function tickTimers() {
  const now = hostNow();
  for (const el of document.querySelectorAll('[data-deadline]')) {
    const at = Number(el.dataset.deadline);
    const span = Number(el.dataset.span);
    const left = Math.max(0, at - now);
    const bar = el.querySelector('i');
    if (bar) bar.style.width = `${Math.min(100, (left / span) * 100)}%`;
  }
  for (const el of document.querySelectorAll('[data-countdown]')) {
    const left = Math.max(0, Math.ceil((Number(el.dataset.countdown) - now) / 1000));
    el.textContent = left ? `⏱ ${left} sn` : '⏱ süre doldu';
  }
}

// ---------- olay efektleri ----------

export function toast(text, kind = '') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), 3800);
}

function floatMoney(p, delta) {
  const anchor = document.querySelector(`[data-cash="${p}"]`);
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float ${delta > 0 ? 'plus' : 'minus'}`;
  el.textContent = `${delta > 0 ? '+' : ''}${fmt(delta)}`;
  el.style.left = `${r.left + r.width / 2 - 30}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

const FLIGHT_MS = 650;
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Oyuncunun para kutusu ya da banka (tahtanın ortası) ekrandaki merkez noktası.
function moneyPoint(p) {
  const el = p === null ? els && els.board : document.querySelector(`[data-cash="${p}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Kira ve transferlerde ödeyenden alana kavis çizerek uçan jetonlar.
function flyCoins({ from, to, amount, n, delay }) {
  const a = moneyPoint(from);
  const b = moneyPoint(to);
  setTimeout(() => from !== null && floatMoney(from, -amount), delay);
  setTimeout(() => to !== null && floatMoney(to, amount), delay + (a && b && !calm() ? FLIGHT_MS + (n - 1) * COIN_GAP : 0));
  if (!a || !b || calm()) return;
  const m = arcPeak(a, b);
  const at = (q, s) => `translate(${q.x}px, ${q.y}px) translate(-50%, -50%) scale(${s})`;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'coin';
    document.body.appendChild(el);
    const k = el.animate([
      { transform: at(a, 0.6), opacity: 0 },
      { transform: at(m, 1.15), opacity: 1, offset: 0.5 },
      { transform: at(b, 0.8), opacity: 1, offset: 0.92 },
      { transform: at(b, 0.4), opacity: 0 },
    ], { duration: FLIGHT_MS, delay: delay + i * COIN_GAP, easing: 'ease-in-out', fill: 'both' });
    k.onfinish = () => el.remove();
  }
}

// Kat dikilince karede kısa bir inşaat sıçraması ve vinç.
function buildFx(sq) {
  const cell = cells && cells[sq];
  if (!cell || calm()) return;
  cell.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) translateY(-4%)', offset: 0.35 }, { transform: 'scale(0.97)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-out' });
  const r = cell.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'buildfx';
  el.textContent = '🏗️';
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function showNews(v, ev) {
  const g = GUNDEM[ev.id];
  const detail = v.gundem && v.gundem.id === ev.id ? v.gundem.detail : '';
  const sum = v.summary && v.summary.round === ev.round - 1 ? summaryHTML(v, v.summary) : '';
  els.stage.innerHTML = html`<div class="stage" data-act="closeStage"><div class="news"><div class="kicker">${ev.round}. TUR · SON DAKİKA</div><div class="gi">${g.icon}</div><div class="gt">${g.name}</div><div class="gx">${g.text}</div>${detail ? html`<div class="gd">${detail}</div>` : ''}${sum}<div class="nhint">kapatmak için tıkla</div></div></div>`.toString();
  clearTimeout(showNews.t);
  showNews.t = setTimeout(() => (els.stage.innerHTML = ''), (sum ? 5600 : 3600) * spd());
}

// Geçen turun özeti: en çok kazanan/kaybeden ve el değiştiren mülkler (en fazla 3).
function summaryHTML(v, sm) {
  const sign = (x) => `${x > 0 ? '+' : ''}${fmt(x)}`;
  const rows = [];
  if (sm.best !== null) {
    rows.push(html`<div>📈 <b>${P(v, sm.best).name}</b> ${sign(sm.deltas[sm.best])}</div>`);
    rows.push(html`<div>📉 <b>${P(v, sm.worst).name}</b> ${sign(sm.deltas[sm.worst])}</div>`);
  }
  for (const c of sm.changes.slice(0, 3)) rows.push(html`<div>🔁 ${BOARD[c.sq].name}: ${P(v, c.from).name} → ${c.to === null ? 'Banka' : P(v, c.to).name}</div>`);
  if (sm.changes.length > 3) rows.push(html`<div>… ve ${sm.changes.length - 3} mülk daha</div>`);
  return rows.length ? html`<div class="recap"><div class="rk">${sm.round}. TURUN ÖZETİ</div>${rows}</div>` : '';
}

function boardCenter() {
  const r = els.board.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Oynadığım kart elden tahtanın ortasına uçar.
function flyMine(prev, v, id) {
  const me = v.you;
  const before = prev && prev.players[me] ? prev.players[me].hand : [];
  const uid = before.find((u) => cardId(u) === id && !v.players[me].hand.includes(u));
  const from = uid && hand.rectOf(uid);
  if (from) flyToCenter(cardFace(id), from, boardCenter());
}

// SÜRPRİZ: tahtanın ortasında soru işaretli kart döner, etkisi görünür.
async function showSurpriz(v, ev) {
  const sur = E.SURPRIZ[ev.id];
  const pl = P(v, ev.p);
  document.querySelectorAll('.surp').forEach((r) => r.remove());
  const c = boardCenter();
  const el = document.createElement('div');
  const dur = Math.round(3000 * spd());
  el.className = 'surp';
  el.style.left = `${c.x}px`;
  el.style.top = `${c.y}px`;
  el.style.setProperty('--dur', `${dur}ms`);
  el.innerHTML = String(html`<div class="who">${av(pl, 'sm')} ${pl.name} · Sürpriz!</div>
    <div class="sflip"><div class="sface sfront"><b>?</b></div><div class="sface sback"><div class="si">${sur.icon}</div><div class="sn">${sur.name}</div><div class="sx">${sur.text}</div></div></div>`);
  document.body.appendChild(el);
  play('card');
  await sleep(dur);
  el.remove();
}

// Kartın kime oynandığı (oynamadan önceki duruma göre).
function victimsOf(pv, ev) {
  const t = ev.target || {};
  switch (ev.card) {
    case 'kamulastirma':
    case 'tedbir':
      return [pv.props[t.sq]?.owner];
    case 'takas':
      return [pv.props[t.theirs]?.owner];
    case 'ihbar':
    case 'dava':
      return [t.player];
    case 'aidat':
      return pv.players.map((_, i) => i).filter((i) => i !== ev.p);
    default:
      return [];
  }
}

// Kartın bu oyunda ne yaptığı, tek cümle.
function cardEffect(v, ev) {
  const t = ev.target || {};
  const sq = (q) => (BOARD[q] ? BOARD[q].name : '');
  const m = (k) => fmt(E.money(v, E.AMOUNTS[k]));
  switch (ev.card) {
    case 'kamulastirma':
      return `${sq(t.sq)} mülkünü fiyatını ödeyerek almak istiyor.`;
    case 'tedbir':
      return `${sq(t.sq)} 2 tur kira alamayacak, üstüne kat dikilemeyecek.`;
    case 'takas':
      return `${sq(t.mine)} ile ${sq(t.theirs)} el değiştirecek.`;
    case 'ihbar':
      return `Tüm kaçak katları yıkılacak, kat başı ${m('ihbarFine')} ceza.`;
    case 'dava':
      return `Zar atılacak; büyük atan ${m('dava')} alır, eşitlikte davalı kazanır.`;
    case 'aidat':
      return `Diğer herkes ona ${m('aidat')} aidat ödeyecek.`;
    case 'kiraZammi':
      return 'Tahsil edeceği ilk kira 2 katı.';
    case 'muteahhit':
      return `${sq(t.sq)} üstüne bedava yasal kat.`;
    case 'piyango':
      return `Bankadan ${m('piyango')} aldı.`;
    case 'taksi':
      return `Zar atmadan ${t.steps} kare ilerliyor.`;
    case 'kestirme':
      return 'Zar toplamı yerine zarlardan biriyle ilerliyor.';
    case 'geriVites':
      return 'Bu tur geri yönde ilerleyecek.';
    case 'pazarlik':
      return 'Arsayı yarı fiyatına alıyor.';
    case 'itiraz':
      return 'Oynanan kartı iptal etmek istiyor.';
    case 'dayi':
      return 'Kirayı ödemiyor.';
    default:
      return CARDS[ev.card] ? CARDS[ev.card].text : '';
  }
}

// Başkasının oynadığı kart ortada büyük gösterilir. Kimin kime ne yaptığı yazar; üzerine gelince durur, tıklayınca kapanır.
async function revealCard(pv, v, ev) {
  // Tur başı haber kartı ekrandaysa onun kapanmasını bekle (üst üste binmesin).
  for (let k = 0; els && els.stage.firstChild && k < 15; k++) await sleep(400);
  if (!els) return;
  document.querySelectorAll('.reveal').forEach((r) => r.remove());
  const c = boardCenter();
  const dur = Math.round(3500 * spd());
  const vics = victimsOf(pv, ev).filter((i) => Number.isInteger(i));
  const toMe = vics.includes(v.you);
  const pl = P(v, ev.p);
  const to = toMe ? ' sana oynadı!' : vics.length === 1 ? ` → ${P(v, vics[0]).name}` : vics.length > 1 ? ' → herkese' : ' oynadı';
  const el = document.createElement('div');
  el.className = `reveal${toMe ? ' me' : ''}`;
  el.style.left = `${c.x}px`;
  el.style.top = `${c.y}px`;
  el.style.setProperty('--dur', `${dur}ms`);
  el.innerHTML = String(html`<div class="who">${av(pl, 'sm')} ${pl.name}${to}</div>${cardFace(ev.card, 'big')}<div class="eff">${cardEffect(v, ev)}</div><div class="rhint">üzerine gel: dur · tıkla: kapat</div>`);
  document.body.appendChild(el);
  await new Promise((done) => {
    const end = () => {
      clearTimeout(cap);
      el.remove();
      done();
    };
    el.addEventListener('animationend', (e) => e.target === el && end());
    el.addEventListener('click', end);
    const cap = setTimeout(end, dur + 8000); // üzerinde bekletilse de en fazla 8 sn fazladan
  });
}

export function confetti() {
  const colors = ['#d1495b', '#edae49', '#00798c', '#2f9e66', '#24408e', '#fff'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = `${2 + Math.random() * 2.5}s`;
    el.style.animationDelay = `${Math.random() * 0.8}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }
}

// Sunucudan gelen bir durum güncellemesini canlandırıp çizer.
export async function present(prev, v, events, fast) {
  const me = v.you;
  if (!fast) for (const f of coinFlights(events)) flyCoins(f);
  for (const ev of events) {
    switch (ev.type) {
      case 'card':
        play(ev.card === 'itiraz' ? 'itiraz' : 'card');
        if (!fast && ev.p === me) flyMine(prev, v, ev.card);
        break;
      case 'money':
        if (ev.to === me) play('coin');
        else if (ev.from === me) play('pay');
        break;
      case 'build':
        play('build');
        if (!fast) buildFx(ev.sq);
        break;
      case 'demolish':
        play('crash');
        toast(`🚜 ${P(v, ev.p).name}: ${ev.n} kaçak kat yıkıldı!`, 'error');
        break;
      case 'collapse':
        play('crash');
        break;
      case 'target':
        play('news');
        toast(`🏁 ${ev.text}`, 'good');
        break;
      case 'konkordato':
        play('crash');
        toast(`⚠️ ${P(v, ev.p).name} konkordato ilan etti!`, 'error');
        break;
      case 'auction':
        if (ev.winner !== null) play('sold');
        if (ev.winner !== null) toast(`🔨 ${BOARD[ev.sq].name} → ${P(v, ev.winner).name}`, 'good');
        break;
      case 'tradeDone':
        play('coin');
        toast('🤝 Anlaşma sağlandı!', 'good');
        break;
      case 'gundem':
        if (!fast) {
          play('news');
          showNews(v, ev);
        }
        break;
      case 'turn':
        if (ev.p === me) {
          play('turn');
          toast('Sıra sende!', 'good');
        }
        break;
      case 'over':
        play('win');
        confetti();
        break;
      default:
    }
  }
  const myHandBefore = prev && prev.players[me] ? prev.players[me].hand : [];
  app.ui.newCards = me >= 0 ? v.players[me].hand.filter((u) => !myHandBefore.includes(u)) : [];
  // Olay sırasıyla canlandır: zar, yürüyüş, sürpriz ve rakip kartları birbirinin üstüne binmez.
  const seq = events.filter((e) => ['dice', 'dava', 'move', 'surpriz'].includes(e.type) || (e.type === 'card' && e.p !== me));
  if (seq.length && prev && els) {
    animating = true;
    try {
      for (const e of seq) {
        if (e.type === 'dice' || e.type === 'dava') {
          const cap = e.type === 'dava' ? `⚖️ Dava zarları: ${P(v, e.p).name} ${e.dice[0]} · ${P(v, e.victim).name} ${e.dice[1]}` : '';
          await dice.roll(e.dice, fast, 1250 * spd(), cap);
        } else if (e.type === 'move') await tokens.walk(P(v, e.p).id, e.path, fast, 150 * spd());
        else if (fast) continue;
        else if (e.type === 'surpriz') await showSurpriz(v, e);
        else await revealCard(prev, v, e);
      }
    } finally {
      animating = false;
    }
  }
  updateGame();
}

export function bindsInput(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.bind) return false;
  app.ui.binds ||= {};
  app.ui.binds[el.dataset.bind] = el.value;
  for (const out of document.querySelectorAll(`[data-show="${el.dataset.bind}"]`)) out.textContent = fmt(Number(el.value) || 0);
  if (app.ui.dialog && app.ui.dialog.type === 'trade') refreshTrade();
  return true;
}
