// Oyun ekranı: tahta, orta alan, yan panel, pencereler ve olay efektleri.
import * as E from '../engine/index.js';
import { html, raw, esc, $, setHTML, sleep } from './dom.js';
import { play, isMuted } from './sound.js';
import { isNotifyOn, notifySupported } from './notify.js';
import { buildBoard, updateBoard, Tokens, rollDice, dieHTML } from './board.js';
import { app, act, send, isHost } from './state.js';
import { RULES_HTML } from './rules.js';

const { BOARD, CARDS, GROUPS, GROUP_SQUARES, GUNDEM, HEDEF, fmt, cardId } = E;
const N = BOARD.length;

let els = null;
let cells = null;
let tokens = null;
let animating = false;

// ---------- iskelet ----------

const QUICK = ['😂', '😤', '🤝', '💸', '🙏', 'Kira nerede?', 'İtiraz!', 'Dayım var benim', 'Çaylar benden ☕'];

export function mountGame(root) {
  root.innerHTML = `
  <div class="game">
    <header class="topbar">
      <div class="mini-logo">RANT</div>
      <div class="stat">Tur<b id="tRound"></b></div>
      <div class="stat">Endeks<b id="tIndex"></b></div>
      <div class="stat">Maaş<b id="tSalary"></b></div>
      <div class="mods" id="tMods"></div>
      <div class="spacer"></div>
      <span class="conn" id="tConn"></span>
      <button class="iconbtn" data-act="copyLink" id="tCode" title="Davet linkini kopyala"></button>
      <button class="iconbtn" data-act="rules">❓ Kurallar</button>
      <button class="iconbtn" data-act="mute" id="tMute" title="Ses"></button>
      <button class="iconbtn${notifySupported() ? '' : ' hidden'}" data-act="notify" id="tNotify" title="Sekme arkadayken sıra sana gelince masaüstü bildirimi"></button>
      <button class="iconbtn" data-act="leave">Çık</button>
    </header>
    <main class="table">
      <section class="board-wrap">
        <div class="board" id="board">
          <div class="board-center">
            <div id="gundem"></div>
            <div class="prompt" id="prompt"></div>
            <div class="dice" id="dice"></div>
            <div class="ticker" id="ticker"></div>
          </div>
          <div class="tokens" id="tokens"></div>
        </div>
      </section>
      <aside class="side">
        <div class="panel players" id="players"></div>
        <div class="panel me-panel" id="mePanel"></div>
        <div class="panel feed">
          <div class="tabs"><button data-act="tab" data-tab="log" id="tabLog">Olaylar</button><button data-act="tab" data-tab="chat" id="tabChat">Sohbet</button></div>
          <div class="feed-list" id="feed"></div>
          <form class="chat-form hidden" id="chatForm"><input class="input" id="chatInput" maxlength="200" placeholder="Masaya bir şey yaz…" autocomplete="off"><button class="btn small turq">Gönder</button></form>
          <div class="quick hidden" id="quick">${QUICK.map((q) => `<button type="button" data-act="quick" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        </div>
      </aside>
    </main>
  </div>
  <div id="modal"></div><div class="toasts" id="toasts"></div><div id="stage"></div>`;
  const g = (id) => document.getElementById(id);
  els = {
    round: g('tRound'), index: g('tIndex'), salary: g('tSalary'), mods: g('tMods'), conn: g('tConn'), code: g('tCode'), mute: g('tMute'), notify: g('tNotify'),
    board: g('board'), gundem: g('gundem'), prompt: g('prompt'), dice: g('dice'), ticker: g('ticker'), tokens: g('tokens'),
    players: g('players'), me: g('mePanel'), feed: g('feed'), chatForm: g('chatForm'), chatInput: g('chatInput'), quick: g('quick'),
    tabLog: g('tabLog'), tabChat: g('tabChat'), modal: g('modal'), stage: g('stage'),
  };
  cells = buildBoard(els.board);
  tokens = new Tokens(els.tokens, cells);
  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = els.chatInput.value.trim();
    if (t) send({ t: 'chat', text: t });
    els.chatInput.value = '';
  });
}

export const gameMounted = () => !!els && document.body.contains(els.board);
export const unmountGame = () => {
  els = null;
};

// ---------- yardımcılar ----------

const P = (v, i) => v.players[i];
const who = (v, i) => (i === v.you ? 'Sen' : P(v, i).name);
const av = (pl, cls = '') => html`<span class="av ${cls}" style="--c:${pl.color}">${pl.avatar}</span>`;
const sqChip = (sq) => {
  const s = BOARD[sq];
  return html`<span class="chip"><span class="dot" style="--c:${s.group ? GROUPS[s.group].color : '#555'}"></span>${s.name}</span>`;
};
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

function timerHTML(v, ids) {
  const dl = app.meta && app.meta.deadlines;
  if (!dl) return '';
  const at = Math.min(...ids.map((i) => dl[P(v, i).id] || Infinity));
  if (!Number.isFinite(at)) return '';
  return html`<div class="timer" data-deadline="${at}" data-span="${Math.max(1000, at - Date.now())}"><i></i></div><div class="muted" style="font-size:12px" data-countdown="${at}"></div>`;
}

// ---------- üst çubuk ----------

const MOD_LABEL = {
  turizm: '🏖️ Turizm', ulasimZam: '🎫 Ulaşım x3', kiraTavani: '🧯 Kira yarı', kiraArtisi: '🔥 Kira x1,5', grev: '🪧 Maaş yok',
  durgunluk: '🥶 Kat yok', kampanya: '🏷️ Kat yarı fiyat', faizIndirimi: '📉 İpotek indirimi', zabitaIzinde: '🏝️ Zabıta izinde',
};

function updateTopbar(v) {
  els.round.textContent = v.round ? `${v.round}/${v.config.maxRounds}` : '-';
  els.index.textContent = v.index;
  els.salary.textContent = fmt(v.salary);
  setHTML(els.mods, Object.keys(v.mods).map((m) => html`<span class="chip">${MOD_LABEL[m] || m}</span>`).join(''));
  els.code.textContent = app.mode === 'local' ? '🤖 Yerel oyun' : `🔗 Oda ${app.code}`;
  els.mute.textContent = isMuted() ? '🔇' : '🔊';
  els.notify.textContent = isNotifyOn() ? '🔔' : '🔕';
  const st = app.status;
  els.conn.textContent = st === 'reconnecting' ? '⚠ Bağlantı koptu, yeniden bağlanılıyor…' : st === 'online' ? '● Bağlı' : '';
  els.conn.classList.toggle('bad', st === 'reconnecting');
}

// ---------- orta alan ----------

function gundemHTML(v) {
  if (!v.gundem) {
    return html`<div class="gundem-card"><div class="gi">🗳️</div><div><div class="gt">Seçime ${v.config.maxRounds} tur var</div><div class="gx">Herkes gizli hedefini seçiyor.</div></div></div>`;
  }
  const g = GUNDEM[v.gundem.id];
  const left = v.config.maxRounds - v.round;
  return html`<div class="gundem-card"><div class="gi">${g.icon}</div><div><div class="gt">${g.name}</div><div class="gx">${g.text}${v.gundem.detail ? ` ${v.gundem.detail}` : ''}</div></div>
    <div class="round">${left ? `Seçime ${left} tur` : 'SON TUR'}<b>${v.round}/${v.config.maxRounds}</b></div></div>`;
}

function deedHTML(v, sq) {
  const s = BOARD[sq];
  const ps = v.props[sq];
  const gc = s.group ? GROUPS[s.group].color : '#1b2233';
  const owner = ps && ps.owner !== null ? P(v, ps.owner) : null;
  let rows = '';
  if (s.kind === 'prop') {
    const mult = v.index / 100;
    const r5 = (x) => Math.round((x * mult * (v.groupMult[s.group] || 1)) / 5) * 5;
    const L = E.level(ps);
    const full = owner && E.ownsGroup(v, ps.owner, s.group);
    rows = [
      [`Temel kira${full ? ' (tam set x2)' : ''}`, r5(s.rents[0] * (full ? 2 : 1)), L === 0],
      ['1 kat', r5(s.rents[1]), L === 1],
      ['2 kat', r5(s.rents[2]), L === 2],
      ['3 kat', r5(s.rents[3]), L === 3],
      ['4 kat', r5(s.rents[4]), L === 4],
    ]
      .map(([k, val, cur]) => html`<tr class="${cur && owner ? 'cur' : ''}"><td>${k}</td><td>${fmt(val)}</td></tr>`)
      .join('');
    rows += html`<tr><td>Kat fiyatı / kaçak</td><td>${fmt(E.katCost(v, sq))} / ${fmt(E.kacakCost(v, sq))}</td></tr>`;
  } else if (s.kind === 'transport') {
    rows = html`<tr><td>1 ulaşım</td><td>${fmt(E.money(v, 25))}</td></tr><tr><td>2 ulaşım</td><td>${fmt(E.money(v, 60))}</td></tr>`;
  }
  const status = [];
  if (owner) status.push(`Sahibi: ${owner.name}`);
  if (ps?.ipotek) status.push('İpotekli');
  if (ps?.tedbir) status.push(`İhtiyati tedbir: ${ps.tedbir} tur`);
  if (ps?.kacak) status.push('Kaçak kat var');
  const now = ps && owner && !ps.ipotek ? `Şu anki kira: ${fmt(E.rentFor(v, sq))}` : '';
  return html`<div class="deed" style="--gc:${gc}"><div class="dh"><div class="city">${s.group ? GROUPS[s.group].name : s.kind === 'transport' ? 'Ulaşım' : ''}</div><div class="nm">${s.icon || ''} ${s.name}</div></div>
    <table><tr><td>Fiyat</td><td>${fmt(E.price(v, sq))}</td></tr>${raw(rows)}<tr><td>İpotek değeri</td><td>${fmt(E.mortgageValue(v, sq))}</td></tr></table>
    ${status.length || now ? html`<div class="dnote">${[...status, now].filter(Boolean).join(' · ')}</div>` : ''}</div>`;
}

// Satın alma ve ihale istemi için kısa tapu kartı.
function miniDeed(v, sq) {
  const s = BOARD[sq];
  const gc = s.group ? GROUPS[s.group].color : '#1b2233';
  const r5 = (x) => Math.round((x * (v.index / 100) * (s.group ? v.groupMult[s.group] || 1 : 1)) / 5) * 5;
  const rent =
    s.kind === 'transport'
      ? `Kira: ${fmt(r5(25))} (1 ulaşım) / ${fmt(r5(60))} (2 ulaşım)`
      : `Kira: ${fmt(r5(s.rents[0]))} → katlarla ${s.rents.slice(1).map((x) => r5(x)).join(' / ')} · Kat ${fmt(E.katCost(v, sq))} (kaçak ${fmt(E.kacakCost(v, sq))})`;
  const g = s.group ? GROUP_SQUARES[s.group] : [];
  const owners = g.filter((q) => q !== sq && v.props[q].owner !== null).map((q) => `${BOARD[q].name}: ${P(v, v.props[q].owner).name}`);
  return html`<div class="deed mini" style="--gc:${gc}"><div class="dh"><div class="city">${s.group ? GROUPS[s.group].name : 'Ulaşım'}</div><div class="nm">${s.icon || ''} ${s.name} · ${fmt(E.price(v, sq))}</div></div>
    <div class="dnote">${rent}${owners.length ? html`<br>Şehirdeki diğerleri: ${owners.join(', ')}` : ''}</div></div>`;
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
    return html`<h3>Hedefler seçiliyor…</h3><p>Bekleniyor: ${rest}</p>`;
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
    return html`<h3>Sıra sende!</h3>
      <p>${t.backward ? 'Geri vitestesin: bu tur geri gideceksin. ' : ''}Zar atmadan önce kart oynayabilir, kat dikebilir ya da pazarlık yapabilirsin.</p>
      <button class="btn primary big" data-act="roll" data-primary>🎲 Zar At</button>${timerHTML(v, [me])}`;
  }
  if (t.step === 'choose') {
    const [a, b] = t.dice;
    const kes = pl.hand.find((u) => cardId(u) === 'kestirme');
    const opt = (steps, label, actName, extra = '') =>
      html`<button class="btn ${actName === 'moveSum' ? 'primary big' : 'gold'}" data-act="${actName}" ${raw(extra)}>${label}: ${steps} kare → ${BOARD[destOf(v, steps, t.backward)].name}</button>`;
    return html`<h3>Nereye gidiyorsun?</h3>
      <div class="row center">${opt(a + b, 'Toplam', 'moveSum', 'data-primary')}</div>
      ${kes ? html`<p>🛵 Kestirme kartınla zarlardan birini seçebilirsin:</p><div class="row center">${opt(a, '1. zar', 'kestirme', `data-die="0" data-uid="${kes}"`)}${opt(b, '2. zar', 'kestirme', `data-die="1" data-uid="${kes}"`)}</div>` : ''}`;
  }
  // serbest evre
  if (pl.cash < 0) {
    return html`<h3>Borçtasın: ${fmt(pl.cash)}</h3><p>Sıranı bitirmeden borcunu kapatmalısın. Kat satabilir, ipotek edebilir, pazarlık yapabilirsin.</p>
      <div class="row center"><button class="btn primary big" data-act="settleDebt" data-primary>Borcu Kapat (otomatik)</button><button class="btn ghost" data-act="manage">Mülklerim</button></div>`;
  }
  const hints = [];
  if (!t.hamle && pl.hand.some((u) => canPlay(v, u))) hints.push('Parlayan kartlarını oynayabilirsin.');
  if (E.propsOf(v, me).some((q) => !E.buildBlock(v, me, q, false) || !E.buildBlock(v, me, q, true))) hints.push('Mülklerine kat dikebilirsin.');
  return html`<h3>${BOARD[pl.pos].icon || ''} ${BOARD[pl.pos].name}</h3><p>${hints.join(' ') || 'İşin bittiyse turu bitir.'}</p>
    <div class="row center"><button class="btn primary big" data-act="endTurn" data-primary>Turu Bitir ➜</button></div>${timerHTML(v, [me])}`;
}

function pendingHTML(v, pd) {
  const me = v.you;
  switch (pd.type) {
    case 'buy': {
      if (pd.p !== me) return html`<div class="who">${av(P(v, pd.p))} ${P(v, pd.p).name}</div><p>${BOARD[pd.sq].name} için karar veriyor: alacak mı, ihaleye mi çıkaracak?</p>${timerHTML(v, [pd.p])}`;
      const cost = E.price(v, pd.sq);
      const cash = P(v, me).cash;
      const paz = P(v, me).hand.find((u) => cardId(u) === 'pazarlik');
      return html`<div style="width:min(380px,100%)">${miniDeed(v, pd.sq)}</div>
        <div class="row center"><button class="btn green big" data-act="buy" data-primary ${cash < cost ? 'disabled' : ''}>Satın Al ${fmt(cost)}</button>
        <button class="btn ghost" data-act="decline">🔨 İhaleye Çıkar</button>
        ${paz && !v.turn.hamle && cash >= Math.round(cost / 10) * 5 ? html`<button class="btn gold" data-act="pazarlik" data-uid="${paz}">🤝 Pazarlık Ustası: ${fmt(Math.round(cost / 10) * 5)}</button>` : ''}</div>
        ${cash < cost ? html`<p class="reason">Nakdin yetmiyor; ihaleye çıkarabilirsin.</p>` : ''}${timerHTML(v, [me])}`;
    }
    case 'auction': {
      const done = Object.keys(pd.bids).length;
      const mine = pd.bids[me];
      const eligible = pd.eligible.includes(me);
      const head = html`<h3>🔨 Gizli ihale: ${BOARD[pd.sq].name}</h3><p>Liste fiyatı ${fmt(E.price(v, pd.sq))}. Herkes aynı anda gizli teklif verir. (${done}/${pd.eligible.length} teklif geldi)</p>`;
      if (!eligible) return html`${head}<p>Nakdin olmadığı için bu ihaleye katılamıyorsun.</p>${timerHTML(v, E.waitingFor(v))}`;
      if (mine !== undefined && mine !== -1) return html`${head}<p><b>Teklifin: ${mine > 0 ? fmt(mine) : 'pas'}</b> — diğerleri bekleniyor.</p>${timerHTML(v, E.waitingFor(v))}`;
      const cash = P(v, me).cash;
      const quick = [0.5, 0.8, 1, 1.3].map((f) => Math.min(cash, Math.round((E.price(v, pd.sq) * f) / 5) * 5));
      return html`${head}<div style="width:min(380px,100%)">${miniDeed(v, pd.sq)}</div>
        <div class="row center"><input class="input" style="width:140px" type="number" min="0" step="5" max="${cash}" data-bind="bid" placeholder="Teklif ₺">
        <button class="btn primary" data-act="bid" data-primary>Teklif Ver</button><button class="btn ghost" data-act="bidPass">Pas</button></div>
        <div class="row center">${[...new Set(quick)].map((q) => html`<button class="btn tiny gold" data-act="bidQuick" data-amt="${q}">${fmt(q)}</button>`)}</div>
        <div class="muted" style="font-size:12px">Nakdin: ${fmt(cash)}</div>${timerHTML(v, [me])}`;
    }
    case 'react': {
      const c = pd.card;
      const card = CARDS[c.id];
      const attacker = P(v, c.by);
      const victim = P(v, pd.victim);
      const what = c.target && c.target.sq !== undefined ? ` (${BOARD[c.target.sq].name})` : c.target && c.target.theirs !== undefined ? ` (${BOARD[c.target.mine].name} ↔ ${BOARD[c.target.theirs].name})` : '';
      const desc = html`<div class="bigcard" style="max-width:420px"><div class="ci">${card.icon}</div><div><div class="cn">${card.name}${what}</div><div class="ct">${attacker.name} → ${victim.name}${pd.chain ? ` · ${pd.chain} itiraz` : ''}</div></div></div>`;
      if (pd.responder !== me) return html`${desc}<p>${P(v, pd.responder).name} itiraz edecek mi?</p>${timerHTML(v, [pd.responder])}`;
      const it = P(v, me).hand.find((u) => cardId(u) === 'itiraz');
      const counter = me === c.by;
      return html`${desc}<h3>${counter ? `${victim.name} itiraz etti! Karşı itiraz?` : `${attacker.name} sana ${card.name} oynadı!`}</h3>
        <div class="row center"><button class="btn primary big" data-act="react" data-uid="${it}" data-primary>✋ ${counter ? 'Karşı İtiraz' : 'İtiraz Et'}</button><button class="btn ghost" data-act="react" data-uid="">${counter ? 'Vazgeç' : 'Kabul Et'}</button></div>${timerHTML(v, [me])}`;
    }
    case 'rent': {
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} kirayı ödeyecek mi, dayısını mı arayacak?</p>`;
      const dayi = P(v, me).hand.find((u) => cardId(u) === 'dayi');
      return html`<h3>Kira: ${fmt(pd.amount)}</h3><p>${BOARD[pd.sq].name} → ${P(v, pd.owner).name}${pd.zam ? ' (Kira Zammı!)' : ''}</p>
        <div class="row center"><button class="btn gold big" data-act="react" data-uid="${dayi}" data-primary>🧔 Dayın Çıktı!</button><button class="btn ghost" data-act="react" data-uid="">Öde</button></div>${timerHTML(v, [me])}`;
    }
    case 'tapu': {
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} Tapu Dairesi'nde arsa bakıyor…</p>`;
      const cash = P(v, me).cash;
      const opts = E.OWNABLE.filter((q) => v.props[q].owner === null);
      return html`<h3>📜 Tapu Dairesi</h3><p>Sahipsiz herhangi bir arsayı fiyatına alabilirsin.</p>
        <div class="targets" style="width:100%">${opts.map((q) => html`<button data-act="tapuBuy" data-sq="${q}" ${E.price(v, q) > cash ? 'disabled' : ''}>${sqChip(q)}<b>${fmt(E.price(v, q))}</b></button>`)}</div>
        <button class="btn ghost" data-act="tapuBuy" data-sq="">Bir şey alma</button>`;
    }
    case 'zabita': {
      if (pd.p !== me) return html`<p>🚨 ${P(v, pd.p).name} zabıtaya kimi ihbar edecek?</p>`;
      return html`<h3>🚨 Zabıta geldi</h3><p>Kimin kaçak katlarını ihbar ediyorsun? Hepsi yıkılır, kat başı ceza öder.</p>
        <div class="row center">${pd.options.map((o) => html`<button class="btn primary" data-act="zabita" data-p="${o}">${P(v, o).avatar} ${P(v, o).name} (${E.floorsOf(v, o).kacak} kaçak)</button>`)}</div>`;
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
      if (pd.p !== me) return html`<p>${P(v, pd.p).name} elindeki fazla kartları atıyor…</p>`;
      const n = app.ui.selected.length;
      return html`<h3>Elinde fazla kart var</h3><p>Sağdaki elinden <b>${pd.count}</b> kart seç ve at (seçili: ${n}).</p>
        <button class="btn primary big" data-act="discardGo" ${n !== pd.count ? 'disabled' : ''} data-primary>Seçilenleri At</button>`;
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

function diceHTML(v) {
  const d = v.turn && v.turn.dice;
  return d ? d.map((x, i) => dieHTML(x, i ? 'red' : '')).join('') : '';
}

function tickerHTML(v) {
  return v.log
    .slice(-3)
    .reverse()
    .map((l) => html`<div>${l.text}</div>`)
    .join('');
}

// ---------- yan panel ----------

function playersHTML(v) {
  const waiting = new Set(E.waitingFor(v));
  const conn = (app.meta && app.meta.connected) || {};
  return v.players
    .map((pl, i) => {
      const props = E.propsOf(v, i).sort((a, b) => a - b);
      const nw = E.netWorth(v, i);
      const flags = [
        pl.bot ? '🤖' : conn[pl.id] === false ? '📴' : '',
        pl.konkordato ? `⚠️×${pl.konkordato}` : '',
        pl.kiraZammi ? '📈' : '',
        waiting.has(i) && v.phase !== 'over' ? html`<span class="wait">⏳</span>` : '',
      ];
      return html`<div class="pl ${v.turn && v.turn.p === i ? 'turn' : ''} ${i === v.you ? 'me' : ''}" data-act="player" data-p="${i}">
        ${av(pl)}<div><div class="pname">${pl.name} ${flags}</div>
        <div class="psub"><span>🂠 ${pl.handCount}</span><div class="props-mini">${props.map((q) => html`<i class="${v.props[q].ipotek ? 'm' : ''}" style="--gc:${BOARD[q].group ? GROUPS[BOARD[q].group].color : '#555'}" title="${BOARD[q].name}"></i>`)}</div></div></div>
        <div class="pcash money ${pl.cash < 0 ? 'neg' : ''}" data-cash="${i}">${fmt(pl.cash)}<small>Değer ${fmt(nw)}</small></div></div>`;
    })
    .join('');
}

function meHTML(v) {
  const me = v.you;
  if (me < 0) return html`<div class="muted">İzleyici olarak bakıyorsun.</div>`;
  const pl = P(v, me);
  const discard = v.pending && v.pending.type === 'discard' && v.pending.p === me;
  const hand = pl.hand
    .map((u) => {
      const c = CARDS[cardId(u)];
      const cls = [c.type === 'tepki' ? 'tepki' : '', canPlay(v, u) ? 'playable' : '', app.ui.selected.includes(u) ? 'sel' : '', app.ui.newCards?.includes(u) ? 'new' : ''].join(' ');
      return html`<div class="hcard ${cls}" data-act="openCard" data-uid="${u}" title="${c.text}"><div class="ci">${c.icon}</div><div class="cn">${c.name}</div><div class="ct">${c.type === 'tepki' ? 'TEPKİ' : 'HAMLE'}</div></div>`;
    })
    .join('');
  const h = pl.hedef && HEDEF[pl.hedef];
  const hedefOk = h && E.hedefMet(v, me, pl.hedef);
  const manage = canManage(v);
  return html`<div class="me-head"><h4>Elin (${pl.hand.length}/${v.config.handLimit})${discard ? ' — atılacakları seç' : ''}</h4><div class="grow"></div>
      <button class="btn small ghost" data-act="manage">🏠 Mülklerim</button>
      <button class="btn small turq" data-act="trade" ${manage ? '' : 'disabled'} title="Sıra sendeyken pazarlık teklif edebilirsin">🤝 Pazarlık</button></div>
    <div class="hand">${raw(hand) || html`<span class="muted">Elinde kart yok.</span>`}</div>
    ${h ? html`<div class="hedef-box"><span class="hi">${h.icon}</span><div><b>Gizli hedef: ${h.name}</b> (+${h.bonus})<div class="muted">${h.text}</div></div><div class="grow"></div>${hedefOk ? html`<span class="chip" style="background:#cdeed9">✓ şu an tutuyor</span>` : ''}</div>` : ''}`;
}

function feedHTML() {
  if (app.ui.tab === 'chat') {
    if (!app.chat.length) return html`<div class="muted" style="padding:6px">Henüz mesaj yok. Laf atmanın tam zamanı.</div>`;
    return app.chat.map((m) => html`<div class="ln chat-msg"><b style="--c:${m.color}">${m.avatar} ${m.from}:</b> ${m.text}</div>`).join('');
  }
  const v = app.view;
  return v.log
    .slice()
    .reverse()
    .map((l) => html`<div class="ln t-${l.type}">${l.text}</div>`)
    .join('');
}

export function renderFeed() {
  if (!els) return;
  const chat = app.ui.tab === 'chat';
  els.tabLog.classList.toggle('on', !chat);
  els.tabChat.classList.toggle('on', chat);
  els.tabChat.textContent = app.unread && !chat ? `Sohbet (${app.unread})` : 'Sohbet';
  els.chatForm.classList.toggle('hidden', !chat);
  els.quick.classList.toggle('hidden', !chat);
  setHTML(els.feed, feedHTML());
  if (chat) els.feed.scrollTop = els.feed.scrollHeight;
}

// ---------- pencereler ----------

function cardDialog(v, uid) {
  const id = cardId(uid);
  const c = CARDS[id];
  const me = v.you;
  const playable = canPlay(v, uid);
  const big = html`<div class="bigcard ${c.type === 'tepki' ? 'tepki' : ''}"><div class="ci">${c.icon}</div><div><div class="cn">${c.name}</div><div class="ct">${c.text}</div>
    <div class="chip" style="margin-top:6px">${c.type === 'tepki' ? 'TEPKİ: gerektiğinde sana sorulur' : { preroll: 'Zar atmadan önce', choose: 'Zar attıktan sonra', buy: 'Satın alma kararında' }[c.when] || 'Sıran sendeyken'}</div></div></div>`;
  if (!playable) {
    let why = 'Bu kart şu an oynanamaz.';
    if (c.type === 'tepki') why = 'Bu bir tepki kartı; zamanı gelince sana sorulacak.';
    else if (v.turn && v.turn.p === me && v.turn.hamle) why = 'Bu tur zaten bir Hamle kartı oynadın.';
    else if (v.turn && v.turn.p === me && !v.pending && E.cardTargets(v, me, id).length === 0) why = 'Bu kart için uygun hedef yok.';
    return html`<h2>Kart</h2>${big}<p class="reason">${why}</p>`;
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
  return html`<h2>Kart oyna</h2>${big}${body}`;
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
    const lvl = '■'.repeat(ps.kat) + (ps.kacak ? '▲' : '');
    return html`<tr><td>${sqChip(q)}${ps.ipotek ? html` <span class="chip">ipotekli</span>` : ''}${ps.tedbir ? html` <span class="chip">⚖️</span>` : ''}</td><td>${lvl || '-'}</td><td class="money">${ps.ipotek ? '-' : fmt(E.rentFor(v, q))}</td><td class="acts">${propActions(v, q)}</td></tr>`;
  });
  return html`<h2>🏠 Mülklerim</h2>${note}<table class="mgr"><tr><th>Mülk</th><th>Kat</th><th>Kira</th><th></th></tr>${rows}</table>
    <p class="muted" style="font-size:12px">■ yasal kat, ▲ kaçak kat. Yasal kat için şehrin tüm mülkleri sende olmalı. Kaçak kat yarı fiyat ama yıkılabilir.</p>`;
}

