// Oyun durum makinesi. applyAction(state, oyuncu, hamle) yeni state ve olay listesi döndürür.
// Olaylar (events) herkese gider; bu yüzden asla gizli bilgi (el, deste) içermez.

import { BOARD, CARDS, GUNDEM, GUNDEM_PERIOD, SURPRIZ, GROUPS, GROUP_SQUARES, OWNABLE, MODE_SQUARES, AMOUNTS, DEFAULT_CONFIG, RULES_VERSION, TARGET_ROUND_CAP, IFLAS_ROUND_CAP } from './data.js';
import { randInt, rollDie, shuffle } from './rng.js';
import * as R from './rules.js';

const { fmt, cardId } = R;

export class GameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameError';
  }
}

const need = (cond, msg) => {
  if (!cond) throw new GameError(msg);
};

const N = BOARD.length;
const LOG_MAX = 150;
const MANAGE_STEPS = ['preroll', 'free'];

// ---------- yardımcılar ----------

function emit(s, ctx, ev) {
  ctx.events.push(ev);
  if (ev.text) {
    // Kart olaylarında kart ve oynayan da saklanır: akışta kart adı çip olur, üzerine gelince kart görünür.
    s.log.push(ev.card ? { r: s.round, text: ev.text, type: ev.type, card: ev.card, p: ev.p } : { r: s.round, text: ev.text, type: ev.type });
    if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX);
  }
}

const say = (s, ctx, text) => emit(s, ctx, { type: 'log', text });
const nm = (s, p) => s.players[p].name;
const sqName = (sq) => BOARD[sq].name;
const others = (s, p) => R.activePlayers(s).filter((i) => i !== p);

export const hasCard = (s, p, id) => s.players[p].hand.some((u) => cardId(u) === id);
// Masada bu karttan biri var mı: tepki beklemeleri buna göre açılır, kimin elinde olduğu sızmaz.
const tableHolds = (s, id) => s.players.some((_, p) => hasCard(s, p, id));
const hasUid = (s, p, uid) => typeof uid === 'string' && s.players[p].hand.includes(uid);

function discardCard(s, p, uid) {
  const hand = s.players[p].hand;
  hand.splice(hand.indexOf(uid), 1);
  s.discard.push(uid);
}

function drawCards(s, ctx, p, n, quiet = false) {
  let got = 0;
  for (let i = 0; i < n; i++) {
    if (!s.deck.length) {
      if (!s.discard.length) break;
      s.deck = shuffle(s, s.discard);
      s.discard = [];
      say(s, ctx, 'Hamle destesi karıştırıldı.');
    }
    s.players[p].hand.push(s.deck.pop());
    got++;
  }
  if (got) emit(s, ctx, { type: 'draw', p, n: got, text: quiet ? undefined : `${nm(s, p)} ${got} kart çekti.` });
}

// from/to: oyuncu sırası ya da null (banka).
function transfer(s, ctx, from, to, amount, why, quiet = false) {
  if (amount <= 0) return;
  if (from !== null) s.players[from].cash -= amount;
  if (to !== null) s.players[to].cash += amount;
  let text;
  if (!quiet) {
    if (from === null) text = `${nm(s, to)} +${fmt(amount)} (${why})`;
    else if (to === null) text = `${nm(s, from)} ${fmt(amount)} ödedi (${why})`;
    else text = `${nm(s, from)} → ${nm(s, to)}: ${fmt(amount)} (${why})`;
  }
  emit(s, ctx, { type: 'money', from, to, amount, why, text });
}

function acquire(s, ctx, p, sq, cost, how) {
  transfer(s, ctx, p, null, cost, `Tapu: ${sqName(sq)}`, true);
  s.props[sq].owner = p;
  emit(s, ctx, { type: 'own', p, sq, text: `${nm(s, p)} ${sqName(sq)} mülkünü ${how} ${fmt(cost)}.` });
}

function demolishKacak(s, ctx, victim, finePer, why) {
  let n = 0;
  for (const q of R.propsOf(s, victim)) {
    if (s.props[q].kacak) {
      s.props[q].kacak = 0;
      n++;
    }
  }
  if (!n) return say(s, ctx, `${why}: ${nm(s, victim)} oyuncusunda kaçak kat bulunamadı.`);
  emit(s, ctx, { type: 'demolish', p: victim, n, text: `${why}: ${nm(s, victim)} oyuncusunun ${n} kaçak katı yıkıldı!` });
  if (finePer) transfer(s, ctx, victim, null, finePer * n, `${why} cezası`);
}

// Borcunu kapatamayan oyuncu: iflas modunda elenir, diğer modlarda konkordato ilan eder.
function goBroke(s, ctx, p) {
  return s.config.iflas ? iflas(s, ctx, p) : konkordato(s, ctx, p);
}

// İflas: mülkler katsız ve ipoteksiz bankaya döner, kartlar desteye gider, oyuncu oyundan çıkar.
function iflas(s, ctx, p) {
  const pl = s.players[p];
  for (const q of R.propsOf(s, p)) Object.assign(s.props[q], { owner: null, kat: 0, kacak: 0, ipotek: false, tedbir: 0 });
  s.discard.push(...pl.hand);
  pl.hand = [];
  pl.cash = 0;
  for (const ps of s.props) if (ps && ps.tedbirBy === p) ps.tedbir = 0; // sırası gelmeyecek, tedbiri düşer
  pl.out = s.players.filter((o) => o.out).length + 1; // kaçıncı elenen
  emit(s, ctx, { type: 'iflas', p, text: `${nm(s, p)} iflas etti ve oyundan çekildi! Mülkleri bankaya döndü.` });
}

function konkordato(s, ctx, p) {
  s.players[p].cash = 0;
  s.players[p].konkordato++;
  emit(s, ctx, {
    type: 'konkordato',
    p,
    text: `${nm(s, p)} konkordato ilan etti! Borcu silindi, oyunda kalıyor; sonda ${s.config.konkordatoPenalty} puan ceza.`,
  });
}

function sellFloorAt(s, ctx, p, sq) {
  const ps = s.props[sq];
  let refund;
  if (ps.kacak) {
    ps.kacak = 0;
    refund = R.round5(R.katValue(s, sq) / 4);
  } else {
    ps.kat--;
    refund = R.round5(R.katValue(s, sq) / 2);
  }
  transfer(s, ctx, null, p, refund, `Kat satışı: ${sqName(sq)}`);
}

function mortgageAt(s, ctx, p, sq) {
  s.props[sq].ipotek = true;
  transfer(s, ctx, null, p, R.mortgageValue(s, sq), `İpotek: ${sqName(sq)}`);
}

function autoLiquidate(s, ctx, p) {
  const byKat = (a, b) => R.katValue(s, a) - R.katValue(s, b);
  while (s.players[p].cash < 0) {
    const mine = R.propsOf(s, p);
    const kacak = mine.filter((q) => s.props[q].kacak).sort(byKat)[0];
    const kat = mine.filter((q) => s.props[q].kat > 0).sort(byKat)[0];
    const free = mine.filter((q) => !s.props[q].ipotek && R.level(s.props[q]) === 0).sort((a, b) => R.price(s, a) - R.price(s, b))[0];
    if (kacak !== undefined) sellFloorAt(s, ctx, p, kacak);
    else if (kat !== undefined) sellFloorAt(s, ctx, p, kat);
    else if (free !== undefined) mortgageAt(s, ctx, p, free);
    else break;
  }
}

// ---------- kurulum ----------

