// Motorun tahtadan bağımsız ortak parçaları: olay, para, kart çekme, satın alma, kira ödeme, açık artırma, borç
// (konkordato, iflas). Hem klasik tahta (klasik.js) hem oyun akışı (game.js) ve Mahalle (mahalle.js) bunları kullanır.
// Olaylar (events) herkese gider; bu yüzden asla gizli bilgi (el, deste) içermez.

import { randInt, shuffle } from './rng.js';
import * as R from './rules.js';

export class GameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameError';
  }
}

export const need = (cond, msg) => {
  if (!cond) throw new GameError(msg);
};

const LOG_MAX = 150;

export function emit(s, ctx, ev) {
  ctx.events.push(ev);
  if (ev.text) {
    // Kart olaylarında kart ve oynayan da saklanır: akışta kart adı çip olur, üzerine gelince kart görünür.
    s.log.push(ev.card ? { r: s.round, text: ev.text, type: ev.type, card: ev.card, p: ev.p } : { r: s.round, text: ev.text, type: ev.type });
    if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX);
  }
}

export const say = (s, ctx, text) => emit(s, ctx, { type: 'log', text });
export const nm = (s, p) => s.players[p].name;
export const sqName = (s, sq) => R.sqOf(s, sq).name;
export const others = (s, p) => R.activePlayers(s).filter((i) => i !== p);
export const pick = (s, arr) => arr[randInt(s, arr.length)];
export const isOpp = (s, p, o) => Number.isInteger(o) && o >= 0 && o < s.players.length && o !== p && !s.players[o].out;

export const hasCard = (s, p, id) => s.players[p].hand.some((u) => R.cardId(u) === id);
// Masada bu karttan biri var mı: tepki beklemeleri buna göre açılır, kimin elinde olduğu sızmaz.
export const tableHolds = (s, id) => s.players.some((_, p) => hasCard(s, p, id));
export const hasUid = (s, p, uid) => typeof uid === 'string' && s.players[p].hand.includes(uid);

// Oyun sonu dayı yorumu için sayaçlar; eski kayıtlarda stats yoksa burada açılır. Puanı etkilemez.
const STAT_KEYS = ['kacak', 'ihale', 'dava', 'gasp', 'yikim', 'kira'];
export const newStats = () => Object.fromEntries(STAT_KEYS.map((k) => [k, 0]));
export function stat(s, p, key, n = 1) {
  const pl = s.players[p];
  pl.stats ??= newStats();
  pl.stats[key] = (pl.stats[key] || 0) + n;
}

export function discardCard(s, p, uid) {
  const hand = s.players[p].hand;
  hand.splice(hand.indexOf(uid), 1);
  s.discard.push(uid);
}

