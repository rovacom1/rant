// Oyun ekranı (tasarım A, Geniş Tahta): tahta, tahtanın ortası (istem, gündem, son olaylar), sağ sütun
// (oyuncular, el, araçlar), kare penceresi, tahtanın ortasında açılan pencereler ve olay efektleri.
import * as E from '../engine/index.js';
import { html, raw, setHTML, sleep } from './dom.js';
import { play, isMuted, getAudio, setMusic } from './sound.js';
import { T, calm, turnFx, ownFx, setFx, buildFx, demolishFx, iflasFx, coinSounds } from './boardfx.js';
import { Hand, cardFace, playFx, WHEN } from './hand.js';
import { deed } from './deed.js';
import { Dice } from './dice.js';
import { isNotifyOn, notifySupported } from './notify.js';
import { buildBoard, updateBoard, Tokens, cellPos } from './board.js';
import { CityMap } from './map.js';
import { app, isHost, act } from './state.js';
import { RULES_HTML } from './rules.js';
import { initTips } from './tip.js';
import { SPEEDS, PACE, STICKERS, STICKER_GAP } from '../net/host.js';
import { isBoardPickable, pickSquares, tapuSquares } from './pick.js';
import { coinFlights, coinCount, arcPeak, COIN_GAP, FLIGHT_GAP } from './coins.js';
import { worthLines } from './chart.js';
import { ic, money, CARD_IC, GUNDEM_IC, SURPRIZ_IC } from './icons.js';
import { pawn } from './pawns.js';
import { verdict } from './verdict.js';
import { mountDayi } from './dayi.js';
import { dayiMoment, dayiSay } from './dayisay.js';
import { canPlay, idleTurn, AUTO_END_MS } from './idle.js';

const { BOARD, CARDS, GROUPS, GROUP_SQUARES, GUNDEM, GUNDEM_PERIOD, fmt, cardId } = E;
const N = BOARD.length;
const I = (name, cls = '') => raw(ic(name, cls));
const M = (n, sign = false) => raw(money(n, sign));
const PW = (pl, s) => raw(pawn(pl.avatar, pl.color, s));

let els = null;
let cells = null;
let tokens = null;
let cityMap = null;
let dice = null;
let hand = null;
let animating = false;

// ---------- iskelet ----------

export function mountGame(root) {
  root.innerHTML = `
  <div class="game">
    <div class="board" id="board">
      <div class="center" id="center">
        <div id="gundem"></div>
        <div id="banner"></div>
        <div class="dice off" id="dice"></div>
        <div class="prompt" id="prompt"></div>
        <div class="events" id="feed" data-act="history" data-tip="Tüm olaylar için tıkla"></div>
      </div>
      <div class="tokens" id="tokens"></div>
      <div id="pop"></div>
      <div id="stage"></div>
      <div id="modal"></div>
      <div class="toasts" id="toasts"></div>
    </div>
    <aside class="side">
      <div class="side-head">
        <span class="logo sm">Rantçı Dayı</span><span class="round-chip" id="round"></span><span class="grow"></span>
        <button class="btn sq fs-btn" data-act="fullscreen" aria-label="Tam ekran">${ic('expand')}</button>
        <button class="btn sq" data-act="audio" id="tAudio" aria-label="Ses ve bildirim ayarları"></button>
        <button class="btn sq" data-act="theme" id="tTheme" aria-label="Tema"></button>
        <button class="btn sq" data-act="rules" aria-label="Kurallar">${ic('book')}</button>
        <button class="btn sq" data-act="leave" aria-label="Oyundan çık">${ic('door')}</button>
      </div>
      <div class="panel players" id="players"></div>
      <div id="audioPop"></div>
      <section class="hand-panel" id="handPanel">
        <div class="hand-head"><span class="kicker">Elin</span><span class="muted small" id="handN"></span><span class="grow"></span><span class="deck" id="deck" data-tip="Destede kalan kart"></span><span id="stick"></span></div>
        <div class="hand-grid" id="handGrid"></div>
      </section>
      <div class="player-panel hidden" id="playerPanel"></div>
      <div class="tools" id="tools"></div>
    </aside>
  </div>
  <div class="turn-phone" role="dialog" aria-label="Telefonu yan çevir">
    <span class="tp-ic">${ic('rotate')}</span>
    <span class="h22">Telefonu yan çevir</span>
    <span class="body">Tahta yatay ekranda rahat oynanır. Döndürme kilidi açıksa kapat.</span>
    <button class="btn L pri fs-btn" data-act="fullscreen">${ic('expand')}Tam ekran, yatay</button>
    <button class="btn S gho" data-act="portraitOk">Dikey devam et</button>
  </div>
  <div id="results"></div>`;
  const g = (id) => document.getElementById(id);
  els = {
    round: g('round'), audio: g('tAudio'), theme: g('tTheme'), board: g('board'), center: g('center'), gundem: g('gundem'), banner: g('banner'),
    prompt: g('prompt'), dice: g('dice'), tokens: g('tokens'), pop: g('pop'), players: g('players'), feed: g('feed'), handPanel: g('handPanel'),
    handN: g('handN'), handGrid: g('handGrid'), deck: g('deck'), audioPop: g('audioPop'), playerPanel: g('playerPanel'), tools: g('tools'),
    modal: g('modal'), stage: g('stage'), results: g('results'), stick: g('stick'),
  };
  cells = buildBoard(els.board);
  cityMap = new CityMap(els.board);
  tokens = new Tokens(els.tokens, cells);
  dice = new Dice(els.dice);
  hand = new Hand(els.handGrid, els.board, els.deck);
  initTips();
  // Tam ekran ve yatay kilit yalnız destekleyen tarayıcıda (Android Chrome) önerilir; iPhone'da düğme görünmez.
  document.body.classList.toggle('can-fs', !!(document.documentElement.requestFullscreen && screen.orientation?.lock));
  setMusic('game');
  // Oyuncu satırının üstüne gelince (ya da odaklanınca) o oyuncunun mülkleri tahtada parlar, diğerleri solar.
  const rowOf = (e) => {
    const r = e.target.closest && e.target.closest('.prow');
    return r ? Number(r.dataset.p) : null;
  };
  els.players.addEventListener('mouseover', (e) => focusPlayer(rowOf(e)));
  els.players.addEventListener('mouseleave', () => focusPlayer(null));
  els.players.addEventListener('focusin', (e) => focusPlayer(rowOf(e)));
  els.players.addEventListener('focusout', () => focusPlayer(null));
  // Kendiliğinden tur bitirmeyi durduran her etkileşim: ele gelmek, Turu bitir dışında bir yere basmak.
  els.handPanel.addEventListener('mouseenter', cancelAutoEnd);
  root.querySelector('.game').addEventListener('pointerdown', (e) => {
    if (!e.target.closest('[data-act="endTurn"]')) cancelAutoEnd();
  });
  // Zarı tutup savurma: Zar At düğmesine ya da tepside bekleyen zarlara basılı tut, sürükle, bırak.
  // Basıp hemen bırakmak da olur (zarlar ileri savrulur); klavyeyle Zar At her zamanki gibi atar.
  els.center.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-act="roll"]');
    const ok = btn ? !btn.disabled : !!e.target.closest('#dice');
    if (!ok || e.button !== 0 || calm() || !app.view || !canToss(app.view)) return;
    e.preventDefault();
    // Parmakla tutulan zarlar parmağın biraz üstünde durur; yoksa başparmak onları örter.
    const lift = e.pointerType === 'mouse' ? 0 : dice.size() * 1.2;
    dice.hold(e.clientX, e.clientY - lift);
    const move = (ev) => dice.move(ev.clientX, ev.clientY - lift);
    const end = (ev) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', end);
      removeEventListener('pointercancel', end);
      if (ev.type === 'pointercancel') return dice.drop();
      dice.release(ev.clientX, ev.clientY - lift);
      const b = els.prompt.querySelector('[data-act="roll"]');
      if (b) b.disabled = true; // ardından gelen tıklama ikinci kez atmasın
      act({ type: 'roll' });
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
  });
  // Dokunmatikte uzun basma menü açmasın (menü dokunuşu iptal eder, zarlar elden düşer).
  root.querySelector('.game').addEventListener('contextmenu', (e) => {
    if (matchMedia('(hover: none)').matches && !e.target.closest('input, textarea')) e.preventDefault();
  });
}

function focusPlayer(p) {
  if (app.ui.focusP === p) return;
  app.ui.focusP = p;
  paintFocus();
}

function paintFocus() {
  const v = app.view;
  const p = v && !app.ui.pick ? app.ui.focusP : null;
  const on = p !== null && p !== undefined && !!v.players[p];
  els.board.classList.toggle('pfocus', on);
  cells.forEach((el, q) => el.classList.toggle('phit', on && v.props[q]?.owner === p));
}

export const gameMounted = () => !!els && document.body.contains(els.board);
// Ev sahibi hamleyi reddedince istem aynı kalır; basılıp kilitlenen düğmeler yeniden açılsın diye baştan çizilir.
export function unlockPrompt() {
  if (!els) return;
  els.prompt._last = null;
  updateGame();
}
export const unmountGame = () => {
  els = null;
};

// ---------- yardımcılar ----------

const P = (v, i) => v.players[i];
const meName = (v, i) => (i === v.you ? 'Sen' : P(v, i).name);
// Endeks ve şehir çarpanıyla ölçeklenmiş tutar (kira tablosu için).
const scaled = (v, sq, x) => Math.max(5, Math.round((x * (v.index / 100) * (BOARD[sq].group ? v.groupMult[BOARD[sq].group] || 1 : 1)) / 5) * 5);
const destOf = (v, steps, backward) => (v.players[v.you].pos + (backward ? -steps : steps) + N * 2) % N;
const myTurnFree = (v) => v.phase === 'play' && !v.pending && v.turn && v.turn.p === v.you;
export const canManage = (v) => myTurnFree(v) && ['preroll', 'free'].includes(v.turn.step);

export { canPlay };

// Oyun hızı çarpanı (lobi ayarı); animasyon süreleri ev sahibinin beklemesiyle aynı oranda uzar.
const spd = () => SPEEDS[app.lobby?.config?.speed] || 1;
const hostNow = () => Date.now() + (app.clockOffset || 0);

// Süre çubuğu: ince ve sakin; saniye yalnız son 10 saniyede görünür. Toplam süre ev sahibinden gelir.
function timerHTML(v, ids) {
  const dl = app.meta && app.meta.deadlines;
  if (!dl) return '';
  const ds = ids.map((i) => dl[P(v, i)?.id]).filter((d) => d && d.at);
  if (!ds.length) return '';
  const d = ds.reduce((a, b) => (b.at < a.at ? b : a));
  const mine = ids.includes(v.you) ? 'data-mine' : '';
  // Kısa pencerede (Kestirme) çubuk saniyelik adımlarla değil, akarak boşalır.
  const left = Math.max(0, d.at - hostNow());
  const run = d.span <= 5000 ? raw(`style="width:${Math.min(100, (left / d.span) * 100)}%;animation:timerRun ${left}ms linear forwards"`) : '';
  return html`<div class="timer" data-deadline="${d.at}" data-span="${d.span}" ${raw(mine)} aria-label="Kalan süre"><i ${run}></i></div><div class="countdown" data-countdown="${d.at}"></div>`;
}

// Mülkün şu anki seviyesi tapu cetvelinde hangi satır: arsa 0, tam set 0.5, katlar 1-4.
function levelRow(v, sq) {
  const ps = v.props[sq];
  if (!ps || ps.owner === null) return undefined;
  if (BOARD[sq].kind !== 'prop') return 1;
  const L = E.level(ps);
  return L ? L : E.ownsGroup(v, ps.owner, BOARD[sq].group) ? 0.5 : 0;
}

// ---------- sağ sütun üstü ----------

const MOD_LABEL = {
  turizm: 'Antalya, İzmir kira ×2', ulasimZam: 'Gar ve havalimanı ×2', kiraTavani: 'Kiralar yarı', kiraArtisi: 'Kiralar ×1,5', grev: 'Maaş yok',
  durgunluk: 'Kat dikilmez', kampanya: 'Kat yarı fiyat', faizIndirimi: 'İpotek kaldırma yarı', zabitaIzinde: 'Zabıta izinde',
};

function updateHead(v) {
  const goal = v.config.targetScore;
  const r = v.round || 0;
  const tail = goal ? html`<span class="muted small" data-tip="Biri bu değere ulaşınca o tur biter, Seçim Günü gelir">· ${M(goal)}</span>` : html`<span class="muted small">/${v.config.maxRounds}</span>`;
  const iflas = v.config.iflas ? html`${I('up')}<b class="num small" data-tip="Son kalan modunda kiralar her tur artar">×${E.iflasMult(v).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</b>` : '';
  setHTML(els.round, html`<b class="num">${r}</b>${tail}${iflas}`);
  setHTML(els.audio, I(isMuted() ? 'mute' : 'sound'));
  setHTML(els.theme, I(document.body.classList.contains('dark') ? 'sun' : 'moon'));
  els.audio.classList.toggle('on', !!app.ui.audioOpen);
}

// ---------- tahtanın ortası ----------

