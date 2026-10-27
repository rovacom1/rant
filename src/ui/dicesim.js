// Zar fiziği ("Savruk"): DOM'suz, saf. Atış görünmeden baştan sona simüle edilir; zarlar tepsinin kenarlarından seker,
// birbirine çarpar, en sonda kenarında sallanıp en yakın yüzüne devrilir. Üstte kalan yüz bulunur ve motorun verdiği
// sayı küpün 24 dönüşünden uygun bir etiketlemeyle o yüze yazılır: oynatılan zar sonunda asla çevrilmez.
// Eksenler CSS ile aynı: x sağa, y aşağı (ekranın üstü uzak kenar), z yukarı (bakana doğru). Birim px.

// Yüz yuvaları ve dış normalleri (a üst, b alt, c sağ, d sol, e uzak, f yakın).
export const NORM = { a: [0, 0, 1], b: [0, 0, -1], c: [1, 0, 0], d: [-1, 0, 0], e: [0, -1, 0], f: [0, 1, 0] };
export const OPP = { a: 'b', b: 'a', c: 'd', d: 'c', e: 'f', f: 'e' };
const STD = { a: 1, b: 6, c: 3, d: 4, e: 2, f: 5 }; // karşılıklı yüzlerin toplamı 7

// Küpün 24 dönüşü: yüz yuvalarına sayıların 24 geçerli dizilişi (hepsi aynı elli, gerçek bir zar).
export const LABELINGS = (() => {
  const key = (v) => v.map(Math.round).join(',');
  const slotOf = {};
  for (const [s, n] of Object.entries(NORM)) slotOf[key(n)] = s;
  const rx = ([x, y, z]) => [x, -z, y];
  const rz = ([x, y, z]) => [-y, x, z];
  const seen = new Map();
  const q = [(v) => v];
  while (q.length) {
    const m = q.shift();
    const lab = {};
    for (const [s, n] of Object.entries(NORM)) lab[slotOf[key(m(n))]] = STD[s];
    const k = JSON.stringify(lab);
    if (seen.has(k)) continue;
    seen.set(k, lab);
    q.push((v) => rx(m(v)), (v) => rz(m(v)));
  }
  return [...seen.values()];
})();

// Üst yuvada `value` duran etiketlemelerden biri (4 tane var; yan yüzler rng ile değişir).
export function labelingFor(top, value, rng = Math.random) {
  const ok = LABELINGS.filter((L) => L[top] === value);
  return ok[Math.min(ok.length - 1, Math.floor(rng() * ok.length))];
}