export function drawCards(s, ctx, p, n, quiet = false) {
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
export function transfer(s, ctx, from, to, amount, why, quiet = false) {
  if (amount <= 0) return;
  if (from !== null) s.players[from].cash -= amount;
  if (to !== null) s.players[to].cash += amount;
  let text;
  if (!quiet) {
    if (from === null) text = `${nm(s, to)} +${R.fmt(amount)} (${why})`;
    else if (to === null) text = `${nm(s, from)} ${R.fmt(amount)} ödedi (${why})`;
    else text = `${nm(s, from)} → ${nm(s, to)}: ${R.fmt(amount)} (${why})`;
  }
  emit(s, ctx, { type: 'money', from, to, amount, why, text });
}

export function acquire(s, ctx, p, sq, cost, how) {
  transfer(s, ctx, p, null, cost, `Tapu: ${sqName(s, sq)}`, true);
  evict(s, ctx, p, sq);
  s.props[sq].owner = p;
  emit(s, ctx, { type: 'own', p, sq, text: `${nm(s, p)} ${sqName(s, sq)} mülkünü ${how} ${R.fmt(cost)}.` });
}

// Mahalle: gecekondulu sahipsiz arsayı alan, gecekonduyu yıkar ve kondurana tahliye bedeli öder (kendisininse ödemez).
export function evict(s, ctx, p, sq) {
  const g = s.props[sq].gk;
  if (!g) return;
  const fee = R.evictCost(s, sq, p);
  s.props[sq].gk = null;
  emit(s, ctx, { type: 'evict', p: g.p, by: p, sq, text: `${sqName(s, sq)} üstündeki gecekondu yıkıldı.` });
  if (fee) transfer(s, ctx, p, g.p, fee, `Tahliye: ${sqName(s, sq)}`);
}

export function demolishKacak(s, ctx, victim, finePer, why, by) {
  let n = 0;
  for (const q of R.propsOf(s, victim)) {
    if (s.props[q].kacak) {
      s.props[q].kacak = 0;
      n++;
    }
  }
  if (!n) return say(s, ctx, `${why}: ${nm(s, victim)} oyuncusunda kaçak kat bulunamadı.`);
  if (by !== victim) stat(s, by, 'yikim', n);
  emit(s, ctx, { type: 'demolish', p: victim, n, text: `${why}: ${nm(s, victim)} oyuncusunun ${n} kaçak katı yıkıldı!` });
  if (finePer) transfer(s, ctx, victim, null, finePer * n, `${why} cezası`);
}

// ---------- kira ----------

export function chargeRent(s, ctx, p, sq) {
  const ps = s.props[sq];
  if (ps.ipotek) return say(s, ctx, `${sqName(s, sq)} ipotekli, kira yok.`);
  if (ps.tedbir > 0) return say(s, ctx, `${sqName(s, sq)} için ihtiyati tedbir var, kira yok.`);
  const owner = ps.owner;
  const zam = s.players[owner].kiraZammi;
  const amount = R.rentFor(s, sq) * (zam ? 2 : 1);
  if (amount <= 0) return;
  const r = { type: 'rent', p, owner, sq, amount, zam };
  // Kartı olsun olmasın aynı karar beklenir; yalnız masada hiç Dayın Çıktı yoksa beklenmez (kimde olduğu belli olmasın).
  if (tableHolds(s, 'dayi')) s.pending = r;
  else payRent(s, ctx, r);
}

export function payRent(s, ctx, r) {
  if (r.zam) s.players[r.owner].kiraZammi = false;
  // Mahalle: çevredeki AVM'lerin payı kiradan kesilir (AVM kiracınınsa payı cebinde kalır).
  let amount = r.amount;
  for (const c of R.avmCuts(s, r.sq, r.amount)) {
    amount -= c.amount;
    if (c.owner !== r.p) transfer(s, ctx, r.p, c.owner, c.amount, `AVM payı: ${sqName(s, c.sq)}`);
  }
  stat(s, r.owner, 'kira', amount);
  transfer(s, ctx, r.p, r.owner, amount, `Kira: ${sqName(s, r.sq)}${r.zam ? ', zamlı' : ''}`);
}

// ---------- borç ----------

// Borcunu kapatamayan oyuncu: iflas modunda elenir, diğer modlarda konkordato ilan eder.
export function goBroke(s, ctx, p) {
  return s.config.iflas ? iflas(s, ctx, p) : konkordato(s, ctx, p);
}

// İflas: mülkler katsız ve ipoteksiz bankaya döner, kartlar desteye gider, oyuncu oyundan çıkar.
function iflas(s, ctx, p) {
  const pl = s.players[p];
  for (const q of R.propsOf(s, p)) {
    Object.assign(s.props[q], { owner: null, kat: 0, kacak: 0, ipotek: false, tedbir: 0 });
    if (s.props[q].park !== undefined) Object.assign(s.props[q], { park: false, avm: false }); // Mahalle
  }
  for (const ps of s.props) if (ps && ps.gk && ps.gk.p === p) ps.gk = null; // gecekonduları da gider
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

export function sellFloorAt(s, ctx, p, sq) {
  const ps = s.props[sq];
  let refund;
  // Mahalle: AVM'den kat satılırsa önce 4 katlı arsaya döner, bedeli geri gelmez.
  if (ps.avm) {
    ps.avm = false;
    return say(s, ctx, `${sqName(s, sq)} AVM olmaktan çıktı.`);
  }
  if (ps.kacak) {
    ps.kacak = 0;
    refund = R.round5(R.katValue(s, sq) / 4);
  } else {
    ps.kat--;
    refund = R.round5(R.katValue(s, sq) / 2);
  }
  transfer(s, ctx, null, p, refund, `Kat satışı: ${sqName(s, sq)}`);
}

export function mortgageAt(s, ctx, p, sq) {
  s.props[sq].ipotek = true;
  transfer(s, ctx, null, p, R.mortgageValue(s, sq), `İpotek: ${sqName(s, sq)}`);
}

export function autoLiquidate(s, ctx, p) {
  const byKat = (a, b) => R.katValue(s, a) - R.katValue(s, b);
  while (s.players[p].cash < 0) {
    const mine = R.propsOf(s, p);
    const kacak = mine.filter((q) => s.props[q].kacak).sort(byKat)[0];
    const kat = mine.filter((q) => s.props[q].kat > 0).sort(byKat)[0];
    const free = mine.filter((q) => !s.props[q].ipotek && !s.props[q].park && R.level(s.props[q]) === 0).sort((a, b) => R.price(s, a) - R.price(s, b))[0];
    if (kacak !== undefined) sellFloorAt(s, ctx, p, kacak);
    else if (kat !== undefined) sellFloorAt(s, ctx, p, kat);
    else if (free !== undefined) mortgageAt(s, ctx, p, free);
    else break;
  }
}

// ---------- açık artırma ----------

// Açık artırma (Monopoly gibi): reddedenden sonraki oyuncudan başlayıp sırayla herkes ya artırır ya çekilir;
// lider dışında herkes çekilince lider kazanır. Reddeden de katılır, nakdi olmayan katılamaz.
export const auctionStep = (s) => R.money(s, 10);

export function startAuction(s, ctx, sq, from) {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, k) => (from + 1 + k) % n).filter((i) => s.players[i].cash > 0);
  if (!order.length) return say(s, ctx, `${sqName(s, sq)} için teklif verebilecek kimse yok.`);
  s.pending = { type: 'auction', sq, order, out: [], high: 0, leader: null, turn: order[order.length - 1] };
  emit(s, ctx, { type: 'auctionStart', sq, text: `${sqName(s, sq)} açık artırmaya çıktı! Liste fiyatı ${R.fmt(R.price(s, sq))}.` });
  nextBidder(s, ctx);
}

