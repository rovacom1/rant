// Uygulama girişi: menü, lobi, bağlantılar ve tıklama yönlendirmesi.
import * as E from '../engine/index.js';
import { Host } from '../net/host.js';
import { localPair, openRoom, joinRoom, randomCode, normalizeCode } from '../net/transport.js';
import { APP_VERSION, PROTOCOL, SAVE_VERSION } from '../version.js';
import { html, raw, $, store, sleep } from './dom.js';
import { play, setAudio, setMusic } from './sound.js';
import { toggleNotify, watchTurn } from './notify.js';
import { app, profile, send, act, isHost } from './state.js';
import * as G from './gameview.js';
import { pickClick, isBoardPickable } from './pick.js';
import { ic } from './icons.js';
import { pawn } from './pawns.js';

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

const I = (name, cls = '') => raw(ic(name, cls));
const PW = (avatar, color, s) => raw(pawn(avatar, color, s));
const ME_COLOR = '#2475e8';

function menuHTML() {
  const host = savedGame('host');
  const local = savedGame('local');
  const busy = app.status === 'connecting' || (typeof app.status === 'string' && app.status.startsWith('Oda kodu'));
  const resume = (kind, s, label) =>
    html`<div class="box-note">${I('refresh')}<span class="grow"><b>${label}</b> · ${s.game ? (s.game.phase === 'over' ? 'bitmiş oyun' : `${s.game.round}. tur`) : 'lobide'}${kind === 'host' ? ` · ${s.code}` : ''}</span>
      <button class="btn S pri" data-act="${kind === 'host' ? 'resumeHost' : 'resumeLocal'}" ${busy ? 'disabled' : ''}>Devam et</button><button class="btn S sq ton" data-act="dropSave" data-k="${kind}" aria-label="Kaydı sil">${I('close')}</button></div>`;
  const parade = E.AVATARS.map((a, i) => PW(a, E.PLAYER_COLORS[i], [56, 64, 72, 64, 56, 52][i]));
  return html`<div class="screen">
    <div class="hero"><span class="logo xl">RANT</span><span class="tagline">Arsa kap, kaçak kat çık, dayını ara.</span>
      <div class="row" style="flex-wrap:wrap;gap:8px"><span class="hint">${I('user')}4-5 kişi</span><span class="hint">${I('timer')}40-50 dk</span><span class="hint">${I('link')}Link aç, katıl</span></div>
      <div class="parade">${parade}</div></div>
    <div class="start-card"><span class="h22">Masaya otur</span>
      ${app.error ? html`<div class="box-err">${I('warning')}<span>${app.error}</span></div>` : ''}
      ${busy ? html`<div class="box-note"><span class="spinner"></span><span>${app.status === 'connecting' ? 'Bağlanılıyor' : app.status}</span></div>` : ''}
      <label class="label">Adın<input class="input" id="nameInput" maxlength="16" placeholder="ör. Deniz" value="${profile.name}"></label>
      <div class="label">Piyonun<div class="pawn-pick">${E.AVATARS.map((a) => html`<button class="${a === profile.avatar ? 'on' : ''}" data-act="avatar" data-a="${a}" aria-label="${E.PAWN_NAMES[a]}" data-tip="${E.PAWN_NAMES[a]}">${PW(a, ME_COLOR, 36)}</button>`)}</div></div>
      ${host ? resume('host', host, 'Kurduğun oda') : ''}${local ? resume('local', local, 'Bot oyunun') : ''}
      <button class="btn L pri full" data-act="host" ${busy ? 'disabled' : ''}>Oda kur</button>
      <div class="row" style="gap:8px"><input class="input code" id="codeInput" maxlength="8" placeholder="ODA KODU" aria-label="Oda kodu" value="${app.joinCode || ''}"><button class="btn sec" data-act="join" ${busy ? 'disabled' : ''}>Katıl${I('arrow')}</button></div>
      <div class="row" style="gap:8px"><button class="btn ton flex" data-act="local" ${busy ? 'disabled' : ''}>${I('bot')}Botlarla dene</button><button class="btn ton flex" data-act="rules">${I('book')}Nasıl oynanır?</button></div>
    </div></div>${modalShell()}<div class="version">RANT ${APP_VERSION}</div>`;
}

