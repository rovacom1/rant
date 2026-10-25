// Tahtadan hedef seçme: mülk hedefli kartlarda (Kamulaştırma, Tedbir, Müteahhit, Takas)
// hangi karelerin parlayacağını ve bir kareye tıklamanın ne yapacağını hesaplar. DOM yok.
import { CARDS, cardId, cardTargets } from '../engine/index.js';

const KINDS = ['opp-prop', 'self-prop', 'swap'];

export const isBoardPickable = (uid) => KINDS.includes(CARDS[cardId(uid)]?.target);

// Parlayacak kareler. Takasta önce kendi mülkün, sonra onunla değiştirilebilecek rakip mülkü.
export function pickSquares(v, uid, swapMine) {
  const id = cardId(uid);
  const targets = cardTargets(v, v.you, id);
  if (CARDS[id].target !== 'swap') return targets.map((t) => t.sq);
  if (swapMine !== null && targets.some((t) => t.mine === swapMine)) return targets.filter((t) => t.mine === swapMine).map((t) => t.theirs);
  return [...new Set(targets.map((t) => t.mine))];
}

// Kareye tıklama: { play: hedef } kartı oynar, { swapMine: kare } takasın ilk adımıdır, null geçersizdir.
export function pickClick(v, uid, swapMine, sq) {
  const id = cardId(uid);
  const targets = cardTargets(v, v.you, id);
  if (CARDS[id].target !== 'swap') {
    const t = targets.find((x) => x.sq === sq);
    return t ? { play: t } : null;
  }
  if (targets.some((t) => t.mine === sq)) return { swapMine: sq };
  const t = targets.find((x) => x.mine === swapMine && x.theirs === sq);
  return t ? { play: t } : null;
}
