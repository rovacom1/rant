// Tahta verisi oyunun durumuna bağlıdır: s.mode hangi tahtada oynandığını söyler (Klasik / Mahalle, docs/TASARIM.md).
// Kurallar ve motor kareleri, setleri ve sahip olunabilir kareleri buradan okur, data.js'deki sabitlerden değil.
// Mahalle tahtası (6x6 arsa) K2'de buraya eklenir.

import { BOARD, GROUPS, GROUP_SQUARES, OWNABLE, MODE_SQUARES } from './data.js';

const BOARDS = {
  klasik: { squares: BOARD, groups: GROUPS, groupSquares: GROUP_SQUARES, ownable: OWNABLE, modeSquares: MODE_SQUARES },
};

export const GAME_MODES = Object.keys(BOARDS);
// Eski kayıtlarda mode alanı yoktur: yok = klasik.
export const modeOf = (s) => s.mode || 'klasik';
export const boardOf = (s) => BOARDS[modeOf(s)];