function gundemHTML(v) {
  const max = v.config.maxRounds;
  const last = v.finalRound || (v.round && v.round >= max);
  if (!v.gundem) {
    const left = max - v.round;
    const road = last ? 'Son tur: Seçim Günü geliyor' : v.config.iflas ? `Son kalan kazanır · ayakta ${E.activePlayers(v).length}` : v.config.targetScore ? `İlk ${fmt(v.config.targetScore)} değer turu bitirir` : `Seçime ${left} tur var`;
    return html`<div class="gpill" aria-label="${road}">${I('trophy')}<span class="h16">${road}</span></div>`;
  }
  const g = GUNDEM[v.gundem.id];
  const mods = Object.keys(v.mods).map((m) => MOD_LABEL[m]).filter(Boolean);
  const left = Math.max(0, v.gundem.until - v.round) + 1;
  const ring = last ? html`<span class="ring" data-tip="Son tur">${I('trophy')}</span>` : html`<span class="ring" data-tip="Gündem ${GUNDEM_PERIOD} turda bir değişir; bu gündemin ${left} turu kaldı">${left}</span>`;
  const open = app.ui.gundemOpen;
  return html`<button class="gpill" data-act="gundem" aria-expanded="${open ? 'true' : 'false'}" aria-label="Gündem: ${g.name}, ayrıntı">${I(GUNDEM_IC[v.gundem.id] || 'news')}<span class="h16">${g.name}</span>${mods.length ? html`<span class="chip">${mods[0]}</span>` : ''}${ring}</button>
    ${open ? html`<div class="gdetail sheet"><div class="sheet-head">${I('news')}<span class="h18">${g.name}</span><span class="grow"></span><button class="btn S sq ton" data-act="gundem" aria-label="Kapat">${I('close')}</button></div><span class="body">${g.text}${v.gundem.detail ? ` ${v.gundem.detail}` : ''}</span>${mods.length > 1 ? html`<div class="row" style="flex-wrap:wrap">${mods.map((m) => html`<span class="chip">${m}</span>`)}</div>` : ''}<span class="note">${I('timer')}Gündem ${GUNDEM_PERIOD} turda bir değişir.${last ? ' Bu son tur.' : ` ${left} tur daha geçerli.`}</span></div>` : ''}`;
}

function bannerHTML() {
  if (app.status !== 'reconnecting') return '';
  return html`<div class="banner" role="status">${I('plug')}<span class="h16">Bağlantı koptu</span><span class="muted small">yeniden bağlanılıyor</span><span class="spinner"></span></div>`;
}

const SPECIAL_INFO = {
  start: "Buradan geçince ya da buraya gelince maaş alırsın. Elinde 5'ten az kart varsa 1 Hamle kartı da gelir.",
  chance: 'Buraya gelince 2 Hamle kartı çekersin.',
  surpriz: 'Rastgele bir sürpriz hemen uygulanır: miras, ceza, düğün, ışınlanma, kapkaç…',
  tapu: 'Tahtadaki sahipsiz herhangi bir arsayı fiyatına alabilirsin.',
  cay: 'Diğer herkes sana çay parası öder.',
  zabita: 'Kaçak katı olan bir rakibi ihbar edersin: kaçakları yıkılır.',
};

// Kareye tıklayınca açılan pencere: tapu kartı ve kira cetveli. Kendi karende kat dik / kaçak kat / kat sat / ipotek.
function popHTML(v, sq) {
  const s = BOARD[sq];
  const ps = v.props[sq];
  const close = html`<button class="btn S sq ton" data-act="popClose" aria-label="Kapat">${I('close')}</button>`;
  if (!ps) {
    return html`<div class="pop-side" style="width:260px"><div class="row">${I(s.kind)}<span class="h16">${s.name}</span><span class="grow"></span>${close}</div><span class="body">${SPECIAL_INFO[s.kind]}</span></div>`;
  }
  const me = v.you;
  const owner = ps.owner === null ? null : P(v, ps.owner);
  const full = owner && s.kind === 'prop' && E.ownsGroup(v, ps.owner, s.group);
  const card = deed(v, sq, { w: 240, ladder: true, level: levelRow(v, sq) });
  const tapu = tapuSquares(v)?.includes(sq);
  if (ps.owner !== me || me < 0) {
    const head = owner
      ? html`<div class="row" style="gap:8px">${PW(owner, 24)}<span class="h16">${owner.name}</span>${full ? I('star') : ''}<span class="grow"></span>${close}</div>`
      : html`<div class="row" style="gap:8px"><span class="h16">Sahipsiz</span><span class="grow"></span>${close}</div>`;
    const notes = [];
    if (owner && s.kind === 'prop' && !full && E.level(ps)) notes.push('Set tamamlanmadığı için kat kiraları yarı.');
    if (ps.tedbir > 0) notes.push(`İhtiyati tedbir: ${ps.tedbir} sıra kira yok.`);
    return html`<div class="col" style="gap:8px">${head}${card}${notes.map((n) => html`<span class="note">${I('info')}${n}</span>`)}${tapu ? html`<button class="btn pri full" data-act="tapuBuy" data-sq="${sq}">${I('tapu')}Tapudan al ${M(E.price(v, sq))}</button>` : ''}</div>`;
  }
  // Benim karem: işlemler yalnız sıra bendeyken.
  const manage = canManage(v);
  const lock = manage ? '' : html`<span class="note">${I('timer')}Kat ve ipotek işlemleri sıra sendeyken.</span>`;
  const side = [];
  side.push(html`<div class="row" style="gap:6px"><span class="h16">Senin</span>${full ? html`${I('star')}<span class="muted small">${GROUPS[s.group].name} seti</span>` : ''}<span class="grow"></span>${close}</div>`);
  if (s.kind === 'prop') {
    const L = E.level(ps);
    const legal = E.buildBlock(v, me, sq, false);
    const kacak = E.buildBlock(v, me, sq, true);
    if (!legal && L < 4) {
      const now = E.rentFor(v, sq);
      const next = scaled(v, sq, s.rents[L + 1]);
      side.push(html`<div class="preview">${I('house')}${L}${I('arrow')}${L + 1} kat<span class="grow"></span>kira <b class="num">${now}</b>${I('arrow')}<b class="num">${next}</b></div>`);
    }
    side.push(html`<button class="btn pri full" data-act="build" data-sq="${sq}" ${!manage || legal ? 'disabled' : ''} data-tip="${legal || ''}">${I('house')}Kat dik ${M(E.katCost(v, sq))}</button>`);
    side.push(html`<button class="btn sec full" data-act="buildKacak" data-sq="${sq}" ${!manage || kacak ? 'disabled' : ''} data-tip="${kacak || ''}">${I('kacak')}Kaçak kat ${M(E.kacakCost(v, sq))}</button>`);
    side.push(html`<span class="muted small">${legal && legal.includes('tüm mülkleri') ? 'Yasal kat için şehrin hepsi sende olmalı. ' : ''}Kaçak kat ucuz ama Zabıta ve İhbar ile yıkılır.</span>`);
    const sell = L > 0 ? html`<button class="btn ton flex" data-act="sellFloor" data-sq="${sq}" ${manage ? '' : 'disabled'}>Kat sat ${M(Math.round(E.katValue(v, sq) / (ps.kacak ? 20 : 10)) * 5, true)}</button>` : '';
    side.push(html`<div class="row" style="gap:6px">${sell}${mortBtn(v, sq, manage)}</div>`);
  } else side.push(html`<div class="row" style="gap:6px">${mortBtn(v, sq, manage)}</div>`);
  if (ps.tedbir > 0) side.push(html`<span class="note">${I('tedbir')}İhtiyati tedbir: ${ps.tedbir} sıra kira yok, kat dikilmez.</span>`);
  side.push(lock);
  return html`${card}<div class="pop-side">${side}</div>`;
}

function mortBtn(v, sq, manage) {
  const ps = v.props[sq];
  if (ps.ipotek) {
    const cost = E.unmortgageCost(v, sq);
    const poor = P(v, v.you).cash < cost;
    return html`<button class="btn ton flex" data-act="unmortgage" data-sq="${sq}" ${!manage || poor ? 'disabled' : ''} data-tip="${poor ? 'Paran yetmiyor.' : ''}">${I('ipotek')}Kaldır ${M(-cost)}</button>`;
  }
  const floors = E.level(ps) > 0;
  return html`<button class="btn ton flex" data-act="mortgage" data-sq="${sq}" ${!manage || floors ? 'disabled' : ''} data-tip="${floors ? 'Önce katları sat.' : ''}">${I('ipotek')}İpotek ${M(E.mortgageValue(v, sq), true)}</button>`;
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
  els.pop.setAttribute('role', 'dialog');
  const c = cells[sq];
  const pw = els.pop.offsetWidth;
  const ph = els.pop.offsetHeight;
  const bw = els.board.clientWidth;
  const bh = els.board.clientHeight;
  const side = cellPos(sq).side;
  // Pencere karenin tahta ortasına bakan tarafında açılır, kareleri kapatmamaya çalışır.
  const toward = (pos, size, len, total) => (pos < total / 2 ? pos + size + 8 : pos - len - 8);
  let x = c.offsetLeft + c.offsetWidth / 2 - pw / 2;
  let y = c.offsetTop + c.offsetHeight / 2 - ph / 2;
  if (side === 'b' || side === 't' || side === 'c') y = toward(c.offsetTop, c.offsetHeight, ph, bh);
  if (side === 'l' || side === 'r' || side === 'c') x = toward(c.offsetLeft, c.offsetWidth, pw, bw);
  // Sığıyorsa tahtanın ortasında kalır (kenar kareleri kapatmaz), sığmazsa tahtanın içinde.
  const clamp = (val, len, total, edge) => (len + 2 * edge + 12 <= total ? Math.max(edge + 6, Math.min(total - edge - len - 6, val)) : Math.max(6, Math.min(total - len - 6, val)));
  els.pop.style.left = `${clamp(x, pw, bw, c.offsetWidth)}px`;
  els.pop.style.top = `${clamp(y, ph, bh, c.offsetHeight)}px`;
}

const waitHTML = (v, i, text, sub = '') =>
  html`<div class="stagebox"><span class="wait-ring" style="--pc:${P(v, i).color}">${PW(P(v, i), 64)}</span><span class="h22">${text}</span>${sub ? html`<span class="muted">${sub}</span>` : ''}<div style="width:260px">${timerHTML(v, [i])}</div></div>`;

// İtiraz zinciri tek görselde: asıl kart solda, gelen itirazlar sağa doğru kayarak üstüne biner (yazısız, yalnız kart).
const chainHTML = (id, n) =>
  n ? html`<div class="chain" style="--n:${n}">${cardFace(id, 'big')}${[...Array(n).keys()].map((k) => html`<div class="chain-it" style="--k:${k + 1}">${cardFace('itiraz', 'big')}</div>`)}<span class="chain-n">${n} itiraz</span></div>` : cardFace(id, 'big');

const vs = (v, a, b) => html`<div class="row" style="gap:8px">${PW(P(v, a), 32)}<span class="muted">${I('arrow')}</span>${PW(P(v, b), 32)}</div>`;

function promptHTML(v) {
  const me = v.you;
  const pd = v.pending;
  if (v.phase === 'over') {
    const w = P(v, v.results.ranking[0]);
    const why = E.activePlayers(v).length === 1 ? 'Rakiplerin hepsi iflas etti.' : 'Seçim Günü geldi, sandıklar açıldı.';
    return html`<div class="stagebox">${I('crown')}<span class="wait-ring" style="--pc:${w.color}">${PW(w, 64)}</span><span class="h28">${w.name} kazandı</span><span class="muted">${why}</span>
      <div class="row"><button class="btn L pri" data-act="results" data-primary>${I('trophy')}Sonuçlar</button></div></div>`;
  }
  if (app.ui.pick) {
    const id = cardId(app.ui.pick.uid);
    const c = CARDS[id];
    const step = c.target === 'swap' ? (app.ui.swapMine === null ? '1) Vereceğin mülkü seç' : `2) ${BOARD[app.ui.swapMine].name} karşılığı alacağını seç`) : 'Parlayan bir mülke tıkla';
    return html`<div class="card-prompt">${cardFace(id, 'big glow')}<div class="opt-col"><span class="h22">${c.name}</span><span class="hint">${I('target')}${step}</span><span class="body">${c.text}</span><button class="btn sec" data-act="pickCancel" style="align-self:flex-start">Vazgeç</button>${timerHTML(v, [me])}</div></div>`;
  }
  if (pd) return pendingHTML(v, pd);
  const t = v.turn;
  if (t.p !== me) {
    const doing = { preroll: 'zar atmak üzere', choose: 'zarına bakıyor', free: 'işlerini hallediyor' }[t.step];
    return waitHTML(v, t.p, `${P(v, t.p).name} ${doing}`);
  }
  const pl = P(v, me);
  if (t.step === 'preroll') {
    return html`<div class="stagebox"><div class="who">${t.doubles ? 'Çift attın, bir daha!' : 'Sıra sende'}</div>${t.backward ? html`<span class="hint">${I('arrowL')}Geri vitestesin: bu tur geri gideceksin</span>` : ''}
      <button class="btn L pri" style="min-width:240px" data-act="roll" data-primary>${I('dice')}Zar At</button><div style="width:260px">${timerHTML(v, [me])}</div></div>`;
  }
  if (t.step === 'choose') {
    // Kısa, tıklamasız pencere (ev sahibi bekler, sonra toplam kadar yürütür). Kartı olmayan yalnız zarı görür;
    // kartı olanın Toplam düğmesi de yok: kimse erken geçemez, kimde Kestirme olduğu sızmaz.
    const kes = !t.hamle && pl.hand.find((u) => cardId(u) === 'kestirme');
    if (!kes) return '';
    const go = (n) => BOARD[destOf(v, n, t.backward)].name;
    return html`<div class="card-prompt">${cardFace('kestirme', 'big glow')}<div class="opt-col"><span class="h22">Kestirme</span><span class="muted">Oynamazsan toplam ${t.dice[0] + t.dice[1]} kare gidersin</span>
      <div class="row">${[0, 1].map((d) => html`<button class="btn L sec flex" data-act="kestirme" data-die="${d}" data-uid="${kes}">${t.dice[d]}${I('arrow')}${go(t.dice[d])}</button>`)}</div>${timerHTML(v, [me])}</div></div>`;
  }
  // serbest evre
  if (pl.cash < 0) return debtHTML(v);
  const hints = [];
  if (!t.hamle && pl.hand.some((u) => canPlay(v, u))) hints.push(html`<span class="hint">${I('bolt')}Kart oynayabilirsin</span>`);
  if (E.propsOf(v, me).some((q) => !E.buildBlock(v, me, q, false))) hints.push(html`<span class="hint">${I('home')}Kat dikebilirsin</span>`);
  return html`<div class="stagebox"><div class="who">${BOARD[pl.pos].name}</div>${hints.length ? html`<div class="row">${hints}</div>` : ''}
    ${endButton(v)}<div style="width:260px">${timerHTML(v, [me])}</div></div>`;
}

