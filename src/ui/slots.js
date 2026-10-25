// Taşların karedeki yeri: kare adını kapatmasınlar diye karenin boş kenarında yan yana dizilirler. DOM yok.
// Tüm değerler kare genişliğine/yüksekliğine oranla (0-1).

export const TOKEN = 0.31; // taş çapı, kare genişliğine oranla

// Taş sırasının dikey yeri. Resimli karelerde ad altta yazar, taşlar üstte durur;
// mülk karelerinde şerit iç kenarda, ad ortada: taşlar şeritten uzak kenarda (üst sırada üstte, diğerlerinde altta).
export function laneY(side, art) {
  if (art) return 0.3;
  return side === 't' ? 0.15 : 0.85;
}

// n taşın yan yana yerleri; sığmazlarsa kare genişliğini aşmadan üst üste biner.
export function tokenSlots(n, y) {
  if (n <= 1) return [{ x: 0.5, y }];
  const step = Math.min(TOKEN * 1.08, (0.96 - TOKEN) / (n - 1));
  const x0 = 0.5 - (step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, k) => ({ x: x0 + step * k, y }));
}
