// Bot karar verici. Yalnız bir oyuncunun görebileceği bilgiyi kullanır:
// kendi eli + herkese açık tahta. Oyunun zarını değil kendi küçük üretecini kullanır.

import { BOARD, CARDS, GROUPS, GROUP_SQUARES, OWNABLE, MODE_SQUARES, AMOUNTS, MAHALLE } from './data.js';
import { nextRandom } from './rng.js';
import * as R from './rules.js';
import { boardOf, isMahalle } from './board.js';
import { pickOptions, lineOf } from './mahalle.js';
import { waitingFor, moveOptions, cardBlock, cardTargets, tradeBlock, hasCard, auctionStep } from './game.js';

const N = BOARD.length;

// Durumdan türeyen sabit bir "zar": aynı durumda bot hep aynı kararı verir (testler tekrarlanabilir).
function noise(s, seat, salt) {
  return nextRandom((s.seq * 7919 + seat * 104729 + salt * 31) >>> 0).value;
}

const cid = R.cardId;
const myCards = (s, p, id) => s.players[p].hand.filter((u) => cid(u) === id);

function reserve(s, p) {
  let maxRent = 0;
  for (const q of boardOf(s).ownable) {
    const o = s.props[q].owner;
    if (o !== null && o !== p) maxRent = Math.max(maxRent, R.rentFor(s, q));
  }
  return Math.min(R.money(s, 450), Math.max(R.money(s, 100), Math.round(maxRent * 0.6)));
}

// Bir mülkün bu oyuncu için değeri (fiyat x stratejik çarpan).
export function propValue(s, p, sq) {
  if (isMahalle(s)) return plotValue(s, p, sq);
  const sqd = BOARD[sq];
  let v = R.price(s, sq);
  if (sqd.kind === 'transport') {
    // Havalimanı kirası her yeni havalimanıyla ikiye katlanır, gar kirası doğrusal artar.
    const mine = MODE_SQUARES[sqd.mode].filter((q) => q !== sq && s.props[q].owner === p).length;
    const step = sqd.mode === 'air' ? 0.4 : 0.25;
    return v * (1.1 + step * mine);
  }
  const group = GROUP_SQUARES[sqd.group].filter((q) => q !== sq);
  const ownedByMe = group.filter((q) => s.props[q].owner === p).length;
  if (ownedByMe === group.length) v *= 2.1;
  else if (ownedByMe > 0) v *= 1.4;
  const owners = new Set(group.map((q) => s.props[q].owner));
  if (owners.size === 1 && !owners.has(null) && !owners.has(p)) v *= 1.35; // rakibin setini engeller
  return v;
}

function squareScore(s, p, sq, path) {
  const sqd = BOARD[sq];
  const pl = s.players[p];
  let score = 0;
  if (path.includes(0)) {
    if (!s.mods.grev) score += s.salary * 0.4;
    if (pl.hand.length < s.config.drawCap) score += 25; // geçince kart
  }
  switch (sqd.kind) {
    case 'prop':
    case 'transport': {
      const ps = s.props[sq];
      if (ps.owner === null) {
        const price = R.price(s, sq);
        score += pl.cash >= price ? propValue(s, p, sq) * 0.5 : 10;
      } else if (ps.owner !== p) {
        const rent = R.rentFor(s, sq) * (s.players[ps.owner].kiraZammi ? 2 : 1);
        score -= hasCard(s, p, 'dayi') ? rent * 0.3 : rent;
      }
      break;
    }
    case 'chance':
      score += 70;
      break;
    case 'surpriz':
      score += s.config.rules.surpriz ? 40 : 0;
      break;
    case 'tapu':
      score += OWNABLE.some((q) => s.props[q].owner === null && R.price(s, q) <= pl.cash) ? 60 : 30;
      break;
    case 'cay':
      score += R.money(s, AMOUNTS.cay) * (R.activePlayers(s).length - 1);
      break;
    case 'zabita':
      score += s.players.some((o, i) => i !== p && R.floorsOf(s, i).kacak > 0) ? 40 : 0;
      break;
    default:
  }
  return score;
}

