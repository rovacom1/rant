import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitGrid, cardFace, emWidth, CARD_SHORT, CARD_GROUP, CARD_GROUPS, RULE_MAX } from '../src/ui/hand.js';
import { deed, setLine } from '../src/ui/deed.js';
import { CARDS, BOARD, OWNABLE } from '../src/engine/index.js';
import { started } from './helpers.js';

test('el ızgarası: yer varken kartlar tam boy, satırlar dengeli', () => {
  assert.deepEqual(fitGrid(5, 460, 600), { cols: 3, w: 128 });
  assert.deepEqual(fitGrid(4, 460, 600), { cols: 2, w: 128 });
  assert.deepEqual(fitGrid(0, 460, 600), { cols: 1, w: 128 });
});

test('el ızgarası: dar yerde kart küçülür ama alana sığar', () => {
  assert.deepEqual(fitGrid(6, 460, 180), { cols: 6, w: 70 });
  for (let n = 1; n <= 7; n++) {
    for (const [w, h] of [[340, 120], [460, 180], [460, 290], [380, 500], [480, 800]]) {
      const g = fitGrid(n, w, h);
      const rows = Math.ceil(n / g.cols);
      assert.ok(g.cols * g.w + (g.cols - 1) * 8 <= w, `${n} kart ${w}x${h}: genişlik`);
      assert.ok(rows * g.w * 1.42 + (rows - 1) * 8 <= h + 1, `${n} kart ${w}x${h}: yükseklik`);
    }
  }
});

test('el ızgarası: dar ekranda yalnız genişliğe bakılır, kart 100 pikselden küçülmez', () => {
  assert.deepEqual(fitGrid(5, 800, 0), { cols: 5, w: 128 });
  assert.deepEqual(fitGrid(6, 340, 0), { cols: 3, w: 108 });
});

test('el ızgarası: alçak ekranda kart alanın boyunu aşmaz, fazlası dikey kayar', () => {
  assert.deepEqual(fitGrid(5, 240, 150, true), { cols: 2, w: 105 });
  assert.deepEqual(fitGrid(1, 240, 150, true), { cols: 1, w: 105 });
  assert.deepEqual(fitGrid(4, 300, 60, true), { cols: 4, w: 64 }); // 64 pikselden küçülmez
});

test('kartlar: her kartın türü ve kısa kuralı var, kural harf sınırını aşmaz', () => {
  for (const id of Object.keys(CARDS)) {
    assert.ok(CARD_GROUPS[CARD_GROUP[id]], `${id}: tür`);
    assert.ok(CARD_SHORT[id], `${id}: kısa kural`);
    assert.ok(CARD_SHORT[id].length <= RULE_MAX, `${id}: "${CARD_SHORT[id]}" ${CARD_SHORT[id].length} harf`);
  }
  assert.deepEqual(Object.keys(CARD_GROUP).sort(), Object.keys(CARDS).sort());
  // Savunma kartları motorda tepki, ötekiler hamle.
  for (const id of Object.keys(CARDS)) assert.equal(CARD_GROUP[id] === 'savunma', CARDS[id].type === 'tepki', id);
});

test('kart yüzü: ad, kural, renk ve erişilebilir ad', () => {
  const s = String(cardFace('dava'));
  assert.match(s, /class="kart hamle g-saldiri/);
  assert.match(s, /--t:#d8283c/);
  assert.match(s, /aria-label="Dava Aç kartı, Saldırı: /);
  assert.match(s, /k-now/);
  assert.ok(emWidth('Müteahhit Dostu') > emWidth('İtiraz'));
});

test('tapu: set illeri, bina resimleri, kaçak ve af işareti', () => {
  const s = started(4);
  const props = OWNABLE.filter((q) => BOARD[q].kind === 'prop');
  const q = props[1];
  const g = BOARD[q].group;
  Object.assign(s.props[q], { owner: 0, kat: 1, kacak: 1 });
  let out = String(deed(s, q, { ladder: true, level: 2, w: 240 }));
  assert.ok(out.includes(setLine(q)) && setLine(q).includes(' · '));
  assert.ok(out.includes(`assets/bina/${g}/0.png`) && out.includes(`assets/bina/${g}/k1.png`));
  assert.ok(out.includes('üstü kaçak') && !out.includes('affedildi'));
  Object.assign(s.props[q], { kat: 2, kacak: 0, affed: true });
  out = String(deed(s, q, { ladder: true, level: 2 }));
  assert.ok(out.includes('kaçaktı, affedildi') && out.includes(`assets/bina/${g}/k1.png`));
  const tr = OWNABLE.find((x) => BOARD[x].kind === 'transport');
  out = String(deed(s, tr, { ladder: true }));
  assert.ok(out.includes('deed tr') && !out.includes('assets/bina'));
  assert.ok(String(deed(s, q, { mini: true, sel: true })).includes('mini sel'));
});