// Turu bitir düğmesi. Yapacak bir şey kalmadıysa 3 sn geri sayar (düğmenin altında boşalan çubuk ve saniye),
// süre dolunca tur kendiliğinden biter; ele gelmek, pencere açmak ya da tahtaya tıklamak bu tur için durdurur.
function endButton(v) {
  const t = v.turn;
  const label = t.again ? html`${I('dice')}Çift attın: bir daha at` : html`Turu bitir ${I('arrow')}`;
  const a = autoEnd.at && autoEnd.key === turnKey(v) ? autoEnd.at : 0;
  const left = a ? Math.max(0, a - Date.now()) : 0;
  const run = a ? html` <span class="autoend" data-autoend="${a}">${Math.ceil(left / 1000)}</span>` : '';
  const bar = a ? raw(`style="min-width:240px;--auto:${AUTO_END_MS}ms;--auto-at:-${AUTO_END_MS - left}ms"`) : raw('style="min-width:240px"');
  return html`<button class="btn L pri ${a ? 'autorun' : ''}" ${bar} data-act="endTurn" data-primary>${label}${run}</button>`;
}

// Kendiliğinden tur bitirme (yalnız istemci; ev sahibine normal endTurn gider).
const autoEnd = { key: '', at: 0, off: false, timer: 0, tick: 0 };
const turnKey = (v) => (v.turn ? `${v.round}:${v.turn.p}:${v.turn.doubles || 0}` : '');

function stopAutoEnd(off) {
  clearTimeout(autoEnd.timer);
  clearInterval(autoEnd.tick);
  autoEnd.at = 0;
  if (off) autoEnd.off = true;
}

function planAutoEnd(v) {
  const key = turnKey(v);
  if (autoEnd.key !== key) {
    stopAutoEnd(false);
    Object.assign(autoEnd, { key, off: false });
  }
  const busy = !!app.ui.dialog || !!app.ui.pick || (app.ui.popSq !== null && app.ui.popSq !== undefined) || !!app.ui.resultsOpen;
  if (busy && autoEnd.at) return stopAutoEnd(true); // pencere açıldı: bu tur kendiliğinden bitmez
  if (autoEnd.off || busy || animating || !idleTurn(v)) return stopAutoEnd(false);
  if (autoEnd.at) return;
  autoEnd.at = Date.now() + AUTO_END_MS;
  autoEnd.tick = setInterval(paintAutoEnd, 200);
  autoEnd.timer = setTimeout(() => {
    const cur = app.view;
    stopAutoEnd(true); // bir turda bir kez
    if (els && cur && turnKey(cur) === key && idleTurn(cur)) act({ type: 'endTurn' });
  }, AUTO_END_MS);
}

function paintAutoEnd() {
  for (const el of document.querySelectorAll('[data-autoend]')) el.textContent = Math.max(1, Math.ceil((Number(el.dataset.autoend) - Date.now()) / 1000));
}

export function cancelAutoEnd() {
  if (!autoEnd.at) return;
  stopAutoEnd(true);
  if (els && app.view) updateGame();
}

// Borç: satılabilecekler sırasıyla, otomatik kapat ya da kendin seç (İnşaat/İpotek).
function debtHTML(v) {
  const me = v.you;
  const pl = P(v, me);
  const rows = [];
  for (const q of E.propsOf(v, me)) {
    const ps = v.props[q];
    if (ps.kacak) rows.push(html`<div class="line-row">${I('kacak')}<span class="grow">${BOARD[q].name} kaçak katı</span><b class="num pos">+${Math.round(E.katValue(v, q) / 20) * 5}</b></div>`);
    else if (ps.kat) rows.push(html`<div class="line-row">${I('house')}<span class="grow">${BOARD[q].name} katı</span><b class="num pos">+${Math.round(E.katValue(v, q) / 10) * 5}</b></div>`);
    else if (!ps.ipotek) rows.push(html`<div class="line-row">${I('ipotek')}<span class="grow">${BOARD[q].name} ipotek</span><b class="num pos">+${E.mortgageValue(v, q)}</b></div>`);
  }
  return html`<div class="sheet W"><div class="sheet-head">${I('warning')}<span class="h22">Borçtasın</span><span class="h22 neg">${M(pl.cash)}</span></div>
    <span class="body">Sıranı bitirmeden kapat. Önce kaçak katlar, sonra katlar, sonra ipotek.</span>
    ${rows.length ? html`<div class="sheet-body" style="max-height:200px">${rows.slice(0, 6)}</div>` : ''}
    <div class="row"><button class="btn L pri flex" data-act="settleDebt" data-primary>Borcu kapat</button><button class="btn L sec" data-act="tool" data-k="build">Kendim seçeyim</button></div>
    <div class="note">${I('iflas')}${v.config.iflas ? 'Satacak bir şey kalmazsa iflas edip oyundan çıkarsın.' : `Satacak bir şey kalmazsa konkordato: borç silinir, sonda −${v.config.konkordatoPenalty} puan.`}</div></div>`;
}

function pendingHTML(v, pd) {
  const me = v.you;
  switch (pd.type) {
    case 'buy': {
      if (pd.p !== me) return waitHTML(v, pd.p, `${P(v, pd.p).name} karar veriyor`, `${BOARD[pd.sq].name}: ${v.config.rules.ihale ? 'alacak mı, artırmaya mı çıkaracak?' : 'alacak mı?'}`);
      const cost = E.price(v, pd.sq);
      const cash = P(v, me).cash;
      const paz = P(v, me).hand.find((u) => cardId(u) === 'pazarlik');
      const half = Math.round(cost / 10) * 5;
      return html`<div class="card-prompt" style="gap:34px">${deed(v, pd.sq, { w: 270 })}<div class="opt-col" style="width:260px">
        <button class="btn L pri full" data-act="buy" data-primary ${cash < cost ? 'disabled' : ''}>Satın al ${M(cost)}</button>
        <button class="btn L sec full" data-act="decline">${v.config.rules.ihale ? html`${I('gavel')}Açık artırma` : 'Alma'}</button>
        ${paz && !v.turn.hamle && cash >= half ? html`<button class="btn sec full" data-act="pazarlik" data-uid="${paz}">${I('deal')}Pazarlık Ustası ${M(half)}</button>` : ''}
        ${cash < cost ? html`<p class="reason">Nakdin yetmiyor${v.config.rules.ihale ? '; artırmaya çıkarabilirsin.' : '.'}</p>` : ''}${timerHTML(v, [me])}</div></div>`;
    }
    case 'auction':
      return auctionHTML(v, pd);
    case 'react': {
      const c = pd.card;
      const target = c.target && c.target.sq !== undefined ? deed(v, c.target.sq, { w: 150, mini: true }) : c.target && c.target.theirs !== undefined ? html`<div class="row">${deed(v, c.target.mine, { mini: true })}${I('swap2')}${deed(v, c.target.theirs, { mini: true })}</div>` : '';
      const head = html`${vs(v, c.by, pd.victim)}`;
      if (pd.responder !== me) {
        return html`<div class="card-prompt">${chainHTML(c.id, pd.chain)}<div class="opt-col">${head}<span class="h22">${P(v, c.by).name}, ${P(v, pd.victim).name} için</span>${target}<span class="body">${cardEffect(v, { card: c.id, target: c.target, p: c.by })}</span><span class="muted">Karar veriliyor</span>${timerHTML(v, [pd.responder])}</div></div>`;
      }
      const it = P(v, me).hand.find((u) => cardId(u) === 'itiraz');
      const counter = me === c.by;
      const title = counter ? `${P(v, pd.victim).name} itiraz etti` : `${P(v, c.by).name} sana oynadı`;
      return html`<div class="card-prompt">${chainHTML(c.id, pd.chain)}<div class="opt-col">${head}<span class="h22">${title}</span>${target}<span class="body">${cardEffect(v, { card: c.id, target: c.target, p: c.by })}</span>
        <div class="row">${it ? html`<button class="btn L pri flex" data-act="react" data-uid="${it}" data-primary>${I('shield')}${counter ? 'Karşı itiraz' : 'İtiraz et'}</button>` : ''}<button class="btn L ${it ? 'sec' : 'pri flex'}" data-act="react" data-uid="" ${it ? '' : 'data-primary'}>${counter ? 'Vazgeç' : 'Kabul'}</button></div>${timerHTML(v, [me])}</div></div>`;
    }
    case 'rent': {
      const owner = P(v, pd.owner);
      const info = html`<div class="row" style="gap:10px">${deed(v, pd.sq, { mini: true, w: 130 })}<span class="row muted" style="gap:6px">${PW(owner, 24)}${owner.name}${pd.zam ? ' · Kira Zammı ×2' : ''}</span></div>`;
      if (pd.p !== me) return html`<div class="stagebox"><span class="row" style="gap:10px">${PW(P(v, pd.p), 40)}<span class="h22">${P(v, pd.p).name} kira ödüyor</span><span class="big-num" style="font-size:34px">${M(pd.amount)}</span></span>${info}<span class="muted">Karar veriliyor</span><div style="width:300px">${timerHTML(v, [pd.p])}</div></div>`;
      const dayi = P(v, me).hand.find((u) => cardId(u) === 'dayi');
      const col = html`<div class="opt-col"><div class="row" style="align-items:baseline"><span class="h22">Kira</span><span class="big-num">${M(pd.amount)}</span></div>${info}
        <div class="row">${dayi ? html`<button class="btn L pri flex" data-act="react" data-uid="${dayi}" data-primary>${I('shield')}Dayın Çıktı</button>` : ''}<button class="btn L ${dayi ? 'sec' : 'pri flex'}" data-act="react" data-uid="" ${dayi ? '' : 'data-primary'}>Öde</button></div>${timerHTML(v, [me])}</div>`;
      return dayi ? html`<div class="card-prompt">${cardFace('dayi', 'big glow')}${col}</div>` : col;
    }
    case 'tapu': {
      if (pd.p !== me) return waitHTML(v, pd.p, `${P(v, pd.p).name} Tapu Dairesi'nde`, 'sahipsiz bir arsa seçiyor');
      const sel = app.ui.popSq;
      const pick = sel !== null && sel !== undefined && tapuSquares(v)?.includes(sel) ? sel : null;
      return html`<div class="card-prompt"><div class="opt-col" style="width:260px"><div class="row">${I('tapu')}<span class="h22">Tapu Dairesi</span></div><span class="hint">${I('target')}Parlayan bir arsa seç</span>
        ${pick !== null ? html`<button class="btn L pri full" data-act="tapuBuy" data-sq="${pick}">Tapudan al ${M(E.price(v, pick))}</button>` : ''}
        <button class="btn gho" data-act="tapuBuy" data-sq="">Bir şey alma</button>${timerHTML(v, [me])}</div>${pick !== null ? deed(v, pick, { w: 230, ladder: true }) : ''}</div>`;
    }
    case 'zabita': {
      if (pd.p !== me) return waitHTML(v, pd.p, `${P(v, pd.p).name} zabıtaya kimi ihbar edecek?`);
      return html`<div class="stagebox"><span class="art" style="width:56px;height:56px">${raw(ic('zabita'))}</span><span class="h22">Kimi ihbar ediyorsun?</span><span class="body">Kaçak katları yıkılır, kat başı ceza öder.</span>
        <div class="row" style="flex-wrap:wrap;justify-content:center">${pd.options.map((o) => html`<button class="btn sec" style="--pc:${P(v, o).color};box-shadow:inset 0 0 0 2px var(--pc);padding-left:8px" data-act="zabita" data-p="${o}">${PW(P(v, o), 28)}${P(v, o).name}<span class="chip">${I('kacak')}${E.floorsOf(v, o).kacak}</span></button>`)}</div>
        <div style="width:300px">${timerHTML(v, [me])}</div></div>`;
    }
    case 'trade':
      return tradePendingHTML(v, pd);
    case 'discard': {
      if (pd.p !== me) return waitHTML(v, pd.p, `${P(v, pd.p).name} fazla kartlarını atıyor`);
      const n = app.ui.selected.length;
      return html`<div class="stagebox">${I('cards')}<span class="h22">Elinde ${P(v, me).hand.length} kart var</span><span class="body">Sağdaki elinden ${pd.count} kart seç (seçili ${n}).</span>
        <button class="btn L pri" data-act="discardGo" ${n !== pd.count ? 'disabled' : ''} data-primary>Seçileni at</button><div style="width:260px">${timerHTML(v, [me])}</div></div>`;
    }
    default:
      return '';
  }
}

