import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAWN, spread, feet, stepDurations } from '../src/ui/slots.js';

// 1000 x 700 tahta, 100 x 70 kareler.
const W = 1000;
const H = 700;
const s = Math.round(70 * PAWN);

test('piyon kutusu kare yuksekliginin yarisi kadar', () => {
  assert.equal(Math.round(95 * PAWN), 53, '95 px kenarda piyon 53 px');
});

test('alt sira: ayak karenin ust (ic) kenarinda, figur ortaya yukselir', () => {
  const b = { x: 300, y: 630, w: 100, h: 70 };
  const [f] = feet('b', b, s, 1, W, H);
  assert.equal(f.x, 350, 'ortali');
  assert.ok(f.y >= b.y && f.y < b.y + s * 0.2, 'ayak ic kenarin hemen icinde');
  assert.ok(f.y - s < b.y, 'figur kareden ortaya tasar');
});

test('ust sira: ayak ortada, figur karenin alt kenarina hafifce deger', () => {
  const b = { x: 300, y: 0, w: 100, h: 70 };
  const [f] = feet('t', b, s, 1, W, H);
  assert.ok(f.y > b.y + b.h, 'ayak ortadaki alanda');
  const over = b.y + b.h - (f.y - s);
  assert.ok(over > 0 && over < s * 0.3, 'figurun yalniz tepesi kareye deger');
});

test('yan sutunlar: piyon ic kenara bitisik, ortaya dogru', () => {
  const l = { x: 0, y: 280, w: 100, h: 70 };
  const r = { x: 900, y: 280, w: 100, h: 70 };
  const [fl] = feet('l', l, s, 1, W, H);
  const [fr] = feet('r', r, s, 1, W, H);
  assert.ok(fl.x > l.x + l.w && fl.x - s / 2 < l.x + l.w, 'sol: kenarin sagi, hafifce kareye deger');
  assert.ok(fr.x < r.x && fr.x + s / 2 > r.x, 'sag: kenarin solu');
  assert.ok(fl.y - s >= l.y - s * 0.2 && fl.y <= l.y + l.h + s * 0.5, 'karenin hizasinda');
});

test('koseler: tek piyon ic kosede, kalabalikta karenin oteki koselerinde, tahtadan tasmadan', () => {
  const c0 = { x: 900, y: 630, w: 100, h: 70 }; // sag alt (BASLANGIC)
  const c18 = { x: 0, y: 0, w: 100, h: 70 }; // sol ust
  const [a] = feet('c', c0, s, 1, W, H);
  const [b] = feet('c', c18, s, 1, W, H);
  assert.ok(a.x < c0.x + c0.w * 0.2 && a.y - s / 2 < c0.y + c0.h * 0.2, 'sag alt kose: sol ust ic kosede');
  assert.ok(b.x > c18.x + c18.w * 0.8 && b.y - s / 2 > c18.y + c18.h * 0.8, 'sol ust kose: sag alt ic kosede');
  for (const c of [c0, c18]) {
    const six = feet('c', c, s, 6, W, H);
    assert.equal(new Set(six.map((f) => `${f.x},${f.y}`)).size, 6, 'herkesin ayri yeri var');
    for (const f of six) {
      assert.ok(f.x - s * 0.28 >= 0 && f.x + s * 0.28 <= W && f.y - s >= 0 && f.y <= H, 'tahtanin icinde');
      assert.ok(f.x > c.x - s * 0.5 && f.x < c.x + c.w + s * 0.5, 'koseden uzaklasmaz');
    }
  }
});

test('bir karede yan yana en cok 3 piyon, fazlasi ortaya dogru ikinci sirada', () => {
  const b = { x: 300, y: 630, w: 100, h: 70 };
  const five = feet('b', b, s, 5, W, H);
  assert.equal(new Set(five.slice(0, 3).map((f) => f.y)).size, 1);
  assert.ok(five[3].y < five[0].y && five[3].y === five[4].y, 'ikinci sira ortaya dogru');
  const l = { x: 0, y: 280, w: 100, h: 70 };
  const four = feet('l', l, s, 4, W, H);
  assert.ok(four[3].x > Math.max(...four.slice(0, 3).map((f) => f.x)) - s * 0.31, 'sol sutunda ikinci sira saga');
});

test('ayni karedeki piyonlar ic kenar boyunca dizilir, kenari asmaz, ortalidir', () => {
  const cw = 101;
  const slot = s * 0.8;
  assert.deepEqual(spread(1, cw, slot), [cw / 2]);
  for (let n = 2; n <= 6; n++) {
    const xs = spread(n, cw, slot);
    assert.equal(xs.length, n);
    for (let k = 1; k < n; k++) assert.ok(xs[k] > xs[k - 1]);
    assert.ok(xs[0] - slot / 2 >= 3 && xs[n - 1] + slot / 2 <= cw - 3, `${n} piyon kenara sigmali`);
    assert.ok(Math.abs(xs[0] + xs[n - 1] - cw) < 1e-9, 'ortali');
  }
  const b = { x: 300, y: 630, w: 100, h: 70 };
  for (const f of feet('b', b, s, 5, W, H)) assert.ok(f.x > b.x && f.x < b.x + b.w);
  const l = { x: 0, y: 280, w: 100, h: 70 };
  for (const f of feet('l', l, s, 5, W, H)) assert.ok(f.y - s * 0.45 > l.y && f.y - s * 0.45 < l.y + l.h);
});

test('yuruyus: kalkista ve varista yavas, ortada hizli, toplam ayni', () => {
  const ds = stepDurations(7, 7 * 220);
  assert.equal(Math.round(ds.reduce((a, b) => a + b, 0)), 7 * 220);
  assert.ok(ds[0] > ds[3] && ds[6] > ds[3], 'uclar ortadan uzun');
  assert.ok(Math.abs(ds[0] - ds[6]) < 1e-9, 'simetrik');
  assert.deepEqual(stepDurations(1, 220), [220]);
  assert.deepEqual(stepDurations(0, 0), []);
});