export function createGame({ players, config = {}, seed = 1 }) {
  need(players.length >= 2 && players.length <= 6, 'Oyun 2-6 kişiyle oynanır.');
  const cfg = { ...DEFAULT_CONFIG, ...config, rules: { ...DEFAULT_CONFIG.rules, ...config.rules } };
  if (cfg.iflas) Object.assign(cfg, { targetScore: 0, maxRounds: IFLAS_ROUND_CAP });
  if (cfg.targetScore) cfg.maxRounds = TARGET_ROUND_CAP;
  const s = {
    v: RULES_VERSION,
    seq: 0,
    rng: seed >>> 0,
    config: cfg,
    phase: 'play',
    round: 0,
    index: 100,
    salary: cfg.salary,
    groupMult: {},
    mods: {},
    gundem: null,
    players: [],
    props: BOARD.map((q) => (q.kind === 'prop' || q.kind === 'transport' ? { owner: null, kat: 0, kacak: 0, ipotek: false, tedbir: 0 } : null)),
    deck: [],
    discard: [],
    gundemDeck: [],
    gundemDiscard: [],
    turn: null,
    pending: null,
    lastAuction: null,
    finalRound: null,
    roundStart: null,
    summary: null,
    worth: [],
    log: [],
    results: null,
  };
  const order = shuffle(s, players.map((_, i) => i));
  s.players = order.map((i, seat) => {
    const p = players[i];
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      bot: !!p.bot,
      cash: cfg.startCash + seat * cfg.seatBonus, // sonra oynayan, ilk mülklere geç kaldığı için biraz fazla nakitle başlar
      pos: 0,
      hand: [],
      konkordato: 0,
      out: 0, // iflas modunda kaçıncı elendiği; 0: oyunda
      kiraZammi: false,
    };
  });
  const copies = (defs) => Object.entries(defs).flatMap(([id, c]) => Array.from({ length: c.count }, (_, n) => `${id}:${n}`));
  s.deck = shuffle(s, copies(CARDS));
  s.gundemDeck = shuffle(s, copies(GUNDEM));
  const ctx = { events: [] };
  s.players.forEach((_, p) => drawCards(s, ctx, p, cfg.startHand, true));
  say(s, ctx, 'Masa kuruldu, oyun başlıyor.');
  startRound(s, ctx);
  startTurn(s, ctx, 0);
  return s;
}

// ---------- tur akışı ----------

function startRound(s, ctx) {
  s.round++;
  s.roundStart = { net: s.players.map((_, p) => R.netWorth(s, p)), owners: s.props.map((ps) => (ps ? ps.owner : null)) };
  if (s.round === 1) s.worth = [s.roundStart.net];
  const last = s.round === s.config.maxRounds ? ' SON TUR: Seçim Günü geliyor!' : '';
  if (!s.config.rules.gundem) {
    s.gundem = null;
    return emit(s, ctx, { type: 'round', round: s.round, text: `— ${s.round}. tur —${last}` });
  }
  // Gündem dönemi sürüyorsa yeni kart açılmaz; dönem kuralları (s.mods) yerinde kalır.
  if (s.gundem && s.round <= s.gundem.until) {
    const left = s.gundem.until - s.round;
    return emit(s, ctx, { type: 'round', round: s.round, text: `— ${s.round}. tur — Gündem sürüyor: ${GUNDEM[s.gundem.id].name} (${left ? `${left} tur daha` : 'son turu'}).${last}` });
  }
  s.mods = {};
  if (!s.gundemDeck.length) {
    s.gundemDeck = shuffle(s, s.gundemDiscard);
    s.gundemDiscard = [];
  }
  const uid = s.gundemDeck.pop();
  s.gundemDiscard.push(uid);
  const id = cardId(uid);
  s.gundem = { id, detail: null, until: Math.min(s.round + GUNDEM_PERIOD - 1, s.config.maxRounds) };
  emit(s, ctx, { type: 'gundem', id, round: s.round, text: `— ${s.round}. tur — Gündem: ${GUNDEM[id].name}. ${GUNDEM[id].text}${last}` });
  applyGundem(s, ctx, id);
}

function startTurn(s, ctx, p) {
  s.turn = { p, step: 'preroll', dice: null, hamle: false, backward: false, trades: 0, side: [] };
  s.players[p].kiraZammi = false;
  // İhtiyati Tedbir, kartı oynayanın 2 sırası boyunca sürer (sıra başında azalır).
  for (const ps of s.props) if (ps && ps.tedbir > 0 && ps.tedbirBy === p) ps.tedbir--;
  emit(s, ctx, { type: 'turn', p });
}

// Tur sonu özeti: net değer farkları ve el değiştiren mülkler (bankadan ilk satın alma sayılmaz).
function summarizeRound(s, ctx) {
  const start = s.roundStart;
  if (!start) return;
  const deltas = s.players.map((_, p) => R.netWorth(s, p) - start.net[p]);
  const changes = [];
  s.props.forEach((ps, sq) => {
    if (ps && start.owners[sq] !== null && ps.owner !== start.owners[sq]) changes.push({ sq, from: start.owners[sq], to: ps.owner });
  });
  const best = deltas.indexOf(Math.max(...deltas));
  const worst = deltas.indexOf(Math.min(...deltas));
  const flat = deltas[best] === deltas[worst];
  s.summary = { round: s.round, deltas, best: flat ? null : best, worst: flat ? null : worst, changes };
  (s.worth ||= []).push(s.players.map((_, p) => R.netWorth(s, p)));
  const sign = (x) => `${x > 0 ? '+' : ''}${fmt(x)}`;
  const parts = [flat ? 'Herkes yerinde saydı' : `En çok kazanan ${nm(s, best)} (${sign(deltas[best])}), en çok kaybeden ${nm(s, worst)} (${sign(deltas[worst])})`];
  if (changes.length) parts.push(`El değiştiren: ${changes.map((c) => `${sqName(c.sq)} (${nm(s, c.from)} → ${c.to === null ? 'Banka' : nm(s, c.to)})`).join(', ')}`);
  emit(s, ctx, { type: 'summary', round: s.round, text: `${s.round}. tur özeti: ${parts.join('. ')}.` });
}

// Değer hedefi: biri hedefe ulaşınca içinde bulunulan tur tamamlanır, sonra Seçim Günü (herkes eşit sayıda oynar).
function checkTarget(s, ctx) {
  const t = s.config.targetScore;
  if (!t || s.finalRound) return;
  const worth = s.players.map((_, p) => R.netWorth(s, p));
  const p = worth.indexOf(Math.max(...worth));
  if (worth[p] < t) return;
  s.finalRound = s.round;
  emit(s, ctx, { type: 'target', p, text: `${nm(s, p)} ${fmt(t)} değer hedefini geçti! Bu tur bitince Seçim Günü.` });
}

// Çift zar atan, turunu bitirince bir daha zar atar (Monopoly gibi); üçüncü çiftte ek hak yok.
const MAX_DOUBLES = 2;

function finishTurn(s, ctx) {
  const t = s.turn;
  if (t.again && !s.players[t.p].out && s.phase === 'play') {
    Object.assign(t, { again: false, step: 'preroll', dice: null, backward: false });
    return emit(s, ctx, { type: 'again', p: t.p, text: `${nm(s, t.p)} çift attı, bir daha oynuyor.` });
  }
  checkTarget(s, ctx);
  const alive = R.activePlayers(s);
  if (alive.length < 2) {
    summarizeRound(s, ctx); // yarım kalan turun net değerleri de grafiğe girsin
    return endGame(s, ctx);
  }
  const next = alive.find((i) => i > s.turn.p) ?? alive[0];
  if (next <= s.turn.p) {
    summarizeRound(s, ctx);
    if (s.round >= s.config.maxRounds || s.finalRound) return endGame(s, ctx);
    startRound(s, ctx);
  }
  startTurn(s, ctx, next);
}