function tradeDialog(v) {
  const me = v.you;
  const t = app.ui.trade;
  const opps = v.players.map((_, i) => i).filter((i) => i !== me);
  if (t.to === null || !opps.includes(t.to)) t.to = opps[0];
  const list = (owner, side) =>
    E.propsOf(v, owner)
      .sort((a, b) => a - b)
      .map((q) => {
        const ok = E.level(v.props[q]) === 0;
        return html`<label class="pick ${ok ? '' : 'off'}"><input type="checkbox" data-act="tradePick" data-side="${side}" data-sq="${q}" ${t[side].props.includes(q) ? 'checked' : ''} ${ok ? '' : 'disabled'}>${sqChip(q)}${ok ? '' : html`<span class="muted">katlı</span>`}</label>`;
      });
  const offer = tradeOffer();
  const block = E.tradeBlock(v, me, offer);
  return html`<h2>🤝 Pazarlık teklifi</h2>
    <div class="seg">${opps.map((i) => html`<button class="${t.to === i ? 'on' : ''}" data-act="tradeTo" data-p="${i}">${P(v, i).avatar} ${P(v, i).name}</button>`)}</div>
    <div class="trade-cols">
      <div class="trade-col"><h4>Sen veriyorsun</h4>${list(me, 'give')}<label class="field">Para<input class="input" type="number" min="0" step="5" data-bind="tradeGive" placeholder="0"></label></div>
      <div class="trade-col"><h4>${P(v, t.to).name} veriyor</h4>${list(t.to, 'take')}<label class="field">Para<input class="input" type="number" min="0" step="5" data-bind="tradeTake" placeholder="0"></label></div>
    </div>
    ${block ? html`<p class="reason">${block}</p>` : ''}
    <div class="row"><div class="grow"></div><button class="btn ghost" data-act="close">Vazgeç</button><button class="btn primary" data-act="sendTrade" ${block ? 'disabled' : ''}>Teklifi Gönder</button></div>`;
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
    const g = BOARD[q].group || 'ulasim';
    (byGroup[g] ||= []).push(q);
  }
  const groups = Object.entries(byGroup).map(
    ([g, qs]) =>
      html`<div class="row"><b style="min-width:90px">${g === 'ulasim' ? 'Ulaşım' : GROUPS[g].name}${g !== 'ulasim' && E.ownsGroup(v, p, g) ? ' ★' : ''}</b>${qs.map((q) => html`<span class="chip">${BOARD[q].name}${v.props[q].kat ? ` ${'■'.repeat(v.props[q].kat)}` : ''}${v.props[q].kacak ? ' ▲' : ''}${v.props[q].ipotek ? ' (ipotek)' : ''}</span>`)}</div>`,
  );
  return html`<h2>${av(pl)} ${pl.name}</h2>
    <div class="row"><span class="chip">💵 ${fmt(pl.cash)}</span><span class="chip">Net değer ${fmt(E.netWorth(v, p))}</span><span class="chip">🂠 ${pl.handCount} kart</span>${pl.konkordato ? html`<span class="chip">Konkordato ×${pl.konkordato}</span>` : ''}</div>
    ${groups.length ? groups : html`<p class="muted">Mülkü yok.</p>`}
    <p class="muted" style="font-size:12px">★ tamamlanmış şehir seti. Gizli hedefler oyun sonunda açılır.</p>`;
}

