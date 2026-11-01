// Sayan sayaç: para el değiştirince bakiye birden atlamaz, ms boyunca sayarak yeni değere gider. Sayarken artan sayı
// yeşil, azalan kırmızı iz bırakır (.cnt-up / .cnt-down). Sayı her karede yalnız metin olarak değişir.

const runs = new Map(); // anahtar -> { from, to, t0, ms, find, fmt }
let raf = 0;
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const valueOf = (r, now) => Math.round(r.from + (r.to - r.from) * easeIO(Math.min(1, (now - r.t0) / r.ms)));

// Anahtarın ekranda görünmesi gereken değeri: value'ya doğru sayılıyorsa o anki ara değer, yoksa value.
export function shown(key, value) {
  const r = runs.get(key);
  return r && r.to === value ? valueOf(r, performance.now()) : value;
}

// key'in sayısı from'dan to'ya ms'de sayar. find(): sayının yazıldığı öğe (yeniden çizilse de bulunur); fmt: sayıdan metin.
export function count(key, from, to, ms, find, fmt = String) {
  if (from === to) return;
  runs.set(key, { from: shown(key, from), to, t0: performance.now(), ms: Math.max(1, ms), find, fmt });
  if (!raf) raf = requestAnimationFrame(tick);
}

function tick() {
  raf = 0;
  const now = performance.now();
  for (const [key, r] of runs) {
    const el = r.find();
    const done = now - r.t0 >= r.ms;
    if (el) {
      const s = r.fmt(done ? r.to : valueOf(r, now));
      if (el.textContent !== s) el.textContent = s;
      el.classList.toggle('cnt-up', !done && r.to > r.from);
      el.classList.toggle('cnt-down', !done && r.to < r.from);
    }
    if (done) runs.delete(key);
  }
  if (runs.size) raf = requestAnimationFrame(tick);
}