function endGame(s, ctx) {
  s.phase = 'over';
  s.pending = null;
  const scores = s.players.map((_, p) => ({ p, ...R.scoreOf(s, p) }));
  // Ayakta kalanlar puana göre; elenenler son elenenden ilk elenene.
  const out = (x) => s.players[x.p].out || Infinity;
  const ranking = [...scores].sort((a, b) => out(b) - out(a) || b.total - a.total || b.nakit - a.nakit).map((x) => x.p);
  s.results = { scores, ranking };
  const w = ranking[0];
  const text = R.activePlayers(s).length === 1 ? `Herkes iflas etti, ayakta kalan ${nm(s, w)} kazandı!` : `SEÇİM GÜNÜ! Kazanan: ${nm(s, w)} (${fmt(scores[w].total)}).`;
  emit(s, ctx, { type: 'over', text });
}

export function moveOptions(s) {
  const d = s.turn?.dice;
  return d ? [d[0] + d[1]] : [];
}

function travel(s, ctx, p, steps, backward) {
  const pl = s.players[p];
  const path = [];
  let pos = pl.pos;
  let passed = 0;
  for (let i = 0; i < steps; i++) {
    pos = (pos + (backward ? N - 1 : 1)) % N;
    path.push(pos);
    if (!backward && pos === 0) passed++;
  }
  pl.pos = pos;
  emit(s, ctx, { type: 'move', p, path, backward, text: `${nm(s, p)} ${steps} kare ${backward ? 'geri gitti' : 'ilerledi'} → ${sqName(pos)}` });
  for (let i = 0; i < passed; i++) {
    if (s.mods.grev) say(s, ctx, 'Bankacılar grevde: maaş yatmadı.');
    else transfer(s, ctx, null, p, s.salary, 'Maaş');
    // Monopoly'deki gibi tur atlamanın küçük ödülü: kart yalnız buradan (ve FIRSAT'tan) gelir.
    if (pl.hand.length < s.config.drawCap) drawCards(s, ctx, p, 1, true);
  }
  s.turn.step = 'free';
  land(s, ctx, p);
}

function land(s, ctx, p) {
  const pos = s.players[p].pos;
  const sq = BOARD[pos];
  switch (sq.kind) {
    case 'prop':
    case 'transport': {
      const ps = s.props[pos];
      if (ps.owner === null) s.pending = { type: 'buy', p, sq: pos };
      else if (ps.owner !== p) chargeRent(s, ctx, p, pos);
      return;
    }
    case 'chance':
      return drawCards(s, ctx, p, 2);
    case 'surpriz':
      if (!s.config.rules.surpriz) return say(s, ctx, 'Sürprizler bu masada kapalı.');
      return applySurpriz(s, ctx, p, pick(s, Object.keys(SURPRIZ)));
    case 'tapu': {
      const cash = s.players[p].cash;
      if (OWNABLE.some((q) => s.props[q].owner === null && R.price(s, q) <= cash)) s.pending = { type: 'tapu', p };
      else {
        say(s, ctx, 'Tapu Dairesi: alınabilecek arsa yok, teselli olarak 1 kart.');
        drawCards(s, ctx, p, 1);
      }
      return;
    }
    case 'cay': {
      const amt = R.money(s, AMOUNTS.cay);
      for (const o of others(s, p)) {
        const c = s.players[o].cash;
        if (c > 0) transfer(s, ctx, o, p, Math.min(amt, c), 'Çay parası');
      }
      return;
    }
    case 'zabita': {
      if (s.mods.zabitaIzinde) return say(s, ctx, 'Zabıta izinde, kimse ihbar edilemedi.');
      const options = others(s, p).filter((o) => R.floorsOf(s, o).kacak > 0);
      if (!options.length) return say(s, ctx, 'Zabıta turladı ama kaçak kat bulamadı.');
      s.pending = { type: 'zabita', p, options };
      return;
    }
    default:
  }
}

function chargeRent(s, ctx, p, sq) {
  const ps = s.props[sq];
  if (ps.ipotek) return say(s, ctx, `${sqName(sq)} ipotekli, kira yok.`);
  if (ps.tedbir > 0) return say(s, ctx, `${sqName(sq)} için ihtiyati tedbir var, kira yok.`);
  const owner = ps.owner;
  const zam = s.players[owner].kiraZammi;
  const amount = R.rentFor(s, sq) * (zam ? 2 : 1);
  if (amount <= 0) return;
  const r = { type: 'rent', p, owner, sq, amount, zam };
  // Kartı olsun olmasın aynı karar beklenir; yalnız masada hiç Dayın Çıktı yoksa beklenmez (kimde olduğu belli olmasın).
  if (tableHolds(s, 'dayi')) s.pending = r;
  else payRent(s, ctx, r);
}

function payRent(s, ctx, r) {
  if (r.zam) s.players[r.owner].kiraZammi = false;
  transfer(s, ctx, r.p, r.owner, r.amount, `Kira: ${sqName(r.sq)}${r.zam ? ', zamlı' : ''}`);
}

// Açık artırma (Monopoly gibi): reddedenden sonraki oyuncudan başlayıp sırayla herkes ya artırır ya çekilir;
// lider dışında herkes çekilince lider kazanır. Reddeden de katılır, nakdi olmayan katılamaz.
export const auctionStep = (s) => R.money(s, 10);

function startAuction(s, ctx, sq, from) {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, k) => (from + 1 + k) % n).filter((i) => s.players[i].cash > 0);
  if (!order.length) return say(s, ctx, `${sqName(sq)} için teklif verebilecek kimse yok.`);
  s.pending = { type: 'auction', sq, order, out: [], high: 0, leader: null, turn: order[order.length - 1] };
  emit(s, ctx, { type: 'auctionStart', sq, text: `${sqName(sq)} açık artırmaya çıktı! Liste fiyatı ${fmt(R.price(s, sq))}.` });
  nextBidder(s, ctx);
}

// Sırayı lider olmayan, çekilmemiş sonraki oyuncuya verir; en düşük teklife nakdi yetmeyen kendiliğinden çekilir.
function nextBidder(s, ctx) {
  const pd = s.pending;
  const min = pd.high + auctionStep(s);
  const at = pd.order.indexOf(pd.turn);
  for (let k = 1; k <= pd.order.length; k++) {
    const q = pd.order[(at + k) % pd.order.length];
    if (pd.out.includes(q) || q === pd.leader) continue;
    if (s.players[q].cash < min) {
      pd.out.push(q);
      say(s, ctx, `${nm(s, q)} artıramıyor, çekildi.`);
      continue;
    }
    pd.turn = q;
    return;
  }
  resolveAuction(s, ctx);
}

function resolveAuction(s, ctx) {
  const pd = s.pending;
  s.pending = null;
  const winner = pd.leader;
  s.lastAuction = { sq: pd.sq, high: pd.high, winner };
  if (winner === null) {
    emit(s, ctx, { type: 'auction', sq: pd.sq, winner, text: `Açık artırma bitti: teklif yok, ${sqName(pd.sq)} sahipsiz kaldı.` });
    return;
  }
  transfer(s, ctx, winner, null, pd.high, `İhale: ${sqName(pd.sq)}`, true);
  s.props[pd.sq].owner = winner;
  emit(s, ctx, { type: 'auction', sq: pd.sq, winner, text: `Açık artırma bitti: ${sqName(pd.sq)} → ${nm(s, winner)} (${fmt(pd.high)}).` });
}

// ---------- Sürpriz ----------

const pick = (s, arr) => arr[randInt(s, arr.length)];