function squareDialog(v, sq) {
  const s = BOARD[sq];
  if (!v.props[sq]) {
    const info = { start: 'Buradan geçince ya da buraya gelince maaş alırsın.', chance: 'Buraya gelince 2 Hamle kartı çekersin.', tapu: 'Buraya gelince tahtadaki sahipsiz herhangi bir arsayı fiyatına alabilirsin.', cay: 'Buraya gelince diğer herkes sana çay parası öder.', zabita: 'Buraya gelince kaçak katı olan bir rakibi ihbar edersin.' }[s.kind];
    return html`<h2>${s.icon} ${s.name}</h2><p>${info}</p>`;
  }
  const acts = propActions(v, sq);
  return html`${deedHTML(v, sq)}${acts.length ? html`<div class="row">${acts}</div>` : ''}`;
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
  return html`<h2>🗳️ Seçim Günü sonuçları</h2><div class="results">${rows}</div>
    ${isHost() ? html`<div class="row"><div class="grow"></div><button class="btn turq" data-act="newGame">Aynı masayla yeni oyun</button></div>` : ''}`;
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
    case 'square':
      body = squareDialog(v, d.sq);
      break;
    case 'results':
      body = resultsDialog(v);
      wide = true;
      break;
    case 'rules':
      body = html`<h2>❓ Nasıl oynanır?</h2>${raw(RULES_HTML)}`;
      break;
    default:
  }
  renderKeep(els.modal, html`<div class="modal-back" data-act="backdrop"><div class="modal ${wide ? 'wide' : ''}"><button class="x" data-act="close">✕</button>${body}</div></div>`);
}