// Açık artırma: mülkün tapu kartı (üstüne gelince kira cetveli), teklif verenler piyonlarıyla, oyuncu renginde çubuk.
// Büyük sayı TOPLAM teklif; yanında ne kadar artırdığın ayrıca yazar.
function auctionHTML(v, pd) {
  const me = v.you;
  const step = E.auctionStep(v);
  const min = pd.high + step;
  const lead = pd.leader !== null ? P(v, pd.leader) : null;
  const bidders = pd.order.map((i) => {
    const st = pd.out.includes(i) ? 'out' : i === pd.leader ? 'lead' : i === pd.turn ? 'turn' : '';
    const say = st === 'out' ? 'çekildi' : st === 'lead' ? 'en yüksek teklif' : st === 'turn' ? 'sırada' : 'bekliyor';
    return html`<span class="bidder ${st}" style="--pc:${P(v, i).color}" data-tip="${meName(v, i)}: ${say}">${PW(P(v, i), 30)}</span>`;
  });
  const high = html`<div class="col" style="align-items:flex-end;gap:2px"><span class="kicker">En yüksek</span>${lead ? html`<span class="row" style="gap:6px">${PW(lead, 24)}<span class="h22">${M(pd.high)}</span></span>` : html`<span class="muted">henüz yok</span>`}</div>`;
  const card = html`<div class="deed-wrap">${deed(v, pd.sq, { w: 230 })}${deed(v, pd.sq, { w: 230, ladder: true, cls: 'hoverladder' })}</div>`;
  const head = html`<div class="row">${I('gavel')}<span class="h22">Açık artırma</span></div><div class="bidders">${bidders}</div>`;
  if (pd.turn !== me) {
    return html`<div class="card-prompt">${card}<div class="opt-col wide">${head}<div class="row" style="align-items:flex-end"><span class="h18">${P(v, pd.turn).name} düşünüyor</span><span class="grow"></span>${high}</div>${timerHTML(v, [pd.turn])}</div></div>`;
  }
  const cash = P(v, me).cash;
  app.ui.binds ||= {};
  let bid = Number(app.ui.binds.raise);
  if (!(bid >= min) || bid > cash) bid = Math.min(min, cash);
  app.ui.binds.raise = String(bid);
  const can = cash >= min;
  return html`<div class="card-prompt">${card}<div class="opt-col wide">${head}
    <div class="row" style="align-items:flex-end;gap:16px"><div class="col" style="gap:2px"><span class="kicker">Teklifin</span><span class="big-num" data-show="raise">${M(bid)}</span></div><span class="delta" data-delta="raise" data-base="${pd.high}">+${bid - pd.high}</span><span class="grow"></span>${high}</div>
    ${can ? html`<input type="range" class="rng" min="${min}" max="${cash}" step="5" data-bind="raise" aria-label="Toplam teklif" style="--c:${P(v, me).color}"><div class="rng-scale"><span>en az ${fmt(min).replace(' ₺', '')}</span><span>nakdin ${fmt(cash).replace(' ₺', '')}</span></div>` : html`<p class="reason">Nakdin en az teklife (${fmt(min)}) yetmiyor.</p>`}
    <div class="row"><button class="btn L pri flex" data-act="raiseCustom" ${can ? '' : 'disabled'} data-primary><span data-show="raise">${M(bid)}</span> ile artır</button><button class="btn L gho" data-act="auctionPass">Çekil</button></div>${timerHTML(v, [me])}</div></div>`;
}

function tradeSide(v, x) {
  const items = x.props.map((q) => deed(v, q, { mini: true }));
  if (x.cash) items.push(html`<span class="cash-chip">${M(x.cash, true)}</span>`);
  return items.length ? items : [html`<span class="muted small">hiçbir şey</span>`];
}

function tradeSummary(v, t) {
  const side = (x) => [...x.props.map((q) => BOARD[q].name), x.cash ? fmt(x.cash) : ''].filter(Boolean).join(' + ') || 'hiçbir şey';
  return html`<span class="sum-row">${side(t.give)} ${I('swap2')} ${side(t.take)}</span>`;
}

function tradePendingHTML(v, pd) {
  const me = v.you;
  if (pd.to === me) {
    const more = (pd.counter || 0) < 2;
    return html`<div class="sheet W"><div class="sheet-head">${PW(P(v, pd.from), 34)}<span class="h22">${P(v, pd.from).name} ${pd.counter ? 'karşı teklif yaptı' : 'teklif ediyor'}</span></div>
      <div class="row" style="align-items:stretch;gap:14px"><div class="trade-box"><span class="muted small">Sen alırsın</span>${tradeSide(v, pd.give)}</div><div style="display:grid;place-items:center">${I('deal')}</div><div class="trade-box"><span class="muted small">Sen verirsin</span>${tradeSide(v, pd.take)}</div></div>
      <div class="row"><button class="btn L pri flex" data-act="tradeAccept" data-primary>Kabul</button>${more ? html`<button class="btn L sec" data-act="counterOpen">${I('swap2')}Karşı teklif</button>` : ''}<button class="btn L gho" data-act="tradeReject">Reddet</button></div>${timerHTML(v, [me])}</div>`;
  }
  if (pd.from === me) {
    return html`<div class="sheet S"><div class="sheet-head"><span class="spinner"></span><span class="h18">Teklifin gönderildi</span><span class="row muted" style="gap:6px">${PW(P(v, pd.to), 24)}${P(v, pd.to).name} düşünüyor</span></div>${tradeSummary(v, pd)}${timerHTML(v, [pd.to])}
      <button class="btn sec" data-act="tradeCancel" style="align-self:flex-start">Teklifi geri çek</button></div>`;
  }
  return waitHTML(v, pd.to, `${P(v, pd.from).name}, ${P(v, pd.to).name} ile pazarlıkta`);
}

// ---------- sağ sütun ----------

function playersHTML(v) {
  const waiting = new Set(E.waitingFor(v));
  const conn = (app.meta && app.meta.connected) || {};
  return v.players
    .map((pl, i) => {
      const turn = v.phase === 'play' && v.turn && v.turn.p === i;
      const tags = [];
      if (pl.out) tags.push(html`<span data-tip="İflas etti, ${pl.out}. elenen">${I('iflas')}</span>`);
      else if (pl.bot) tags.push(html`<span data-tip="Bot oynuyor">${I('bot')}</span>`);
      else if (conn[pl.id] === false) tags.push(html`<span data-tip="Bağlantısı koptu, süre dolunca bot oynar">${I('plug')}</span>`);
      if (pl.konkordato) tags.push(html`<span data-tip="Konkordato: oyun sonunda ${pl.konkordato * v.config.konkordatoPenalty} puan ceza">${I('warning')}</span>`);
      if (pl.kiraZammi) tags.push(html`<span data-tip="Kira Zammı: tahsil edeceği ilk kira 2 katı">${I('up')}</span>`);
      const wait = waiting.has(i) && !turn && v.phase !== 'over' ? html`<span class="pwait" data-tip="Karar vermesi bekleniyor"></span>` : '';
      const label = `${pl.name}${i === v.you ? ' (sen)' : ''}, ${pl.out ? 'iflas etti' : `${fmt(pl.cash)}`}`;
      return html`<button class="prow ${turn ? 'turn' : ''} ${pl.out ? 'out' : ''}" style="--pc:${pl.color}" data-act="player" data-p="${i}" aria-label="${label}">
        <span class="disc">${PW(pl, 30)}</span><span class="pname">${pl.name}</span><span class="ptag">${tags}</span>${wait}<span class="grow"></span>
        <span class="pcash ${pl.cash < 0 ? 'neg' : ''}" data-cash="${i}">${pl.out ? 'elendi' : cashText(shownCash(i, pl.cash))}</span></button>`;
    })
    .join('');
}

// Sağ sütundaki el ve deste. İzleyicinin eli yoktur. Oyuncu ayrıntısı açıksa elin yerinde durur.
function renderHand(v) {
  const me = v.you;
  const panel = app.ui.dialog && app.ui.dialog.type === 'player';
  els.handPanel.classList.toggle('hidden', me < 0 || panel);
  els.playerPanel.classList.toggle('hidden', !panel);
  if (panel) setHTML(els.playerPanel, playerPanelHTML(v, app.ui.dialog.p));
  if (me < 0) return hand.render([], () => ({}));
  const pl = P(v, me);
  const discard = v.pending && v.pending.type === 'discard' && v.pending.p === me;
  // Sıra bendeyken şu an oynanamayan kartlar soluk durur, oynanabilenler köşesindeki şimşekle belli olur.
  const myTurn = v.phase === 'play' && v.turn && v.turn.p === me && !discard;
  hand.render(pl.hand, (u) => {
    const playable = !discard && canPlay(v, u);
    return { playable, idle: myTurn && !playable, selected: app.ui.selected.includes(u) };
  }, app.ui.newCards || []);
  app.ui.newCards = [];
  setHTML(els.handN, `${pl.hand.length}/${v.config.handLimit}`);
  setHTML(els.deck, html`${I('cards')}${v.deck}`);
}

function toolsHTML(v) {
  const d = app.ui.dialog?.type;
  const t = (k, icon, label, tip) => html`<button class="btn ${d === k ? 'on' : ''}" data-act="tool" data-k="${k}" data-tip="${tip}">${I(icon)}${label}</button>`;
  return html`${t('trade', 'deal', 'Pazarlık', 'Bir rakibe mülk ve para teklif et (sıran değilken turda bir kez)')}${t('mortgage', 'ipotek', 'İpotek', 'Mülklerini ipotek et ya da ipoteği kaldır')}${t('build', 'build', 'İnşaat', 'Bütün setlerinde kat dik ya da sat')}`;
}

// Tepki çıkartması: elin başlığında küçük düğme, açılınca 6 hazır çıkartma (serbest yazı yok).
function stickerHTML(v) {
  if (v.you < 0) return '';
  const open = app.ui.stickerOpen;
  const wait = Date.now() < (app.ui.stickerAt || 0) + STICKER_GAP;
  const menu = open ? html`<div class="sticker-pick" role="menu" aria-label="Tepki">${STICKERS.map((s, i) => html`<button class="btn S sec" role="menuitem" data-act="sticker" data-id="${i}" ${wait ? 'disabled' : ''}>${s}</button>`)}</div>` : '';
  return html`<span class="sticker-wrap"><button class="btn S sq ton ${open ? 'on' : ''}" data-act="stickers" aria-expanded="${open ? 'true' : 'false'}" aria-label="Tepki gönder" data-tip="Tepki gönder">${I('smile')}</button>${menu}</span>`;
}

// Çıkartma o oyuncunun piyonundan yükselir: tahtanın üst yarısında aşağı, alt yarısında yukarı.
export function showSticker(p, id) {
  const v = app.view;
  const pl = v && v.players[p];
  const tok = pl && tokens && tokens.els.get(pl.id);
  if (!els || !tok || !STICKERS[id]) return;
  const b = els.board.getBoundingClientRect();
  const r = tok.getBoundingClientRect();
  const x = r.left + r.width / 2 - b.left;
  const y = r.top + r.height / 2 - b.top;
  const down = y < b.height / 2;
  const el = document.createElement('span');
  el.className = `sticker ${down ? 'down' : ''}`;
  el.style.setProperty('--pc', pl.color);
  el.style.left = `${Math.max(60, Math.min(b.width - 60, x))}px`;
  el.style.top = `${down ? y + r.height * 0.4 : y - r.height * 0.6}px`;
  el.textContent = STICKERS[id];
  els.board.appendChild(el);
  play('tap');
  setTimeout(() => el.remove(), 2000);
}

function renderAudioPop() {
  if (!app.ui.audioOpen) return setHTML(els.audioPop, '');
  const a = getAudio();
  const row = (k, icon, label, color) =>
    html`<div class="col" style="gap:6px"><div class="row" style="gap:8px">${I(icon)}<span style="font-weight:600">${label}</span><span class="grow"></span><input type="checkbox" class="sw" style="--c:${color}" data-act="audioToggle" data-k="${k}" ${a[`${k}On`] ? 'checked' : ''} aria-label="${label} açık"></div>
      <input type="range" class="rng" min="0" max="100" step="5" value="${Math.round(a[k] * 100)}" data-audio="${k}" style="--c:${color};--p:${Math.round(a[k] * 100)}%" aria-label="${label} sesi"></div>`;
  const online = app.mode !== 'local';
  setHTML(els.audioPop, html`<div class="sound-pop" role="dialog" aria-label="Ses ayarları"><span class="h16">Ses</span>${row('music', 'music', 'Müzik', '#c8912f')}${row('sfx', 'sound', 'Efektler', '#2475e8')}
    ${notifySupported() ? html`<div class="row" style="gap:8px;padding-top:8px;border-top:1px solid var(--line)">${I(isNotifyOn() ? 'bell' : 'bellOff')}<span class="small">Sıra bana gelince bildir</span><span class="grow"></span><input type="checkbox" class="sw" data-act="notify" ${isNotifyOn() ? 'checked' : ''} aria-label="Bildirim"></div>` : ''}
    ${online ? html`<button class="btn S ton" data-act="copyLink">${I('link')}Davet linkini kopyala · ${app.code}</button>` : ''}</div>`);
}