// Sürpriz etkisi seçim beklemeden hemen uygulanır; gerekirse oyuncuyu başka kareye taşıyıp oraya indirir.
function applySurpriz(s, ctx, p, id) {
  const pl = s.players[p];
  const sur = SURPRIZ[id];
  const amt = (k) => R.money(s, AMOUNTS[k]);
  emit(s, ctx, { type: 'surpriz', p, id, text: `${nm(s, p)} için Sürpriz: ${sur.name}! ${sur.text}` });
  switch (id) {
    case 'miras':
      return transfer(s, ctx, null, p, amt('surMiras'), 'Miras');
    case 'radar':
      return transfer(s, ctx, p, null, amt('surRadar'), 'Hız cezası');
    case 'dugun':
      for (const o of others(s, p)) {
        const c = s.players[o].cash;
        if (c > 0) transfer(s, ctx, o, p, Math.min(amt('surDugun'), c), 'Düğün takısı');
      }
      return;
    case 'hesap':
      for (const o of others(s, p)) transfer(s, ctx, p, o, amt('surHesap'), 'Kebap hesabı');
      return;
    case 'robin': {
      const all = R.activePlayers(s);
      const rich = all.reduce((a, b) => (s.players[b].cash > s.players[a].cash ? b : a));
      const poor = all.reduce((a, b) => (s.players[b].cash < s.players[a].cash ? b : a));
      if (s.players[rich].cash === s.players[poor].cash) return say(s, ctx, 'Herkesin nakdi eşit, Robin Hood eli boş döndü.');
      return transfer(s, ctx, rich, poor, Math.min(amt('surRobin'), Math.max(0, s.players[rich].cash)), 'Robin Hood');
    }
    case 'catlak': {
      const built = R.propsOf(s, p).filter((q) => R.level(s.props[q]) > 0);
      if (!built.length) return say(s, ctx, 'Neyse ki çökecek katın yoktu.');
      const q = built.sort((a, b) => R.level(s.props[b]) - R.level(s.props[a]) || R.katValue(s, b) - R.katValue(s, a))[0];
      const ps = s.props[q];
      if (ps.kacak) ps.kacak = 0;
      else ps.kat--;
      return emit(s, ctx, { type: 'collapse', p, sq: q, text: `${sqName(q)} üstündeki 1 kat çöktü.` });
    }
    case 'jest': {
      const ok = s.mods.durgunluk ? [] : R.propsOf(s, p).filter((q) => BOARD[q].kind === 'prop' && !s.props[q].ipotek && !s.props[q].tedbir && R.level(s.props[q]) < 4);
      if (!ok.length) return transfer(s, ctx, null, p, amt('surTeselli'), 'Belediye tesellisi');
      const q = pick(s, ok);
      s.props[q].kat++;
      return emit(s, ctx, { type: 'build', p, sq: q, text: `${sqName(q)} üstüne belediyeden bedava kat çıktı.` });
    }
    case 'tarla': {
      const free = OWNABLE.filter((q) => s.props[q].owner === null);
      if (!free.length) return transfer(s, ctx, null, p, amt('surTarla'), 'Tarla satışı');
      const q = free.reduce((a, b) => (R.price(s, b) < R.price(s, a) ? b : a));
      s.props[q].owner = p;
      return emit(s, ctx, { type: 'own', p, sq: q, text: `${nm(s, p)} dededen kalan ${sqName(q)} tapusunu bedavaya aldı.` });
    }
    case 'ucak': {
      const steps = Math.min(...MODE_SQUARES.air.map((q) => (q - pl.pos + N) % N || N));
      return travel(s, ctx, p, steps, false);
    }
    case 'isinlan': {
      const to = pick(s, BOARD.map((_, i) => i).filter((i) => BOARD[i].kind !== 'surpriz'));
      pl.pos = to;
      emit(s, ctx, { type: 'move', p, path: [to], jump: true, text: `${nm(s, p)} ışınlandı → ${sqName(to)}` });
      return land(s, ctx, p);
    }
    case 'tersKose': {
      const o = pick(s, others(s, p));
      const [a, b] = [pl.pos, s.players[o].pos];
      pl.pos = b;
      s.players[o].pos = a;
      emit(s, ctx, { type: 'move', p, path: [b], jump: true });
      emit(s, ctx, { type: 'move', p: o, path: [a], jump: true, text: `${nm(s, p)} ile ${nm(s, o)} yer değiştirdi.` });
      return;
    }
    case 'kapkac': {
      const victims = others(s, p).filter((o) => s.players[o].hand.length);
      if (!victims.length) return drawCards(s, ctx, p, 1);
      const o = pick(s, victims);
      const hand = s.players[o].hand;
      pl.hand.push(hand.splice(randInt(s, hand.length), 1)[0]);
      return say(s, ctx, `${nm(s, p)}, ${nm(s, o)} oyuncusunun elinden bir kart kaptı.`);
    }
    case 'bavul': {
      if (!pl.hand.length) return say(s, ctx, 'Bavul zaten boştu.');
      const uid = pick(s, pl.hand);
      discardCard(s, p, uid);
      return say(s, ctx, `${nm(s, p)} elindeki ${CARDS[cardId(uid)].name} kartını kaybetti.`);
    }
    case 'haciz':
      return transfer(s, ctx, p, null, R.round5(Math.max(0, pl.cash) * 0.1), 'Haciz');
    case 'vergiIade': {
      const n = R.propsOf(s, p).length;
      if (!n) return say(s, ctx, 'Mülkün olmadığı için iade çıkmadı.');
      return transfer(s, ctx, null, p, n * amt('surVergi'), 'Vergi iadesi');
    }
    default:
  }
}

// ---------- Gündem ----------