function pathOf(from, steps, backward) {
  const path = [];
  let pos = from;
  for (let i = 0; i < steps; i++) {
    pos = (pos + (backward ? N - 1 : 1)) % N;
    path.push(pos);
  }
  return path;
}

function bestSteps(s, p, options, backward) {
  let best = options[0];
  let bestScore = -Infinity;
  for (const st of options) {
    const path = pathOf(s.players[p].pos, st, backward);
    const sc = squareScore(s, p, path[path.length - 1], backward ? [] : path);
    if (sc > bestScore) {
      bestScore = sc;
      best = st;
    }
  }
  return { steps: best, score: bestScore };
}

// Zar atınca beklenen skor (elde Kestirme varsa seçim hakkı dahil).
function expectedRollScore(s, p, backward = s.turn.backward) {
  const choice = hasCard(s, p, 'kestirme');
  let total = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) total += bestSteps(s, p, choice ? [a + b, a, b] : [a + b], backward).score;
  }
  return total / 36;
}

const CARD_KEEP = { kestirme: 50, itiraz: 90, dayi: 75, piyango: 150, aidat: 85, kamulastirma: 70, muteahhit: 80, taksi: 55, kiraZammi: 45, tedbir: 50, ihbar: 45, takas: 40, dava: 30, pazarlik: 45, geriVites: 10 };

function cardPlay(s, p) {
  const pl = s.players[p];
  const res = reserve(s, p);
  let best = null;
  const consider = (uid, target, value) => {
    if (value > 0 && (!best || value > best.value)) best = { uid, target, value };
  };
  for (const uid of pl.hand) {
    const id = cid(uid);
    const c = CARDS[id];
    if (c.type !== 'hamle' || c.when === 'preroll' || c.when === 'buy') continue;
    const targets = cardTargets(s, p, id);
    if (!targets.length) continue;
    switch (id) {
      case 'piyango':
        consider(uid, {}, R.money(s, AMOUNTS.piyango));
        break;
      case 'aidat':
        consider(uid, {}, R.money(s, AMOUNTS.aidat) * (R.activePlayers(s).length - 1));
        break;
      case 'kiraZammi': {
        const mine = R.propsOf(s, p);
        const potential = mine.reduce((m, q) => Math.max(m, R.rentFor(s, q)), 0);
        consider(uid, {}, potential >= R.money(s, 60) ? potential * 0.4 : 0);
        break;
      }
      case 'muteahhit':
        for (const t of targets) {
          const ps = s.props[t.sq];
          const gain = R.sqOf(s, t.sq).rents[R.level(ps) + 1] - R.sqOf(s, t.sq).rents[R.level(ps)];
          consider(uid, t, R.katValue(s, t.sq) * 0.6 + gain);
        }
        break;
      case 'kamulastirma':
        for (const t of targets) {
          const cost = R.price(s, t.sq);
          if (pl.cash - cost < res) continue;
          consider(uid, t, propValue(s, p, t.sq) - cost);
        }
        break;
      case 'takas':
        for (const t of targets) consider(uid, t, propValue(s, p, t.theirs) - propValue(s, p, t.mine) - 20);
        break;
      case 'tedbir':
        for (const t of targets) consider(uid, t, R.rentFor(s, t.sq) * 1.2 - R.money(s, 45));
        break;
      case 'ihbar':
        for (const t of targets) consider(uid, t, (R.floorsOf(s, t.player).kacak + R.gecekondular(s, t.player)) * R.money(s, 60));
        break;
      case 'dava': {
        const rich = targets.sort((a, b) => s.players[b.player].cash - s.players[a.player].cash)[0];
        if (pl.hand.length >= 5 || noise(s, p, 3) < 0.25) consider(uid, rich, 15);
        break;
      }
      default:
    }
  }
  return best && { type: 'playCard', uid: best.uid, target: best.target };
}

