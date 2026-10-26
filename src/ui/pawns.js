// Oyuncu piyonları: şeffaf zeminli resimler (assets/piyon). Oyuncunun rengi halka değil, figürün kendi kenarına
// çizilir (CSS drop-shadow). Görünen alan eşit olsun diye ince piyonlar (Galata, leblebi) biraz daha uzun çizilir.
import { AVATARS, PAWN_NAMES } from '../engine/index.js';

// Resmin görünen kısmının genişlik / yükseklik oranı (resimler bu kısma kırpılı).
const ASPECT = { semazen: 0.764, kofte: 1.158, leblebi: 0.703, ankaray: 1.063, galata: 0.667, hitit: 1.036 };

const kindOf = (avatar) => (ASPECT[avatar] ? avatar : AVATARS[0]);

// s: piyonun kutusu (px). Kenar kalınlığı küçük boyda 2,5, büyükte 3 px; boydan bağımsız.
export function pawn(avatar, color, s, cls = '') {
  const k = kindOf(avatar);
  const a = ASPECT[k];
  let h = Math.min(s * Math.sqrt(0.72 / a), s * 1.15);
  let w = h * a;
  if (w > s * 1.05) {
    w = s * 1.05;
    h = w / a;
  }
  const o = s <= 28 ? 2.5 : 3;
  return `<span class="pawn ${cls}" style="--s:${s}px;--pc:${color};--o:${o}px" aria-label="${PAWN_NAMES[k]}" role="img"><img src="assets/piyon/${k}.png" alt="" draggable="false" style="width:${w.toFixed(1)}px;height:${h.toFixed(1)}px"></span>`;
}