function lobbyHTML() {
  const L = app.lobby;
  const host = isHost();
  const seats = L.seats.map(
    (s) => html`<div class="seat ${s.id === app.me ? 'me' : ''} ${!s.bot && !s.connected ? 'off' : ''}" style="--pc:${s.color}">${PW(s.avatar, s.color, 32)}<span class="h16">${s.name}</span>
      ${s.id === L.hostId ? html`<span data-tip="Ev sahibi">${I('crown')}</span>` : ''}${s.bot ? html`<span data-tip="Bot">${I('bot')}</span>` : ''}${!s.bot && !s.connected ? html`<span data-tip="Bağlantı yok">${I('plug')}</span>` : ''}${s.id === app.me ? html`<span class="muted small">sen</span>` : ''}
      <span class="grow"></span>${host && s.id !== L.hostId ? html`<button class="btn S sq ton" data-act="removeSeat" data-id="${s.id}" aria-label="Çıkar">${I('close')}</button>` : ''}</div>`,
  );
  const empty = Math.max(0, 6 - L.seats.length);
  for (let i = 0; i < empty; i++) seats.push(html`<div class="seat empty">${host ? html`<button class="add" data-act="addBot">${I('plus')}Bot ekle</button>` : html`<span class="add" style="cursor:default">boş koltuk</span>`}</div>`);
  const seg = (name, opts, cur, label) =>
    html`<div class="col" style="gap:6px"><span class="label">${label}</span><div class="seg">${opts.map(([v, t]) => html`<button class="btn S ${cur === v ? 'on' : ''}" data-act="${name}" data-v="${v}" ${host ? '' : 'disabled'}>${t}</button>`)}</div></div>`;
  const online = app.mode !== 'local';
  const rules = L.config.rules || E.DEFAULT_CONFIG.rules;
  const RULE_IC = { ihale: 'gavel', surpriz: 'surpriz', gundem: 'news' };
  const humans = L.seats.filter((s) => !s.bot).length;
  const levelName = (b) => b[0].toLocaleUpperCase('tr-TR') + b.slice(1);
  return html`<div class="lobby">
    <div class="lobby-head"><span class="logo sm">RANT</span><span class="grow"></span><button class="btn sq" data-act="rules" aria-label="Kurallar">${I('book')}</button><button class="btn sq" data-act="theme" aria-label="Tema">${I(document.body.classList.contains('dark') ? 'sun' : 'moon')}</button><button class="btn sq" data-act="leave" aria-label="Çık">${I('door')}</button></div>
    <div class="lobby-main">
      <section class="panel lobby-seats">
        ${online ? html`<div class="row" style="gap:14px"><span class="label">Oda</span><span class="room-code">${L.code}</span><span class="grow"></span><button class="btn sec" data-act="copyLink">${I('link')}Davet linkini kopyala</button></div>
          <span class="muted small">Linki arkadaşlarına gönder; açıp adını yazınca masaya otururlar.</span>` : html`<span class="h18">Bot masası</span><span class="muted small">Tek bilgisayarda botlara karşı. Arkadaşlarla oynamak için menüden "Oda kur".</span>`}
        ${seats}
      </section>
      <section class="panel lobby-cfg"><span class="h18">Masa${host ? '' : html` <span class="muted small">(ev sahibi seçer)</span>`}</span>
        ${seg('cfgEnd', [['rounds', 'Tur'], ['score', 'Değer hedefi'], ['iflas', 'Son kalan']], L.config.endMode || 'rounds', 'Oyun sonu')}
        ${L.config.endMode === 'score'
          ? seg('cfgTarget', E.TARGET_OPTIONS.map((t) => [t, E.fmt(t).replace(' ₺', '')]), L.config.targetScore, 'Hedef değer')
          : L.config.endMode === 'iflas'
            ? html`<span class="note">${I('iflas')}Borcunu kapatamayan iflas edip elenir. Kiralar her tur artar; en geç ${E.IFLAS_ROUND_CAP}. turda biter.</span>`
            : seg('cfgRounds', E.ROUND_OPTIONS.map((r) => [r, `${r} tur`]), L.config.maxRounds, 'Uzunluk')}
        ${seg('cfgTurn', [[60, '60 sn'], [120, '2 dk'], [180, '3 dk'], [0, 'Yok']], L.config.turnLimit, 'Sıra süresi')}
        ${seg('cfgSpeed', [['slow', 'Yavaş'], ['normal', 'Normal'], ['fast', 'Hızlı']], L.config.speed || 'normal', 'Oyun hızı')}
        ${seg('cfgBot', E.BOT_LEVELS.map((b) => [b, levelName(b)]), L.config.botLevel || 'normal', 'Botlar')}
        <div class="col" style="gap:6px"><span class="label">Kurallar</span><div class="rules-row">${Object.entries(E.RULE_LABELS).map(([k, r]) => html`<button class="btn S sec ${rules[k] ? '' : 'off'}" data-act="cfgRule" data-k="${k}" ${host ? '' : 'disabled'} data-tip="${rules[k] ? 'Açık' : `Kapalı: ${r.off}`}">${I(RULE_IC[k])}${r.name}</button>`)}</div></div>
      </section>
    </div>
    ${app.error ? html`<div class="box-err">${I('warning')}<span>${app.error}</span></div>` : ''}
    <div class="lobby-foot">${host ? html`<span class="muted">${humans} oyuncu · ${L.seats.length - humans} bot</span><span class="grow"></span><button class="btn L pri" data-act="start" ${L.seats.length < 2 ? 'disabled' : ''}>${I('play')}Oyunu başlat</button>` : html`<div class="box-note grow"><span class="spinner"></span><span>Ev sahibinin oyunu başlatması bekleniyor</span></div>`}</div>
  </div>${modalShell()}<div class="version">RANT ${APP_VERSION}</div>`;
}

