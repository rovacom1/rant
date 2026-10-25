// Uygulama girişi: menü, lobi, bağlantılar ve tıklama yönlendirmesi.
import * as E from '../engine/index.js';
import { Host } from '../net/host.js';
import { localPair, openRoom, joinRoom, randomCode, normalizeCode } from '../net/transport.js';
import { APP_VERSION, PROTOCOL, SAVE_VERSION } from '../version.js';
import { html, raw, $, store, sleep } from './dom.js';
import { play, setAudio } from './sound.js';
import { toggleNotify, watchTurn } from './notify.js';
import { app, profile, send, act, isHost } from './state.js';
import * as G from './gameview.js';
import { pickClick, isBoardPickable } from './pick.js';
import { RULES_HTML } from './rules.js';

const root = document.getElementById('app');
const SAVE = { host: 'save.host', local: 'save.local' };
const SAVE_MAX_AGE = 3 * 24 * 3600 * 1000;
const freshUI = () => ({ dialog: null, selected: [], binds: {}, trade: null, swapMine: null, pick: null, popSq: null, seenOver: false });

function savedGame(kind) {
  const s = store.get(SAVE[kind]);
  if (!s || s.v !== SAVE_VERSION || Date.now() - s.savedAt > SAVE_MAX_AGE) return null;
  if (s.game && s.game.v !== E.RULES_VERSION) return null;
  return s;
}

// ---------- ekranlar ----------

const SKYLINE = `<svg class="skyline" viewBox="0 0 460 130" aria-hidden="true">
  <g fill="#24408e"><rect x="0" y="70" width="46" height="60"/><rect x="52" y="40" width="34" height="90"/><rect x="200" y="55" width="40" height="75"/><rect x="330" y="30" width="38" height="100"/><rect x="410" y="62" width="50" height="68"/></g>
  <g fill="#00798c"><rect x="92" y="78" width="40" height="52"/><rect x="246" y="86" width="30" height="44"/><rect x="372" y="80" width="34" height="50"/></g>
  <g fill="#1b2233"><path d="M138 130V92a32 32 0 0 1 64 0v38z"/><rect x="134" y="38" width="5" height="92"/><path d="M131 40l5.5-14 5.5 14z"/><rect x="201" y="44" width="5" height="86"/><path d="M198 46l5.5-14 5.5 14z"/><rect x="166" y="52" width="8" height="10" rx="4"/></g>
  <g stroke="#edae49" stroke-width="3" fill="none"><path d="M290 130V18M290 22h70M290 22l-22 16M300 22l58 0"/><path d="M352 22v34" stroke-width="1.5"/></g>
  <rect x="345" y="56" width="14" height="10" fill="#d1495b"/>
  <g fill="#edae49" opacity=".85"><rect x="58" y="50" width="6" height="6"/><rect x="72" y="50" width="6" height="6"/><rect x="58" y="66" width="6" height="6"/><rect x="72" y="82" width="6" height="6"/><rect x="338" y="40" width="6" height="6"/><rect x="352" y="56" width="6" height="6"/><rect x="338" y="72" width="6" height="6"/><rect x="210" y="66" width="6" height="6"/><rect x="224" y="82" width="6" height="6"/><rect x="420" y="74" width="6" height="6"/><rect x="438" y="90" width="6" height="6"/></g>
</svg>`;

