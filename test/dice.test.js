import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LABELINGS, NORM, OPP, labelingFor, simulate, seeded, topSlot, flatness, timeline, frameAt, qmat, qn, simulateTo } from '../src/ui/dicesim.js';

const SLOTS = Object.keys(NORM);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const slotWith = (L, v) => SLOTS.find((s) => L[s] === v);
// İki küpün iç içe geçme derinliği (R biriminde; 0: değmiyor). Ayırma ekseni sınaması, 15 eksen.
function depth(a, b, R) {
  const ax = (q) => { const m = qmat(q); return [0, 1, 2].map((j) => [m[0][j], m[1][j], m[2][j]]); };
  const A = ax(a.q), B = ax(b.q);
  const axes = [...A, ...B];
  for (const u of A) for (const v of B) { const c = cross(u, v); const l = Math.hypot(...c); if (l > 1e-6) axes.push(c.map((x) => x / l)); }
  const d = [b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]];
  let min = Infinity;
  for (const n of axes) {
    const r = A.concat(B).reduce((s, e) => s + Math.abs(dot(e, n)), 0) * R;
    min = Math.min(min, r - Math.abs(dot(d, n)));
    if (min <= 0) return 0;
  }
  return min / R;
}

test('24 etiketleme var, hepsi farkli ve gecerli bir zar (karsilikli yuzler 7, ayni el)', () => {
  assert.equal(LABELINGS.length, 24);
  assert.equal(new Set(LABELINGS.map((L) => JSON.stringify(L))).size, 24);
  const hand = (L) => Math.sign(dot(cross(NORM[slotWith(L, 1)], NORM[slotWith(L, 2)]), NORM[slotWith(L, 3)]));
  const h0 = hand(LABELINGS[0]);
  for (const L of LABELINGS) {
    assert.deepEqual(SLOTS.map((s) => L[s]).sort(), [1, 2, 3, 4, 5, 6]);
    for (const s of SLOTS) assert.equal(L[s] + L[OPP[s]], 7);
    assert.equal(hand(L), h0, 'ayna goruntusu zar olmamali');
  }
});

test('her ust yuva ve her deger icin bir etiketleme vardir', () => {
  for (const s of SLOTS) {
    for (let v = 1; v <= 6; v++) {
      assert.equal(LABELINGS.filter((L) => L[s] === v).length, 4);
      const rng = seeded(v * 7 + s.charCodeAt(0));
      for (let k = 0; k < 5; k++) assert.equal(labelingFor(s, v, rng)[s], v);
    }
  }
});

const TRAYS = [
  { n: 2, W: 504, H: 157, R: 28 }, // oyun zarı
  { n: 2, W: 300, H: 134, R: 28 }, // dar ekran
  { n: 1, W: 186, H: 96, R: 32 }, // dava düellosu
];

test('atis sinirli surede biter, zarlar duz yatar, tepsiden cikmaz, ust uste binmez', () => {
  for (const tray of TRAYS) {
    const { n, W, H, R } = tray;
    for (let seed = 1; seed <= 200; seed++) {
      const sim = simulate({ ...tray, rng: seeded(seed) });
      assert.ok(sim.end < 3, `sure ${sim.end}`);
      assert.ok(sim.frames.length < 3 * 60 + 2);
      const last = sim.frames[sim.frames.length - 1];
      assert.equal(last.length, n);
      last.forEach((d, i) => {
        assert.ok(flatness(d.q) > 0.9999, `zar ${i} duz degil (tohum ${seed})`);
        assert.equal(topSlot(d.q), sim.tops[i]);
        assert.ok(Math.abs(d.p[2] - R) < 1e-9);
      });
      for (const f of sim.frames) {
        for (const d of f) {
          assert.ok(d.p[0] >= R - 1e-6 && d.p[0] <= W - R + 1e-6, `x ${d.p[0]} (tohum ${seed})`);
          assert.ok(d.p[1] >= R - 1e-6 && d.p[1] <= H - R + 1e-6, `y ${d.p[1]} (tohum ${seed})`);
          assert.ok(d.p[2] >= R - 1e-6);
        }
      }
      if (n === 2) {
        // Durunca hiç, atış boyunca da (elden çıktıkları ilk anlar hariç) gözle görülür ölçüde iç içe geçmezler.
        assert.ok(depth(last[0], last[1], R) < 0.02, `zarlar ic ice duruyor (tohum ${seed})`);
        for (const f of sim.frames.slice(3)) assert.ok(depth(f[0], f[1], R) < 0.05, `zarlar ic ice gecti: ${depth(f[0], f[1], R).toFixed(2)} (tohum ${seed})`);
      }
    }
  }
});

