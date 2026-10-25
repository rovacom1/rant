// Taşların karedeki yeri: kare adını kapatmasınlar diye karenin boş kenarında yan yana dizilirler. DOM yok.
// Tüm değerler kare genişliğine/yüksekliğine oranla (0-1).

export const TOKEN = 0.28; // taş çapı, kare genişliğine oranla

// Taş sırasının dikey yeri. İkonlu karelerde ad üstte, ikon altta (köşelerde tersi): taşlar ikonun üstünde durur;
// mülk karelerinde şerit iç kenarda, ad şeride yaslı: taşlar dış kenarda (üst sırada üstte, diğerlerinde altta).
export function laneY(side, art) {
  if (art) return side === 'c' ? 0.38 : 0.68;
  return side === 't' ? 0.07 : 0.9;
}

// n taşın yan yana yerleri; sığmazlarsa kare genişliğini aşmadan üst üste biner.
export function tokenSlots(n, y) {
  if (n <= 1) return [{ x: 0.5, y }];
  const step = Math.min(TOKEN * 1.08, (0.96 - TOKEN) / (n - 1));
  const x0 = 0.5 - (step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, k) => ({ x: x0 + step * k, y }));
}