function menuHTML() {
  const host = savedGame('host');
  const local = savedGame('local');
  const busy = app.status === 'connecting' || (typeof app.status === 'string' && app.status.startsWith('Oda kodu'));
  const resume = (kind, s, label) =>
    html`<div class="notice"><b>${label}</b>${s.game ? ` — ${s.game.phase === 'over' ? 'bitmiş oyun' : `${s.game.round}. tur`}` : ' — lobide'}${kind === 'host' ? `, oda ${s.code}` : ''}
      <div class="row" style="margin-top:6px"><button class="btn small turq" data-act="${kind === 'host' ? 'resumeHost' : 'resumeLocal'}" ${busy ? 'disabled' : ''}>Devam et</button><button class="btn small ghost" data-act="dropSave" data-k="${kind}">Sil</button></div></div>`;
  return html`<div class="screen"><div class="hero">
    <div>
      <h1 class="logo">RA<span>N</span>T</h1>
      <p class="tagline">Kentsel dönüşümün kart oyunu. Arsa kap, kaçak kat çık, dayını ara, itiraz et.</p>
      <div class="facts"><span>👥 4-5 kişi (2-6)</span><span>⏱ 35-45 dk</span><span>🌍 İnternetten, kurulum yok</span></div>
      ${raw(SKYLINE)}
    </div>
    <div class="card-panel">
      <h2>Masaya otur</h2>
      <label class="field">Adın<input class="input" id="nameInput" maxlength="16" placeholder="ör. Furkan" value="${profile.name}"></label>
      <div class="field">Simgen<div class="avatars">${E.AVATARS.map((a) => html`<button class="${a === profile.avatar ? 'on' : ''}" data-act="avatar" data-a="${a}">${a}</button>`)}</div></div>
      ${app.error ? html`<div class="notice error">${app.error}</div>` : ''}
      ${busy ? html`<div class="notice">⏳ ${app.status === 'connecting' ? 'Bağlanılıyor…' : app.status}</div>` : ''}
      ${host ? resume('host', host, 'Kurduğun oda') : ''}
      ${local ? resume('local', local, 'Bot oyunun') : ''}
      <button class="btn primary big" data-act="host" ${busy ? 'disabled' : ''}>🏠 Oda Kur</button>
      <div class="divider">ya da arkadaşının odasına katıl</div>
      <div class="row"><input class="input code grow" id="codeInput" maxlength="8" placeholder="ODA KODU" value="${app.joinCode || ''}" style="flex:1;min-width:0"><button class="btn turq" data-act="join" ${busy ? 'disabled' : ''}>Katıl</button></div>
      <div class="divider">ya da</div>
      <div class="row"><button class="btn ghost grow" data-act="local" ${busy ? 'disabled' : ''}>🤖 Botlarla dene</button><button class="btn ghost" data-act="rules">❓ Nasıl oynanır?</button></div>
    </div>
  </div></div>${modalShell()}<div class="version">RANT ${APP_VERSION}</div>`;
}

