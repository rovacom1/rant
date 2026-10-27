// Oyuncu piyonları: şeffaf zeminli resimler (assets/piyon). Panellerde oyuncunun rengi halka değil, figürün kendi kenarına
// çizilir (CSS drop-shadow). Görünen alan eşit olsun diye ince piyonlar (Galata, leblebi) biraz daha uzun çizilir.
import { AVATARS, PAWN_NAMES } from '../engine/index.js';

// Resmin görünen kısmının genişlik / yükseklik oranı (resimler bu kısma kırpılı).
const ASPECT = {
  semazen: 0.766, kofte: 1.422, leblebi: 0.664, ankaray: 1.103, galata: 0.668, hitit: 0.918, atakule: 0.794, boyoz: 1.014,
  caretta: 1.33, ekmek: 1.103, hamsi: 1.212, kestane: 0.949, kizkulesi: 0.663, nasreddin: 0.771, saatkulesi: 0.587,
};

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

// Tahtadaki piyon: figür (ilk çocuk; boardfx onu zıplatır), ayağın altında oyuncu renginde beyaz halkalı oval kaide
// ve yumuşak gölge. Figürün kenarı tahtada beyazdır (tahta.css); oyuncunun rengi kaidededir.
export const boardPawn = (avatar, color, s) => `<span class="fig">${pawn(avatar, color, s)}</span><i class="base"></i><i class="sh"></i>`;
