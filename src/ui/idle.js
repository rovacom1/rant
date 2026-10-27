// Sıradaki oyuncunun şu an ne yapabileceği (saf, DOM yok): kart oynanabilir mi, serbest evrede yapacak bir şey kaldı mı.
import * as E from '../engine/index.js';

const { CARDS, cardId } = E;

// Elimdeki kart şu an oynanabilir mi (zamanı ve hedefi var mı).
export function canPlay(v, uid) {
  const id = cardId(uid);
  const c = CARDS[id];
  if (!c || c.type !== 'hamle' || v.phase !== 'play' || !v.turn || v.turn.p !== v.you || v.turn.hamle) return false;
  const pd = v.pending;
  if (c.when === 'buy') {
    if (!(pd && pd.type === 'buy' && pd.p === v.you)) return false;
  } else {
    if (pd) return false;
    if (c.when === 'preroll' && v.turn.step !== 'preroll') return false;
    if (c.when === 'choose' && v.turn.step !== 'choose') return false;
    if (!c.when && !['preroll', 'free'].includes(v.turn.step)) return false;
  }
  return E.cardTargets(v, v.you, id).length > 0;
}

// Turu kendiliğinden bitirmek güvenli mi: sıra bende, serbest evre, borç yok ve yapabileceğim hiçbir şey yok
// (oynanabilir kart, dikilebilir yasal ya da kaçak kat, kaldırılabilir ipotek). Emin değilse false (bitirmez).
export const AUTO_END_MS = 3000;

export function idleTurn(v) {
  const me = v && v.you;
  if (!v || me < 0 || v.phase !== 'play' || v.pending || !v.turn || v.turn.p !== me || v.turn.step !== 'free') return false;
  const pl = v.players[me];
  if (!pl || pl.out || pl.cash < 0) return false;
  if (pl.hand.length > v.config.handLimit) return false;
  if (!v.turn.hamle && pl.hand.some((u) => canPlay(v, u))) return false;
  for (const q of E.propsOf(v, me)) {
    if (!E.buildBlock(v, me, q, false) || !E.buildBlock(v, me, q, true)) return false;
    if (v.props[q].ipotek && pl.cash >= E.unmortgageCost(v, q)) return false;
  }
  return true;
}