function lobbyHTML() {
  const L = app.lobby;
  const host = isHost();
  const seats = L.seats.map(
    (s) => html`<div class="seat ${s.id === app.me ? 'me' : ''}"><span class="av" style="--c:${s.color}">${s.avatar}</span>
      <div class="grow"><b>${s.name}</b><div class="muted" style="font-size:12px">${s.id === L.hostId ? 'ev sahibi' : s.bot ? '🤖 bot' : s.connected ? 'bağlı' : '📴 bağlantı yok'}${s.id === app.me ? ' · sen' : ''}</div></div>
      ${host && s.id !== L.hostId ? html`<button class="btn tiny ghost" data-act="removeSeat" data-id="${s.id}" title="Çıkar">✕</button>` : ''}</div>`,
  );
  const empty = Math.max(0, 6 - L.seats.length);
  for (let i = 0; i < empty; i++) {
    seats.push(i === 0 && host ? html`<button class="seat empty" data-act="addBot" style="cursor:pointer">+ Bot ekle</button>` : html`<div class="seat empty">boş koltuk</div>`);
  }
  const seg = (name, opts, cur, label) =>
    html`<div class="field">${label}<div class="seg">${opts.map(([v, t]) => html`<button class="${cur === v ? 'on' : ''}" data-act="${name}" data-v="${v}" ${host ? '' : 'disabled'}>${t}</button>`)}</div></div>`;
  const online = app.mode !== 'local';
  return html`<div class="screen"><div class="card-panel lobby">
    <div class="row"><h2 class="grow">${online ? 'Oda hazır' : 'Bot masası'}</h2><button class="btn small ghost" data-act="rules">❓ Kurallar</button><button class="btn small ghost" data-act="leave">Çık</button></div>
    ${online ? html`<div class="row"><div><div class="muted" style="font-size:12px">ODA KODU</div><div class="room-code">${L.code}</div></div><div class="grow"></div><button class="btn turq" data-act="copyLink">🔗 Davet linkini kopyala</button></div>
      <p class="muted" style="margin:0">Linki arkadaşlarına gönder. Açınca adını yazıp "Katıl"a basmaları yeter. Kurulum ya da sunucu yok.</p>` : html`<p class="muted" style="margin:0">Tek bilgisayarda botlara karşı oynarsın. Arkadaşlarla oynamak için menüden "Oda Kur".</p>`}
    <div class="seats">${seats}</div>
    <div class="row" style="gap:18px;align-items:flex-start">
      ${seg('cfgEnd', [['rounds', 'Tur sayısı'], ['score', 'Değer hedefi']], L.config.endMode || 'rounds', 'Oyun sonu')}
      ${L.config.endMode === 'score'
        ? seg('cfgTarget', E.TARGET_OPTIONS.map((t) => [t, E.fmt(t)]), L.config.targetScore, 'Hedef değer (ulaşılan tur Seçim Günü olur)')
        : seg('cfgRounds', [[10, '10 tur'], [15, '15 tur'], [20, '20 tur']], L.config.maxRounds, 'Oyun uzunluğu')}
      ${seg('cfgTurn', [[60, '60 sn'], [120, '2 dk'], [180, '3 dk'], [0, 'Yok']], L.config.turnLimit, 'Sıra süresi (dolunca bot oynar)')}
    </div>
    ${rulesHTML(L.config.rules || E.DEFAULT_CONFIG.rules, host)}
    ${app.error ? html`<div class="notice error">${app.error}</div>` : ''}
    ${host ? html`<button class="btn primary big" data-act="start" ${L.seats.length < 2 ? 'disabled' : ''}>Oyunu Başlat (${L.seats.length} oyuncu)</button>
      <div class="muted" style="font-size:12px">Oyun 4-5 kişi için ayarlı. Eksik koltukları botla doldurabilirsin.</div>` : html`<div class="notice">Ev sahibinin oyunu başlatması bekleniyor…</div>`}
  </div></div>${modalShell()}<div class="version">RANT ${APP_VERSION}</div>`;
}

// Masa ayarları: ev sahibi tıklayarak açar/kapatır, diğerleri yalnız görür.
function rulesHTML(rules, host) {
  const items = Object.entries(E.RULE_LABELS).map(
    ([k, r]) => html`<button class="rule ${rules[k] ? 'on' : ''}" data-act="cfgRule" data-k="${k}" ${host ? '' : 'disabled'} title="${rules[k] ? 'Açık' : `Kapalı: ${r.off}`}">
      <span class="ri">${r.icon}</span><span class="rn">${r.name}</span><span class="rs">${rules[k] ? 'Açık' : 'Kapalı'}</span></button>`,
  );
  return html`<div class="field">Masa ayarları${host ? '' : ' (ev sahibi seçer)'}<div class="rules-grid">${items}</div></div>`;
}

const modalShell = () => (app.ui.menuModal ? html`<div class="modal-back" data-act="backdrop"><div class="modal"><button class="x" data-act="close">✕</button><h2>❓ Nasıl oynanır?</h2>${raw(RULES_HTML)}</div></div>` : '');

function render() {
  if (app.screen === 'game' && app.view) {
    if (!G.gameMounted()) G.mountGame(root);
    G.updateGame();
    return;
  }
  G.unmountGame();
  const focus = document.activeElement && document.activeElement.id;
  root.innerHTML = String(app.screen === 'lobby' && app.lobby ? lobbyHTML() : menuHTML());
  if (focus && document.getElementById(focus)) document.getElementById(focus).focus();
}

