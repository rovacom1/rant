// Bot karar verici. Yalnız bir oyuncunun görebileceği bilgiyi kullanır:
// kendi eli + herkese açık tahta. Oyunun zarını değil kendi küçük üretecini kullanır.

import { BOARD, CARDS, GROUPS, GROUP_SQUARES, OWNABLE, MODE_SQUARES, AMOUNTS } from './data.js';
import { nextRandom } from './rng.js';
import * as R from './rules.js';
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
  for (const q of OWNABLE) {
    const o = s.props[q].owner;
    if (o !== null && o !== p) maxRent = Math.max(maxRent, R.rentFor(s, q));
  }
  return Math.min(R.money(s, 450), Math.max(R.money(s, 100), Math.round(maxRent * 0.6)));
}

// Bir mülkün bu oyuncu için değeri (fiyat x stratejik çarpan).
export function propValue(s, p, sq) {
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
  if (path.includes(0) && !s.mods.grev) score += s.salary * 0.4;
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

const CARD_KEEP = { kestirme: 50, itiraz: 90, dayi: 75, piyango: 150, kredi: 35, aidat: 85, kamulastirma: 70, muteahhit: 80, taksi: 55, kiraZammi: 45, tedbir: 50, ihbar: 45, takas: 40, dava: 30, pazarlik: 45, geriVites: 10 };

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
      case 'kredi':
        // Faizi net değerden düşer; yalnız nakit yedeğin altındayken ve borç oyun bitmeden ödenecekse.
        if (pl.cash < res && s.round + 2 <= s.config.maxRounds) consider(uid, {}, 30);
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
          const gain = BOARD[t.sq].rents[R.level(ps) + 1] - BOARD[t.sq].rents[R.level(ps)];
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
        for (const t of targets) consider(uid, t, R.floorsOf(s, t.player).kacak * R.money(s, 60));
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

// Rakibin elindeki tek eksik parçayı nakitle almayı dene (turda bir kez). Kolay bot pazarlık önermez.
function tradePlan(s, p, level) {
  if (s.turn.trades || level === 'kolay') return null;
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
    const offer = R.round5(R.price(s, q) * 2.3);
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

function tradeValue(s, p, pd) {
  const getting = p === pd.to ? pd.give : pd.take;
  const giving = p === pd.to ? pd.take : pd.give;
  const other = p === pd.to ? pd.from : pd.to;
  let v = getting.cash - giving.cash;
  for (const q of getting.props) v += propValue(s, p, q);
  for (const q of giving.props) {
    v -= propValue(s, p, q);
    // Rakibin setini tamamlatmak ekstra pahalı.
    const g = BOARD[q].group;
    if (g && GROUP_SQUARES[g].every((x) => x === q || s.props[x].owner === other)) v -= R.price(s, q) * 0.8;
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
        const cap = Math.min(v, pl.cash - res * 0.5, pl.cash);
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
      case 'trade':
        return { type: 'tradeRespond', accept: tradeValue(s, p, pd) >= R.money(s, 25) };
      case 'discard': {
        const sorted = [...pl.hand].sort((a, b) => CARD_KEEP[cid(a)] - CARD_KEEP[cid(b)]);
        return { type: 'discard', uids: sorted.slice(0, pd.count) };
      }
      default:
        return null;
    }
  }

  const step = s.turn.step;
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
