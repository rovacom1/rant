// Botlarla tam oyun oynatır ve her adımda tutarlılık denetimi yapar.
// Hem testler (test/sim.test.js) hem denge raporu (tools/sim.js) kullanır.

import { createGame, applyAction, waitingFor, botAction, CARDS, GUNDEM, BOARD, AVATARS, PLAYER_COLORS, BOT_NAMES } from '../src/engine/index.js';

const TOTAL_CARDS = Object.values(CARDS).reduce((a, c) => a + c.count, 0);
const TOTAL_GUNDEM = Object.values(GUNDEM).reduce((a, c) => a + c.count, 0);

export function checkInvariants(s) {
  const errs = [];
  for (const pl of s.players) if (!Number.isInteger(pl.cash)) errs.push(`tam sayı olmayan nakit: ${pl.name} ${pl.cash}`);
  s.props.forEach((ps, q) => {
    if (!ps) return;
    if (ps.kat < 0 || ps.kacak < 0 || ps.kacak > 1 || ps.kat + ps.kacak > 4) errs.push(`seviye hatası kare ${q}`);
    if (ps.owner === null && (ps.kat || ps.kacak || ps.ipotek)) errs.push(`sahipsiz mülkte kat/ipotek kare ${q}`);
    if (ps.ipotek && ps.kat + ps.kacak > 0) errs.push(`ipotekli mülkte kat kare ${q}`);
    if (BOARD[q].kind === 'transport' && ps.kat + ps.kacak > 0) errs.push(`ulaşımda kat kare ${q}`);
  });
  const cards = s.deck.length + s.discard.length + s.players.reduce((a, p) => a + p.hand.length, 0);
  if (cards !== TOTAL_CARDS) errs.push(`kart sayısı ${cards} != ${TOTAL_CARDS}`);
  const g = s.gundemDeck.length + s.gundemDiscard.length;
  if (g !== TOTAL_GUNDEM) errs.push(`gündem sayısı ${g} != ${TOTAL_GUNDEM}`);
  if (s.phase !== 'over' && waitingFor(s).length === 0) errs.push('kimse beklenmiyor ama oyun bitmedi');
  return errs;
}

export function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `bot${i}`, name: BOT_NAMES[i], avatar: AVATARS[i], color: PLAYER_COLORS[i], bot: true }));
}

export function playBotGame(seed, nPlayers = 5, config = {}, maxActions = 30000) {
  let s = createGame({ players: makePlayers(nPlayers), seed, config });
  const counts = { actions: 0, cards: {}, trades: 0, tradesAccepted: 0, kacak: 0, builds: 0, auctions: 0, konkordato: 0, rentTotal: 0, rentMax: 0, rentCount: 0 };
  while (s.phase !== 'over') {
    if (counts.actions++ > maxActions) throw new Error(`oyun bitmedi (tohum ${seed})`);
    const seat = waitingFor(s)[0];
    const action = botAction(s, seat);
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
      if (ev.type === 'tradeDone') counts.tradesAccepted++;
      if (ev.type === 'trade') counts.trades++;
      if (ev.type === 'build') ev.kacak ? counts.kacak++ : counts.builds++;
      if (ev.type === 'auction' && ev.winner !== null) counts.auctions++;
      if (ev.type === 'konkordato') counts.konkordato++;
      if (ev.type === 'money' && ev.why.startsWith('Kira')) {
        counts.rentTotal += ev.amount;
        counts.rentCount++;
        counts.rentMax = Math.max(counts.rentMax, ev.amount);
      }
    }
    const errs = checkInvariants(s);
    if (errs.length) throw new Error(`tutarlılık hatası (tohum ${seed}, hamle ${JSON.stringify(action)}): ${errs.join('; ')}`);
  }
  return { state: s, counts };
}