// ---------- bağlantı ----------

const queue = [];
let draining = false;

function enqueue(m) {
  queue.push(m);
  if (!draining) drain();
}

async function drain() {
  draining = true;
  while (queue.length) {
    const m = queue.shift();
    const prev = app.view;
    app.view = m.view;
    app.meta = m.meta;
    if (m.lobby) app.lobby = m.lobby;
    if (app.screen !== 'game') {
      app.screen = 'game';
      render();
    }
    try {
      await G.present(prev, m.view, m.events || [], queue.length > 2 || !prev);
    } catch (e) {
      console.error(e);
      G.updateGame();
    }
  }
  draining = false;
}

function onMsg(m) {
  app.lastMsg = Date.now();
  switch (m.t) {
    case 'welcome':
      Object.assign(app, { me: m.you, hostId: m.hostId, code: m.code, spectator: m.spectator, status: 'online', error: '' });
      break;
    case 'lobby':
      app.lobby = m.lobby;
      if (app.screen === 'game') {
        app.view = null;
        app.ui = freshUI();
      }
      app.screen = 'lobby';
      render();
      break;
    case 'state':
      enqueue(m);
      break;
    case 'error':
      play('error');
      if (app.screen === 'game') G.toast(m.msg, 'error');
      else {
        app.error = m.msg;
        render();
      }
      break;
    case 'reject':
      leave(
        { version: 'Oyunun sürümü ev sahibininkiyle uyuşmuyor. İkiniz de sayfayı yenileyin (Ctrl+F5).', taken: 'Bu koltuk başka bir tarayıcıya ait.', full: 'Oda dolu (en fazla 6 kişi).' }[m.reason] ||
          'Odaya girilemedi.',
      );
      break;
    case 'kicked':
      leave('Ev sahibi seni odadan çıkardı.');
      break;
    case 'ping':
      send({ t: 'pong' });
      break;
    default:
  }
}

function useConn(conn) {
  app.conn = conn;
  app.lastMsg = Date.now();
  conn.onmessage = onMsg;
  conn.onclose = () => {
    if (app.leaving || app.conn !== conn) return;
    if (app.mode === 'join') reconnect();
  };
  send({ t: 'hello', v: PROTOCOL, token: profile.token, name: profile.name, avatar: profile.avatar });
}

async function reconnect() {
  app.status = 'reconnecting';
  if (G.gameMounted()) G.updateGame();
  else render();
  for (let i = 0; app.mode === 'join' && !app.leaving; i++) {
    await sleep(Math.min(8000, 2000 + i * 1000));
    if (app.mode !== 'join' || app.leaving) return;
    try {
      const conn = await joinRoom(app.code);
      if (app.mode !== 'join' || app.leaving) return conn.close();
      useConn(conn);
      return;
    } catch {}
  }
}

// Ev sahibinden uzun süre ses çıkmazsa bağlantı ölmüştür.
setInterval(() => {
  if (app.mode === 'join' && app.conn && app.status === 'online' && Date.now() - app.lastMsg > 20000) {
    const c = app.conn;
    app.conn = null;
    try {
      c.close();
    } catch {}
    reconnect();
  }
}, 4000);

function attachLocal(host) {
  const [a, b] = localPair();
  host.attach(a, { local: true });
  useConn(b);
}