test('ayni tohum ayni atisi verir', () => {
  const a = simulate({ ...TRAYS[0], rng: seeded(42) });
  const b = simulate({ ...TRAYS[0], rng: seeded(42) });
  assert.deepEqual(a.frames.at(-1), b.frames.at(-1));
  assert.deepEqual(a.tops, b.tops);
});

test('secilen etiketleme istenen degeri durunca ustteki yuze koyar (iki zar)', () => {
  const rng = seeded(9);
  for (let seed = 1; seed <= 100; seed++) {
    const sim = simulate({ ...TRAYS[0], rng: seeded(seed) });
    const want = [1 + (seed % 6), 1 + ((seed * 5) % 6)];
    const labs = want.map((v, i) => labelingFor(sim.tops[i], v, rng));
    sim.frames.at(-1).forEach((d, i) => assert.equal(labs[i][topSlot(d.q)], want[i]));
  }
});

test('oynatma zar suresine sigar, son an agir cekimdir', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const sim = simulate({ ...TRAYS[0], rng: seeded(seed) });
    for (const budget of [0.84, 1.4, 2.1]) {
      const tl = timeline(sim, budget);
      assert.ok(tl.duration <= budget + 1e-9, `${tl.duration} > ${budget}`);
      assert.ok(Math.abs(tl.simAt(tl.duration) - sim.end) < 1e-9);
      assert.ok(Math.abs(tl.real(sim.end) - tl.duration) < 1e-9);
      // son 0,1 sn gercek zaman, onceki 0,1 sn'den daha az simulasyon zamani ilerletir
      const d = tl.duration;
      assert.ok(tl.simAt(d) - tl.simAt(d - 0.1) < tl.simAt(0.2) - tl.simAt(0.1));
    }
    const end = frameAt(sim, sim.end + 1);
    assert.deepEqual(end, sim.frames.at(-1));
  }
});

test('elden savrulan atis: yone gider, en az bir hizla savrulur, tepside kalir, eldeki yuzlerle istenen sonucu verir', () => {
  const tray = TRAYS[0];
  const { W, H, R } = tray;
  for (let seed = 1; seed <= 60; seed++) {
    const r = seeded(seed);
    const qs = [0, 1].map(() => qn([r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5]));
    const ps = [[150, 95], [251, 101]]; // dice.js hold: aralarında 3,6 R
    const right = seed % 2 === 0;
    const toss = { ps, qs, v: right ? [1800, -200] : [0, 0] }; // hizli saga savurma ya da yerinde birakma
    const labs = [LABELINGS[seed % 24], LABELINGS[(seed * 5) % 24]];
    const want = [1 + (seed % 6), 1 + ((seed * 7) % 6)];
    const sim = simulateTo({ ...tray, toss }, labs, want, seed * 1000);
    assert.ok(sim, `atis bulunamadi (tohum ${seed})`);
    // ilk kare eldeki yerde ve dönüşte
    sim.frames[0].forEach((d, i) => assert.ok(Math.hypot(d.p[0] - ps[i][0], d.p[1] - ps[i][1]) < R * 0.5));
    const last = sim.frames.at(-1);
    last.forEach((d, i) => {
      assert.equal(labs[i][topSlot(d.q)], want[i]);
      assert.ok(flatness(d.q) > 0.9999);
      assert.ok(d.p[0] >= R - 1e-6 && d.p[0] <= W - R + 1e-6 && d.p[1] >= R - 1e-6 && d.p[1] <= H - R + 1e-6);
    });
    // yerinde bırakılsa da savrulur; sağa savrulunca sağa gider
    const moved = Math.max(...sim.frames.slice(0, 20).map((f) => Math.hypot(f[0].p[0] - ps[0][0], f[0].p[1] - ps[0][1])));
    assert.ok(moved > R, `zar savrulmadi (tohum ${seed})`);
    if (right) assert.ok(Math.max(...sim.frames.flatMap((f) => f.map((d) => d.p[0]))) > W - R * 3, `saga gitmedi (tohum ${seed})`);
  }
});
