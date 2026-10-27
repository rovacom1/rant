// Piyonların tahtadaki yeri ("kaldırım" düzeni, yol yok). DOM yok, ölçüler tahtaya göre px.
// Piyon durduğu karenin iç kenarında, ortadaki alana hafifçe taşarak durur (yan yana en çok 3); köşede köşe karesinin
// iç köşesinde, kalabalıkta karenin öteki köşelerinde.
// Bir piyonun yeri ayağının (kaidesinin ortası) noktasıdır; figür bu noktadan yukarı doğru çizilir.

export const PAWN = 0.56; // piyon kutusu, kenar derinliğine oranla (95 px kenarda 53 px)

// n piyonun bir kenar boyunca merkezleri (kenarın başından px). Sığmazlarsa kenarı aşmadan üst üste biner, ortalı durur.
export function spread(n, len, slot, pad = 4) {
  if (n <= 1) return [len / 2];
  const step = Math.min(slot, (len - 2 * pad - slot) / (n - 1));
  const x0 = (len - step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, k) => x0 + step * k);
}

// Bir karede yan yana en çok ROW piyon durur; fazlası bir sıra daha ortaya geçer.
export const ROW = 3;

// side: 'b' | 't' | 'l' | 'r' | 'c'; b: karenin tahtadaki kutusu {x, y, w, h}; s: piyon kutusu; n: karedeki piyon sayısı;
// W, H: tahtanın boyu (köşenin hangi köşe olduğunu bulmak için). Ayak noktalarını döndürür: [{ x, y }].
export function feet(side, b, s, n, W, H) {
  if (side === 'c') return cornerFeet(b, s, n, W, H);
  const rows = Array.from({ length: Math.ceil(n / ROW) }, (_, r) => Math.min(ROW, n - r * ROW));
  const out = [];
  rows.forEach((m, r) => {
    if (side === 'b' || side === 't') {
      // Alt sırada iç kenar üstte: ayak kenarın hemen içinde, figür ortaya yükselir.
      // Üst sırada iç kenar altta: ayak ortada, figürün yalnız tepesi kareye değer. İkinci sıra biraz daha ortada.
      const y = side === 'b' ? b.y + s * 0.06 - r * s * 0.5 : b.y + b.h + s * 0.86 + r * s * 0.5;
      for (const x of spread(m, b.w, s * 0.8)) out.push({ x: b.x + x, y });
    } else {
      const dir = side === 'l' ? 1 : -1; // ortaya doğru
      const x = (side === 'l' ? b.x + b.w + s * 0.44 : b.x - s * 0.44) + dir * r * s * 0.62;
      // Kenar boyunca dizilir; üç kişide ortadaki bir ortaya kayar ki başlar görünsün.
      spread(m, b.h, s * 0.55).forEach((y, k) => out.push({ x: x + (m > 2 && k % 2 ? dir * s * 0.3 : 0), y: b.y + y + s * 0.45 }));
    }
  });
  return out;
}

// Köşe karesi: tek piyon karenin ortaya bakan köşesinde (ortaya hafifçe taşar); kalabalıkta sırayla karenin öteki
// köşelerine, beş ve altı kişide karenin ortasına geçer. Tahtanın kenarından taşmaz, ortaya dizilmez.
function cornerFeet(b, s, n, W, H) {
  const right = b.x + b.w / 2 > W / 2;
  const bottom = b.y + b.h / 2 > H / 2;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const sx = right ? -1 : 1; // ortaya doğru
  const sy = bottom ? -1 : 1;
  const ox = b.w * 0.21; // öteki köşe noktalarının karenin ortasından uzaklığı (piyon tahtanın kenarından taşmaz)
  const oy = b.h * 0.21;
  const inner = { x: cx + sx * b.w * 0.42, y: cy + sy * b.h * 0.42 };
  const spots = [inner, { x: cx + sx * ox, y: cy - sy * oy }, { x: cx - sx * ox, y: cy + sy * oy }, { x: cx - sx * ox, y: cy - sy * oy }];
  if (n === 5) spots.push({ x: cx, y: cy });
  else spots.push({ x: cx - s * 0.32, y: cy }, { x: cx + s * 0.32, y: cy });
  // Nokta figürün ortası; ayak onun yarım piyon altında.
  return spots.slice(0, n).map((c) => ({ x: c.x, y: c.y + s * 0.5 }));
}

// Yürüyüşte adım süreleri: kalkışta yavaş, ortada hızlı, varışta yavaş; toplamı total (ms).
export function stepDurations(n, total) {
  if (n <= 0) return [];
  if (n === 1) return [total];
  const w = Array.from({ length: n }, (_, k) => 1 + 1.4 * Math.abs((2 * k) / (n - 1) - 1) ** 2);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (x * total) / sum);
}
