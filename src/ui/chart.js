// Oyun sonu grafiği için saf yardımcı: tur tur net değerlerden SVG çizgi koordinatları.
// worth[k][p]: k. tur sonunda p oyuncusunun net değeri (worth[0] oyun başı).
export function worthLines(worth, w, h, pad = 6) {
  if (!worth || worth.length < 2) return null;
  const all = worth.flat();
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const x = (k) => pad + (k * (w - 2 * pad)) / (worth.length - 1);
  const y = (val) => h - pad - ((val - lo) * (h - 2 * pad)) / span;
  const r = (n) => Math.round(n * 10) / 10;
  const lines = worth[0].map((_, p) => worth.map((row, k) => `${r(x(k))},${r(y(row[p]))}`).join(' '));
  return { lines, lo, hi, zero: r(y(0)), rounds: worth.length - 1 };
}