const modalShell = () => (app.ui.menuModal ? html`<div class="screen" style="position:fixed;inset:0;background:color-mix(in srgb, var(--page) 70%, transparent);z-index:60" data-act="backdrop">${G.rulesSheet()}</div>` : '');

function render() {
  if (app.screen === 'game' && app.view) {
    if (!G.gameMounted()) G.mountGame(root);
    G.updateGame();
    return;
  }
  G.unmountGame();
  setMusic('lobby');
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
      await G.present(prev, m.view, m.events || [], queue.length > 5 || !prev);
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
      // Ev sahibinin saati: süre çubuğu onunla işler (yarım saniyeden küçük oynamalar yok sayılır).
      if (m.meta && m.meta.now) {
        const off = m.meta.now - Date.now();
        if (app.clockOffset === undefined || Math.abs(off - app.clockOffset) > 500) app.clockOffset = off;
      }
      enqueue(m);
      break;
    case 'error':
      play('error');
      if (app.screen === 'game') {
        G.toast(m.msg, 'error', 'warning');
        G.unlockPrompt();
      }
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
    case 'backup':
      // Ev sahibi düşerse oyunu sürdürecek yedek benim: son kopyayı tut.
      if (m.snap && m.snap.backupId === app.me) app.backup = m.snap;
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

// Ev sahibi bu kadar süre dönmezse yedek oyuncu oyunu devralır (sayfasını yenileyen ev sahibine önce şans tanınır).
const TAKEOVER_AFTER = 15000;

async function reconnect() {
  app.status = 'reconnecting';
  if (G.gameMounted()) G.updateGame();
  else render();
  const lost = Date.now();
  for (let i = 0; app.mode === 'join' && !app.leaving; i++) {
    await sleep(Math.min(8000, 2000 + i * 1000));
    if (app.mode !== 'join' || app.leaving) return;
    if (app.backup && Date.now() - lost > TAKEOVER_AFTER && (await takeover())) return;
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

// Yedek oyuncu, ev sahibinin son kopyasıyla aynı oda kodunda ev sahibi olur. Diğerleri yeniden bağlanma
// döngüsünde aynı koda bağlanır ve kendiliğinden yeni ev sahibine geçer. Kod hala tutuluyorsa false (sonra yine denenir).
async function takeover() {
  const snap = app.backup;
  const host = new Host({ code: app.code, hostToken: profile.token, hostName: profile.name, hostAvatar: profile.avatar, save: (s) => store.set(SAVE.host, s), saved: snap });
  let peer;
  try {
    peer = await openRoom(app.code, (conn) => host.attach(conn), (st) => {
      app.status = st === 'online' ? 'online' : st === 'reconnecting' ? 'reconnecting' : app.status;
      if (G.gameMounted()) G.updateGame();
    });
  } catch {
    return false;
  }
  if (app.mode !== 'join' || app.leaving) {
    peer.destroy();
    return true;
  }
  const old = app.conn;
  Object.assign(app, { mode: 'host', peer, host, backup: null, status: 'online' });
  try {
    old && old.close();
  } catch {}
  app.hb = setInterval(() => host.heartbeat(), 5000);
  attachLocal(host);
  host.schedule();
  host.persist();
  G.toast('Ev sahibi masadan kalktı; oyun artık senin tarayıcında sürüyor.', '', 'crown');
  return true;
}

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
        // Oda başka bir ev sahibinde (devralındı) açıksa ona oyuncu olarak katıl.
        try {
          const conn = await joinRoom(code);
          Object.assign(app, { mode: 'join', code, status: 'connecting' });
          store.set('lastJoin', code);
          history.replaceState(null, '', `#${code}`);
          useConn(conn);
          return;
        } catch {}
        app.status = `Oda kodu ${code} henüz serbest değil, tekrar deneniyor (${tries + 1})`;
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
  Object.assign(app, { mode: null, conn: null, host: null, peer: null, me: null, view: null, meta: null, lobby: null, screen: 'menu', status: '', error: msg, backup: null });
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
    G.toast('Davet linki kopyalandı', '', 'link');
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
  cfgSpeed: (el) => send({ t: 'lobby', cmd: 'config', speed: el.dataset.v }),
  cfgEnd: (el) => send({ t: 'lobby', cmd: 'config', endMode: el.dataset.v }),
  cfgTarget: (el) => send({ t: 'lobby', cmd: 'config', targetScore: Number(el.dataset.v) }),
  cfgBot: (el) => send({ t: 'lobby', cmd: 'config', botLevel: el.dataset.v }),
  cfgRule: (el) => {
    const cur = (app.lobby.config.rules || E.DEFAULT_CONFIG.rules)[el.dataset.k];
    send({ t: 'lobby', cmd: 'config', rules: { [el.dataset.k]: !cur } });
  },
  start: () => send({ t: 'lobby', cmd: 'start' }),
  newGame: () => send({ t: 'lobby', cmd: 'newGame' }),
  copyLink,
  leave() {
    const playing = app.view && app.view.phase !== 'over';
    if (app.mode === 'host' && playing && !confirm('Ev sahibi sensin: çıkarsan oyun 15 saniye sonra masadaki bir oyuncunun tarayıcısında sürer. Menüden "Devam et" ile geri dönebilirsin. Çıkılsın mı?')) return;
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
    if (!on && Notification.permission === 'denied') G.toast('Bildirim izni tarayıcıda kapalı; adres çubuğundaki kilit simgesinden açabilirsin.', 'error', 'bellOff');
    else G.toast(on ? 'Sıra sana gelince bildirim gelecek.' : 'Bildirimler kapandı.', '', on ? 'bell' : 'bellOff');
    G.updateGame();
  },
  gundem() {
    app.ui.gundemOpen = !app.ui.gundemOpen;
    G.updateGame();
  },
  // Sağ alttaki araçlar: aynı araca yeniden basınca kapanır.
  tool(el) {
    const k = el.dataset.k;
    if (app.ui.dialog && app.ui.dialog.type === k) return closeDialog();
    if (k === 'trade') return A.trade();
    if (k === 'build') app.ui.build = {};
    openDialog({ type: k });
  },
  // İnşaat panelinde kat sayısını değiştirir (henüz gönderilmez).
  bstep(el) {
    const sq = Number(el.dataset.sq);
    const b = (app.ui.build ||= {});
    b[sq] = (b[sq] || 0) + Number(el.dataset.d);
    G.renderModal();
  },
  // Seçilen katları sırayla diker ya da satar.
  buildGo() {
    for (const [sq, d] of Object.entries(app.ui.build || {})) {
      for (let i = 0; i < Math.abs(d); i++) act({ type: d > 0 ? 'build' : 'sellFloor', sq: Number(sq) });
    }
    app.ui.build = {};
    closeDialog();
  },

  roll: () => act({ type: 'roll' }),
  moveSum: () => act({ type: 'move', steps: V().turn.dice[0] + V().turn.dice[1] }),
  kestirme: (el) => act({ type: 'playCard', uid: el.dataset.uid, target: { die: Number(el.dataset.die) } }),
  endTurn: () => act({ type: 'endTurn' }),
  settleDebt: () => act({ type: 'settleDebt' }),
  buy: () => act({ type: 'buy' }),
  decline: () => act({ type: 'decline' }),
  pazarlik: (el) => act({ type: 'playCard', uid: el.dataset.uid }),
  raise: (el) => act({ type: 'raise', amount: Number(el.dataset.amt) }),
  raiseCustom() {
    act({ type: 'raise', amount: Math.floor(Number(app.ui.binds.raise) || 0) });
    app.ui.binds.raise = '';
  },
  auctionPass: () => act({ type: 'pass' }),
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
  player(el) {
    const p = Number(el.dataset.p);
    if (app.ui.dialog && app.ui.dialog.type === 'player' && app.ui.dialog.p === p) return closeDialog();
    openDialog({ type: 'player', p });
  },
  history: () => openDialog({ type: 'history' }),
  manage: () => openDialog({ type: 'manage' }),
  trade() {
    if (!G.canManage(V())) return G.toast('Pazarlık teklifini sıra sendeyken yapabilirsin.', '', 'deal');
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
    const o = G.tradeOffer();
    if (app.ui.trade.counter) act({ type: 'tradeCounter', give: o.give, take: o.take });
    else act({ type: 'proposeTrade', ...o });
    closeDialog();
  },
  // Gelen teklifi tersine çevirip pazarlık penceresinde açar; oyuncu değiştirip geri gönderir.
  counterOpen() {
    const pd = V().pending;
    app.ui.trade = { to: pd.from, give: { props: [...pd.take.props] }, take: { props: [...pd.give.props] }, counter: true };
    app.ui.binds.tradeGive = String(pd.take.cash || 0);
    app.ui.binds.tradeTake = String(pd.give.cash || 0);
    openDialog({ type: 'trade' });
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
  closeStage: () => G.stageClose(),
  results() {
    app.ui.resultsOpen = true;
    G.updateGame();
  },
  resultsClose() {
    app.ui.resultsOpen = false;
    G.updateGame();
  },
  theme() {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    store.set('theme', dark ? 'dark' : 'light');
    if (app.screen === 'game') G.updateGame();
    else render();
  },
};

// Elden gelen kart olayları: tıklayınca ayrıntı, tahtaya sürükleyip bırakınca oyna.
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
  if (app.ui.audioOpen && !e.target.closest('.sound-pop, #tAudio')) {
    app.ui.audioOpen = false;
    G.updateGame();
  }
  // Kira penceresi dışına tıklanınca kapanır.
  if (app.ui.popSq !== null && app.ui.popSq !== undefined && !e.target.closest('.pop, .cell, #prompt')) closePop();
  if (app.ui.gundemOpen && !e.target.closest('#gundem')) {
    app.ui.gundemOpen = false;
    G.updateGame();
  }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  if (el.tagName !== 'INPUT') e.preventDefault();
  fn(el, e);
  // İstemdeki düğme bir kez basılır; istem yeni durumla yeniden çizilene kadar kilitli kalır (çift tıklama hata vermesin).
  if (el.tagName === 'BUTTON' && el.closest('#prompt')) el.disabled = true;
});

document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.audio;
  if (k) {
    setAudio({ [k]: Number(e.target.value) / 100 });
    e.target.style.setProperty('--p', `${e.target.value}%`);
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
  if (e.key === 'Escape' && app.ui.resultsOpen) return A.resultsClose();
  if (e.key === 'Escape' && app.ui.pick) return A.pickCancel();
  if (e.key === 'Escape' && app.ui.popSq !== null && app.ui.popSq !== undefined) return closePop();
  if (e.key === 'Enter' && typing) {
    if (document.activeElement.dataset.bind === 'raise') return A.raiseCustom();
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
  document.title = document.hidden && mine ? (document.title.startsWith('•') ? 'RANT' : '• Sıra sende! — RANT') : 'RANT — Kentsel Dönüşümün Kart Oyunu';
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
