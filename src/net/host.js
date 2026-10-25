// Ev sahibi: oyunun tek yetkili kopyası burada. Lobi, botlar, süreler, kayıt.
// Taşıma katmanından bağımsızdır: attach() ile verilen her bağlantı { send, onmessage, onclose } nesnesidir.

import * as E from '../engine/index.js';
import { PROTOCOL, SAVE_VERSION } from '../version.js';

const PASSIVE_TIMEOUT = { auction: 15, react: 20, rent: 20, trade: 45, discard: 45 }; // sn
const DISCONNECT_GRACE = 20; // sn
const BOT_MIN = 900; // ms, botun en kısa düşünme süresi
const MAX_SEATS = 6;
// Lobideki oyun hızı: bekleme ve animasyon süreleri bu çarpanla uzar ya da kısalır (istemci de aynısını kullanır).
export const SPEEDS = { slow: 1.4, normal: 1, fast: 0.6 };

// Olayların istemcide canlandırılması normal hızda ne kadar sürer (ms). Ev sahibi bot hamlesini bunun
// bitişine erteler, insanın süresi de o zaman başlar; böylece hamleler okunmadan geçmez.
export function paceOf(events) {
  let block = 0;
  let read = 0;
  let money = 0;
  const has = (t) => events.some((e) => e.type === t);
  for (const e of events) {
    switch (e.type) {
      case 'dice':
        block += 1250;
        break;
      case 'dava':
        block += 1250;
        read = Math.max(read, 1200);
        break;
      case 'move':
        block += 150 * e.path.length + 150;
        break;
      case 'surpriz':
        block += 3000;
        break;
      case 'card':
        block += 3500;
        break;
      case 'gundem':
        read = Math.max(read, has('summary') ? 5600 : 3600);
        break;
      case 'auction':
      case 'tradeDone':
      case 'demolish':
      case 'collapse':
      case 'konkordato':
      case 'iflas':
      case 'target':
        read = Math.max(read, 1200);
        break;
      case 'build':
      case 'own':
        read = Math.max(read, 700);
        break;
      case 'money':
        money++;
        break;
      default:
    }
  }
  if (money) read = Math.max(read, 650 + 260 * (money - 1));
  return block + read;
}

