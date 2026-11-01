import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout, cellRect, headRect, pawnFeet, pawnSize, focusPoint, arcHeight, rowCol, SIDE, LAND } from '../src/ui/arazigeom.js';
import { MAHALLE_SHORT, setTextMode, cardText, cardShort, gundemText, modLabel } from '../src/ui/modetext.js';
import { RULE_MAX } from '../src/ui/hand.js';
import { CARDS, GUNDEM, MAHALLE_CARD_TEXT, MAHALLE_GUNDEM_TEXT, plotAt } from '../src/engine/index.js';

const SIZES = [
  [1080, 872, true], // masaüstü 1440x900
  [481, 332, true], // yatay telefon 844x340
  [433, 312, true], // yatay telefon 667x320
  [374, 374, false], // dikey telefon
];
const inside = (r, W, H) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5;
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const [W, H, panel] of SIZES) {
  test(`arazi ${W}x${H}: 36 arsa tahtada, kare, üst üste binmez; orta sütun arsaları kapatmaz`, () => {
    const L = layout(W, H, panel);
    const rs = Array.from({ length: SIDE * SIDE }, (_, i) => cellRect(L, i));
    for (const r of rs) {
      assert.ok(inside(r, W, H), JSON.stringify(r));
      assert.equal(r.w, r.h);
    }
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) assert.ok(!overlap(rs[i], rs[j]), `${i} ${j}`);
    if (panel) {
      assert.ok(L.center && L.center.w >= 190, 'orta sütun en az 190 px');
      assert.ok(inside({ x: L.center.x, y: L.center.y, w: L.center.w, h: L.center.h }, W, H));
      for (const r of rs) assert.ok(!overlap(r, L.center), 'orta sütun arsaya binmez');
    } else assert.equal(L.center, null);
    if (L.head) for (let k = 1; k <= SIDE; k++) for (const isRow of [true, false]) {
      const h = headRect(L, k, isRow);
      assert.ok(inside(h, W, H));
      for (const r of rs) assert.ok(!overlap(h, r), 'başlık arsaya binmez');
    }
    // kumsal arazinin sağında başlar: 6. sütun kıyıya bakar
    assert.ok(L.bg.size * LAND >= L.grid.x + L.grid.size, 'arsalar kumsala taşmaz');
    assert.ok(L.bg.size >= H, 'arazi resmi tahtanın boyunu kaplar');
  });
}

test('arsa numarası satır ve sütundan; 1. satır yukarıda, 6. sütun sağda', () => {
  const L = layout(1080, 872, true);
  assert.deepEqual(rowCol(plotAt(3, 5)), { row: 3, col: 5 });
  const a = cellRect(L, plotAt(1, 1));
  const b = cellRect(L, plotAt(1, 6));
  const c = cellRect(L, plotAt(6, 1));
  assert.ok(b.x > a.x && b.y === a.y);
  assert.ok(c.y > a.y && c.x === a.x);
  const f = focusPoint(L, plotAt(3, 5));
  const r = cellRect(L, plotAt(3, 5));
  assert.deepEqual(f, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
});

test('piyonlar arsanın içinde durur, en çok 3 yan yana', () => {
  const L = layout(1080, 872, true);
  const s = pawnSize(L);
  for (const n of [1, 2, 3, 4, 6]) {
    const r = cellRect(L, 14);
    const fs = pawnFeet(L, 14, n, s);
    assert.equal(fs.length, n);
    for (const p of fs) {
      assert.ok(p.x - s / 2 >= r.x - 1 && p.x + s / 2 <= r.x + r.w + 1, `n=${n} yatayda taşar`);
      assert.ok(p.y <= r.y + r.h && p.y >= r.y + r.h * 0.5, `n=${n} ayak arsanın alt yarısında`);
    }
    assert.ok(new Set(fs.map((p) => p.y)).size === Math.ceil(n / 3));
  }
});

test('zıplama yayı mesafeyle büyür, sınırlı', () => {
  assert.ok(arcHeight(10, 0, 50) >= 45);
  assert.ok(arcHeight(600, 400, 50) <= 150);
  assert.ok(arcHeight(300, 0, 50) > arcHeight(80, 0, 50));
});

test('Mahalle metinleri yalnız Mahalle oyununda; kısa kurallar kart yüzüne sığar', () => {
  for (const [id, t] of Object.entries(MAHALLE_SHORT)) {
    assert.ok(CARDS[id], id);
    assert.ok(t.length <= RULE_MAX, `${id}: ${t.length}`);
  }
  setTextMode('klasik');
  assert.equal(cardText('taksi'), CARDS.taksi.text);
  assert.equal(cardShort('taksi'), null);
  assert.equal(gundemText('turizm'), GUNDEM.turizm.text);
  assert.equal(modLabel('turizm', { turizm: 'x' }), 'x');
  setTextMode('mahalle');
  assert.equal(cardText('taksi'), MAHALLE_CARD_TEXT.taksi);
  assert.equal(cardText('piyango'), CARDS.piyango.text);
  assert.equal(gundemText('turizm'), MAHALLE_GUNDEM_TEXT.turizm);
  assert.equal(modLabel('turizm', { turizm: 'x' }), 'Kıyı kira ×2');
  setTextMode('klasik');
});