async function startHost(saved = null) {
  app.leaving = false;
  app.mode = 'host';
  app.status = 'connecting';
  app.error = '';
  render();
  let code = saved ? saved.code : randomCode();
  const host = new Host({ code, hostToken: profile.token, hostName: profile.name, hostAvatar: profile.avatar, save: (snap) => store.set(SAVE.host, snap), saved });
  for (let tries = 0; ; tries++) {
    try {
      app.peer = await openRoom(code, (conn) => host.attach(conn), (st) => {
        app.status = st === 'online' ? 'online' : st === 'reconnecting' ? 'reconnecting' : app.status;
        if (G.gameMounted()) G.updateGame();
      });
      break;
    } catch (e) {
      if (e.type === 'unavailable-id' && saved && tries < 12) {
        app.status = `Oda kodu ${code} henüz serbest değil, tekrar deneniyor (${tries + 1})…`;
        render();
        await sleep(5000);
        continue;
      }
      if (e.type === 'unavailable-id' && !saved && tries < 3) {
        code = randomCode();
        host.code = code;
        continue;
      }
      app.mode = null;
      app.status = '';
      app.error = e.message;
      render();
      return;
    }
  }
  if (app.mode !== 'host') {
    app.peer.destroy();
    return;
  }
  app.host = host;
  app.code = code;
  app.hb = setInterval(() => host.heartbeat(), 5000);
  attachLocal(host);
  host.schedule();
}

function startLocal(saved = null) {
  app.leaving = false;
  app.mode = 'local';
  app.error = '';
  const host = new Host({ code: 'YEREL', hostToken: profile.token, hostName: profile.name, hostAvatar: profile.avatar, save: (snap) => store.set(SAVE.local, snap), saved });
  if (!saved) for (let i = 0; i < 3; i++) host.addBot();
  app.host = host;
  app.code = 'YEREL';
  attachLocal(host);
  host.schedule();
}

async function startJoin(raw) {
  const code = normalizeCode(raw);
  if (code.length < 4) {
    app.error = 'Geçerli bir oda kodu yaz.';
    return render();
  }
  app.leaving = false;
  app.mode = 'join';
  app.code = code;
  app.status = 'connecting';
  app.error = '';
  render();
  try {
    const conn = await joinRoom(code);
    if (app.mode !== 'join') return conn.close();
    history.replaceState(null, '', `#${code}`);
    store.set('lastJoin', code);
    useConn(conn);
  } catch (e) {
    app.mode = null;
    app.status = '';
    app.error = e.message;
    render();
  }
}

function leave(msg = '') {
  app.leaving = true;
  try {
    app.conn && app.conn.close();
  } catch {}
  if (app.peer) app.peer.destroy();
  if (app.host) clearTimeout(app.host.timer);
  clearInterval(app.hb);
  Object.assign(app, { mode: null, conn: null, host: null, peer: null, me: null, view: null, meta: null, lobby: null, screen: 'menu', status: '', error: msg });
  app.ui = freshUI();
  app.joinCode = '';
  store.del('lastJoin');
  history.replaceState(null, '', location.pathname);
  render();
}

function needName() {
  const inp = $('#nameInput');
  if (inp) profile.name = inp.value.trim().slice(0, 16);
  store.set('name', profile.name);
  if (!profile.name) {
    app.error = 'Önce adını yaz.';
    render();
    $('#nameInput')?.focus();
    return false;
  }
  return true;
}

function inviteLink() {
  return `${location.origin}${location.pathname}#${app.code}`;
}

async function copyLink() {
  if (app.mode === 'local') return;
  const link = inviteLink();
  try {
    await navigator.clipboard.writeText(link);
    G.toast(`Davet linki kopyalandı: ${link}`, 'good');
  } catch {
    prompt('Bu linki arkadaşlarına gönder:', link);
  }
}

// ---------- tıklamalar ----------

const V = () => app.view;
const closeDialog = () => {
  app.ui.dialog = null;
  app.ui.menuModal = false;
  if (app.screen === 'game') G.renderModal();
  else render();
};
const openDialog = (d) => {
  app.ui.dialog = d;
  app.ui.popSq = null;
  G.updateGame();
};
const closePop = () => {
  if (app.ui.popSq === null || app.ui.popSq === undefined) return;
  app.ui.popSq = null;
  G.updateGame();
};

