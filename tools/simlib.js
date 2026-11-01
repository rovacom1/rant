// Botlarla tam oyun oynatır ve her adımda tutarlılık denetimi yapar.
// Hem testler (test/sim.test.js, test/mahalle.test.js) hem denge raporu (tools/sim.js) kullanır.

import { createGame, applyAction, waitingFor, botAction, cardId, ownsGroup, inSite, gecekondular, boardOf, isMahalle, CARDS, GROUPS, MAHALLE, AVATARS, PLAYER_COLORS, BOT_NAMES } from '../src/engine/index.js';

const TOTAL_CARDS = Object.values(CARDS).reduce((a, c) => a + c.count, 0);

// Desteler oyun türüne göre değişir (Mahalle'de Ulaşıma Zam yok): beklenen sayılar oyunun başındaki durumdan alınır.
export const deckTotals = (s) => ({ cards: TOTAL_CARDS, gundem: s.gundemDeck.length + s.gundemDiscard.length });

export function checkInvariants(s, totals = deckTotals(s)) {
  const errs = [];
  const B = boardOf(s);
  for (const pl of s.players) if (!Number.isInteger(pl.cash)) errs.push(`tam sayı olmayan nakit: ${pl.name} ${pl.cash}`);
  s.props.forEach((ps, q) => {
    if (!ps) return;
    if (ps.kat < 0 || ps.kacak < 0 || ps.kacak > 1 || ps.kat + ps.kacak > 4) errs.push(`seviye hatası kare ${q}`);
    if (ps.owner === null && (ps.kat || ps.kacak || ps.ipotek)) errs.push(`sahipsiz mülkte kat/ipotek kare ${q}`);
    if (ps.ipotek && ps.kat + ps.kacak > 0) errs.push(`ipotekli mülkte kat kare ${q}`);
    if (B.squares[q].kind === 'transport' && ps.kat + ps.kacak > 0) errs.push(`ulaşımda kat kare ${q}`);
    if (ps.park && (ps.owner === null || ps.kat + ps.kacak > 0 || ps.ipotek)) errs.push(`park hatası kare ${q}`);
    if (ps.avm && (ps.owner === null || ps.kat !== 4 || ps.kacak)) errs.push(`AVM hatası kare ${q}`);
    if (ps.gk && ps.owner !== null) errs.push(`sahipli arsada gecekondu kare ${q}`);
  });
  if (isMahalle(s)) {
    s.players.forEach((pl, p) => {
      if (gecekondular(s, p) > MAHALLE.gecekonduMax) errs.push(`gecekondu sınırı aşıldı: ${pl.name}`);
      if (!(pl.torpil >= 0 && pl.torpil <= MAHALLE.torpilMax)) errs.push(`torpil hatası: ${pl.name} ${pl.torpil}`);
      if (pl.pos !== null && !B.ownable.includes(pl.pos)) errs.push(`piyon arazinin dışında: ${pl.name}`);
    });
  }
  const cards = s.deck.length + s.discard.length + s.players.reduce((a, p) => a + p.hand.length, 0);
  if (cards !== totals.cards) errs.push(`kart sayısı ${cards} != ${totals.cards}`);
  const g = s.gundemDeck.length + s.gundemDiscard.length;
  if (g !== totals.gundem) errs.push(`gündem sayısı ${g} != ${totals.gundem}`);
  if (s.phase !== 'over' && waitingFor(s).length === 0) errs.push('kimse beklenmiyor ama oyun bitmedi');
  return errs;
}

export function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `bot${i}`, name: BOT_NAMES[i], avatar: AVATARS[i], color: PLAYER_COLORS[i], bot: true }));
}

// levels: koltuk başına bot seviyesi (verilmeyen koltuk masa ayarını kullanır). config.mode: oyun türü (klasik | mahalle).
export function playBotGame(seed, nPlayers = 5, config = {}, levels = [], maxActions = 30000) {
  const { mode = 'klasik', ...cfg } = config;
  let s = createGame({ players: makePlayers(nPlayers), seed, config: cfg, mode });
  const totals = deckTotals(s);
  const counts = { actions: 0, cards: {}, trades: 0, tradesAccepted: 0, kacak: 0, builds: 0, auctions: 0, konkordato: 0, rentTotal: 0, rentMax: 0, rentCount: 0, drawn: 0, salary: 0, turns: 0, dupTurns: 0, setless: 0, gecekondu: 0, park: 0, avm: 0, torpil: 0, tahliye: 0, avmPay: 0 };
  let lastTurn = null;
  while (s.phase !== 'over') {
    if (counts.actions++ > maxActions) throw new Error(`oyun bitmedi (tohum ${seed})`);
    const seat = waitingFor(s)[0];
    const action = botAction(s, seat, levels[seat]);
    if (!action) throw new Error(`bot hamle bulamadı (tohum ${seed}, ${JSON.stringify(s.pending)})`);
    let res;
    try {
      res = applyAction(s, seat, action);
    } catch (e) {
      throw new Error(`geçersiz bot hamlesi (tohum ${seed}): ${JSON.stringify(action)} → ${e.message}`);
    }
    s = res.state;
    for (const ev of res.events) {
      if (ev.type === 'card') counts.cards[ev.card] = (counts.cards[ev.card] || 0) + 1;
      if (ev.type === 'draw') counts.drawn += ev.n;
      if (ev.type === 'money' && (ev.why === 'Maaş' || ev.why === 'Hakediş')) counts.salary += ev.amount;
      if (ev.type === 'tradeDone') counts.tradesAccepted++;
      if (ev.type === 'trade') counts.trades++;
      if (ev.type === 'build') ev.kacak ? counts.kacak++ : counts.builds++;
      if (ev.type === 'auction' && ev.winner !== null) counts.auctions++;
      if (ev.type === 'konkordato') counts.konkordato++;
      if (ev.type === 'gecekondu' || ev.type === 'park' || ev.type === 'avm' || ev.type === 'torpil') counts[ev.type]++;
      if (ev.type === 'money' && ev.why.startsWith('Tahliye')) counts.tahliye++;
      if (ev.type === 'money' && ev.why.startsWith('AVM payı')) counts.avmPay++;
      if (ev.type === 'money' && ev.why.startsWith('Kira')) {
        counts.rentTotal += ev.amount;
        counts.rentCount++;
        counts.rentMax = Math.max(counts.rentMax, ev.amount);
      }
    }
    if (s.turn && s.turn !== lastTurn && s.phase !== 'over') {
      lastTurn = s.turn;
      counts.turns++;
      const ids = s.players[s.turn.p].hand.map(cardId);
      if (new Set(ids).size < ids.length) counts.dupTurns++;
    }
    const errs = checkInvariants(s, totals);
    if (errs.length) throw new Error(`tutarlılık hatası (tohum ${seed}, hamle ${JSON.stringify(action)}): ${errs.join('; ')}`);
  }
  // Seti olmayan oyuncu; Mahalle'de sitesi olmayan.
  const hasSet = (p) => (isMahalle(s) ? boardOf(s).ownable.some((q) => s.props[q].owner === p && inSite(s, q)) : Object.keys(GROUPS).some((g) => ownsGroup(s, p, g)));
  counts.setless = s.players.filter((_, p) => !hasSet(p)).length;
  return { state: s, counts };
}
