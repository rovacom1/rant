// Tahtadan hedef seçme: mülk hedefli kartlarda (Kamulaştırma, Tedbir, Müteahhit, Takas)
// hangi karelerin parlayacağını ve bir kareye tıklamanın ne yapacağını hesaplar. DOM yok.
import { CARDS, OWNABLE, cardId, cardTargets, price, isMahalle } from '../engine/index.js';

const KINDS = ['opp-prop', 'self-prop', 'swap'];

// Mahalle'de Taksi de tahtadan seçilir: piyonun satırındaki ya da sütunundaki bir arsa.
export const isBoardPickable = (uid, v) => KINDS.includes(CARDS[cardId(uid)]?.target) || (!!v && isMahalle(v) && cardId(uid) === 'taksi');

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

// Tapu Dairesi sırası sendeyse parana yeten sahipsiz kareler parlar; değilse null.
export function tapuSquares(v) {
  const pd = v.pending;
  if (!pd || pd.type !== 'tapu' || pd.p !== v.you) return null;
  const cash = v.players[v.you].cash;
  return OWNABLE.filter((q) => v.props[q].owner === null && price(v, q) <= cash);
}

// Kaldır-bırak: elden sürüklenen kartın bırakılabileceği hedefler. Kartın üstüne bırakıldığı kare ya da oyuncu kartı o
// hedefle oynatır. squares: kare -> hamle hedefi ({ swapMine } takasın ilk adımı), players: oyuncu -> hedef.
// dest(n, geri): piyonun n kare ötesindeki kare (Taksi ve Kestirme klasik tahtada gidilecek kareye bırakılır).
export function dropTargets(v, uid, dest) {
  const id = cardId(uid);
  const squares = new Map();
  const players = new Map();
  const targets = cardTargets(v, v.you, id);
  if (isBoardPickable(uid, v)) {
    if (CARDS[id].target === 'swap') for (const q of pickSquares(v, uid, null)) squares.set(q, { swapMine: q });
    else for (const t of targets) if (t.sq !== undefined) squares.set(t.sq, t);
  } else if (!isMahalle(v) && CARDS[id].target === 'steps') {
    for (const t of targets) squares.set(dest(t.steps, false), t);
  } else if (!isMahalle(v) && CARDS[id].target === 'die' && v.turn?.dice) {
    for (const t of targets) if (!squares.has(dest(v.turn.dice[t.die], v.turn.backward))) squares.set(dest(v.turn.dice[t.die], v.turn.backward), t);
  } else if (CARDS[id].target === 'opp-player') {
    // oyuncunun satırı ya da piyonunun durduğu kare (karede tek hedef varsa)
    for (const t of targets) players.set(t.player, t);
    const at = new Map();
    for (const t of targets) {
      const q = v.players[t.player].pos;
      if (q !== null && q !== undefined) at.set(q, at.has(q) ? null : t);
    }
    for (const [q, t] of at) if (t) squares.set(q, t);
  }
  return { squares, players };
}