const A = {
  avatar(el) {
    profile.avatar = el.dataset.a;
    store.set('avatar', profile.avatar);
    const inp = $('#nameInput');
    if (inp) profile.name = inp.value;
    render();
  },
  host: () => needName() && startHost(),
  join: () => needName() && startJoin($('#codeInput').value),
  local: () => needName() && startLocal(),
  resumeHost: () => needName() && startHost(savedGame('host')),
  resumeLocal: () => needName() && startLocal(savedGame('local')),
  dropSave(el) {
    if (!confirm('Kayıtlı oyun silinsin mi?')) return;
    store.del(SAVE[el.dataset.k]);
    render();
  },
  rules() {
    if (app.screen === 'game') openDialog({ type: 'rules' });
    else {
      app.ui.menuModal = true;
      render();
    }
  },
  addBot: () => send({ t: 'lobby', cmd: 'addBot' }),
  removeSeat: (el) => send({ t: 'lobby', cmd: 'remove', id: el.dataset.id }),
  cfgRounds: (el) => send({ t: 'lobby', cmd: 'config', maxRounds: Number(el.dataset.v) }),
  cfgTurn: (el) => send({ t: 'lobby', cmd: 'config', turnLimit: Number(el.dataset.v) }),
  cfgEnd: (el) => send({ t: 'lobby', cmd: 'config', endMode: el.dataset.v }),
  cfgTarget: (el) => send({ t: 'lobby', cmd: 'config', targetScore: Number(el.dataset.v) }),
  cfgRule: (el) => {
    const cur = (app.lobby.config.rules || E.DEFAULT_CONFIG.rules)[el.dataset.k];
    send({ t: 'lobby', cmd: 'config', rules: { [el.dataset.k]: !cur } });
  },
  start: () => send({ t: 'lobby', cmd: 'start' }),
  newGame: () => send({ t: 'lobby', cmd: 'newGame' }),
  copyLink,
  leave() {
    const playing = app.view && app.view.phase !== 'over';
    if (app.mode === 'host' && playing && !confirm('Ev sahibi sensin: çıkarsan oyun herkes için durur. Oyun kaydedilir, menüden "Devam et" ile sürdürebilirsin. Çıkılsın mı?')) return;
    if (app.mode !== 'host' && playing && !confirm('Oyundan çıkılsın mı? Aynı linkle geri dönebilirsin.')) return;
    leave();
  },
  audio() {
    app.ui.audioOpen = !app.ui.audioOpen;
    G.updateGame();
  },
  audioToggle(el) {
    setAudio({ [`${el.dataset.k}On`]: el.checked });
    G.updateGame();
  },
  async notify() {
    const on = await toggleNotify();
    if (!on && Notification.permission === 'denied') G.toast('Bildirim izni tarayıcıda kapalı; adres çubuğundaki kilit simgesinden açabilirsin.', 'error');
    else G.toast(on ? '🔔 Sıra sana gelince bildirim gelecek.' : '🔕 Bildirimler kapandı.', on ? 'good' : '');
    G.updateGame();
  },

  roll: () => act({ type: 'roll' }),
  moveSum: () => act({ type: 'move', steps: V().turn.dice[0] + V().turn.dice[1] }),
  kestirme: (el) => act({ type: 'playCard', uid: el.dataset.uid, target: { die: Number(el.dataset.die) } }),
  endTurn: () => act({ type: 'endTurn' }),
  settleDebt: () => act({ type: 'settleDebt' }),
  buy: () => act({ type: 'buy' }),
  decline: () => act({ type: 'decline' }),
  pazarlik: (el) => act({ type: 'playCard', uid: el.dataset.uid }),
  bid() {
    act({ type: 'bid', amount: Math.max(0, Math.floor(Number(app.ui.binds.bid) || 0)) });
    app.ui.binds.bid = '0';
  },
  bidPass: () => act({ type: 'bid', amount: 0 }),
  bidQuick(el) {
    app.ui.binds.bid = el.dataset.amt;
    G.updateGame();
  },
  react: (el) => act({ type: 'react', uid: el.dataset.uid || null }),
  tapuBuy: (el) => act({ type: 'tapuBuy', sq: el.dataset.sq === '' ? null : Number(el.dataset.sq) }),
  zabita: (el) => act({ type: 'zabitaTarget', target: Number(el.dataset.p) }),
  tradeAccept: () => act({ type: 'tradeRespond', accept: true }),
  tradeReject: () => act({ type: 'tradeRespond', accept: false }),
  tradeCancel: () => act({ type: 'tradeCancel' }),
  discardGo() {
    act({ type: 'discard', uids: app.ui.selected });
    app.ui.selected = [];
  },
  hedef: (el) => act({ type: 'chooseHedef', hedef: el.dataset.id }),
  openCard(el) {
    const v = V();
    const uid = el.dataset.uid;
    if (v.pending && v.pending.type === 'discard' && v.pending.p === v.you) {
      const s = app.ui.selected;
      app.ui.selected = s.includes(uid) ? s.filter((u) => u !== uid) : [...s, uid].slice(-v.pending.count);
      return G.updateGame();
    }
    app.ui.swapMine = null;
    openDialog({ type: 'card', uid });
  },
  play(el) {
    act({ type: 'playCard', uid: el.dataset.uid, target: JSON.parse(el.dataset.t || '{}') });
    closeDialog();
  },
  swapMine(el) {
    app.ui.swapMine = Number(el.dataset.sq);
    G.renderModal();
  },
  square(el) {
    const sq = Number(el.dataset.sq);
    if (!app.ui.pick) {
      app.ui.popSq = app.ui.popSq === sq ? null : sq;
      return G.updateGame();
    }
    const r = pickClick(V(), app.ui.pick.uid, app.ui.swapMine, sq);
    if (!r) return G.toast('Bu kare seçilemez; parlayan karelerden birini seç.', 'error');
    if (r.swapMine !== undefined) app.ui.swapMine = r.swapMine;
    else {
      act({ type: 'playCard', uid: app.ui.pick.uid, target: r.play });
      app.ui.pick = null;
    }
    G.updateGame();
  },
  pickBoard(el) {
    app.ui.pick = { uid: el.dataset.uid };
    app.ui.swapMine = null;
    app.ui.dialog = null;
    G.updateGame();
  },
  popClose: closePop,
  pickCancel() {
    app.ui.pick = null;
    G.updateGame();
  },
  player: (el) => openDialog({ type: 'player', p: Number(el.dataset.p) }),
  history: () => openDialog({ type: 'history' }),
  manage: () => openDialog({ type: 'manage' }),
  trade() {
    app.ui.trade = { to: null, give: { props: [] }, take: { props: [] } };
    app.ui.binds.tradeGive = '0';
    app.ui.binds.tradeTake = '0';
    openDialog({ type: 'trade' });
  },
  tradeTo(el) {
    app.ui.trade.to = Number(el.dataset.p);
    app.ui.trade.take.props = [];
    app.ui.binds.tradeTake = '0';
    G.renderModal();
  },
  tradePick(el) {
    const list = app.ui.trade[el.dataset.side].props;
    const sq = Number(el.dataset.sq);
    const i = list.indexOf(sq);
    if (i >= 0) list.splice(i, 1);
    else list.push(sq);
    G.renderModal();
  },
  sendTrade() {
    act({ type: 'proposeTrade', ...G.tradeOffer() });
    closeDialog();
  },
  build: (el) => act({ type: 'build', sq: Number(el.dataset.sq) }),
  buildKacak: (el) => act({ type: 'buildKacak', sq: Number(el.dataset.sq) }),
  sellFloor: (el) => act({ type: 'sellFloor', sq: Number(el.dataset.sq) }),
  mortgage: (el) => act({ type: 'mortgage', sq: Number(el.dataset.sq) }),
  unmortgage: (el) => act({ type: 'unmortgage', sq: Number(el.dataset.sq) }),
  close: closeDialog,
  backdrop(el, e) {
    if (e.target === el) closeDialog();
  },
  closeStage: (el) => el.remove(),
  results: () => openDialog({ type: 'results' }),
  theme() {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    store.set('theme', dark ? 'dark' : 'light');
    G.updateGame();
  },
};