// Olaylar: sade, büyük yazı; zar, yürüme, maaş gibi gürültü gizlenir. Ortada son 3 olay, geçmişte turlara ayrılmış hepsi.
const FEED_IC = { iflas: 'iflas', target: 'trophy', surpriz: 'surpriz', collapse: 'kacak', card: 'hamle', own: 'tapu', auction: 'gavel', build: 'build', demolish: 'kacak', konkordato: 'warning', tradeDone: 'deal', over: 'trophy', summary: 'news', gundem: 'news' };
const FEED_HIDE = new Set(['dice', 'move', 'bid', 'draw', 'turn', 'trade', 'auctionStart']);
const cardChip = (id) => html`<span class="cchip ${CARDS[id].type}" data-card="${id}">${CARDS[id].name}</span>`;

function feedIcon(l) {
  if (l.type === 'card' && l.card) return CARDS[l.card].type;
  if (l.type === 'money') return / \+/.test(l.text) ? 'coin' : 'coin';
  return FEED_IC[l.type] || 'info';
}

// Motorun günlük metnindeki ok karakterleri SVG oka döner (yazı tipi okları kullanılmaz).
const ARROWS = { '\u2192': 'arrow', '\u2194': 'swap2' };
const arrows = (t) => html`${t.split(/(\u2192|\u2194)/).map((x) => (ARROWS[x] ? I(ARROWS[x], 'arr') : x))}`;

function feedText(l) {
  const c = l.card && CARDS[l.card];
  if (!c) return arrows(l.text);
  const i = l.text.indexOf(c.name);
  return i < 0 ? html`${arrows(l.text)} ${cardChip(l.card)}` : html`${arrows(l.text.slice(0, i))}${cardChip(l.card)}${arrows(l.text.slice(i + c.name.length))}`;
}

const feedRows = () => app.view.log.filter((l) => l.text && !FEED_HIDE.has(l.type) && !/\((Maaş|Kat|Kaçak kat)\)$/.test(l.text));

export function renderFeed() {
  if (!els) return;
  const rows = feedRows().filter((l) => l.type !== 'gundem' && l.type !== 'round').slice(-3).reverse();
  const r = app.view.round;
  setHTML(els.feed, rows.length ? html`<span class="kicker">${r}. tur</span>${rows.map((l) => html`<div class="ev">${I(feedIcon(l))}<span>${feedText(l)}</span></div>`)}` : '');
  els.feed.classList.toggle('hidden', !rows.length || !!app.ui.dialog || app.view.phase === 'over');
}

function historyHTML() {
  const rows = [];
  let round = null;
  for (const l of feedRows().slice(-80).reverse()) {
    if (l.r !== round) {
      round = l.r;
      rows.push(html`<span class="kicker" style="padding-top:6px">${round}. tur</span>`);
    }
    if (l.type === 'round') continue;
    rows.push(html`<div class="hist-row">${I(feedIcon(l))}<span>${feedText(l)}</span></div>`);
  }
  return html`<div class="sheet L" style="max-height:100%"><div class="sheet-head">${I('history')}<span class="h22">Son olaylar</span><span class="grow"></span><button class="btn S sq ton" data-act="close" aria-label="Kapat">${I('close')}</button></div><div class="sheet-body">${rows}</div></div>`;
}

// ---------- pencereler (tahtanın ortasında) ----------

const sheetHead = (icon, title, extra = '') => html`<div class="sheet-head">${I(icon)}<span class="h22">${title}</span>${extra}<span class="grow"></span><button class="btn S sq ton" data-act="close" aria-label="Kapat">${I('close')}</button></div>`;

function cardDialog(v, uid) {
  const id = cardId(uid);
  const c = CARDS[id];
  const me = v.you;
  const timing = c.type === 'tepki' ? 'Gerektiğinde sana sorulur' : WHEN[c.when] || 'Sıra sendeyken';
  const top = html`<div class="row">${I(c.type)}<span class="h22">${c.name}</span><span class="grow"></span><button class="btn S sq ton" data-act="close" aria-label="Kapat">${I('close')}</button></div><span class="card-text">${c.text}</span><span class="chip" style="align-self:flex-start">${I('timer')}${timing}</span>`;
  if (!canPlay(v, uid)) {
    let why = 'Bu kart şu an oynanamaz.';
    if (c.type === 'tepki') why = 'Bu bir tepki kartı; zamanı gelince sana sorulur.';
    else if (!v.turn || v.turn.p !== me) why = 'Hamle kartları sıra sendeyken oynanır.';
    else if (v.turn.hamle) why = 'Bu tur zaten bir Hamle kartı oynadın.';
    else if (!v.pending && E.cardTargets(v, me, id).length === 0) why = 'Bu kart için uygun hedef yok.';
    return html`<div class="sheet W"><div class="card-prompt" style="align-items:flex-start">${cardFace(id, 'big')}<div class="opt-col" style="width:auto;flex:1">${top}<span class="note">${I('info')}${why}</span></div></div></div>`;
  }
  const targets = E.cardTargets(v, me, id);
  const play = (t, label, cls = 'btn sec full') => html`<button class="${cls}" data-act="play" data-uid="${uid}" data-t="${JSON.stringify(t)}">${label}</button>`;
  let body;
  switch (c.target) {
    case 'steps':
      body = html`<span class="h18">Kaç kare gideceksin?</span><div class="steps">${targets.map((t) => html`<button data-act="play" data-uid="${uid}" data-t="${JSON.stringify(t)}"><b>${t.steps}</b><span>${BOARD[destOf(v, t.steps, false)].name}</span></button>`)}</div>`;
      break;
    case 'die':
      body = html`<div class="row">${targets.map((t) => play(t, html`${v.turn.dice[t.die]}${I('arrow')}${BOARD[destOf(v, v.turn.dice[t.die], v.turn.backward)].name}`, 'btn L sec flex'))}</div>`;
      break;
    case 'opp-player':
      body = html`<span class="h18">Kime?</span><div class="col" style="gap:8px">${targets.map((t) => play(t, html`${PW(P(v, t.player), 26)}${P(v, t.player).name}<span class="grow"></span>${id === 'ihbar' ? html`${I('kacak')}${E.floorsOf(v, t.player).kacak}` : M(P(v, t.player).cash)}`))}</div>`;
      break;
    case 'none':
      body = html`<button class="btn L pri full" data-act="play" data-uid="${uid}" data-t="{}" data-primary>${I('bolt')}Oyna</button>`;
      break;
    default:
      body = html`<button class="btn L pri full" data-act="pickBoard" data-uid="${uid}" data-primary>${I('target')}Tahtadan seç</button>`;
  }
  return html`<div class="sheet W" style="width:600px"><div class="card-prompt" style="align-items:flex-start">${cardFace(id, 'big glow')}<div class="opt-col" style="width:auto;flex:1">${top}${body}</div></div></div>`;
}

// İnşaat paneli: bütün setler tek yerde, kare başına +/- (yasal kat), toplam ve "İnşa et".
function buildDialog(v) {
  const me = v.you;
  const manage = canManage(v);
  const st = (app.ui.build ||= {});
  const mine = E.propsOf(v, me).filter((q) => BOARD[q].kind === 'prop');
  const groups = Object.keys(GROUPS).filter((g) => mine.some((q) => BOARD[q].group === g));
  let total = 0;
  const sets = groups.map((g) => {
    const full = E.ownsGroup(v, me, g);
    const qs = GROUP_SQUARES[g].filter((q) => v.props[q].owner === me);
    const rows = qs.map((q) => {
      const ps = v.props[q];
      const d = st[q] || 0;
      const lvl = E.level(ps) + d;
      total += d > 0 ? d * E.katCost(v, q) : d < 0 ? d * Math.round(E.katValue(v, q) / 10) * 5 : 0;
      const plusBlock = !full ? 'Yasal kat için şehrin hepsi gerekir.' : lvl >= 4 ? 'En üst seviye.' : d === 0 ? E.buildBlock(v, me, q, false) : null;
      const minusOk = ps.kat + Math.min(0, d) > 0 || d > 0;
      const now = E.rentFor(v, q);
      const icons = [...Array(Math.min(4, Math.max(0, ps.kat + d))).keys()].map(() => I('house'));
      if (ps.kacak) icons.push(I('kacak'));
      const kac = !full && !ps.kacak && !E.buildBlock(v, me, q, true) ? html`<button class="btn S sec" data-act="buildKacak" data-sq="${q}" ${manage ? '' : 'disabled'}>${I('kacak')}${M(E.kacakCost(v, q))}</button>` : '';
      return html`<div class="build-row"><span class="bname">${BOARD[q].name}</span><span class="blvl">${icons}</span>
        <button class="btn S sec sq" data-act="bstep" data-sq="${q}" data-d="-1" ${manage && minusOk ? '' : 'disabled'} aria-label="Azalt">${I('minus')}</button><span class="bval">${ps.kat + d}</span>
        <button class="btn S pri sq" data-act="bstep" data-sq="${q}" data-d="1" ${manage && !plusBlock ? '' : 'disabled'} data-tip="${plusBlock || ''}" aria-label="Artır">${I('plus')}</button>${kac}
        <span class="brent">kira ${now}${d ? html`${I('arrow')}${scaled(v, q, BOARD[q].rents[Math.min(4, E.level(ps) + d)])}` : ''}</span></div>`;
    });
    return html`<div class="col" style="gap:4px"><div class="set-head"><span class="cdot" style="--dc:${GROUPS[g].color}"></span>${GROUPS[g].name}<span class="muted small">${full ? `set tamam · kat ${fmt(E.katCost(v, qs[0]))}` : 'set yok · yalnız kaçak'}</span></div>${rows}</div>`;
  });
  const empty = !sets.length ? html`<span class="body">Henüz mülkün yok. Sahipsiz bir arsaya gelince satın alabilirsin.</span>` : '';
  const lock = manage ? '' : html`<span class="note">${I('timer')}Kat dikmek ve satmak yalnız sıra sendeyken.</span>`;
  const changed = Object.values(st).some((d) => d);
  return html`<div class="sheet L">${sheetHead('build', 'İnşaat', html`<span class="muted small">bütün setlerin tek yerde</span>`)}<div class="sheet-body">${sets}${empty}</div>${lock}
    <div class="sheet-foot"><span class="muted small">Toplam</span><span class="h28">${M(-total)}</span><span class="grow"></span><button class="btn gho" data-act="close">Vazgeç</button><button class="btn pri" data-act="buildGo" ${manage && changed && total <= P(v, me).cash ? '' : 'disabled'}>${I('build')}İnşa et</button></div></div>`;
}

function mortgageDialog(v) {
  const me = v.you;
  const manage = canManage(v);
  const mine = E.propsOf(v, me).sort((a, b) => a - b);
  const rows = mine.map((q) => {
    const ps = v.props[q];
    const status = ps.ipotek ? 'İpotekli: kira almaz' : E.level(ps) ? 'Önce katları sat' : `Kira ${fmt(E.rentFor(v, q))}`;
    return html`<div class="build-row" style="height:auto;padding:8px 10px">${deed(v, q, { mini: true, w: 110 })}<span class="col" style="gap:2px;flex:1"><span class="muted small">${status}</span></span>${mortBtn(v, q, manage)}</div>`;
  });
  const lock = manage ? '' : html`<span class="note">${I('timer')}İpotek işlemleri yalnız sıra sendeyken.</span>`;
  return html`<div class="sheet L">${sheetHead('ipotek', 'İpotek', html`<span class="muted small">koyunca fiyatın yarısı, kaldırınca %55</span>`)}<div class="sheet-body">${rows.length ? rows : html`<span class="body">Henüz mülkün yok.</span>`}</div>${lock}</div>`;
}

// Bana gelmiş, karşı teklif hakkı olan bir pazarlık var mı?
const counterable = (v) => v.pending && v.pending.type === 'trade' && v.pending.to === v.you && (v.pending.counter || 0) < 2;