// Sırayı lider olmayan, çekilmemiş sonraki oyuncuya verir; en düşük teklife nakdi yetmeyen kendiliğinden çekilir.
export function nextBidder(s, ctx) {
  const pd = s.pending;
  const min = pd.high + auctionStep(s);
  const at = pd.order.indexOf(pd.turn);
  for (let k = 1; k <= pd.order.length; k++) {
    const q = pd.order[(at + k) % pd.order.length];
    if (pd.out.includes(q) || q === pd.leader) continue;
    if (s.players[q].cash < min + R.evictCost(s, pd.sq, q)) {
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
    emit(s, ctx, { type: 'auction', sq: pd.sq, winner, high: 0, text: `Açık artırma bitti: teklif yok, ${sqName(s, pd.sq)} sahipsiz kaldı.` });
    return;
  }
  transfer(s, ctx, winner, null, pd.high, `İhale: ${sqName(s, pd.sq)}`, true);
  evict(s, ctx, winner, pd.sq);
  s.props[pd.sq].owner = winner;
  stat(s, winner, 'ihale');
  emit(s, ctx, { type: 'auction', sq: pd.sq, winner, high: pd.high, text: `Açık artırma bitti: ${sqName(s, pd.sq)} → ${nm(s, winner)} (${R.fmt(pd.high)}).` });
}