function buildPlan(s, p, level) {
  if (isMahalle(s)) return buildPlanM(s, p, level);
  const pl = s.players[p];
  const res = reserve(s, p);
  const mine = R.propsOf(s, p).filter((q) => BOARD[q].kind === 'prop');
  // Yasal kat: en pahalı şehirde en düşük seviyeli mülke.
  const legal = mine
    .filter((q) => !R.buildBlock(s, p, q, false) && pl.cash - R.katCost(s, q) >= res)
    .sort((a, b) => R.level(s.props[a]) - R.level(s.props[b]) || GROUPS[BOARD[b].group].kat - GROUPS[BOARD[a].group].kat);
  if (legal.length && !(level === 'kolay' && noise(s, p, 9) < 0.5)) return { type: 'build', sq: legal[0] };
  // Kaçak kat: biraz risk. Zor bot dikmez: zabıta ve ihbarla kaybettiği, kazandığından fazla (sim: 5 kişide %22 -> %29).
  const kacakCap = level === 'normal' ? 2 : 0;
  if (R.floorsOf(s, p).kacak < kacakCap && !s.mods.durgunluk) {
    const kacak = mine
      .filter((q) => !R.buildBlock(s, p, q, true) && pl.cash - R.kacakCost(s, q) >= res * 1.6)
      .sort((a, b) => BOARD[b].rents[1] - BOARD[a].rents[1]);
    if (kacak.length && noise(s, p, 5) < 0.55) return { type: 'buildKacak', sq: kacak[0] };
  }
  const mortgaged = R.propsOf(s, p).filter((q) => s.props[q].ipotek && pl.cash - R.unmortgageCost(s, q) >= res * 2);
  if (mortgaged.length) return { type: 'unmortgage', sq: mortgaged[0] };
  return null;
}

// Bir şehirde tek eksiği olan oyuncunun eksik, katsız parçası (yoksa null).
function lastPiece(s, p, g) {
  const missing = GROUP_SQUARES[g].filter((q) => s.props[q].owner !== p);
  if (missing.length !== 1 || GROUP_SQUARES[g].length < 2) return null;
  const q = missing[0];
  return s.props[q].owner !== null && R.level(s.props[q]) === 0 ? q : null;
}

// Monopoly'deki gibi iki tarafa da set tamamlatan takas: benim eksiğim onda, onun eksiği bende.
// Değer farkı nakitle kapatılır; karşı taraf kabul etmezse teklif yapılmaz.
function swapPlan(s, p) {
  const spare = s.players[p].cash - reserve(s, p);
  for (const g of Object.keys(GROUPS)) {
    const a = lastPiece(s, p, g);
    if (a === null) continue;
    const o = s.props[a].owner;
    for (const h of Object.keys(GROUPS)) {
      const b = h === g ? null : lastPiece(s, o, h);
      if (b === null || s.props[b].owner !== p) continue;
      const t = { to: o, give: { cash: 0, props: [b] }, take: { cash: 0, props: [a] } };
      const short = R.money(s, 25) - tradeValue(s, o, { from: p, ...t });
      if (short > 0) t.give.cash = Math.ceil(short / 5) * 5;
      if (t.give.cash <= Math.max(0, spare) && tradeValue(s, p, { from: p, ...t }) > 0 && !tradeBlock(s, p, t)) return t;
    }
  }
  return null;
}

// Önce karşılıklı set takası, sonra rakibin elindeki tek eksik parçayı nakitle almayı dene (turda bir kez). Kolay bot pazarlık önermez.
function tradePlan(s, p, level) {
  if (s.turn.trades || level === 'kolay') return null;
  if (isMahalle(s)) return tradePlanM(s, p);
  const swap = swapPlan(s, p);
  if (swap) return { type: 'proposeTrade', ...swap };
  const pl = s.players[p];
  for (const g of Object.keys(GROUPS)) {
    const qs = GROUP_SQUARES[g];
    const missing = qs.filter((q) => s.props[q].owner !== p);
    if (missing.length !== 1 || qs.length - missing.length < 1) continue;
    const q = missing[0];
    const owner = s.props[q].owner;
    if (owner === null || R.level(s.props[q]) > 0) continue;
    if (level === 'zor') {
      const t = sharpOffer(s, p, owner, q);
      if (t && !tradeBlock(s, p, t)) return { type: 'proposeTrade', ...t };
      continue;
    }
    const offer = R.round5(R.price(s, q) * 2.6);
    if (pl.cash - offer < reserve(s, p)) continue;
    const t = { to: owner, give: { cash: offer, props: [] }, take: { cash: 0, props: [q] } };
    if (!tradeBlock(s, p, t)) return { type: 'proposeTrade', ...t };
  }
  return null;
}