function applyGundem(s, ctx, id) {
  const all = R.activePlayers(s);
  const g = GUNDEM[id];
  if (g.mod) {
    s.mods[g.mod] = true;
    return;
  }
  switch (id) {
    case 'enflasyon':
      s.index += AMOUNTS.enflasyon;
      s.gundem.detail = `Endeks artık ${s.index}.`;
      break;
    case 'dolar':
      for (const p of all) transfer(s, ctx, p, null, R.round5(Math.max(0, s.players[p].cash) * 0.1), 'Dolar kuru');
      break;
    case 'asgari':
      s.salary += AMOUNTS.asgari;
      s.gundem.detail = `Maaş artık ${fmt(s.salary)}.`;
      break;
    case 'imarAffi': {
      let n = 0;
      for (const ps of s.props) {
        if (ps && ps.kacak) {
          ps.kacak = 0;
          ps.kat++;
          n++;
        }
      }
      s.gundem.detail = n ? `${n} kaçak kat yasallaştı.` : 'Affedilecek kaçak kat yoktu.';
      break;
    }
    case 'operasyon': {
      let n = 0;
      for (const ps of s.props) {
        if (ps && ps.kacak) {
          ps.kacak = 0;
          n++;
        }
      }
      s.gundem.detail = n ? `${n} kaçak kat yıkıldı.` : 'Yıkılacak kaçak kat yoktu, kepçeler boş döndü.';
      break;
    }
    case 'deprem':
      for (const p of all) {
        const f = R.floorsOf(s, p);
        transfer(s, ctx, p, null, f.kat * R.money(s, AMOUNTS.depremKat) + f.kacak * R.money(s, AMOUNTS.depremKacak), 'Deprem güçlendirmesi');
      }
      break;
    case 'emlakVergisi':
      for (const p of all) transfer(s, ctx, p, null, R.propsOf(s, p).length * R.money(s, AMOUNTS.emlakVergisi), 'Emlak vergisi');
      break;
    case 'bayram':
      for (const p of all) transfer(s, ctx, null, p, R.money(s, AMOUNTS.bayram), 'Bayram ikramiyesi');
      break;
    case 'kentsel': {
      const eligible = (q) => s.props[q].owner !== null && !s.props[q].ipotek && R.level(s.props[q]) < 4;
      const groups = Object.keys(GROUPS).filter((gr) => GROUP_SQUARES[gr].some(eligible));
      if (!groups.length) {
        s.gundem.detail = 'Dönüşecek sahipli mülk yok.';
        break;
      }
      const gr = groups[randInt(s, groups.length)];
      const qs = GROUP_SQUARES[gr].filter(eligible);
      for (const q of qs) s.props[q].kat++;
      s.gundem.detail = `${GROUPS[gr].name}: ${qs.length} mülke bedava kat.`;
      break;
    }
    case 'secimVaadi': {
      const p = [...all].sort((a, b) => R.netWorth(s, a) - R.netWorth(s, b))[0];
      transfer(s, ctx, null, p, R.money(s, AMOUNTS.secimVaadi), 'Seçim vaadi');
      break;
    }
    case 'rantVergisi': {
      const p = [...all].sort((a, b) => R.netWorth(s, b) - R.netWorth(s, a))[0];
      transfer(s, ctx, p, null, R.money(s, AMOUNTS.rantVergisi), 'Rant vergisi');
      break;
    }
    case 'faizUctu':
      for (const p of all) {
        const n = R.propsOf(s, p).filter((q) => s.props[q].ipotek).length;
        transfer(s, ctx, p, null, n * R.money(s, AMOUNTS.faizUctu), 'İpotek faizi');
      }
      break;
    case 'metro': {
      const groups = Object.keys(GROUPS);
      const gr = groups[randInt(s, groups.length)];
      s.groupMult[gr] = Math.round((s.groupMult[gr] || 1) * 1.25 * 100) / 100;
      s.gundem.detail = `${GROUPS[gr].name} değerlendi.`;
      break;
    }
    case 'komsuluk': {
      const gifts = all.map((p) => {
        const hand = s.players[p].hand;
        return hand.length ? hand.splice(randInt(s, hand.length), 1)[0] : null;
      });
      gifts.forEach((uid, i) => uid && s.players[all[(i + 1) % all.length]].hand.push(uid));
      break;
    }
    default:
  }
  if (s.gundem.detail) say(s, ctx, s.gundem.detail);
}

// ---------- kartlar ----------

const victimOf = (s, id, t) => {
  if (id === 'kamulastirma' || id === 'tedbir') return s.props[t.sq].owner;
  if (id === 'takas') return s.props[t.theirs].owner;
  return t.player;
};

const isOwnable = (sq) => Number.isInteger(sq) && sq >= 0 && sq < N && s_ownable[sq];
const s_ownable = BOARD.map((q) => q.kind === 'prop' || q.kind === 'transport');
const isOpp = (s, p, o) => Number.isInteger(o) && o >= 0 && o < s.players.length && o !== p && !s.players[o].out;

// Kartın verilen hedefle oynanamama sebebi; oynanabiliyorsa null.
export function cardBlock(s, p, id, t = {}) {
  const pl = s.players[p];
  const ps = isOwnable(t.sq) ? s.props[t.sq] : null;
  switch (id) {
    case 'taksi':
      return Number.isInteger(t.steps) && t.steps >= 1 && t.steps <= 12 ? null : '1 ile 12 arasında bir kare sayısı seç.';
    case 'geriVites':
      return s.turn.backward ? 'Zaten geri viteste.' : null;
    case 'kestirme':
      return t.die === 0 || t.die === 1 ? null : 'Hangi zarla ilerleyeceğini seç.';
    case 'kamulastirma':
      if (!ps || !isOpp(s, p, ps.owner)) return 'Bir rakibin mülkünü seç.';
      if (R.level(ps) > 0 || ps.ipotek) return 'Katlı ya da ipotekli mülk kamulaştırılamaz.';
      if (R.inFullSet(s, t.sq)) return 'Tamamlanmış şehir setinden mülk alınamaz.';
      if (pl.cash < R.price(s, t.sq)) return 'Kamulaştırma bedeline paran yetmiyor.';
      return null;
    case 'takas': {
      const mine = isOwnable(t.mine) ? s.props[t.mine] : null;
      const theirs = isOwnable(t.theirs) ? s.props[t.theirs] : null;
      if (!mine || mine.owner !== p || R.level(mine) > 0) return 'Vereceğin katsız bir mülkünü seç.';
      if (!theirs || !isOpp(s, p, theirs.owner) || R.level(theirs) > 0) return 'Rakibin katsız bir mülkünü seç.';
      if (R.inFullSet(s, t.theirs)) return 'Tamamlanmış şehir setinden mülk alınamaz.';
      return null;
    }
    case 'tedbir':
      if (!ps || !isOpp(s, p, ps.owner)) return 'Bir rakibin mülkünü seç.';
      return ps.tedbir > 0 ? 'Bu mülkte zaten tedbir var.' : null;
    case 'ihbar':
      if (s.mods.zabitaIzinde) return 'Zabıta izinde: bu dönem ihbar olmaz.';
      if (!isOpp(s, p, t.player)) return 'Bir rakip seç.';
      return R.floorsOf(s, t.player).kacak > 0 ? null : 'Bu oyuncunun kaçak katı yok.';
    case 'kiraZammi':
      return pl.kiraZammi ? 'Kira Zammı zaten etkin.' : null;
    case 'muteahhit':
      if (!ps || ps.owner !== p || BOARD[t.sq].kind !== 'prop') return 'Kendi mülklerinden birini seç.';
      if (GROUP_SQUARES[BOARD[t.sq].group].filter((q) => s.props[q].owner === p).length < 2) return 'Müteahhit için o şehirden en az 2 mülkün olmalı.';
      if (s.mods.durgunluk) return 'Piyasa durgun: bu dönem kat dikilemez.';
      if (ps.ipotek || ps.tedbir > 0) return 'İpotekli ya da tedbirli mülke kat dikilemez.';
      return R.level(ps) >= 4 ? 'Bu mülk en üst seviyede.' : null;
    case 'piyango':
    case 'aidat':
      return null;
    case 'dava':
      return isOpp(s, p, t.player) ? null : 'Dava açacağın rakibi seç.';
    case 'pazarlik': {
      const pd = s.pending;
      return pl.cash >= R.round5(R.price(s, pd.sq) / 2) ? null : 'Yarı fiyata bile paran yetmiyor.';
    }
    default:
      return 'Bilinmeyen kart.';
  }
}

// Arayüz ve botlar için: kartın geçerli hedefleri.
export function cardTargets(s, p, id) {
  const opps = others(s, p);
  const oppProps = OWNABLE.filter((q) => opps.includes(s.props[q].owner));
  switch (CARDS[id].target) {
    case 'steps':
      return Array.from({ length: 12 }, (_, i) => ({ steps: i + 1 }));
    case 'die':
      return [{ die: 0 }, { die: 1 }];
    case 'opp-prop':
      return oppProps.map((sq) => ({ sq })).filter((t) => !cardBlock(s, p, id, t));
    case 'self-prop':
      return R.propsOf(s, p).map((sq) => ({ sq })).filter((t) => !cardBlock(s, p, id, t));
    case 'opp-player':
      return opps.map((player) => ({ player })).filter((t) => !cardBlock(s, p, id, t));
    case 'swap': {
      const mine = R.propsOf(s, p).filter((q) => R.level(s.props[q]) === 0);
      const theirs = oppProps.filter((q) => R.level(s.props[q]) === 0 && !R.inFullSet(s, q));
      return mine.flatMap((m) => theirs.map((t) => ({ mine: m, theirs: t })));
    }
    default:
      return cardBlock(s, p, id, {}) ? [] : [{}];
  }
}