// ---- dördey (quaternion) [w, x, y, z] ----
export const qmul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
export const qn = (q) => {
  const l = Math.hypot(...q) || 1;
  return q.map((v) => v / l);
};
export const qaxis = (ax, an) => {
  const l = Math.hypot(...ax) || 1;
  const s = Math.sin(an / 2);
  return [Math.cos(an / 2), (ax[0] / l) * s, (ax[1] / l) * s, (ax[2] / l) * s];
};
export const qmat = ([w, x, y, z]) => [
  [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
  [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
  [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
];
export const mv = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) {
    b = b.map((v) => -v);
    d = -d;
  }
  if (d > 0.9995) return qn(a.map((v, i) => v + (b[i] - v) * t));
  const th = Math.acos(Math.min(1, d));
  const s = Math.sin(th);
  return a.map((v, i) => (Math.sin((1 - t) * th) * v + Math.sin(t * th) * b[i]) / s);
}
// Dönüşte en yukarı bakan yüz yuvası.
export function topSlot(q) {
  const m = qmat(q);
  let best = 'a';
  let bz = -2;
  for (const [s, n] of Object.entries(NORM)) {
    const z = mv(m, n)[2];
    if (z > bz) {
      bz = z;
      best = s;
    }
  }
  return best;
}
// Üst yüzün normalinin z bileşeni (1: tam düz yatıyor).
export const flatness = (q) => mv(qmat(q), NORM[topSlot(q)])[2];

// "Savruk": hızlı atış, kenarlardan seker, zarlar birbirine çarpar. Değerler R = 22 px zar için; simulate R'ye göre ölçekler.
export const SAVRUK = { g: 2300, rest: 0.48, fric: 0.82, spin: 13, v: [560, 680], vz: 520, roll: 0.45, calm: 28, force: 1.6 };

const DT = 1 / 240;
const STRIDE = 4; // her 4 adımda bir kare: 60 kare/sn
export const FPS = 240 / STRIDE;

// n zarı W x H tepside atar. Dönen: frames (her biri n zarın {p, q} durumu, 1/FPS sn arayla), events ([t, şiddet, tür]:
// 'floor' yere vuruş, 'wall' kenar, 'die' zar zara, 'rest' devrilip durma), tops (her zarın üst yuvası), settleAt (son zarın
// devrilmeye başladığı an), end (simülasyon süresi, sn). rng: [0,1) üreten fonksiyon (testte sabit tohumlu).
export function simulate({ n = 2, W, H, R = 28, rng = Math.random, style = SAVRUK } = {}) {
  const k = R / 22;
  const s = style;
  const g = s.g * k;
  const out = [];
  const ev = [];
  let t = 0;
  let step = 0;
  const dir = rng() < 0.5 ? 1 : -1; // soldan ya da sağdan atılır
  const lo = [R, R];
  const hi = [W - R, H - R];
  const dy = Math.min(R * 1.2, Math.max(0, H / 2 - R));
  const narrow = Math.min(1, Math.max(0.3, (H - 2 * R) / (4 * R))); // alçak tepside daha yatay atılır
  const dice = Array.from({ length: n }, (_, i) => {
    const side = n === 1 ? 0 : i ? 1 : -1;
    const ang = (-side * (0.18 + rng() * 0.25) + (n === 1 ? (rng() - 0.5) * 0.5 : 0)) * narrow;
    const sp = (s.v[0] + rng() * (s.v[1] - s.v[0])) * k;
    return {
      p: [dir > 0 ? R : W - R, H / 2 + side * dy, R * 2.4],
      v: [dir * sp * Math.cos(ang), sp * Math.sin(ang), s.vz * k * (0.85 + rng() * 0.3)],
      q: qn([rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5]),
      w: [(rng() - 0.5) * s.spin * 2, (rng() - 0.5) * s.spin * 2, (rng() - 0.5) * s.spin],
      settle: null,
      done: false,
    };
  });
  const clamp = (d) => {
    for (const i of [0, 1]) d.p[i] = Math.min(hi[i], Math.max(lo[i], d.p[i]));
  };
  const snap = () => dice.map((d) => ({ p: [...d.p], q: [...d.q] }));
  // En yakın yüzüne devrilme: üst yüzün normalini +z'ye çeviren dönüş.
  const startSettle = (d) => {
    const up = mv(qmat(d.q), NORM[topSlot(d.q)]);
    const an = Math.acos(Math.max(-1, Math.min(1, up[2])));
    const q1 = an < 1e-4 ? d.q : qn(qmul(qaxis(cross(up, [0, 0, 1]), an), d.q));
    d.settle = { t0: t, dur: 0.32 + an * 0.4, q0: d.q, q1, lift: (an > 0.5 ? 8 : 3) * k };
    d.v = [d.v[0] * 0.3, d.v[1] * 0.3, 0];
  };
  while (t < 6) {
    for (const d of dice) {
      if (d.done) continue;
      if (d.settle) {
        // Kenarında bir an sallanır, sonra yüzüne oturur.
        const u = Math.min(1, (t - d.settle.t0) / d.settle.dur);
        const e = 1 - Math.exp(-5 * u) * Math.cos(9 * u);
        d.q = slerp(d.settle.q0, d.settle.q1, Math.min(1.08, e));
        d.p[2] = R + d.settle.lift * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u);
        d.p[0] += d.v[0] * DT * (1 - u);
        d.p[1] += d.v[1] * DT * (1 - u);
        clamp(d);
        if (u >= 1) {
          d.q = d.settle.q1;
          d.p[2] = R;
          d.done = true;
          d.doneAt = step;
          ev.push([t, 0.25, 'rest']);
        }
        continue;
      }
      d.v[2] -= g * DT;
      d.p = d.p.map((x, i) => x + d.v[i] * DT);
      const dq = qmul([0, ...d.w], d.q);
      d.q = qn(d.q.map((x, i) => x + 0.5 * DT * dq[i]));
      if (d.p[2] < R && d.v[2] < 0) {
        const imp = -d.v[2];
        d.p[2] = R;
        d.v[2] = imp * s.rest;
        d.v[0] *= s.fric;
        d.v[1] *= s.fric;
        const rollw = cross([0, 0, 1], d.v).map((x) => (x / R) * s.roll);
        const kick = (imp / (600 * k)) * s.spin;
        d.w = d.w.map((x, i) => x * 0.45 + rollw[i] + (rng() - 0.5) * kick);
        if (imp > 60 * k) ev.push([t, Math.min(1, imp / (650 * k)), 'floor']);
      }
      const onGround = d.p[2] <= R + 1 && Math.abs(d.v[2]) < 70 * k;
      if (onGround) {
        d.p[2] = R;
        d.v[2] = 0;
        d.v[0] *= 1 - 2.2 * DT;
        d.v[1] *= 1 - 2.2 * DT;
        const rollw = cross([0, 0, 1], d.v).map((x) => x / R);
        d.w = d.w.map((x, i) => x + (rollw[i] - x) * Math.min(1, 6 * DT));
      }
      // tepsinin kenarları
      for (const i of [0, 1]) {
        const hit = d.p[i] > hi[i] && d.v[i] > 0 ? hi[i] : d.p[i] < lo[i] && d.v[i] < 0 ? lo[i] : null;
        if (hit === null) continue;
        d.p[i] = hit;
        d.v[i] *= -0.55;
        d.w[1 - i] *= -1;
        ev.push([t, Math.min(1, Math.abs(d.v[i]) / (500 * k)), 'wall']);
      }
      clamp(d);
      const speed = Math.hypot(d.v[0], d.v[1]);
      if ((onGround && speed < s.calm * k) || t > s.force) startSettle(d);
    }
    // zar zara çarpma (küre yaklaşımı); devrilen zar da itilir, durmuş zar yerinde kalır
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = dice[i];
        const b = dice[j];
        if (a.done && b.done && a.doneAt < step && b.doneAt < step) continue;
        const dx = [a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]];
        const dist = Math.hypot(...dx);
        const min = 2 * R * 0.95;
        if (dist >= min || dist === 0) continue;
        const nn = dx.map((x) => x / dist);
        const free = !a.settle && !b.settle;
        if (free) {
          const vn = (a.v[0] - b.v[0]) * nn[0] + (a.v[1] - b.v[1]) * nn[1] + (a.v[2] - b.v[2]) * nn[2];
          if (vn < 0) {
            const jj = (-(1 + 0.6) * vn) / 2;
            a.v = a.v.map((x, m) => x + jj * nn[m]);
            b.v = b.v.map((x, m) => x - jj * nn[m]);
            const kk = jj / (120 * k);
            a.w = a.w.map((x) => x + (rng() - 0.5) * kk * 6);
            b.w = b.w.map((x) => x + (rng() - 0.5) * kk * 6);
            ev.push([t, Math.min(1, jj / (300 * k)), 'die']);
          }
        }
        // Yalnız yatayda ayır (yere gömülmesin); durmuş zar kıpırdamaz. Kenara sıkışırsa öbür eksende kayar.
        const need = Math.sqrt(Math.max(0, min * min - dx[2] * dx[2]));
        const wa = a.done && a.doneAt < step ? 0 : b.done && b.doneAt < step ? 1 : 0.5;
        // Bir eksende (ya da ortak normalde), aradaki yatay uzaklık need olacak kadar it.
        const part = (dir) => {
          const ex = a.p[0] - b.p[0];
          const ey = a.p[1] - b.p[1];
          if (Math.hypot(ex, ey) >= need) return;
          const along = ex * dir[0] + ey * dir[1];
          const perp = Math.abs(ex * dir[1] - ey * dir[0]);
          const gap = Math.sqrt(Math.max(0, need * need - perp * perp)) - Math.abs(along);
          if (gap <= 0) return;
          const sg = along < 0 ? -1 : 1;
          for (const m of [0, 1]) {
            a.p[m] += sg * dir[m] * gap * wa;
            b.p[m] -= sg * dir[m] * gap * (1 - wa);
          }
          clamp(a);
          clamp(b);
        };
        const h = Math.hypot(dx[0], dx[1]);
        part(h > 1e-6 ? [dx[0] / h, dx[1] / h] : [1, 0]);
        part([1, 0]);
        part([0, 1]);
      }
    }
    if (step % STRIDE === 0) out.push(snap());
    step++;
    t += DT;
    if (dice.every((d) => d.done)) break;
  }
  // Güvenlik: süre biterse yarım kalan devrilme tamamlanır (zar hep düz yatar).
  for (const d of dice) {
    if (!d.settle) startSettle(d);
    if (!d.done) {
      d.q = d.settle.q1;
      d.p[2] = R;
      d.done = true;
    }
  }
  out.push(snap());
  return { frames: out, events: ev, tops: dice.map((d) => topSlot(d.q)), settleAt: Math.max(...dice.map((d) => d.settle.t0)), end: t };
}