// Zor bot: karşı tarafın (bot ölçüsüyle) kabul edeceği en ucuz teklif. Önce yalnız para;
// yetmezse ya da daha ucuzsa başka şehirden katsız bir mülkünü de koyar.
function sharpOffer(s, p, owner, q) {
  const spare = s.players[p].cash - reserve(s, p);
  const swaps = [null, ...R.propsOf(s, p).filter((m) => BOARD[m].group !== BOARD[q].group && R.level(s.props[m]) === 0)];
  let best = null;
  for (const m of swaps) {
    const t = { to: owner, give: { cash: 0, props: m === null ? [] : [m] }, take: { cash: 0, props: [q] } };
    const short = R.money(s, 25) - tradeValue(s, owner, { from: p, ...t });
    t.give.cash = Math.max(0, Math.ceil(short / 5) * 5);
    const net = tradeValue(s, p, { from: p, ...t });
    if (t.give.cash <= spare && net > R.money(s, 20) && (!best || net > best.net)) best = { t, net };
  }
  return best && best.t;
}

// Teklif yetmiyorsa aynı takası eksik kalan farkı nakit olarak isteyerek geri gönderir (çok büyük farkta vazgeçer).
function counterOffer(s, p, pd, short) {
  const extra = Math.ceil(short / 5) * 5;
  if (extra > R.money(s, 200)) return null;
  const pay = pd.take.cash; // botun ödemesi istenen para önce azalır
  const t = {
    to: pd.from,
    give: { cash: Math.max(0, pay - extra), props: pd.take.props },
    take: { cash: pd.give.cash + Math.max(0, extra - pay), props: pd.give.props },
  };
  return tradeBlock(s, p, t) ? null : { type: 'tradeCounter', give: t.give, take: t.take };
}

function tradeValue(s, p, pd) {
  const getting = p === pd.to ? pd.give : pd.take;
  const giving = p === pd.to ? pd.take : pd.give;
  const other = p === pd.to ? pd.from : pd.to;
  let v = getting.cash - giving.cash;
  for (const q of getting.props) v += propValue(s, p, q);
  // Takas benim setimi de tamamlıyorsa rakibe set vermek ek ceza sayılmaz (karşılıklı set takası).
  if (isMahalle(s)) {
    for (const q of giving.props) v -= propValue(s, p, q);
    return v;
  }
  const mineToo = getting.props.some((q) => BOARD[q].group && GROUP_SQUARES[BOARD[q].group].every((x) => x === q || s.props[x].owner === p));
  for (const q of giving.props) {
    v -= propValue(s, p, q);
    // Rakibin setini tamamlatmak ekstra pahalı.
    const g = BOARD[q].group;
    if (!mineToo && g && GROUP_SQUARES[g].every((x) => x === q || s.props[x].owner === other)) v -= R.price(s, q) * 0.8;
  }
  return v;
}

function reactValue(s, p, pd) {
  const { id, target, by } = pd.card;
  const iAmVictim = p === pd.victim;
  let harm;
  switch (id) {
    case 'kamulastirma':
      harm = propValue(s, pd.victim, target.sq) - R.price(s, target.sq) + 40;
      break;
    case 'takas':
      harm = propValue(s, pd.victim, target.theirs) - propValue(s, pd.victim, target.mine) + 30;
      break;
    case 'tedbir':
      harm = R.rentFor(s, target.sq) * 1.5;
      break;
    case 'ihbar':
      harm = R.floorsOf(s, pd.victim).kacak * R.money(s, 70);
      break;
    case 'dava':
      harm = R.money(s, 50);
      break;
    case 'aidat':
      harm = R.money(s, AMOUNTS.aidat);
      break;
    default:
      harm = 50;
  }
  if (!iAmVictim) harm *= by === p ? 0.9 : 0;
  return harm;
}

