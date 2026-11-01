// Tahta verisi oyunun durumuna bağlıdır: s.mode hangi tahtada oynandığını söyler (Klasik / Mahalle, docs/TASARIM.md).
// Kurallar ve motor kareleri, setleri ve sahip olunabilir kareleri buradan okur, data.js'deki sabitlerden değil.

import { BOARD, GROUPS, GROUP_SQUARES, OWNABLE, MODE_SQUARES } from './data.js';

// ---------- Mahalle: 6x6 arsa (docs/TASARIM.md §13) ----------
// Arsa numarası (satır-1)*6 + (sütun-1); satırlar yukarıdan aşağı, sütunlar soldan sağa. 6. sütun denize bakar.
// Her bölge fiyatı ona yakın bugünkü mülkün kira cetvelini ve setinin kat fiyatını kullanır; bina resmi `bina` setinden.
export const ZONES = {
  dis: { name: 'Dış halka', gen: 'Dış halkanın', color: GROUPS.corum.color, kat: 50, price: 80, rents: [4, 20, 60, 180, 320], bina: 'corum' },
  ic: { name: 'İç halka', gen: 'İç halkanın', color: GROUPS.bursa.color, kat: 100, price: 140, rents: [10, 50, 150, 450, 625], bina: 'bursa' },
  merkez: { name: 'Merkez', gen: 'Merkezin', color: GROUPS.istanbul.color, kat: 100, price: 200, rents: [16, 80, 220, 600, 800], bina: 'istanbul' },
  kiyi: { name: 'Kıyı', gen: 'Kıyının', color: GROUPS.antalya.color, kat: 100, price: 160, rents: [12, 60, 180, 500, 700], bina: 'antalya', sahil: true },
};

export const SIDE = 6;
export const plotAt = (row, col) => (row - 1) * SIDE + (col - 1);

function zoneOf(row, col) {
  if (col === SIDE) return 'kiyi';
  if (row === 1 || row === SIDE || col === 1) return 'dis';
  if (row >= 3 && row <= 4 && col >= 3 && col <= 4) return 'merkez';
  return 'ic';
}

const PLOTS = Array.from({ length: SIDE * SIDE }, (_, i) => {
  const row = Math.floor(i / SIDE) + 1;
  const col = (i % SIDE) + 1;
  const group = zoneOf(row, col);
  const z = ZONES[group];
  return { kind: 'prop', name: `${row}. satır ${col}. sütun`, group, price: z.price, rents: z.rents, row, col };
});

const inside = (r, c) => r >= 1 && r <= SIDE && c >= 1 && c <= SIDE;
const around = (deltas) => PLOTS.map((p) => deltas.filter(([dr, dc]) => inside(p.row + dr, p.col + dc)).map(([dr, dc]) => plotAt(p.row + dr, p.col + dc)));
const ADJ = around([[-1, 0], [0, -1], [0, 1], [1, 0]]);
const RING = around([[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]);
// 2x2 bloklar (site), sol üst köşelerine göre.
const BLOCKS = PLOTS.filter((p) => p.row < SIDE && p.col < SIDE).map((p) => [0, 1, SIDE, SIDE + 1].map((d) => plotAt(p.row, p.col) + d));

const BOARDS = {
  klasik: { squares: BOARD, groups: GROUPS, groupSquares: GROUP_SQUARES, ownable: OWNABLE, modeSquares: MODE_SQUARES },
  mahalle: {
    squares: PLOTS,
    groups: ZONES,
    groupSquares: Object.fromEntries(Object.keys(ZONES).map((g) => [g, PLOTS.map((p, i) => (p.group === g ? i : -1)).filter((i) => i >= 0)])),
    ownable: PLOTS.map((_, i) => i),
    modeSquares: { air: [], rail: [] },
    adj: ADJ, // dört yandaki komşular
    ring: RING, // çevredeki 8 arsa (AVM)
    blocks: BLOCKS,
  },
};

export const GAME_MODES = Object.keys(BOARDS);
// Eski kayıtlarda mode alanı yoktur: yok = klasik.
export const modeOf = (s) => s.mode || 'klasik';
export const boardOf = (s) => BOARDS[modeOf(s)];
export const isMahalle = (s) => modeOf(s) === 'mahalle';