// Oynatma zaman çizelgesi: simülasyon zamanı ile gerçek zaman (sn). Son an (son zarın devrilmesi, en çok SLOW_LEN
// simülasyon saniyesi) hafif ağır çekimdir (SLOW hızında);
// tüm atış `budget` saniyeye sığdırılır, ama hız `minRate`'in altına düşmez (o zaman biraz erken biter).
export const SLOW = 0.6;
const SLOW_LEN = 0.3;
export function timeline(sim, budget, minRate = 0.8) {
  const slowFrom = Math.max(0, sim.settleAt - 0.1, sim.end - SLOW_LEN);
  const natural = slowFrom + (sim.end - slowFrom) / SLOW;
  const rate = Math.max(minRate, natural / Math.max(0.05, budget));
  const real = (st) => (st <= slowFrom ? st / rate : (slowFrom + (st - slowFrom) / SLOW) / rate);
  const simAt = (rt) => {
    const r = rt * rate;
    return r <= slowFrom ? r : Math.min(sim.end, slowFrom + (r - slowFrom) * SLOW);
  };
  return { rate, duration: real(sim.end), real, simAt };
}

// t (sn) anındaki durum: iki kare arasında doğrusal konum, küresel dönüş.
export function frameAt(sim, st) {
  const f = sim.frames;
  const x = Math.min(f.length - 1, Math.max(0, st * FPS));
  const i = Math.floor(x);
  if (i >= f.length - 1) return f[f.length - 1];
  const u = x - i;
  return f[i].map((a, d) => {
    const b = f[i + 1][d];
    return { p: a.p.map((v, m) => v + (b.p[m] - v) * u), q: slerp(a.q, b.q, u) };
  });
}

// Sabit tohumlu rng (testler ve tekrar edilebilir gösterim için): mulberry32.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