// level: 'kolay' | 'normal' | 'zor' (docs/TASARIM.md 2. bölüm); verilmezse masa ayarı.
export function botAction(s, p, level = s.config.botLevel || 'normal') {
  if (!waitingFor(s).includes(p)) return null;
  const pl = s.players[p];
  const pd = s.pending;
  const res = reserve(s, p);
  if (pd) {
    switch (pd.type) {
      case 'buy': {
        if (isMahalle(s)) return buyM(s, p, pd, level);
        const price = R.price(s, pd.sq);
        const v = propValue(s, p, pd.sq);
        const [pazarlik] = myCards(s, p, 'pazarlik');
        if (pazarlik && !s.turn.hamle && pl.cash >= price / 2) return { type: 'playCard', uid: pazarlik };
        if (pl.cash >= price && (pl.cash - price >= res || (v >= price * 2 && level !== 'kolay'))) return { type: 'buy' };
        // İhale yoksa arsa bir daha kolay gelmez: yedeğin yarısı kalıyorsa al.
        if (!s.config.rules.ihale && pl.cash >= price && pl.cash - price >= res * 0.5) return { type: 'buy' };
        return { type: 'decline' };
      }
      case 'auction': {
        // Değerine ve yedeğine göre bir tavan; tavanı aşmadan kalan payın üçte biri kadar artırır, aşılınca çekilir.
        // Zor bot tavanını şaşmaz ve en az artışla gider; kolay bot erken çekilir.
        const sharp = level === 'zor';
        const v = propValue(s, p, pd.sq) * (sharp ? 0.9 : (level === 'kolay' ? 0.55 : 0.75) + noise(s, p, 1) * 0.3);
        const evict = R.evictCost(s, pd.sq, p);
        const cap = Math.min(v - evict, pl.cash - res * 0.5 - evict, pl.cash - evict);
        const min = pd.high + auctionStep(s);
        if (cap < min || v < R.price(s, pd.sq) * 0.25) return { type: 'pass' };
        const bid = sharp ? min : Math.min(Math.floor(cap / 5) * 5, Math.max(min, R.round5(pd.high + (cap - pd.high) / 3)));
        return bid >= min ? { type: 'raise', amount: bid } : { type: 'pass' };
      }
      case 'react': {
        const [itiraz] = myCards(s, p, 'itiraz');
        return { type: 'react', uid: itiraz && reactValue(s, p, pd) >= R.money(s, 45) ? itiraz : null };
      }
      case 'rent': {
        const [dayi] = myCards(s, p, 'dayi');
        return { type: 'react', uid: pd.amount >= R.money(s, 50) || pd.amount > pl.cash * 0.3 ? dayi : null };
      }
      case 'tapu': {
        const opts = OWNABLE.filter((q) => s.props[q].owner === null && pl.cash - R.price(s, q) >= res * 0.6).sort(
          (a, b) => propValue(s, p, b) - R.price(s, b) - (propValue(s, p, a) - R.price(s, a)),
        );
        return { type: 'tapuBuy', sq: opts.length ? opts[0] : null };
      }
      case 'zabita': {
        const target = [...pd.options].sort((a, b) => R.floorsOf(s, b).kacak - R.floorsOf(s, a).kacak || R.netWorth(s, b) - R.netWorth(s, a))[0];
        return { type: 'zabitaTarget', target };
      }
      case 'trade': {
        const val = tradeValue(s, p, pd);
        if (val >= R.money(s, 25)) return { type: 'tradeRespond', accept: true };
        const counter = level !== 'kolay' && (pd.counter || 0) < 2 && counterOffer(s, p, pd, R.money(s, 25) - val);
        return counter || { type: 'tradeRespond', accept: false };
      }
      case 'discard': {
        const sorted = [...pl.hand].sort((a, b) => CARD_KEEP[cid(a)] - CARD_KEEP[cid(b)]);
        return { type: 'discard', uids: sorted.slice(0, pd.count) };
      }
      default:
        return null;
    }
  }

  const step = s.turn.step;
  if (isMahalle(s) && (step === 'preroll' || step === 'choose')) return moveM(s, p);
  if (step === 'preroll') {
    const [taksi] = myCards(s, p, 'taksi');
    if (taksi && !s.turn.hamle) {
      const best = bestSteps(s, p, Array.from({ length: 12 }, (_, i) => i + 1), false);
      if (best.score > expectedRollScore(s, p) + 50) return { type: 'playCard', uid: taksi, target: { steps: best.steps } };
    }
    // Geri Vites: önde pahalı kiralar varsa ve geri yön belirgin daha iyiyse (maaş kaçsa da) geri gider.
    const [geri] = myCards(s, p, 'geriVites');
    if (geri && !s.turn.hamle && !s.turn.backward && expectedRollScore(s, p, true) > expectedRollScore(s, p, false) + 40) return { type: 'playCard', uid: geri };
    return { type: 'roll' };
  }
  if (step === 'choose') {
    const [a, b] = s.turn.dice;
    const best = bestSteps(s, p, [a + b, a, b], s.turn.backward);
    const sum = bestSteps(s, p, [a + b], s.turn.backward);
    const [kestirme] = myCards(s, p, 'kestirme');
    if (kestirme && best.steps !== a + b && best.score > sum.score + 30) return { type: 'playCard', uid: kestirme, target: { die: best.steps === a ? 0 : 1 } };
    return { type: 'move', steps: a + b };
  }
  if (pl.cash < 0) return R.hasLiquidAssets(s, p) ? { type: 'settleDebt' } : { type: 'endTurn' };
  // Kolay bot kartlarının yarısını oynamayı unutur.
  if (!s.turn.hamle && !(level === 'kolay' && noise(s, p, 7) < 0.5)) {
    const play = cardPlay(s, p);
    if (play && !cardBlock(s, p, cid(play.uid), play.target)) return play;
  }
  const build = buildPlan(s, p, level);
  if (build) return build;
  const trade = tradePlan(s, p, level);
  if (trade) return trade;
  return { type: 'endTurn' };
}