function cardText(s, p, id, t) {
  const who = nm(s, p);
  const name = CARDS[id].name;
  switch (id) {
    case 'taksi':
      return `${who} Taksi çağırdı: ${t.steps} kare.`;
    case 'kestirme':
      return `${who} Kestirme kullandı: ${s.turn.dice[t.die]} kare.`;
    case 'kamulastirma':
    case 'tedbir':
      return `${who} → ${nm(s, s.props[t.sq].owner)}: ${name} (${sqName(t.sq)})`;
    case 'takas':
      return `${who} → ${nm(s, s.props[t.theirs].owner)}: Zorla Takas (${sqName(t.mine)} ↔ ${sqName(t.theirs)})`;
    case 'ihbar':
    case 'dava':
      return `${who} → ${nm(s, t.player)}: ${name}`;
    default:
      return `${who} ${name} oynadı.`;
  }
}

function playCard(s, p, a, ctx) {
  need(hasUid(s, p, a.uid), 'Bu kart elinde yok.');
  const id = cardId(a.uid);
  const c = CARDS[id];
  need(c && c.type === 'hamle', 'Tepki kartları kendi anlarında oynanır.');
  need(!s.turn.hamle, 'Bu tur zaten bir Hamle kartı oynadın.');
  const pd = s.pending;
  if (c.when === 'buy') need(pd && pd.type === 'buy' && pd.p === p, 'Bu kart satın alma kararı sırasında oynanır.');
  else {
    need(!pd, 'Önce bekleyen kararı ver.');
    if (c.when === 'preroll') need(s.turn.step === 'preroll', 'Bu kart zar atmadan önce oynanır.');
    else if (c.when === 'choose') need(s.turn.step === 'choose', 'Bu kart zar atıldıktan sonra oynanır.');
    else need(MANAGE_STEPS.includes(s.turn.step), 'Şu an kart oynayamazsın.');
  }
  const t = a.target && typeof a.target === 'object' ? a.target : {};
  const block = cardBlock(s, p, id, t);
  need(!block, block);
  discardCard(s, p, a.uid);
  s.turn.hamle = true;
  emit(s, ctx, { type: 'card', p, card: id, target: t, text: cardText(s, p, id, t) });
  const card = { id, by: p, target: t };
  if (c.react) {
    const queue = id === 'aidat' ? others(s, p) : [victimOf(s, id, t)];
    s.pending = { type: 'react', card, queue, victim: null, responder: null, chain: 0 };
    return continueReaction(s, ctx);
  }
  applyCard(s, ctx, card, null);
}

function continueReaction(s, ctx) {
  for (;;) {
    const pd = s.pending;
    if (!pd || pd.type !== 'react') return;
    if (!pd.queue.length) {
      s.pending = null;
      return;
    }
    pd.victim = pd.queue.shift();
    pd.chain = 0;
    if (tableHolds(s, 'itiraz')) {
      pd.responder = pd.victim;
      return;
    }
    applyCard(s, ctx, pd.card, pd.victim);
  }
}

function finishVictim(s, ctx) {
  const pd = s.pending;
  pd.responder = null;
  if (pd.chain % 2 === 0) applyCard(s, ctx, pd.card, pd.victim);
  else say(s, ctx, `${CARDS[pd.card.id].name} itirazla düştü (${nm(s, pd.victim)}).`);
  continueReaction(s, ctx);
}

function applyCard(s, ctx, card, victim) {
  const p = card.by;
  const t = card.target;
  switch (card.id) {
    case 'taksi':
      s.turn.dice = null;
      return travel(s, ctx, p, t.steps, false);
    case 'geriVites':
      s.turn.backward = true;
      return;
    case 'kestirme':
      return travel(s, ctx, p, s.turn.dice[t.die], s.turn.backward);
    case 'kamulastirma':
      transfer(s, ctx, p, victim, R.price(s, t.sq), `Kamulaştırma bedeli: ${sqName(t.sq)}`);
      s.props[t.sq].owner = p;
      return emit(s, ctx, { type: 'own', p, sq: t.sq, text: `${sqName(t.sq)} kamulaştırıldı, artık ${nm(s, p)} oyuncusunun.` });
    case 'takas':
      s.props[t.mine].owner = victim;
      s.props[t.theirs].owner = p;
      return emit(s, ctx, { type: 'own', p, sq: t.theirs, text: `Takas tamam: ${sqName(t.theirs)} ↔ ${sqName(t.mine)}.` });
    case 'tedbir':
      Object.assign(s.props[t.sq], { tedbir: 2, tedbirBy: card.by });
      return say(s, ctx, `${sqName(t.sq)} için ihtiyati tedbir kararı: 2 tur kira yok.`);
    case 'ihbar':
      return demolishKacak(s, ctx, victim, R.money(s, AMOUNTS.ihbarFine), 'İhbar');
    case 'kiraZammi':
      s.players[p].kiraZammi = true;
      return;
    case 'muteahhit':
      s.props[t.sq].kat++;
      return emit(s, ctx, { type: 'build', p, sq: t.sq, text: `${sqName(t.sq)} üstüne ruhsatlı bedava kat çıktı.` });
    case 'piyango':
      return transfer(s, ctx, null, p, R.money(s, AMOUNTS.piyango), 'Piyango');
    case 'aidat':
      return transfer(s, ctx, victim, p, R.money(s, AMOUNTS.aidat), 'Aidat');
    case 'dava': {
      const a = rollDie(s);
      const b = rollDie(s);
      const win = a > b ? p : victim;
      const lose = win === p ? victim : p;
      emit(s, ctx, { type: 'dava', p, victim, dice: [a, b], text: `Dava zarları: ${nm(s, p)} ${a}, ${nm(s, victim)} ${b}. Kazanan ${nm(s, win)}.` });
      return transfer(s, ctx, lose, win, R.money(s, AMOUNTS.dava), 'Dava');
    }
    case 'pazarlik': {
      const sq = s.pending.sq;
      s.pending = null;
      return acquire(s, ctx, p, sq, R.round5(R.price(s, sq) / 2), 'yarı fiyatına aldı:');
    }
    default:
  }
}

// ---------- pazarlık ----------

function normTrade(a) {
  const side = (x = {}) => ({
    cash: Number.isInteger(x.cash) && x.cash > 0 ? x.cash : 0,
    props: Array.isArray(x.props) ? [...new Set(x.props)] : [],
  });
  return { to: a.to, give: side(a.give), take: side(a.take) };
}

const MAX_COUNTER = 2;

// Açık pazarlık: bekleyen karar yokken ve sıradaki oyuncu zar öncesi ya da serbest evredeyken herkes teklif yapabilir.
export function tradeWait(s, p) {
  const pl = s.players[p];
  if (s.phase !== 'play' || !s.turn || !pl || pl.out) return 'Şu an pazarlık yapamazsın.';
  if (s.pending || !MANAGE_STEPS.includes(s.turn.step)) return 'Teklif, sıradaki oyuncu zar atmadan önce ya da turunu bitirmeden gönderilebilir.';
  if (p === s.turn.p) return s.turn.trades < 3 ? null : 'Bir turda en fazla 3 pazarlık teklifi yapılır.';
  return (s.turn.side || []).includes(p) ? 'Sıran değilken turda bir teklif yapabilirsin.' : null;
}

function proposeTrade(s, p, a, ctx) {
  const w = tradeWait(s, p);
  need(!w, w);
  const t = normTrade(a);
  const b = tradeBlock(s, p, t);
  need(!b, b);
  if (p === s.turn.p) s.turn.trades++;
  else (s.turn.side ??= []).push(p);
  s.pending = { type: 'trade', from: p, to: t.to, give: t.give, take: t.take };
  emit(s, ctx, { type: 'trade', text: `${nm(s, p)} → ${nm(s, t.to)}: pazarlık teklifi var.` });
}

