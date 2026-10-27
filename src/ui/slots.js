// Piyonların tahtadaki yeri ("kaldırım" düzeni, yol yok). DOM yok, ölçüler tahtaya göre px.
// Piyon durduğu karenin iç kenarında, ortadaki alana hafifçe taşarak durur; köşede köşe karesinin iç köşesinde.
// Bir piyonun yeri ayağının (kaidesinin ortası) noktasıdır; figür bu noktadan yukarı doğru çizilir.

export const PAWN = 0.56; // piyon kutusu, kenar derinliğine oranla (95 px kenarda 53 px)

// n piyonun bir kenar boyunca merkezleri (kenarın başından px). Sığmazlarsa kenarı aşmadan üst üste biner, ortalı durur.
export function spread(n, len, slot, pad = 4) {
  if (n <= 1) return [len / 2];
  const step = Math.min(slot, (len - 2 * pad - slot) / (n - 1));
  const x0 = (len - step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, k) => x0 + step * k);
}

// side: 'b' | 't' | 'l' | 'r' | 'c'; b: karenin tahtadaki kutusu {x, y, w, h}; s: piyon kutusu; n: karedeki piyon sayısı;
// W, H: tahtanın boyu (köşenin hangi köşe olduğunu bulmak için). Ayak noktalarını döndürür: [{ x, y }].
export function feet(side, b, s, n, W, H) {
  if (side === 'b' || side === 't') {
    // Alt sırada iç kenar üstte: ayak kenarın hemen içinde, figür ortaya yükselir.
    // Üst sırada iç kenar altta: ayak ortada, figürün yalnız tepesi kareye değer.
    const y = side === 'b' ? b.y + s * 0.06 : b.y + b.h + s * 0.86;
    return spread(n, b.w, s * 0.8).map((x) => ({ x: b.x + x, y }));
  }
  if (side === 'l' || side === 'r') {
    const dir = side === 'l' ? 1 : -1; // ortaya doğru
    const x = side === 'l' ? b.x + b.w + s * 0.44 : b.x - s * 0.44;
    // Kenar boyunca dizilir; kalabalıkta biri bir ortaya kayar ki başlar görünsün.
    return spread(n, b.h, s * 0.55).map((y, k) => ({ x: x + (n > 2 && k % 2 ? dir * s * 0.42 : 0), y: b.y + y + s * 0.45 }));
  }
  const right = b.x + b.w / 2 > W / 2;
  const bottom = b.y + b.h / 2 > H / 2;
  const ix = right ? b.x : b.x + b.w; // köşe karesinin ortaya bakan köşesi
  const dir = right ? -1 : 1;
  const y = bottom ? b.y + s * 0.06 : b.y + b.h + s * 0.86;
  return Array.from({ length: n }, (_, k) => ({ x: ix + dir * (s * 0.5 + k * s * 0.72), y }));
}

// Yürüyüşte adım süreleri: kalkışta yavaş, ortada hızlı, varışta yavaş; toplamı total (ms).
export function stepDurations(n, total) {
  if (n <= 0) return [];
  if (n === 1) return [total];
  const w = Array.from({ length: n }, (_, k) => 1 + 1.4 * Math.abs((2 * k) / (n - 1) - 1) ** 2);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (x * total) / sum);
}