// ---------- Mahalle (docs/TASARIM.md §13) ----------

// Arsanın değeri: fiyat, komşu arsalarım (yasal kat, blok), tamamlanacak 2x2 site, rakibin bloğunu bozmak.
function plotValue(s, p, sq) {
  const B = boardOf(s);
  const adj = B.adj[sq];
  const mine = adj.filter((q) => s.props[q].owner === p).length;
  const free = adj.filter((q) => s.props[q].owner === null).length;
  let v = R.price(s, sq) * (1 + 0.3 * mine + 0.08 * free);
  if (B.blocks.some((b) => b.includes(sq) && b.every((q) => q === sq || s.props[q].owner === p))) v *= 1.3;
  const opp = adj.map((q) => s.props[q].owner).filter((o) => o !== null && o !== p);
  if (opp.length >= 2 && new Set(opp).size === 1) v *= 1.15;
  return v;
}

// Piyon bu arsadayken yapılabilecek inşaatın kabaca değeri (burada ve komşu arsalarımda).
function buildChance(s, p, sq) {
  if (s.players[p].cash < reserve(s, p) + R.money(s, 60)) return 0;
  let best = 0;
  for (const q of [sq, ...boardOf(s).adj[sq]]) {
    const ps = s.props[q];
    if (ps.owner !== p || ps.park || ps.ipotek) continue;
    if (ps.kat === 4 && !ps.avm) best = Math.max(best, 60);
    else if (R.level(ps) < 4 && R.ownNeighbors(s, p, q)) best = Math.max(best, 25 + 10 * R.level(ps));
    if (R.level(ps) === 0 && boardOf(s).blocks.some((b) => b.includes(q) && b.every((x) => s.props[x].owner === p && !s.props[x].park))) best = Math.max(best, 90);
  }
  return best;
}

// Bu arsaya inmenin değeri: sahipsizse alma (ya da gecekondu), rakibinse kira, benimse inşaat imkanı.
function plotScore(s, p, sq) {
  const pl = s.players[p];
  const ps = s.props[sq];
  if (ps.owner === null) {
    if (pl.cash >= R.price(s, sq) + R.evictCost(s, sq, p)) return propValue(s, p, sq) * 0.5;
    return R.gecekonduBlock(s, p, sq) ? 5 : 20;
  }
  if (ps.owner !== p) {
    const rent = R.rentFor(s, sq) * (s.players[ps.owner].kiraZammi ? 2 : 1);
    return -(hasCard(s, p, 'dayi') ? rent * 0.3 : rent);
  }
  return buildChance(s, p, sq);
}