// Elden gelen kart olayları: tıklayınca ayrıntı, yukarı sürükleyip bırakınca oyna.
document.addEventListener('rant:card', (e) => {
  const v = V();
  if (!v) return;
  const { uid, how } = e.detail;
  if (how === 'click' || (v.pending && v.pending.type === 'discard')) return A.openCard({ dataset: { uid } });
  if (!G.canPlay(v, uid)) return;
  const target = E.CARDS[E.cardId(uid)].target;
  if (target === 'none') return act({ type: 'playCard', uid, target: {} });
  if (isBoardPickable(uid)) return A.pickBoard({ dataset: { uid } });
  A.openCard({ dataset: { uid } });
});

document.addEventListener('click', (e) => {
  if (app.ui.audioOpen && !e.target.closest('.audio-pop, #tAudio')) {
    app.ui.audioOpen = false;
    G.updateGame();
  }
  // Kira penceresi dışına tıklanınca kapanır.
  if (app.ui.popSq !== null && app.ui.popSq !== undefined && !e.target.closest('.pop, .cell')) closePop();
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  if (el.tagName !== 'INPUT') e.preventDefault();
  fn(el, e);
});

document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.audio;
  if (k) {
    setAudio({ [k]: Number(e.target.value) / 100 });
    const show = document.querySelector(`[data-audio-show="${k}"]`);
    if (show) show.textContent = `%${e.target.value}`;
    return;
  }
  if (G.bindsInput(e)) return;
  if (e.target.id === 'nameInput') {
    profile.name = e.target.value.trim().slice(0, 16);
    store.set('name', profile.name);
  }
});

