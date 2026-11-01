// Oyun türüne göre değişen metinler: Mahalle'de kartların ve gündemin uyarlanmış kuralları (docs/TASARIM.md §13).
// Oyun ekranı açılınca türü bir kez söyler (setTextMode); kart yüzü, kart penceresi ve gündem buradan okur. DOM yok.
import { CARDS, GUNDEM, MAHALLE_CARD_TEXT, MAHALLE_GUNDEM_TEXT } from '../engine/index.js';

let mh = false;
export const setTextMode = (mode) => {
  mh = mode === 'mahalle';
};

// Elde kartın kısa kuralı (en çok RULE_MAX harf, hand.js).
export const MAHALLE_SHORT = {
  taksi: 'Satır ya da sütunda git',
  kestirme: 'Bir zarı yeniden at',
  geriVites: 'Önceki arsana dön',
  kamulastirma: 'Rakip arsasını bedeliyle al',
  takas: 'Arsanı rakibinkiyle değiş',
  tedbir: 'Rakip arsası kira almaz',
  ihbar: 'Kaçak ve gecekondu yıkılır',
  muteahhit: 'Arsana bedava 1 kat',
  pazarlik: 'Arsayı yarı fiyatına al',
};

// Gündemin tahtadaki etkisi (gündem hapı).
const MOD_M = { turizm: 'Kıyı kira ×2', grev: 'Hakediş yok' };

export const cardText = (id) => (mh && MAHALLE_CARD_TEXT[id]) || CARDS[id].text;
export const cardShort = (id) => (mh && MAHALLE_SHORT[id]) || null;
export const gundemText = (id) => (mh && MAHALLE_GUNDEM_TEXT[id]) || GUNDEM[id].text;
export const modLabel = (m, base) => (mh && MOD_M[m]) || base[m];
