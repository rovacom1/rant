import { createGame, applyAction } from '../src/engine/index.js';
import { makePlayers } from '../tools/simlib.js';

// İlk oyuncunun sırası başlamış bir oyun.
export function started(n = 4, seed = 42, config = {}) {
  return createGame({ players: makePlayers(n), seed, config });
}

export const act = (s, p, a) => applyAction(s, p, a).state;
export const actEv = (s, p, a) => applyAction(s, p, a);

// Desteden belirli bir kartı oyuncunun eline taşır (kart sayısı korunur). uid döndürür.
export function give(s, p, id) {
  for (const pile of [s.deck, s.discard]) {
    const i = pile.findIndex((u) => u.startsWith(`${id}:`));
    if (i >= 0) {
      const [uid] = pile.splice(i, 1);
      s.players[p].hand.push(uid);
      return uid;
    }
  }
  for (const pl of s.players) {
    const i = pl.hand.findIndex((u) => u.startsWith(`${id}:`));
    if (i >= 0 && pl !== s.players[p]) {
      const [uid] = pl.hand.splice(i, 1);
      s.players[p].hand.push(uid);
      return uid;
    }
  }
  throw new Error(`kart bulunamadı: ${id}`);
}

// Oyuncunun elindeki belirli türdeki tüm kartları desteye geri koyar.
export function strip(s, p, id) {
  const hand = s.players[p].hand;
  for (let i = hand.length - 1; i >= 0; i--) if (hand[i].startsWith(`${id}:`)) s.deck.push(...hand.splice(i, 1));
}

export function own(s, p, ...squares) {
  for (const q of squares) s.props[q].owner = p;
}