document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (e.key === 'Escape' && (app.ui.dialog || app.ui.menuModal)) return closeDialog();
  if (e.key === 'Escape' && app.ui.pick) return A.pickCancel();
  if (e.key === 'Escape' && app.ui.popSq !== null && app.ui.popSq !== undefined) return closePop();
  if (e.key === 'Enter' && typing) {
    if (document.activeElement.dataset.bind === 'bid') return A.bid();
    if (document.activeElement.id === 'codeInput') return A.join();
    if (document.activeElement.id === 'nameInput' && app.joinCode) return A.join();
  }
  if (e.key === ' ' && !typing && !app.ui.dialog && app.screen === 'game') {
    const b = document.querySelector('#prompt [data-primary]:not(:disabled)');
    if (b) {
      e.preventDefault();
      b.click();
    }
  }
});

// Sıra sendeyken sekme arkadaysa başlık yanıp söner; bildirim açıksa masaüstü bildirimi de gelir.
setInterval(() => {
  G.tickTimers();
  const v = app.view;
  const mine = !!(v && v.phase !== 'over' && v.you >= 0 && E.waitingFor(v).includes(v.you));
  watchTurn(mine, 'Masaya dön, seni bekliyorlar.');
  document.title = document.hidden && mine ? (document.title.startsWith('🔔') ? 'RANT' : '🔔 Sıra sende! — RANT') : 'RANT — Kentsel Dönüşümün Kart Oyunu';
}, 1000);

window.addEventListener('beforeunload', (e) => {
  if (app.mode === 'host' && app.view && app.view.phase === 'play') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---------- başlangıç ----------

app.ui = freshUI();
app.joinCode = normalizeCode(location.hash.slice(1));
// Tahta teması: kayıtlı seçim, yoksa sistemin karanlık mod tercihi.
document.body.classList.toggle('dark', (store.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark');
render();
// Davet linkiyle girmiş oyuncu sayfayı yenilerse aynı odaya kendiliğinden döner.
if (app.joinCode && app.joinCode === store.get('lastJoin') && profile.name) startJoin(app.joinCode);
window.__rant = app; // hata ayıklama için