export function tradeBlock(s, from, t) {
  if (!isOpp(s, from, t.to)) return 'Pazarlık yapacağın oyuncuyu seç.';
  const fp = s.players[from];
  const tp = s.players[t.to];
  if (t.give.cash > Math.max(0, fp.cash)) return 'Teklif ettiğin para nakdinden fazla.';
  if (t.take.cash > Math.max(0, tp.cash)) return 'Karşı tarafın o kadar nakdi yok.';
  const okProps = (list, owner) => list.every((q) => isOwnable(q) && s.props[q].owner === owner && R.level(s.props[q]) === 0);
  if (!okProps(t.give.props, from)) return 'Verdiğin mülkler senin ve katsız olmalı.';
  if (!okProps(t.take.props, t.to)) return 'İstediğin mülkler onun ve katsız olmalı.';
  if (!t.give.cash && !t.take.cash && !t.give.props.length && !t.take.props.length) return 'Boş teklif olmaz.';
  return null;
}

function executeTrade(s, ctx, pd) {
  transfer(s, ctx, pd.from, pd.to, pd.give.cash, 'Pazarlık', true);
  transfer(s, ctx, pd.to, pd.from, pd.take.cash, 'Pazarlık', true);
  for (const q of pd.give.props) s.props[q].owner = pd.to;
  for (const q of pd.take.props) s.props[q].owner = pd.from;
  const side = (x) => [...x.props.map(sqName), ...(x.cash ? [fmt(x.cash)] : [])].join(' + ') || 'hiçbir şey';
  emit(s, ctx, { type: 'tradeDone', text: `Anlaşma! ${nm(s, pd.from)} verdi: ${side(pd.give)}; aldı: ${side(pd.take)} (${nm(s, pd.to)}).` });
}

// ---------- hamle işleyicileri ----------

const needManage = (s) => need(MANAGE_STEPS.includes(s.turn.step), 'Şu an bunu yapamazsın.');
const needMine = (s, p, sq) => need(isOwnable(sq) && s.props[sq].owner === p, 'Bu mülk senin değil.');

const TURN = {
  roll(s, p, a, ctx) {
    need(s.turn.step === 'preroll', 'Zar zaten atıldı.');
    const d = [rollDie(s), rollDie(s)];
    s.turn.dice = d;
    s.turn.step = 'choose';
    emit(s, ctx, { type: 'dice', p, dice: d, text: `${nm(s, p)} zar attı: ${d[0]} ve ${d[1]}${d[0] === d[1] ? ', çift' : ''}` });
    if (d[0] === d[1]) {
      s.turn.doubles = (s.turn.doubles || 0) + 1;
      s.turn.again = s.turn.doubles <= MAX_DOUBLES;
    }
    // Masada Kestirme varsa oyuncu (kartı olsun olmasın) zarı görüp karar verir; yoksa doğrudan ilerler.
    if (s.turn.hamle || !tableHolds(s, 'kestirme')) travel(s, ctx, p, d[0] + d[1], s.turn.backward);
  },
  move(s, p, a, ctx) {
    need(s.turn.step === 'choose', 'Önce zar at.');
    need(moveOptions(s).includes(a.steps), 'Zar toplamı kadar ilerlenir.');
    travel(s, ctx, p, a.steps, s.turn.backward);
  },
  playCard,
  build(s, p, a, ctx) {
    needManage(s);
    const b = R.buildBlock(s, p, a.sq, false);
    need(!b, b);
    const cost = R.katCost(s, a.sq);
    s.props[a.sq].kat++;
    transfer(s, ctx, p, null, cost, 'Kat', true);
    emit(s, ctx, { type: 'build', p, sq: a.sq, text: `${nm(s, p)} ${sqName(a.sq)} üstüne kat dikti (${fmt(cost)}).` });
  },
  buildKacak(s, p, a, ctx) {
    needManage(s);
    const b = R.buildBlock(s, p, a.sq, true);
    need(!b, b);
    const cost = R.kacakCost(s, a.sq);
    s.props[a.sq].kacak = 1;
    transfer(s, ctx, p, null, cost, 'Kaçak kat', true);
    emit(s, ctx, { type: 'build', p, sq: a.sq, kacak: true, text: `${nm(s, p)} ${sqName(a.sq)} üstüne gece yarısı kaçak kat çıktı (${fmt(cost)}).` });
  },
  sellFloor(s, p, a, ctx) {
    needManage(s);
    needMine(s, p, a.sq);
    need(R.level(s.props[a.sq]) > 0, 'Satılacak kat yok.');
    sellFloorAt(s, ctx, p, a.sq);
  },
  mortgage(s, p, a, ctx) {
    needManage(s);
    needMine(s, p, a.sq);
    const ps = s.props[a.sq];
    need(!ps.ipotek, 'Zaten ipotekli.');
    need(R.level(ps) === 0, 'Önce katları satmalısın.');
    mortgageAt(s, ctx, p, a.sq);
  },
  unmortgage(s, p, a, ctx) {
    needManage(s);
    needMine(s, p, a.sq);
    need(s.props[a.sq].ipotek, 'Bu mülk ipotekli değil.');
    const cost = R.unmortgageCost(s, a.sq);
    need(s.players[p].cash >= cost, 'Paran yetmiyor.');
    s.props[a.sq].ipotek = false;
    transfer(s, ctx, p, null, cost, `İpotek kaldırma: ${sqName(a.sq)}`);
  },
  proposeTrade,
  settleDebt(s, p, a, ctx) {
    needManage(s);
    need(s.players[p].cash < 0, 'Borcun yok.');
    autoLiquidate(s, ctx, p);
    if (s.players[p].cash >= 0) return;
    goBroke(s, ctx, p);
    if (s.players[p].out) finishTurn(s, ctx); // iflas eden oyuncunun sırası biter
  },
  endTurn(s, p, a, ctx) {
    need(s.turn.step === 'free', 'Önce zar atıp ilerlemelisin.');
    if (s.players[p].cash < 0) {
      need(!R.hasLiquidAssets(s, p), 'Borcun var: önce borcunu kapat (kat sat, ipotek et ya da "Borcu Kapat").');
      goBroke(s, ctx, p);
      if (s.players[p].out) return finishTurn(s, ctx);
    }
    const extra = s.players[p].hand.length - s.config.handLimit;
    if (extra > 0) {
      s.pending = { type: 'discard', p, count: extra };
      return;
    }
    finishTurn(s, ctx);
  },
};