function tradeDialog(v) {
  const me = v.you;
  const t = app.ui.trade;
  const opps = t.counter ? [t.to] : v.players.map((_, i) => i).filter((i) => i !== me && !P(v, i).out);
  if (t.to === null || !opps.includes(t.to)) t.to = opps[0];
  const col = (i, title, side, bind) => {
    const pl = P(v, i);
    const qs = E.propsOf(v, i).sort((a, b) => a - b);
    const props = qs.map((q) => {
      const ok = E.level(v.props[q]) === 0;
      return deed(v, q, { mini: true, sel: t[side].props.includes(q), off: !ok, attrs: ok ? `data-act="tradePick" data-side="${side}" data-sq="${q}" role="button" tabindex="0"` : 'data-tip="Katlı mülk takas edilemez"' });
    });
    const val = Number((app.ui.binds || {})[bind]) || 0;
    return html`<div class="trade-col" style="--pc:${pl.color}"><div class="row" style="gap:8px">${PW(pl, 24)}<span class="h16">${title}</span></div>
      <div class="trade-props">${props.length ? props : html`<span class="muted small">Mülk yok</span>`}</div>
      <div class="trade-cash"><span class="muted small">Para</span><span data-show="${bind}">${M(val)}</span></div>
      <input type="range" class="rng" min="0" max="${Math.max(0, pl.cash)}" step="10" data-bind="${bind}" style="--c:${pl.color}" ${pl.cash > 0 ? '' : 'disabled'} aria-label="${title} para"></div>`;
  };
  const { offer, empty, block } = tradeState(v);
  return html`<div class="sheet XL" style="height:100%"><div class="sheet-head">${I(t.counter ? 'swap2' : 'deal')}<span class="h22">${t.counter ? 'Karşı teklif' : 'Pazarlık'}</span><span class="grow"></span>
      <div class="partners">${opps.map((i) => html`<button class="btn S sec ${t.to === i ? 'on' : ''}" style="--pc:${P(v, i).color}" data-act="tradeTo" data-p="${i}">${PW(P(v, i), 24)}${P(v, i).name.split(' ')[0]}</button>`)}</div>
      <button class="btn S sq ton" data-act="close" aria-label="Kapat">${I('close')}</button></div>
    <div class="trade-cols">${col(me, 'Sen veriyorsun', 'give', 'tradeGive')}${col(t.to, `${P(v, t.to).name} veriyor`, 'take', 'tradeTake')}</div>
    <div class="row"><span data-trade-sum class="grow">${block ? html`<span class="reason">${block}</span>` : empty ? html`<span class="muted small">Vermek ya da almak istediğini seç.</span>` : tradeSummary(v, offer)}</span>
      <button class="btn gho" data-act="close">Vazgeç</button><button class="btn L pri" data-act="sendTrade" ${empty || block ? 'disabled' : ''}>${t.counter ? 'Karşı teklifi gönder' : 'Teklifi gönder'}</button></div></div>`;
}

// Kaydırma çubuğu oynarken pencereyi yeniden çizmeden özeti ve düğmeyi günceller.
function refreshTrade() {
  const v = app.view;
  const { offer, empty, block } = tradeState(v);
  const sum = els.modal.querySelector('[data-trade-sum]');
  const btn = els.modal.querySelector('[data-act="sendTrade"]');
  if (sum) sum.innerHTML = String(block ? html`<span class="reason">${block}</span>` : empty ? html`<span class="muted small">Vermek ya da almak istediğini seç.</span>` : tradeSummary(v, offer));
  if (btn) btn.disabled = empty || !!block;
}

// Teklifin durumu: boş mu, gönderilemiyorsa neden. Sıra beklenirken pencere açık kalır, düğme teklif yapılabilene kadar kapalı
// (açık pazarlık: sırası olmayan da, sıradaki oyuncu zar öncesi ya da serbest evredeyken turda bir teklif yapar).
function tradeState(v) {
  const offer = tradeOffer();
  const empty = !offer.give.cash && !offer.take.cash && !offer.give.props.length && !offer.take.props.length;
  const wait = app.ui.trade.counter ? null : E.tradeWait(v, v.you);
  return { offer, empty, block: wait || (empty ? null : E.tradeBlock(v, v.you, offer)) };
}

export function tradeOffer() {
  const t = app.ui.trade;
  const b = app.ui.binds || {};
  const cash = (x) => Math.max(0, Math.floor(Number(x) || 0));
  return { to: t.to, give: { cash: cash(b.tradeGive), props: t.give.props }, take: { cash: cash(b.tradeTake), props: t.take.props } };
}

function playerPanelHTML(v, p) {
  const pl = P(v, p);
  const byGroup = {};
  for (const q of E.propsOf(v, p)) (byGroup[BOARD[q].group || BOARD[q].mode] ||= []).push(q);
  const groups = Object.entries(byGroup).map(([g, qs]) => {
    const color = GROUPS[g] ? GROUPS[g].color : '#3b465c';
    const items = qs.map((q) => {
      const ps = v.props[q];
      return html`<span class="pchip">${BOARD[q].name}${ps.kat ? html`${I('house')}×${ps.kat}` : ''}${ps.kacak ? I('kacak') : ''}${ps.ipotek ? I('ipotek') : ''}</span>`;
    });
    return html`<div class="col" style="gap:4px"><div class="row" style="gap:6px"><span class="cdot" style="--dc:${color}"></span><b class="small">${GROUPS[g] ? GROUPS[g].name : E.TRANSPORT_LABEL[g]}</b>${GROUPS[g] && E.ownsGroup(v, p, g) ? I('star') : ''}</div><div class="row" style="flex-wrap:wrap;gap:4px">${items}</div></div>`;
  });
  return html`<div class="row" style="gap:10px">${PW(pl, 40)}<span class="h22">${pl.name}</span><span class="grow"></span><button class="btn S sq ton" data-act="close" aria-label="Kapat">${I('close')}</button></div>
    <div class="stat3"><div class="stat" data-tip="Nakit">${I('coin')}<b class="num">${fmt(pl.cash).replace(' ₺', '')}</b></div><div class="stat" data-tip="Net değer: nakit + mülk + katlar">${I('up')}<b class="num">${fmt(E.netWorth(v, p)).replace(' ₺', '')}</b></div><div class="stat" data-tip="Elindeki kart">${I('cards')}<b class="num">${pl.handCount}</b></div></div>
    ${pl.konkordato ? html`<span class="note">${I('warning')}Konkordato ×${pl.konkordato}: sonda −${pl.konkordato * v.config.konkordatoPenalty} puan</span>` : ''}
    ${groups.length ? groups : html`<span class="muted">Mülkü yok.</span>`}`;
}

const RULE_ITEMS = [
  ['dice', 'Zar at, ilerle', 'Sahipsiz arsayı al ya da artırmaya çıkar. Çift gelirse bir daha atarsın.'],
  ['star', 'Seti tamamla', 'Şehrin hepsi sende: kira 2 kat, yasal kat dikebilirsin.'],
  ['house', 'Kat dik', 'Karena tıkla ya da İnşaat. En fazla 4 kat.'],
  ['kacak', 'Kaçak kat', 'Set şart değil, yarı fiyat; ama Zabıta ve İhbar yıkar.'],
  ['hamle', 'Hamle kartları', 'Sıra sendeyken turda 1 kart. Başlangıç ve Fırsat kart verir.'],
  ['tepki', 'İtiraz ve Dayın Çıktı', 'Sana oynanan karta ya da kiraya karşı.'],
  ['news', 'Gündem', `${GUNDEM_PERIOD} turda bir haber çıkar, kuralları değiştirir.`],
  ['trophy', 'Seçim Günü', 'Son turun sonunda puanı en yüksek olan kazanır.'],
];

export const rulesSheet = () =>
  html`<div class="sheet XL" style="max-height:100%">${sheetHead('book', 'Nasıl oynanır?')}<div class="sheet-body"><div class="rules-grid">${RULE_ITEMS.map(([icn, h, t]) => html`<div class="rule-item">${I(icn)}<span class="col" style="gap:2px"><b class="h16">${h}</b><span class="body" style="font-size:14px">${t}</span></span></div>`)}</div>
    <details class="rules-more"><summary>Bütün kurallar</summary>${raw(RULES_HTML)}</details></div></div>`;

export function renderModal() {
  if (!els) return;
  const v = app.view;
  const d = app.ui.dialog;
  if (!d || !v || d.type === 'player') {
    setHTML(els.modal, '');
    return;
  }
  let body = '';
  switch (d.type) {
    case 'card':
      if (!v.players[v.you]?.hand.includes(d.uid)) {
        app.ui.dialog = null;
        return renderModal();
      }
      body = cardDialog(v, d.uid);
      break;
    case 'build':
      body = buildDialog(v);
      break;
    case 'mortgage':
      body = mortgageDialog(v);
      break;
    case 'trade':
      if (!(app.ui.trade && app.ui.trade.counter ? counterable(v) : v.phase === 'play' && !P(v, v.you).out)) {
        app.ui.dialog = null;
        return renderModal();
      }
      body = tradeDialog(v);
      break;
    case 'rules':
      body = rulesSheet();
      break;
    case 'history':
      body = historyHTML();
      break;
    default:
  }
  renderKeep(els.modal, html`<div class="layer modal-layer" data-act="backdrop">${body}</div>`);
}

// İçerik değişince girişleri (teklif, para) kaybetmeden yeniden çizer.
function renderKeep(el, content) {
  const focused = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.bind : null;
  const scrollers = () => el.querySelectorAll('.sheet-body, .trade-props');
  const tops = [...scrollers()].map((n) => n.scrollTop);
  setHTML(el, content);
  [...scrollers()].forEach((n, i) => tops[i] && (n.scrollTop = tops[i]));
  app.ui.binds ||= {};
  for (const inp of el.querySelectorAll('[data-bind]')) {
    const key = inp.dataset.bind;
    let val = app.ui.binds[key];
    if (inp.type === 'range' && (val === undefined || val === '')) val = app.ui.binds[key] = inp.min || '0';
    if (val !== undefined && inp.value !== String(val)) inp.value = val;
    paintRange(inp);
    if (focused && key === focused && document.activeElement !== inp) inp.focus();
  }
  for (const out of el.querySelectorAll('[data-show]')) showBind(out);
}

const paintRange = (inp) => {
  const lo = Number(inp.min) || 0;
  const hi = Number(inp.max) || 0;
  inp.style.setProperty('--p', `${hi > lo ? ((Number(inp.value) - lo) / (hi - lo)) * 100 : 0}%`);
};
const showBind = (out) => {
  out.innerHTML = money(Number(app.ui.binds[out.dataset.show]) || 0);
};

// ---------- ana çizim ----------

function highlightOf(v) {
  const pd = v.pending;
  if (pd && (pd.type === 'buy' || pd.type === 'auction' || pd.type === 'rent')) return pd.sq;
  return -1;
}

// Taksi ve yol seçiminde gidilebilecek karelerde sayı rozeti.
function stepBadges(v) {
  const t = v.turn;
  if (!t || t.p !== v.you || v.pending || t.step !== 'choose' || !t.dice) return null;
  const [a, b] = t.dice;
  const o = { [destOf(v, a + b, t.backward)]: a + b };
  if (!t.hamle && P(v, v.you).hand.some((u) => cardId(u) === 'kestirme')) {
    o[destOf(v, a, t.backward)] = a;
    o[destOf(v, b, t.backward)] = b;
  }
  return o;
}

export function updateGame() {
  const v = app.view;
  if (!v || !els) return;
  setMusic(v.phase === 'over' ? null : v.finalRound || v.round >= v.config.maxRounds ? 'final' : 'game');
  updateHead(v);
  if (app.ui.pick && !(v.players[v.you]?.hand.includes(app.ui.pick.uid) && canPlay(v, app.ui.pick.uid))) app.ui.pick = null;
  if (app.ui.pick) app.ui.popSq = null;
  const turnPl = v.phase === 'play' && v.turn ? P(v, v.turn.p) : null;
  updateBoard(cells, v, {
    highlight: highlightOf(v),
    pick: app.ui.pick ? pickSquares(v, app.ui.pick.uid, app.ui.swapMine) : tapuSquares(v),
    open: app.ui.popSq,
    turn: turnPl && !turnPl.out ? { sq: turnPl.pos, color: turnPl.color } : null,
    steps: stepBadges(v),
  });
  paintFocus();
  cityMap.update(v);
  tokens.sync(v.players);
  tokens.setActive(turnPl && !turnPl.out ? turnPl.id : null);
  if (!animating) tokens.settle(v.players);
  setHTML(els.gundem, gundemHTML(v));
  setHTML(els.banner, bannerHTML());
  planAutoEnd(v);
  renderKeep(els.prompt, promptHTML(v));
  if (!animating) paintDice(v);
  renderPop(v);
  setHTML(els.players, playersHTML(v));
  renderHand(v);
  setHTML(els.tools, toolsHTML(v));
  setHTML(els.stick, stickerHTML(v));
  renderAudioPop();
  renderFeed();
  renderModal();
  renderResults(v);
  tickTimers();
}

// Zarlar atıştan sonra 2,5 saniye görünür; yol seçerken de görünür kalır. Sıra sende ve zar atılacaksa tepside bekler.
function paintDice(v) {
  if (showDice(v)) dice.show(v.turn.dice);
  else if (canToss(v)) dice.ready();
  else dice.show(null);
}

const canToss = (v) => v.phase === 'play' && v.you >= 0 && v.turn && v.turn.p === v.you && v.turn.step === 'preroll' && !v.pending && !calm();

function showDice(v) {
  if (!v.turn || !v.turn.dice || v.phase !== 'play') return false;
  if (v.turn.step === 'choose') return true;
  return Date.now() < (app.ui.diceUntil || 0);
}

