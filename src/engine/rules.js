// State'ten türetilen değerler: fiyatlar, kiralar, inşaat kuralları, net değer.
// Buradaki fonksiyonlar state'i değiştirmez.

import { BOARD, GROUPS, GROUP_SQUARES, TRANSPORT_SQUARES, TRANSPORT_RENT, OWNABLE, HEDEF } from './data.js';

export const round5 = (x) => Math.round(x / 5) * 5;
export const fmt = (n) => `${n < 0 ? '-' : ''}${String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₺`;
export const money = (s, base) => round5((base * s.index) / 100);
export const cardId = (uid) => uid.split(':')[0];

const groupMult = (s, sq) => (BOARD[sq].group ? s.groupMult[BOARD[sq].group] || 1 : 1);

export function price(s, sq) {
  return round5(((BOARD[sq].price * s.index) / 100) * groupMult(s, sq));
}

// Yeni kat dikme bedeli (kampanya indirimi dahil).
export function katCost(s, sq) {
  const base = (GROUPS[BOARD[sq].group].kat * s.index) / 100;
  return round5(s.mods.kampanya ? base / 2 : base);
}

export const kacakCost = (s, sq) => round5(katCost(s, sq) / 2);

// Katın değer olarak karşılığı (kampanyadan etkilenmez).
export const katValue = (s, sq) => round5((GROUPS[BOARD[sq].group].kat * s.index) / 100);

export const mortgageValue = (s, sq) => round5(price(s, sq) / 2);
export const unmortgageCost = (s, sq) => round5(price(s, sq) * 0.55 * (s.mods.faizIndirimi ? 0.5 : 1));

export const level = (ps) => ps.kat + ps.kacak;

export function ownsGroup(s, p, group) {
  return GROUP_SQUARES[group].every((q) => s.props[q].owner === p);
}

export const inFullSet = (s, sq) => {
  const ps = s.props[sq];
  return BOARD[sq].kind === 'prop' && ps.owner !== null && ownsGroup(s, ps.owner, BOARD[sq].group);
};

export const propsOf = (s, p) => OWNABLE.filter((q) => s.props[q].owner === p);

export function transportCount(s, p) {
  return TRANSPORT_SQUARES.filter((q) => s.props[q].owner === p && !s.props[q].ipotek).length;
}

// Bu kareye gelen bir rakibin ödeyeceği kira (Kira Zammı hariç).
export function rentFor(s, sq) {
  const ps = s.props[sq];
  if (!ps || ps.owner === null || ps.ipotek || ps.tedbir > 0) return 0;
  const sqd = BOARD[sq];
  let base;
  let mult = 1;
  if (sqd.kind === 'transport') {
    base = TRANSPORT_RENT[transportCount(s, ps.owner)];
    if (s.mods.ulasimZam) mult *= 3;
  } else {
    const L = level(ps);
    base = L === 0 ? sqd.rents[0] * (ownsGroup(s, ps.owner, sqd.group) ? 2 : 1) : sqd.rents[L];
    mult *= groupMult(s, sq);
    if (s.mods.turizm && GROUPS[sqd.group].sahil) mult *= 2;
  }
  if (s.mods.kiraTavani) mult *= 0.5;
  if (s.mods.kiraArtisi) mult *= 1.5;
  return round5(((base * s.index) / 100) * mult);
}

// Engel varsa Türkçe sebep döndürür, yoksa null.
export function buildBlock(s, p, sq, kacak) {
  const sqd = BOARD[sq];
  const ps = s.props[sq];
  if (!ps || sqd.kind !== 'prop') return 'Buraya kat dikilemez.';
  if (ps.owner !== p) return 'Bu mülk senin değil.';
  if (s.mods.durgunluk) return 'Piyasa durgun: bu tur kat dikilemez.';
  if (ps.ipotek) return 'İpotekli mülke kat dikilemez.';
  if (ps.tedbir > 0) return 'Mülkte ihtiyati tedbir var.';
  if (level(ps) >= 4) return 'Bu mülk en üst seviyede.';
  if (kacak) {
    if (ps.kacak > 0) return 'Bir mülkte en fazla 1 kaçak kat olur.';
    if (s.players[p].cash < kacakCost(s, sq)) return 'Paran yetmiyor.';
    return null;
  }
  if (!ownsGroup(s, p, sqd.group)) return `Yasal kat için ${GROUPS[sqd.group].gen} tüm mülkleri gerekir.`;
  if (GROUP_SQUARES[sqd.group].some((q) => s.props[q].ipotek)) return 'Şehirde ipotekli mülk var.';
  if (s.players[p].cash < katCost(s, sq)) return 'Paran yetmiyor.';
  return null;
}

export function floorsOf(s, p) {
  let kat = 0;
  let kacak = 0;
  for (const q of propsOf(s, p)) {
    kat += s.props[q].kat;
    kacak += s.props[q].kacak;
  }
  return { kat, kacak };
}

export function netWorthParts(s, p) {
  let mulk = 0;
  let katlar = 0;
  for (const q of propsOf(s, p)) {
    const ps = s.props[q];
    mulk += ps.ipotek ? mortgageValue(s, q) : price(s, q);
    if (BOARD[q].kind === 'prop') katlar += ps.kat * katValue(s, q) + ps.kacak * round5(katValue(s, q) / 2);
  }
  return { nakit: s.players[p].cash, mulk, katlar };
}

export function netWorth(s, p) {
  const w = netWorthParts(s, p);
  return w.nakit + w.mulk + w.katlar;
}

export function hedefMet(s, p, hedefId) {
  const h = HEDEF[hedefId];
  if (!h) return false;
  const pl = s.players[p];
  const c = h.check;
  switch (c.type) {
    case 'group':
      return ownsGroup(s, p, c.group);
    case 'floors': {
      const f = floorsOf(s, p);
      return f.kat + f.kacak >= c.n;
    }
    case 'transport':
      return TRANSPORT_SQUARES.every((q) => s.props[q].owner === p);
    case 'mostCash':
      return s.players.every((o) => o.cash <= pl.cash);
    case 'props':
      return propsOf(s, p).length >= c.n;
    case 'kacak':
      return floorsOf(s, p).kacak >= c.n;
    case 'hukuk':
      return pl.stats.hukuk >= c.n;
    case 'ihale':
      return pl.stats.ihale >= c.n;
    case 'clean':
      return !pl.stats.mortgaged && pl.konkordato === 0 && propsOf(s, p).length >= c.n;
    default:
      return false;
  }
}

export function scoreOf(s, p) {
  const parts = netWorthParts(s, p);
  const pl = s.players[p];
  const hedefOk = pl.hedef ? hedefMet(s, p, pl.hedef) : false;
  const hedefBonus = hedefOk ? HEDEF[pl.hedef].bonus : 0;
  const ceza = pl.konkordato * s.config.konkordatoPenalty;
  return { ...parts, hedefOk, hedefBonus, ceza, total: parts.nakit + parts.mulk + parts.katlar + hedefBonus - ceza };
}

export function hasLiquidAssets(s, p) {
  return propsOf(s, p).some((q) => level(s.props[q]) > 0 || !s.props[q].ipotek);
}
