// State'ten türetilen değerler: fiyatlar, kiralar, inşaat kuralları, net değer.
// Buradaki fonksiyonlar state'i değiştirmez.

import { BOARD, GROUPS, GROUP_SQUARES, MODE_SQUARES, TRANSPORT_RENT, OWNABLE } from './data.js';

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
// İflas modunda kira çarpanı her tur iflasKira kadar artar (1. tur 1, 10. tur 4,6 kat), oyun sonsuza uzamasın diye.
export const iflasMult = (s) => (s.config.iflas ? 1 + Math.max(0, s.round - 1) * s.config.iflasKira : 1);
// Oyunda kalan oyuncular (iflas modunda elenenler çıkar).
export const activePlayers = (s) => s.players.map((_, i) => i).filter((i) => !s.players[i].out);

// Oyuncunun bu türden (air | rail) ipoteksiz ulaşım sayısı.
export function transportCount(s, p, mode) {
  return MODE_SQUARES[mode].filter((q) => s.props[q].owner === p && !s.props[q].ipotek).length;
}

// Bu kareye gelen bir rakibin ödeyeceği kira (Kira Zammı hariç).
export function rentFor(s, sq) {
  const ps = s.props[sq];
  if (!ps || ps.owner === null || ps.ipotek || ps.tedbir > 0) return 0;
  const sqd = BOARD[sq];
  let base;
  let mult = 1;
  if (sqd.kind === 'transport') {
    base = TRANSPORT_RENT[sqd.mode][transportCount(s, ps.owner, sqd.mode)];
    if (s.mods.ulasimZam) mult *= 2;
  } else {
    const L = level(ps);
    // Tam sette arsa kirası 2 katı; set tamamlanmamışsa katların kirası yarıdır (Monopoly'de ev yalnız tam sette dikilir).
    const full = ownsGroup(s, ps.owner, sqd.group);
    base = L === 0 ? sqd.rents[0] * (full ? 2 : 1) : sqd.rents[L] * (full ? 1 : 0.5);
    mult *= groupMult(s, sq);
    if (s.mods.turizm && GROUPS[sqd.group].sahil) mult *= 2;
  }
  if (s.mods.kiraTavani) mult *= 0.5;
  if (s.mods.kiraArtisi) mult *= 1.5;
  mult *= iflasMult(s);
  // Para 5'e yuvarlanır; Monopoly'nin 2-4 ₺'lik kiraları sıfıra düşmesin diye kira en az 5.
  return Math.max(5, round5(((base * s.index) / 100) * mult));
}

// Engel varsa Türkçe sebep döndürür, yoksa null.
export function buildBlock(s, p, sq, kacak) {
  const sqd = BOARD[sq];
  const ps = s.props[sq];
  if (!ps || sqd.kind !== 'prop') return 'Buraya kat dikilemez.';
  if (ps.owner !== p) return 'Bu mülk senin değil.';
  if (s.mods.durgunluk) return 'Piyasa durgun: bu dönem kat dikilemez.';
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

function netWorthParts(s, p) {
  let mulk = 0;
  let katlar = 0;
  for (const q of propsOf(s, p)) {
    const ps = s.props[q];
    mulk += ps.ipotek ? mortgageValue(s, q) : price(s, q);
    if (BOARD[q].kind === 'prop') katlar += ps.kat * katValue(s, q) + ps.kacak * round5(katValue(s, q) / 2);
  }
  return { nakit: s.players[p].cash, borc: s.players[p].kredi?.amount || 0, mulk, katlar };
}

export function netWorth(s, p) {
  const w = netWorthParts(s, p);
  return w.nakit - w.borc + w.mulk + w.katlar;
}

export function scoreOf(s, p) {
  const parts = netWorthParts(s, p);
  const ceza = s.players[p].konkordato * s.config.konkordatoPenalty;
  return { ...parts, ceza, total: parts.nakit - parts.borc + parts.mulk + parts.katlar - ceza };
}

export function hasLiquidAssets(s, p) {
  return propsOf(s, p).some((q) => level(s.props[q]) > 0 || !s.props[q].ipotek);
}