export function tickTimers() {
  const now = hostNow();
  for (const el of document.querySelectorAll('[data-deadline]')) {
    const at = Number(el.dataset.deadline);
    const span = Number(el.dataset.span);
    const left = Math.max(0, at - now);
    const bar = el.querySelector('i');
    if (bar) bar.style.width = `${Math.min(100, (left / span) * 100)}%`;
    el.classList.toggle('late', left <= 10000);
    // Kendi süremin son 5 saniyesinde saat tıklar.
    const sec = Math.ceil(left / 1000);
    if (el.hasAttribute('data-mine') && span > 5000 && sec > 0 && sec <= 5 && tickTimers.last !== `${at}:${sec}`) {
      tickTimers.last = `${at}:${sec}`;
      play('tick');
    }
  }
  for (const el of document.querySelectorAll('[data-countdown]')) {
    const left = Math.max(0, Math.ceil((Number(el.dataset.countdown) - now) / 1000));
    el.textContent = left && left <= 10 ? `${left} sn` : '';
  }
  if (els && app.view && !animating && app.ui.diceUntil && Date.now() > app.ui.diceUntil) {
    app.ui.diceUntil = 0;
    paintDice(app.view);
  }
}

// ---------- sonuç ekranı ----------

function renderResults(v) {
  if (!app.ui.resultsOpen || v.phase !== 'over') {
    mountDayi(null);
    return setHTML(els.results, '');
  }
  const r = v.results;
  const iflas = v.config.iflas;
  const sub = (p) => {
    const pl = P(v, p);
    const sc = r.scores[p];
    if (pl.out) return `${pl.out}. elenen`;
    return sc.ceza ? `konkordato −${fmt(sc.ceza).replace(' ₺', '')}` : `nakit ${fmt(sc.nakit).replace(' ₺', '')} · mülk ${fmt(sc.mulk).replace(' ₺', '')}`;
  };
  const score = (p) => (P(v, p).out ? '—' : fmt(r.scores[p].total).replace(' ₺', ''));
  const podOrder = [r.ranking[1], r.ranking[0], r.ranking[2]].filter((x) => x !== undefined);
  const H = { 0: 170, 1: 128, 2: 96 };
  const podium = podOrder.map((p) => {
    const k = r.ranking.indexOf(p);
    const pl = P(v, p);
    return html`<div class="pod" style="--pc:${pl.color}">${k === 0 ? I('crown') : ''}${PW(pl, k === 0 ? 84 : 64)}<span class="h18 ${pl.name.length > 12 ? 'long' : ''}">${pl.name}</span><div class="block" style="height:${H[k]}px"><span class="h28">${score(p)}</span><span class="rank">${k + 1}</span></div></div>`;
  });
  // Dayı kazanana konuşur; sonuncu oyuncu kendi ekranında kendi azarını büyük görür, herkes de satırının altında.
  const vd = verdict(v);
  const mine = vd.lose && vd.lose.p === v.you;
  const say = mine ? vd.lose : vd.win;
  const rows = r.ranking.map((p, k) => {
    const pl = P(v, p);
    const note = vd.lose && vd.lose.p === p && !mine ? html`<span class="rank-note"><b>${pl.name}</b>, ${vd.lose.text}</span>` : '';
    return html`<div class="rank-row ${k === 0 ? 'first' : ''} ${pl.out ? 'out' : ''}" style="--pc:${pl.color}"><span class="rank-n">${k + 1}</span><span class="disc">${PW(pl, 30)}</span>
      <span class="col grow" style="gap:0;min-width:0"><span class="h16">${pl.name}</span><span class="muted small">${sub(p)}</span></span>${pl.out ? I('iflas') : ''}<span class="h22">${score(p)}</span>${note}</div>`;
  });
  const sp = P(v, say.p);
  const bubble = html`<div class="verdict"><div class="verdict-dayi"></div><div class="bubble"><p><b>${sp.name}</b>, ${say.text}</p></div></div>`;
  const winner = P(v, r.ranking[0]).name;
  setHTML(els.results, html`<div class="results" role="dialog" aria-label="Oyun sonu">
    <div class="left"><span class="kicker">${iflas ? 'Son kalan' : `${v.round} tur bitti`}</span><span class="logo" style="font-size:${iflas && winner.length > 10 ? 40 : 52}px;text-align:center">${iflas ? `${winner} kazandı` : 'Seçim Günü'}</span>${bubble}<div class="podium">${podium}</div><span class="grow"></span>
      <div class="row">${isHost() ? html`<button class="btn L pri" data-act="newGame">${I('refresh')}Aynı masayla yeni oyun</button>` : ''}<button class="btn L sec" data-act="resultsClose">Tahtaya dön</button><button class="btn L gho" data-act="leave">Ana menü</button></div></div>
    <div class="right">${rows}${worthChart(v)}</div></div>`);
  mountDayi(els.results.querySelector('.verdict-dayi'), mine ? 'kayip' : vd.win.clip);
}

// Tur tur net değer çizgisi (konkordato cezası yok; kazananın çizgisi kalın).
function worthChart(v) {
  const W = 520;
  const H = 120;
  const c = worthLines(v.worth, W, H);
  if (!c) return '';
  const win = v.results.ranking[0];
  const order = [...c.lines.keys()].sort((a, b) => (a === win) - (b === win));
  const lines = order.map((p) => html`<polyline points="${c.lines[p]}" style="--c:${P(v, p).color}" class="${p === win ? 'win' : ''}"><title>${P(v, p).name}</title></polyline>`);
  return html`<div class="panel worth" style="padding:12px 14px;display:flex;flex-direction:column;gap:6px"><span class="kicker">Tur tur net değer</span>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tur tur net değer grafiği">${lines}</svg></div>`;
}

// ---------- olay efektleri ----------

// Bildirimler tahtanın ortasının altında belirir, aynı metin üst üste gelmez.
export const toast = (text, kind = '', icon = '') => showToast(text, kind, icon);
function showToast(text, kind = '', icon = '') {
  const box = els && document.getElementById('toasts');
  if (!box) return;
  if ([...box.children].some((c) => c.dataset.text === text)) return;
  const el = document.createElement('div');
  el.className = `toast ${kind === 'error' ? 'bad' : ''}`;
  el.dataset.text = text;
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon ? ic(icon) : ''}<span>${String(html`${text}`)}</span>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 3800);
}

function floatMoney(p, delta) {
  const anchor = document.querySelector(`[data-cash="${p}"]`);
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float ${delta > 0 ? 'plus' : 'minus'}`;
  el.textContent = `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
  // Paneldeki sayının solunda belirir, sayıyı kapatmaz.
  el.style.left = `${r.left - 70}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

const FLIGHT_MS = PACE.flight;

// Bakiye sayacı: para el değiştirince oyuncu listesindeki bakiye jetonlar uçarken sayarak değişir, birden atlamaz.
const counts = new Map(); // oyuncu -> { from, to, t0, ms }
const cashText = (n) => fmt(n).replace(' ₺', '');
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function shownCash(p, cash) {
  const c = counts.get(p);
  if (!c || c.to !== cash) return cash;
  const t = Math.min(1, (performance.now() - c.t0) / c.ms);
  return Math.round(c.from + (c.to - c.from) * easeIO(t));
}

export function countCash(prev, v, ms) {
  if (calm() || !prev) return;
  v.players.forEach((pl, i) => {
    const before = prev.players[i]?.cash;
    if (before === undefined || before === pl.cash || pl.out) return;
    counts.set(i, { from: shownCash(i, before), to: pl.cash, t0: performance.now(), ms: Math.max(1, ms) });
  });
  if (counts.size && !countCash.raf) countCash.raf = requestAnimationFrame(countTick);
}

function countTick() {
  countCash.raf = 0;
  const now = performance.now();
  for (const [p, c] of counts) {
    const el = els && document.querySelector(`[data-cash="${p}"]`);
    const done = now - c.t0 >= c.ms;
    if (el && !app.view?.players[p]?.out) el.textContent = cashText(done ? c.to : shownCash(p, c.to));
    if (done) counts.delete(p);
  }
  if (counts.size) countCash.raf = requestAnimationFrame(countTick);
}

// Tutar, tahtadaki bir noktanın yanında: üst yarıda aşağı, alt yarıda yukarı kayıp söner.
function floatAt(pt, delta) {
  const down = pt.y < els.board.getBoundingClientRect().top + els.board.clientHeight / 2;
  const el = document.createElement('div');
  el.className = `float ${delta > 0 ? 'plus' : 'minus'} ${down ? 'down' : ''}`;
  el.textContent = `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
  el.style.left = `${pt.x - 24}px`;
  el.style.top = `${down ? pt.y + 18 : pt.y - 44}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

const centerOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

// Oyuncunun para kutusu ya da banka (tahtanın ortası) ekrandaki merkez noktası.
function moneyPoint(p) {
  const el = p === null ? els && els.center : document.querySelector(`[data-cash="${p}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Kira ve transferlerde ödeyenden alana kavis çizerek uçan jetonlar.
function flyCoins({ from, to, amount, n, delay }) {
  const F = FLIGHT_MS * spd();
  const a = moneyPoint(from);
  const b = moneyPoint(to);
  setTimeout(() => from !== null && floatMoney(from, -amount), delay);
  setTimeout(() => to !== null && floatMoney(to, amount), delay + (a && b && !calm() ? F + (n - 1) * COIN_GAP : 0));
  if (!a || !b || calm()) return;
  flyBetween(a, b, n, delay, F);
}

// a'dan b'ye (ekran noktaları) kavis çizerek uçan n jeton; ms: uçuş süresi.
function flyBetween(a, b, n, delay, ms) {
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
    ], { duration: ms, delay: delay + i * COIN_GAP, easing: 'ease-in-out', fill: 'both' });
    k.onfinish = () => el.remove();
  }
}

// Kira ve maaş: jetonlar piyonlar arasında (maaşta Başlangıç köşesinden piyona) uçar; kalkışta fırlatma, her jeton
// konduğunda jeton sesi çalar (boardfx.coinSounds).
function pawnFlight(v, e, delay) {
  const ms = T.flight;
  const n = coinCount(e.amount);
  const tok = (p) => centerOf(tokens.els.get(P(v, p).id));
  const salary = e.from === null;
  const a = salary ? centerOf(cells[0]) : tok(e.from);
  const b = tok(e.to);
  const land = (i) => i * COIN_GAP + ms * 0.92; // flyBetween'de jeton varış noktasına %92'de gelir
  setTimeout(() => {
    if (!els) return;
    coinSounds(n, land, salary, els.board, cells[0]);
    if (!salary && a) floatAt(a, -e.amount);
  }, delay);
  if (a && b && !calm()) flyBetween(a, b, n, delay, ms);
  if (b) setTimeout(() => floatAt(b, e.amount), delay + (calm() ? 0 : ms));
}

// Sahne katmanı: haber, sürpriz ve rakip kartı tahtanın ortasında, kareleri kapatmadan gösterilir.
function stageShow(content, ms, click = true) {
  setHTML(els.stage, html`<div class="layer stage-layer" ${click ? raw('data-act="closeStage"') : ''}>${content}</div>`);
  clearTimeout(stageShow.t);
  return new Promise((done) => {
    stageShow.done = done;
    stageShow.t = setTimeout(stageClose, ms);
  });
}
// Ortadaki sahne (haber, kart) kapanınca çözülür; en fazla 9 sn bekler.
async function afterStage() {
  for (let i = 0; i < 45 && els && els.stage.firstChild; i++) await sleep(200);
}

export function stageClose() {
  if (!els) return;
  clearTimeout(stageShow.t);
  setHTML(els.stage, '');
  if (stageShow.done) stageShow.done();
  stageShow.done = null;
}

function showNews(v, ev) {
  const g = GUNDEM[ev.id];
  const detail = v.gundem && v.gundem.id === ev.id ? v.gundem.detail : '';
  const sum = v.summary && v.summary.round === ev.round - 1 ? summaryHTML(v, v.summary) : '';
  const img = html`<div class="nimg" style="background-image:url(assets/gundem/${ev.id}.jpg)"></div>`;
  stageShow(html`<div class="news-card">${img}<div class="nbody"><span class="kicker">${ev.round}. tur · son dakika</span><span class="h28">${g.name}</span><span class="body">${g.text}</span>${detail ? html`<span class="hint" style="height:auto;padding:8px 12px;white-space:normal">${detail}</span>` : ''}${sum}</div></div>`, (sum ? PACE.newsSum : PACE.news) * spd());
}

// Geçen turun özeti: en çok kazanan/kaybeden ve el değiştiren mülkler (en fazla 3).
function summaryHTML(v, sm) {
  const rows = [];
  if (sm.best !== null) {
    rows.push(html`<div class="recap-row">${I('up')}${PW(P(v, sm.best), 20)}${P(v, sm.best).name}<b class="num pos">${M(sm.deltas[sm.best], true)}</b></div>`);
    rows.push(html`<div class="recap-row">${I('down')}${PW(P(v, sm.worst), 20)}${P(v, sm.worst).name}<b class="num neg">${M(sm.deltas[sm.worst], true)}</b></div>`);
  }
  for (const c of sm.changes.slice(0, 3)) rows.push(html`<div class="recap-row">${I('deal')}${BOARD[c.sq].name} · ${P(v, c.from).name}${I('arrow')}${c.to === null ? 'Banka' : P(v, c.to).name}</div>`);
  if (sm.changes.length > 3) rows.push(html`<div class="recap-row muted">ve ${sm.changes.length - 3} mülk daha</div>`);
  return rows.length ? html`<div class="recap"><span class="kicker">${sm.round}. turun özeti</span>${rows}</div>` : '';
}

