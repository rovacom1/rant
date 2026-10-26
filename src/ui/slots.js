// Piyonların karedeki yeri: piyonlar karenin üst kısmında, semt adı altta kalır (birbirini kapatmaz). DOM yok.

export const PAWN = 0.47; // piyon kutusu, kare yüksekliğine oranla (76 px karede 36 px)

// Piyonların üst kenarı: alt sıradaki karelerde şerit üstte olduğu için biraz aşağıda, diğerlerinde en üstte.
export const laneTop = (side, ch) => Math.round(side === 'b' ? ch * 0.14 : ch * 0.03);

// n piyonun kare içindeki sol kenarları (px). Sığmazlarsa kareyi aşmadan üst üste biner, ortalı durur.
export function pawnXs(n, cw, s, pad = 4) {
  if (n <= 1) return [Math.round((cw - s) / 2)];
  const step = Math.min(s * 0.92, (cw - 2 * pad - s) / (n - 1));
  const x0 = (cw - (s + step * (n - 1))) / 2;
  return Array.from({ length: n }, (_, k) => Math.round(x0 + step * k));
}