export const idFromToken = (token) => {
  let h = 2166136261;
  for (const c of String(token)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return `p${h.toString(36)}`;
};

const cleanName = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'Oyuncu';
const cleanAvatar = (a) => (E.AVATARS.includes(a) ? a : E.AVATARS[0]);

export class Host {
  constructor({ code, hostToken, hostName, hostAvatar, save = () => {}, saved = null }) {
    this.code = code;
    this.hostId = idFromToken(hostToken);
    this.save = save;
    this.clients = new Set();
    this.timer = null;
    this.waitSince = {};
    // Koltuk kimliği tokenden türetilir; koltuğu yalnız aynı tokeni bilen geri alabilir.
    this.secrets = {};
    if (saved) {
      Object.assign(this, { seats: saved.seats, config: saved.config, game: saved.game, secrets: saved.secrets || {} });
      for (const s of this.seats) s.connected = !!s.bot;
    } else {
      this.seats = [];
      this.config = { maxRounds: 15, turnLimit: 120, endMode: 'rounds', targetScore: 3500, speed: 'normal', botLevel: 'normal', rules: { ...E.DEFAULT_CONFIG.rules } };
      this.game = null;
      this.addSeat({ id: this.hostId, name: cleanName(hostName), avatar: cleanAvatar(hostAvatar), bot: false });
    }
  }

  snapshot() {
    return { v: SAVE_VERSION, code: this.code, seats: this.seats, config: this.config, game: this.game, secrets: this.secrets, savedAt: Date.now() };
  }

  persist() {
    try {
      this.save(this.snapshot());
    } catch (e) {
      console.warn('kayıt yapılamadı', e);
    }
  }

  addSeat({ id, name, avatar, bot }) {
    const used = new Set(this.seats.map((s) => s.color));
    const color = E.PLAYER_COLORS.find((c) => !used.has(c)) || E.PLAYER_COLORS[0];
    const seat = { id, name, avatar, color, bot, connected: bot };
    this.seats.push(seat);
    return seat;
  }

  // Lobiye bot oturtur; eklenemezse (oyun başladı ya da masa dolu) false.
  addBot() {
    if (this.game || this.seats.length >= MAX_SEATS) return false;
    const names = new Set(this.seats.map((s) => s.name));
    const avatars = new Set(this.seats.map((s) => s.avatar));
    const n = this.seats.filter((s) => s.bot).length;
    this.addSeat({
      id: `bot${Date.now().toString(36)}${n}`,
      name: E.BOT_NAMES.find((b) => !names.has(b)) || `Bot ${n + 1}`,
      avatar: E.AVATARS.find((a) => !avatars.has(a)) || E.AVATARS[0],
      bot: true,
    });
    return true;
  }

  attach(conn, { local = false } = {}) {
    const client = { conn, playerId: null, lastSeen: Date.now(), local };
    this.clients.add(client);
    conn.onmessage = (m) => {
      client.lastSeen = Date.now();
      try {
        this.onMessage(client, m);
      } catch (e) {
        console.error(e);
        this.send(client, { t: 'error', msg: e instanceof E.GameError ? e.message : 'Beklenmeyen bir hata oldu.' });
      }
    };
    conn.onclose = () => this.detach(client);
  }

  detach(client) {
    if (!this.clients.delete(client)) return;
    const seat = this.seatOf(client.playerId);
    if (seat && ![...this.clients].some((c) => c.playerId === seat.id)) {
      seat.connected = false;
      this.schedule();
      this.broadcast();
    }
  }

  send(client, msg) {
    try {
      client.conn.send(msg);
    } catch (e) {
      console.warn('gönderilemedi', e);
    }
  }

  seatOf(id) {
    return this.seats.find((s) => s.id === id) || null;
  }

  seatIndex(id) {
    return this.game ? this.game.players.findIndex((p) => p.id === id) : -1;
  }

  onMessage(client, m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'pong') return;
    if (m.t === 'hello') return this.onHello(client, m);
    if (!client.playerId) return;
    switch (m.t) {
      case 'act':
        return this.onAct(client, m.action);
      case 'profile':
        return this.onProfile(client, m);
      case 'lobby':
        return this.onLobby(client, m);
      default:
    }
  }

  onHello(client, m) {
    if (m.v !== PROTOCOL) return this.send(client, { t: 'reject', reason: 'version' });
    const token = String(m.token || '');
    const id = idFromToken(token);
    // Ev sahibi koltuğu yalnız aynı sayfadaki yerel bağlantıya; diğer koltuklar yalnız sahibinin tokenine açık.
    if (id === this.hostId && !client.local) return this.send(client, { t: 'reject', reason: 'taken' });
    if (token.length < 16 || (this.secrets[id] && this.secrets[id] !== token)) return this.send(client, { t: 'reject', reason: 'taken' });
    this.secrets[id] = token;
    let seat = this.seatOf(id);
    if (!seat && !this.game) {
      if (this.seats.length >= MAX_SEATS) return this.send(client, { t: 'reject', reason: 'full' });
      seat = this.addSeat({ id, name: cleanName(m.name), avatar: cleanAvatar(m.avatar), bot: false });
    }
    if (seat && !this.game) {
      seat.name = cleanName(m.name);
      seat.avatar = cleanAvatar(m.avatar);
    }
    client.playerId = id;
    if (seat) seat.connected = true;
    delete this.waitSince[id];
    this.send(client, { t: 'welcome', you: id, hostId: this.hostId, code: this.code, spectator: !seat });
    this.schedule();
    this.broadcast();
  }

  onProfile(client, m) {
    if (this.game) return;
    const seat = this.seatOf(client.playerId);
    if (!seat) return;
    seat.name = cleanName(m.name);
    seat.avatar = cleanAvatar(m.avatar);
    this.broadcast();
  }

  onLobby(client, m) {
    if (!client.local || client.playerId !== this.hostId) throw new E.GameError('Bunu yalnız odayı kuran yapabilir.');
    switch (m.cmd) {
      case 'addBot':
        if (!this.addBot()) return;
        break;
      case 'remove': {
        if (this.game || m.id === this.hostId) return;
        this.seats = this.seats.filter((s) => s.id !== m.id);
        for (const c of this.clients) {
          if (c.playerId === m.id) {
            this.send(c, { t: 'kicked' });
            c.playerId = null;
          }
        }
        break;
      }
      case 'config': {
        if (this.game) return;
        if (E.ROUND_OPTIONS.includes(m.maxRounds)) this.config.maxRounds = m.maxRounds;
        if (['rounds', 'score', 'iflas'].includes(m.endMode)) this.config.endMode = m.endMode;
        if (E.TARGET_OPTIONS.includes(m.targetScore)) this.config.targetScore = m.targetScore;
        if ([0, 60, 90, 120, 180].includes(m.turnLimit)) this.config.turnLimit = m.turnLimit;
        if (Object.hasOwn(SPEEDS, m.speed)) this.config.speed = m.speed;
        if (E.BOT_LEVELS.includes(m.botLevel)) this.config.botLevel = m.botLevel;
        if (m.rules && typeof m.rules === 'object') {
          for (const k of Object.keys(E.DEFAULT_CONFIG.rules)) if (typeof m.rules[k] === 'boolean') this.config.rules[k] = m.rules[k];
        }
        break;
      }
      case 'start': {
        if (this.game) return;
        if (this.seats.length < 2) throw new E.GameError('En az 2 oyuncu gerekir (bot ekleyebilirsin).');
        this.game = E.createGame({
          players: this.seats.map((s) => ({ id: s.id, name: s.name, avatar: s.avatar, color: s.color, bot: s.bot })),
          config: { maxRounds: this.config.maxRounds, targetScore: this.config.endMode === 'score' ? this.config.targetScore : 0, iflas: this.config.endMode === 'iflas', rules: { ...this.config.rules }, botLevel: this.config.botLevel || 'normal' },
          seed: E.randomSeed(),
        });
        this.waitSince = {};
        this.schedule();
        this.broadcast([{ type: 'start' }]);
        this.persist();
        return;
      }
      case 'newGame': {
        if (!this.game || this.game.phase !== 'over') return;
        this.game = null;
        break;
      }
      case 'takeover': {
        // Bağlantısı kopan oyuncunun koltuğunu bota devret ya da geri al.
        const seat = this.seatOf(m.id);
        if (seat && seat.id !== this.hostId) seat.bot = !!m.bot;
        if (this.game) {
          const i = this.seatIndex(m.id);
          if (i >= 0) this.game.players[i].bot = !!m.bot;
        }
        break;
      }
      default:
        return;
    }
    this.schedule();
    this.broadcast();
    this.persist();
  }

  onAct(client, action) {
    if (!this.game) return;
    const seat = this.seatIndex(client.playerId);
    if (seat < 0) throw new E.GameError('İzleyiciler hamle yapamaz.');
    delete this.waitSince[client.playerId];
    this.apply(seat, action);
  }

  speed() {
    return SPEEDS[this.config.speed] || 1;
  }

  apply(seat, action) {
    const { state, events } = E.applyAction(this.game, seat, action);
    this.game = state;
    this.readyAt = Date.now() + Math.round(paceOf(events) * this.speed());
    this.schedule();
    this.broadcast(events);
    this.persist();
  }

  meta() {
    const deadlines = {};
    for (const [id, d] of Object.entries(this.deadlines || {})) deadlines[id] = { at: d.at, span: d.span };
    // now: istemci kendi saatiyle aradaki farkı hesaplar, süre çubuğu ev sahibinin saatine göre işler.
    return { connected: Object.fromEntries(this.seats.map((s) => [s.id, s.connected])), deadlines, hostId: this.hostId, now: Date.now() };
  }

  lobbyInfo() {
    return { code: this.code, hostId: this.hostId, seats: this.seats, config: this.config };
  }

  broadcast(events = []) {
    for (const c of this.clients) {
      if (!c.playerId) continue;
      if (!this.game) {
        this.send(c, { t: 'lobby', lobby: this.lobbyInfo() });
        continue;
      }
      this.send(c, { t: 'state', view: E.viewFor(this.game, this.seatIndex(c.playerId)), events, meta: this.meta(), lobby: this.lobbyInfo() });
    }
  }

  // Sırası gelen botları oynatır; insanlar için süre sınırı koyar.
  schedule() {
    clearTimeout(this.timer);
    this.timer = null;
    this.deadlines = {};
    const g = this.game;
    if (!g || g.phase === 'over') return;
    const waiting = E.waitingFor(g);
    const now = Date.now();
    const ready = Math.max(now, this.readyAt || 0); // ekrandaki son animasyonun bitişi
    for (const id of Object.keys(this.waitSince)) if (!waiting.some((i) => g.players[i].id === id)) delete this.waitSince[id];
    let next = null;
    for (const i of waiting) {
      const pl = g.players[i];
      const seat = this.seatOf(pl.id);
      if (pl.bot || !seat) {
        const at = Math.max(ready, now + BOT_MIN * this.speed());
        if (!next || at < next.at) next = { at, seat: i, mode: 'bot' };
        continue;
      }
      const since = (this.waitSince[pl.id] ??= ready);
      const pd = g.pending;
      const passive = pd && PASSIVE_TIMEOUT[pd.type];
      let limit = passive || this.config.turnLimit;
      if (!seat.connected) limit = Math.min(limit || DISCONNECT_GRACE, DISCONNECT_GRACE);
      if (!limit) continue;
      const d = { at: since + limit * 1000, span: limit * 1000, seat: i, mode: passive ? 'default' : 'bot' };
      this.deadlines[pl.id] = d;
      if (!next || d.at < next.at) next = d;
    }
    if (!next) return;
    this.timer = setTimeout(() => this.runDeadline(next), Math.max(0, next.at - Date.now()));
  }

  runDeadline(d) {
    const g = this.game;
    if (!g || !E.waitingFor(g).includes(d.seat)) return this.schedule();
    const action = d.mode === 'bot' ? E.botAction(g, d.seat) : E.defaultAction(g, d.seat);
    try {
      if (!action) throw new Error('bot hamle bulamadı');
      this.apply(d.seat, action);
    } catch (e) {
      console.error('otomatik hamle hatası', e);
      const fallback = E.defaultAction(g, d.seat);
      if (fallback) this.apply(d.seat, fallback);
    }
  }

  heartbeat() {
    const now = Date.now();
    for (const c of [...this.clients]) {
      if (c.local) continue;
      if (now - c.lastSeen > 25000) {
        try {
          c.conn.close?.();
        } catch {}
        this.detach(c);
      } else this.send(c, { t: 'ping' });
    }
  }
}