const scoresOf = (s, p) => boardOf(s).ownable.map((q) => plotScore(s, p, q));
// Bu zarlarla gidilebilecek en iyi arsa ve değeri (çiftte kart da gelir).
function bestPick(s, p, sc, dice) {
  let sq = null;
  let score = -Infinity;
  for (const q of pickOptions(dice)) {
    if (sc[q] > score) {
      score = sc[q];
      sq = q;
    }
  }
  const card = dice[0] === dice[1] && s.players[p].hand.length < s.config.drawCap ? 25 : 0;
  return { sq, score: score + card };
}

function expectedPick(s, p, sc) {
  let total = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) total += bestPick(s, p, sc, [a, b]).score;
  return total / 36;
}

// Zar öncesi Taksi ve Geri Vites, zar sonrası Torpil, Kestirme ve arsa seçimi.
function moveM(s, p) {
  const pl = s.players[p];
  const sc = scoresOf(s, p);
  if (s.turn.step === 'preroll') {
    if (!s.turn.hamle && pl.pos !== null) {
      const exp = expectedPick(s, p, sc);
      const [taksi] = myCards(s, p, 'taksi');
      if (taksi) {
        const best = lineOf(pl.pos).reduce((a, b) => (sc[b] > sc[a] ? b : a));
        if (sc[best] > exp + 50) return { type: 'playCard', uid: taksi, target: { sq: best } };
      }
      const [geri] = myCards(s, p, 'geriVites');
      if (geri && pl.prev !== null && sc[pl.prev] > exp + 40) return { type: 'playCard', uid: geri };
    }
    return { type: 'roll' };
  }
  const dice = s.turn.dice;
  const now = bestPick(s, p, sc, dice);
  if (pl.torpil > 0 && !s.turn.torpil) {
    let best = null;
    for (const die of [0, 1]) {
      for (const delta of [-1, 1]) {
        const v = dice[die] + delta;
        if (v < 1 || v > 6) continue;
        const d = [...dice];
        d[die] = v;
        const gain = bestPick(s, p, sc, d).score - now.score;
        if (!best || gain > best.gain) best = { die, delta, gain };
      }
    }
    const need = pl.torpil >= MAHALLE.torpilMax ? 25 : 60;
    if (best && best.gain > need) return { type: 'torpil', die: best.die, delta: best.delta };
  }
  const [kestirme] = myCards(s, p, 'kestirme');
  if (kestirme && !s.turn.hamle) {
    let best = null;
    for (const die of [0, 1]) {
      let total = 0;
      for (let v = 1; v <= 6; v++) {
        const d = [...dice];
        d[die] = v;
        total += bestPick(s, p, sc, d).score;
      }
      const gain = total / 6 - now.score;
      if (!best || gain > best.gain) best = { die, gain };
    }
    if (best.gain > 50) return { type: 'playCard', uid: kestirme, target: { die: best.die } };
  }
  return { type: 'pick', sq: now.sq };
}

function buyM(s, p, pd, level) {
  const pl = s.players[p];
  const res = reserve(s, p);
  const cost = R.price(s, pd.sq) + R.evictCost(s, pd.sq, p);
  const v = propValue(s, p, pd.sq);
  const [pazarlik] = myCards(s, p, 'pazarlik');
  if (pazarlik && !s.turn.hamle && !cardBlock(s, p, 'pazarlik')) return { type: 'playCard', uid: pazarlik };
  if (pl.cash >= cost && (pl.cash - cost >= res || (v >= cost * 2 && level !== 'kolay'))) return { type: 'buy' };
  if (!s.config.rules.ihale && pl.cash >= cost && pl.cash - cost >= res * 0.5) return { type: 'buy' };
  // Almıyorsa gecekondu kondurur (komşuları kendi arsalarıysa kendi kirasını düşürmesin diye kondurmaz).
  if (!R.gecekonduBlock(s, p, pd.sq) && R.ownNeighbors(s, p, pd.sq) < 2 && !(level === 'kolay' && noise(s, p, 11) < 0.5)) return { type: 'gecekondu' };
  return { type: 'decline' };
}