// Oynadığım kart elden tahtanın ortasına uçar, döner ve masaya iner (playFx).
function flyMine(prev, v, id) {
  const me = v.you;
  const before = prev && prev.players[me] ? prev.players[me].hand : [];
  const uid = before.find((u) => cardId(u) === id && !v.players[me].hand.includes(u));
  const el = uid && hand.cardEl(uid);
  if (el) playFx(el, els.center.getBoundingClientRect());
}

// SÜRPRİZ: kartın arka yüzü ve etkisi tahtanın ortasında.
async function showSurpriz(v, ev) {
  const sur = E.SURPRIZ[ev.id];
  const pl = P(v, ev.p);
  play('card');
  await stageShow(html`<div class="surp"><div class="sback" style="background-image:url(assets/kart/surpriz.jpg)"></div><div class="scard"><div class="row" style="gap:8px">${PW(pl, 28)}<span class="h16">${pl.name} · Sürpriz</span></div>${I(SURPRIZ_IC[ev.id] || 'surpriz')}<span class="h28">${sur.name}</span><span class="body">${sur.text}</span></div></div>`, Math.round(PACE.surpriz * spd()));
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
      return `${sq(t.sq)} 2 sıra kira alamayacak, üstüne kat dikilemeyecek.`;
    case 'takas':
      return `${sq(t.mine)} ile ${sq(t.theirs)} el değiştirecek.`;
    case 'ihbar':
      return `Tüm kaçak katları yıkılacak, kat başı ${m('ihbarFine')} ceza.`;
    case 'dava':
      return `Zar atılacak; yüksek atan ${m('dava')} alır, eşitlikte davalı kazanır.`;
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

// Dava düellosu: davacı ve davalı yan yana, her birinin kendi zarı kendi altında. Zarlar dönünce kazanan
// altınla parlar, kaybeden soluklaşır, tutarlar yazar. Eşitlikte davalı kazanır (not hep görünür).
export async function showDava(v, e) {
  const [a, b] = e.dice;
  const pl = P(v, e.p);
  const df = P(v, e.victim);
  const amt = E.money(v, E.AMOUNTS.dava);
  const side = (who, cls, label) => html`<div class="duel-side ${cls}" style="--pc:${who.color}"><span class="kicker">${label}</span>${PW(who, 56)}<span class="h18">${who.name}</span><div class="duel-die"></div><span class="duel-res"></span></div>`;
  const shown = stageShow(html`<div class="duel"><div class="row" style="gap:12px">${cardFace('dava', 'mini')}<span class="h22">Dava açıldı</span></div>
    <div class="duel-row">${side(pl, 'plaintiff', 'Davacı')}<span class="duel-vs">VS</span>${side(df, 'defendant', 'Davalı')}</div>
    <span class="note duel-tie">${I('tedbir')}Eşitlikte davalı kazanır</span></div>`, Math.round((PACE.dice + PACE.card) * spd()));
  const root = els.stage.querySelector('.duel');
  if (!root) return shown;
  const slots = root.querySelectorAll('.duel-die');
  const dA = new Dice(slots[0], 1);
  const dB = new Dice(slots[1], 1);
  await Promise.all([dA.roll([a], false, PACE.dice * spd(), '', spd()), dB.roll([b], false, PACE.dice * spd(), '', spd())]);
  if (!root.isConnected) return shown;
  const win = a > b ? 'plaintiff' : 'defendant';
  root.querySelector('.duel-vs').textContent = a > b ? '>' : a < b ? '<' : '=';
  root.classList.add(`won-${win}`, a === b ? 'tie' : 'clear');
  root.querySelector(`.${win} .duel-res`).innerHTML = `<span class="pos">${money(amt, true)}</span>`;
  root.querySelector(`.${win === 'plaintiff' ? 'defendant' : 'plaintiff'} .duel-res`).innerHTML = `<span class="neg">${money(-amt)}</span>`;
  play(win === 'plaintiff' && e.p === v.you ? 'coin' : 'sold');
  return shown;
}

// Başkasının oynadığı kart ortada gösterilir: kimin kime ne yaptığı. Üzerine gelince durur, tıklayınca kapanır.
async function revealCard(pv, v, ev) {
  if (!els) return;
  const vics = victimsOf(pv, ev).filter((i) => Number.isInteger(i));
  const pl = P(v, ev.p);
  const toMe = vics.includes(v.you);
  const who = vics.length === 1 ? vs(v, ev.p, vics[0]) : html`<div class="row" style="gap:8px">${PW(pl, 32)}</div>`;
  play('card');
  const title = toMe ? `${pl.name} sana oynadı` : vics.length === 1 ? `${pl.name}, ${P(v, vics[0]).name} için oynadı` : vics.length > 1 ? `${pl.name} herkese oynadı` : `${pl.name} oynadı`;
  await stageShow(html`<div class="card-prompt reveal">${cardFace(ev.card, 'big')}<div class="opt-col">${who}<span class="h22">${title}</span><span class="line-row">${I(CARD_IC[ev.card] || 'hamle')}<span class="grow">${cardEffect(v, ev)}</span></span><span class="muted small">kapatmak için tıkla</span></div></div>`, Math.round(PACE.card * spd()));
}

export function confetti() {
  const colors = [...E.PLAYER_COLORS, '#c8912f', '#f5c542'];
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

// Sunucudan gelen bir durum güncellemesini canlandırıp çizer. Tek odak: önce zar ve yürüyüş, sonra rakip kartı
// ya da sürpriz, en son para jetonları, kat efekti ve bildirimler; hepsi aynı anda ekrana dökülmez.
export async function present(prev, v, events, fast) {
  const me = v.you;
  const later = []; // canlandırma sırası bitince gösterilecekler
  const toast = (...a) => later.push(() => showToast(...a));
  // Sesler, ait oldukları canlandırmayla aynı anda ve aynı sürede çalar (jeton sesi jetonlar uçarken).
  const sfx = (name, sec) => later.push(() => play(name, sec));
  const flight = (PACE.flight * spd()) / 1000;
  // Tahta animasyonları (boardfx.js), sesleri görüntüyle aynı anlarda. Yıkım ve iflas eski kare ve piyon üstünde
  // (later), diğerleri tahta yeni duruma çizildikten sonra (post) oynar. Aynı türden birkaç kare varsa ses bir kez çalar.
  const live = !fast && !!prev && !!els;
  const post = [];
  const pawnMoney = (e) => e.type === 'money' && e.amount > 0 && e.to !== null && (e.why === 'Maaş' || (/^Kira/.test(e.why || '') && e.from !== null));
  for (const ev of events) {
    switch (ev.type) {
      case 'card':
        // Benim kartım elden uçarken; rakibinki ortada gösterilirken (revealCard) çalar.
        if (ev.p === me) {
          play(ev.card === 'itiraz' ? 'itiraz' : 'card', 1.1);
          if (!fast) flyMine(prev, v, ev.card);
        } else if (fast) play('card');
        break;
      case 'money':
        if (live && pawnMoney(ev)) break; // pawnFlight çalar
        if (ev.to === me) sfx('coin', flight);
        else if (ev.from === me) sfx('pay', flight);
        break;
      case 'build':
        if (live) post.push(() => buildFx(els.board, cells[ev.sq]));
        else sfx('build');
        break;
      case 'demolish': {
        const lost = BOARD.map((_, q) => q).filter((q) => prev && prev.props[q]?.kacak && !v.props[q]?.kacak);
        if (live) later.push(() => lost.forEach((q, k) => demolishFx(els.board, cells[q], k === 0)));
        else sfx('crash');
        toast(`${P(v, ev.p).name}: ${ev.n} kaçak kat yıkıldı`, 'error', 'kacak');
        break;
      }
      case 'collapse':
        sfx('crash');
        break;
      case 'target':
        sfx('news');
        toast(ev.text, '', 'trophy');
        break;
      case 'konkordato':
        sfx('crash');
        toast(`${P(v, ev.p).name} konkordato ilan etti`, 'error', 'warning');
        break;
      case 'iflas':
        if (live) {
          const owned = BOARD.map((_, q) => q).filter((q) => prev.props[q]?.owner === ev.p).map((q) => cells[q]);
          later.push(() => iflasFx(els.board, tokens.els.get(P(v, ev.p).id), owned));
        } else sfx('sad');
        toast(`${P(v, ev.p).name} iflas etti, oyundan çıktı`, 'error', 'iflas');
        break;
      case 'auction':
        if (ev.winner !== null) {
          sfx('sold');
          toast(`${BOARD[ev.sq].name}: ${P(v, ev.winner).name} aldı`, '', 'gavel');
        }
        break;
      case 'tradeDone':
        sfx('coin', flight);
        toast('Anlaşma sağlandı', '', 'deal');
        break;
      case 'gundem':
        if (!fast) {
          play('news');
          showNews(v, ev);
        }
        break;
      case 'turn':
        if (live && !P(v, ev.p).out) {
          const pl = P(v, ev.p);
          post.push(() => turnFx(els.board, cells[pl.pos], tokens.els.get(pl.id), pl, ev.p === me));
        } else if (ev.p === me) play('turn');
        break;
      case 'over':
        play('win');
        confetti();
        break;
      default:
    }
  }
  const flights = fast ? [] : coinFlights(live ? events.filter((e) => !pawnMoney(e)) : events);
  const pawnFlights = live ? events.filter(pawnMoney).slice(0, 6) : [];
  // El değiştiren mülkler: alıcının rengi kenarı dolanır, şerit dolar; tamamlanan set sonra boyanır.
  const gained = live ? BOARD.map((_, q) => q).filter((q) => v.props[q] && v.props[q].owner !== null && prev.props[q]?.owner !== v.props[q].owner) : [];
  if (gained.length) {
    const has = (t) => events.some((e) => e.type === t);
    const buy = has('own'); // ihale ve pazarlık kendi sesini zaten çalıyor
    const sets = new Map();
    for (const q of gained) if (BOARD[q].group && E.inFullSet(v, q) && !E.inFullSet(prev, q)) sets.set(BOARD[q].group, v.props[q].owner);
    post.push(() => gained.forEach((q, k) => ownFx(els.board, cells[q], P(v, v.props[q].owner).color, buy && k === 0)));
    if (sets.size) {
      post.push(() => setTimeout(() => {
        if (!els) return;
        [...sets].forEach(([g, o], k) => setFx(els.board, GROUP_SQUARES[g].map((q) => cells[q]), P(v, o).color, k === 0));
      }, T.own.ms));
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
        if (e.type === 'dice') {
          app.ui.diceUntil = Date.now() + (PACE.diceShow + PACE.dice) * spd();
          await dice.roll(e.dice, fast, PACE.dice * spd(), '', spd());
        } else if (e.type === 'dava') {
          if (!fast) await showDava(v, e);
        } else if (e.type === 'move') await tokens.walk(P(v, e.p).id, e.path, fast, PACE.step * spd());
        else if (fast) continue;
        else if (e.type === 'surpriz') await showSurpriz(v, e);
        else if (e.card === 'itiraz' && prev.pending && prev.pending.type === 'react') {
          play('itiraz');
          toast(`${P(v, e.p).name} itiraz etti`, '', 'shield');
        }
        else await revealCard(prev, v, e);
      }
    } finally {
      animating = false;
    }
  }
  for (const f of later) f();
  // Büyük anda dayı köşeden bir laf eder (hızlı oyunda ve yetişmeye çalışırken susar); ortadaki sahne kapanınca.
  const moment = live && spd() >= 1 ? dayiMoment(events) : null;
  if (moment) afterStage().then(() => els && dayiSay(els.board, moment));
  pawnFlights.forEach((e, i) => pawnFlight(v, e, i * FLIGHT_GAP));
  if (flights.length && els) {
    for (const f of flights) flyCoins(f);
  }
  if ((flights.length || pawnFlights.length) && els) {
    // Bakiyeler ilk jeton kalkınca saymaya başlar, son jeton konunca biter.
    const lastDelay = Math.max(0, ...flights.map((f) => f.delay + (f.n - 1) * COIN_GAP), (pawnFlights.length - 1) * FLIGHT_GAP);
    countCash(prev, v, FLIGHT_MS * spd() + lastDelay);
  }
  if ((flights.length || pawnFlights.length) && els) await sleep(FLIGHT_MS * spd() * 0.6); // jetonlar yola çıksın, sayılar sonra değişsin
  if (v.phase === 'over' && !app.ui.seenOver) {
    app.ui.seenOver = true;
    app.ui.resultsOpen = true;
  }
  updateGame();
  if (els) for (const f of post) f();
}

export function bindsInput(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.bind) return false;
  app.ui.binds ||= {};
  app.ui.binds[el.dataset.bind] = el.value;
  paintRange(el);
  for (const out of document.querySelectorAll(`[data-show="${el.dataset.bind}"]`)) showBind(out);
  for (const d of document.querySelectorAll(`[data-delta="${el.dataset.bind}"]`)) d.textContent = `+${Number(el.value) - Number(d.dataset.base)}`;
  if (app.ui.dialog && app.ui.dialog.type === 'trade') refreshTrade();
  return true;
}