const PENDING = {
  buy: {
    buy(s, p, a, ctx) {
      const sq = s.pending.sq;
      const cost = R.price(s, sq);
      need(s.players[p].cash >= cost, s.config.rules.ihale ? 'Paran yetmiyor, ihaleye çıkarabilirsin.' : 'Paran yetmiyor.');
      s.pending = null;
      acquire(s, ctx, p, sq, cost, 'satın aldı:');
    },
    decline(s, p, a, ctx) {
      const sq = s.pending.sq;
      s.pending = null;
      if (s.config.rules.ihale) startAuction(s, ctx, sq, p);
      else say(s, ctx, `${nm(s, p)} ${sqName(sq)} arsasını almadı, sahipsiz kaldı.`);
    },
    playCard,
  },
  auction: {
    raise(s, p, a, ctx) {
      const pd = s.pending;
      const min = pd.high + auctionStep(s);
      need(Number.isInteger(a.amount) && a.amount >= min, `En az ${fmt(min)} teklif vermelisin.`);
      need(a.amount <= s.players[p].cash, 'Nakdinden fazla teklif veremezsin.');
      pd.high = a.amount;
      pd.leader = p;
      emit(s, ctx, { type: 'bid', p, amount: a.amount, text: `${nm(s, p)} ${sqName(pd.sq)} için ${fmt(a.amount)} verdi.` });
      nextBidder(s, ctx);
    },
    pass(s, p, a, ctx) {
      const pd = s.pending;
      pd.out.push(p);
      emit(s, ctx, { type: 'bid', p, amount: 0, text: `${nm(s, p)} artırmadan çekildi.` });
      nextBidder(s, ctx);
    },
  },
  react: {
    react(s, p, a, ctx) {
      const pd = s.pending;
      if (a.uid) {
        need(cardId(a.uid) === 'itiraz' && hasUid(s, p, a.uid), 'İtiraz kartın yok.');
        discardCard(s, p, a.uid);
        pd.chain++;
        emit(s, ctx, { type: 'card', p, card: 'itiraz', text: `${nm(s, p)}: İTİRAZ EDİYORUM!` });
        const other = p === pd.victim ? pd.card.by : pd.victim;
        if (tableHolds(s, 'itiraz')) {
          pd.responder = other;
          return;
        }
      }
      finishVictim(s, ctx);
    },
  },
  rent: {
    react(s, p, a, ctx) {
      const r = s.pending;
      s.pending = null;
      if (a.uid) {
        need(cardId(a.uid) === 'dayi' && hasUid(s, p, a.uid), 'Dayın Çıktı kartın yok.');
        discardCard(s, p, a.uid);
        emit(s, ctx, { type: 'card', p, card: 'dayi', text: `${nm(s, p)}: "Dayım çıktı!" ${sqName(r.sq)} kirası ödenmedi.` });
        return;
      }
      payRent(s, ctx, r);
    },
  },
  tapu: {
    tapuBuy(s, p, a, ctx) {
      if (a.sq === null || a.sq === undefined) {
        s.pending = null;
        return say(s, ctx, `${nm(s, p)} tapuda bir şey almadı.`);
      }
      need(isOwnable(a.sq) && s.props[a.sq].owner === null, 'Bu arsa sahipsiz değil.');
      const cost = R.price(s, a.sq);
      need(s.players[p].cash >= cost, 'Paran yetmiyor.');
      s.pending = null;
      acquire(s, ctx, p, a.sq, cost, 'tapudan aldı:');
    },
  },
  zabita: {
    zabitaTarget(s, p, a, ctx) {
      need(s.pending.options.includes(a.target), 'Bu oyuncu ihbar edilemez.');
      s.pending = null;
      demolishKacak(s, ctx, a.target, R.money(s, AMOUNTS.zabitaFine), 'Zabıta');
    },
  },
  trade: {
    tradeRespond(s, p, a, ctx) {
      const pd = s.pending;
      s.pending = null;
      if (!a.accept) return say(s, ctx, `${nm(s, p)} teklifi reddetti.`);
      const b = tradeBlock(s, pd.from, pd);
      need(!b, b);
      executeTrade(s, ctx, pd);
    },
    // Teklifi alan karşı teklif yapabilir: aynı pazarlık ters yönde sürer (en fazla MAX_COUNTER kez).
    tradeCounter(s, p, a, ctx) {
      const pd = s.pending;
      need((pd.counter || 0) < MAX_COUNTER, 'Bu pazarlıkta daha fazla karşı teklif yapılamaz.');
      const t = normTrade({ ...a, to: pd.from });
      const b = tradeBlock(s, p, t);
      need(!b, b);
      s.pending = { type: 'trade', from: p, to: pd.from, give: t.give, take: t.take, counter: (pd.counter || 0) + 1 };
      emit(s, ctx, { type: 'trade', text: `${nm(s, p)} → ${nm(s, pd.from)}: karşı teklif var.` });
    },
  },
  discard: {
    discard(s, p, a, ctx) {
      const pd = s.pending;
      const uids = Array.isArray(a.uids) ? a.uids : [];
      need(uids.length === pd.count && new Set(uids).size === uids.length && uids.every((u) => hasUid(s, p, u)), `${pd.count} kart seçmelisin.`);
      for (const u of uids) discardCard(s, p, u);
      s.pending = null;
      finishTurn(s, ctx);
    },
  },
};

export function waitingFor(s) {
  if (s.phase === 'over') return [];
  const pd = s.pending;
  if (pd) {
    switch (pd.type) {
      case 'auction':
        return [pd.turn];
      case 'react':
        return [pd.responder];
      case 'trade':
        return [pd.to];
      default:
        return [pd.p];
    }
  }
  return s.turn ? [s.turn.p] : [];
}

function handle(s, actor, a, ctx) {
  need(s.phase !== 'over', 'Oyun bitti.');
  need(Number.isInteger(actor) && actor >= 0 && actor < s.players.length, 'Geçersiz oyuncu.');
  need(a && typeof a.type === 'string', 'Geçersiz hamle.');
  const pd = s.pending;
  if (pd && pd.type === 'trade' && a.type === 'tradeCancel' && actor === pd.from) {
    s.pending = null;
    return say(s, ctx, `${nm(s, actor)} teklifini geri çekti.`);
  }
  if (!pd && a.type === 'proposeTrade') return proposeTrade(s, actor, a, ctx); // sırası olmayan da teklif yapabilir
  need(waitingFor(s).includes(actor), 'Şu an hamle sırası sende değil.');
  const table = pd ? PENDING[pd.type] : TURN;
  const h = Object.hasOwn(table, a.type) ? table[a.type] : null;
  need(h, pd ? 'Önce bekleyen kararı ver.' : 'Bu hamle şu an yapılamaz.');
  h(s, actor, a, ctx);
}

export function applyAction(state, actor, action) {
  const s = structuredClone(state);
  const ctx = { events: [] };
  handle(s, actor, action, ctx);
  s.seq++;
  return { state: s, events: ctx.events };
}

// Süre dolunca ya da oyuncu yokken kullanılacak en zararsız hamle.
export function defaultAction(s, seat) {
  const pd = s.pending;
  const pl = s.players[seat];
  if (pd) {
    switch (pd.type) {
      case 'buy':
        return { type: 'decline' };
      case 'auction':
        return { type: 'pass' };
      case 'react':
      case 'rent':
        return { type: 'react', uid: null };
      case 'tapu':
        return { type: 'tapuBuy', sq: null };
      case 'zabita':
        return { type: 'zabitaTarget', target: pd.options[0] };
      case 'trade':
        return { type: 'tradeRespond', accept: false };
      case 'discard':
        return { type: 'discard', uids: pl.hand.slice(-pd.count) };
      default:
        return null;
    }
  }
  if (s.turn.step === 'preroll') return { type: 'roll' };
  if (s.turn.step === 'choose') return { type: 'move', steps: moveOptions(s)[0] };
  if (pl.cash < 0 && R.hasLiquidAssets(s, seat)) return { type: 'settleDebt' };
  return { type: 'endTurn' };
}

// Oyuncuya özel görünüm: başkalarının eli ve deste sırası gizlenir.
export function viewFor(s, seat) {
  const over = s.phase === 'over';
  const v = {
    ...s,
    rng: 0,
    deck: s.deck.length,
    discard: s.discard.length,
    gundemDeck: s.gundemDeck.length,
    gundemDiscard: s.gundemDiscard.length,
    you: seat,
    players: s.players.map((pl, i) => ({
      ...pl,
      handCount: pl.hand.length,
      hand: i === seat || over ? pl.hand : [],
    })),
  };
  return JSON.parse(JSON.stringify(v));
}