function buildPlanM(s, p, level) {
  const pl = s.players[p];
  const res = reserve(s, p);
  if (pl.pos === null) return null;
  const B = boardOf(s);
  const spot = [pl.pos, ...B.adj[pl.pos]].filter((q) => s.props[q].owner === p);
  const afford = (q) => pl.cash - R.katCost(s, q) >= res;
  // AVM: çevresinde rakip arsaları varsa.
  for (const q of spot) {
    const oppRing = B.ring[q].filter((x) => s.props[x].owner !== null && s.props[x].owner !== p).length;
    if (!R.avmBlock(s, p, q) && afford(q) && oppRing >= 2) return { type: 'avm', sq: q };
  }
  // Park: komşu kiralarımın yarısı (rakip komşulara gidenin bir kısmı düşülür) bu arsaya kat dikmekten iyiyse.
  const gain = (q) => R.sqOf(s, q).rents[R.level(s.props[q]) + 1] - R.sqOf(s, q).rents[R.level(s.props[q])];
  if (level !== 'kolay') {
    for (const q of spot) {
      if (R.parkBlock(s, p, q) || !afford(q)) continue;
      // Site olabilecek bloğu (rakip arsası ve park yok) bozmaz.
      const siteHope = (b) => b.includes(q) && b.every((x) => x === q || ((s.props[x].owner === null || s.props[x].owner === p) && !s.props[x].park));
      if (B.blocks.some(siteHope)) continue;
      let v = 0;
      for (const x of B.adj[q]) {
        const o = s.props[x].owner;
        if (o === p) v += R.rentFor(s, x) * 0.5;
        else if (o !== null) v -= R.rentFor(s, x) * 0.25;
      }
      if (v > Math.max(R.money(s, 40), gain(q) * 1.5)) return { type: 'park', sq: q };
    }
  }
  // Yasal kat: önce siteyi tamamlayan katsız arsa, sonra düşük seviyeli, sonra kira artışı büyük olan.
  const siteGap = (q) => (R.level(s.props[q]) === 0 && B.blocks.some((b) => b.includes(q) && b.every((x) => s.props[x].owner === p && !s.props[x].park)) ? 0 : 1);
  const legal = spot.filter((q) => !R.buildBlock(s, p, q, false) && afford(q)).sort((a, b) => siteGap(a) - siteGap(b) || R.level(s.props[a]) - R.level(s.props[b]) || gain(b) - gain(a));
  if (legal.length && !(level === 'kolay' && noise(s, p, 9) < 0.5)) return { type: 'build', sq: legal[0] };
  const kacakCap = level === 'normal' ? 2 : 0;
  if (R.floorsOf(s, p).kacak < kacakCap && !s.mods.durgunluk) {
    const kacak = spot.filter((q) => !R.buildBlock(s, p, q, true) && pl.cash - R.kacakCost(s, q) >= res * 1.6).sort((a, b) => R.sqOf(s, b).rents[1] - R.sqOf(s, a).rents[1]);
    if (kacak.length && noise(s, p, 5) < 0.55) return { type: 'buildKacak', sq: kacak[0] };
  }
  const mortgaged = R.propsOf(s, p).filter((q) => s.props[q].ipotek && pl.cash - R.unmortgageCost(s, q) >= res * 2);
  if (mortgaged.length) return { type: 'unmortgage', sq: mortgaged[0] };
  return null;
}

// Rakibin, iki komşusu benim olan katsız arsasını nakitle almayı dener (turda bir kez).
function tradePlanM(s, p) {
  const pl = s.players[p];
  for (const q of boardOf(s).ownable) {
    const ps = s.props[q];
    if (ps.owner === null || ps.owner === p || R.level(ps) > 0 || ps.park || R.ownNeighbors(s, p, q) < 2) continue;
    const offer = R.round5(R.price(s, q) * 2.2);
    if (pl.cash - offer < reserve(s, p)) continue;
    const t = { to: ps.owner, give: { cash: offer, props: [] }, take: { cash: 0, props: [q] } };
    if (!tradeBlock(s, p, t)) return { type: 'proposeTrade', ...t };
  }
  return null;
}