// İçerik değişince girişleri (teklif, para) kaybetmeden yeniden çizer.
function renderKeep(el, content) {
  const focused = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.bind : null;
  setHTML(el, content);
  for (const inp of el.querySelectorAll('[data-bind]')) {
    const val = app.ui.binds?.[inp.dataset.bind];
    if (val !== undefined && inp.value !== String(val)) inp.value = val;
    if (focused && inp.dataset.bind === focused && document.activeElement !== inp) inp.focus();
  }
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
  updateBoard(cells, v, highlightOf(v));
  tokens.sync(v.players, v.turn ? v.turn.p : -1);
  if (!animating) tokens.settle(v.players);
  setHTML(els.gundem, gundemHTML(v));
  renderKeep(els.prompt, promptHTML(v));
  if (!animating) setHTML(els.dice, v.pending ? '' : diceHTML(v));
  setHTML(els.ticker, tickerHTML(v));
  setHTML(els.players, playersHTML(v));
  setHTML(els.me, meHTML(v));
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
  const now = Date.now();
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

function showNews(v, ev) {
  const g = GUNDEM[ev.id];
  const detail = v.gundem && v.gundem.id === ev.id ? v.gundem.detail : '';
  els.stage.innerHTML = html`<div class="stage" data-act="closeStage"><div class="news"><div class="kicker">${ev.round}. TUR · SON DAKİKA</div><div class="gi">${g.icon}</div><div class="gt">${g.name}</div><div class="gx">${g.text}</div>${detail ? html`<div class="gd">${detail}</div>` : ''}</div></div>`.toString();
  clearTimeout(showNews.t);
  showNews.t = setTimeout(() => (els.stage.innerHTML = ''), 3600);
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
  for (const ev of events) {
    switch (ev.type) {
      case 'card':
        play(ev.card === 'itiraz' ? 'itiraz' : 'card');
        if (ev.p !== me) toast(`${CARDS[ev.card].icon} ${ev.text}`, 'card');
        break;
      case 'money':
        if (!fast) {
          if (ev.from !== null) floatMoney(ev.from, -ev.amount);
          if (ev.to !== null) floatMoney(ev.to, ev.amount);
        }
        if (ev.to === me) play('coin');
        else if (ev.from === me) play('pay');
        break;
      case 'build':
        play('build');
        break;
      case 'demolish':
        play('crash');
        toast(`🚜 ${P(v, ev.p).name}: ${ev.n} kaçak kat yıkıldı!`, 'error');
        break;
      case 'konkordato':
        play('crash');
        toast(`⚠️ ${P(v, ev.p).name} konkordato ilan etti!`, 'error');
        break;
      case 'auction':
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
  const dice = events.find((e) => e.type === 'dice' || e.type === 'dava');
  const moves = events.filter((e) => e.type === 'move');
  if ((dice || moves.length) && prev && els) {
    animating = true;
    try {
      if (dice) await rollDice(els.dice, dice.dice, fast);
      els.dice._last = null;
      for (const m of moves) await tokens.walk(P(v, m.p).id, m.path, fast);
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
  if (app.ui.dialog && app.ui.dialog.type === 'trade') renderModal();
  return true;
}
