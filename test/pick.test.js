import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, GROUPS, OWNABLE, price } from '../src/engine/index.js';
import { isBoardPickable, pickSquares, pickClick, tapuSquares } from '../src/ui/pick.js';
import { started, give, own } from './helpers.js';

// Her şehirden ilk mülk: tek başına set tamamlamaz.
const firstOf = Object.keys(GROUPS).map((g) => BOARD.findIndex((sq) => sq.group === g));
const [a, b, c] = firstOf;

const view = (s) => ({ ...s, you: 0 });

test('tahtadan secim yalniz mulk hedefli kartlarda acilir', () => {
  const s = started();
  assert.ok(isBoardPickable(give(s, 0, 'kamulastirma')));
  assert.ok(isBoardPickable(give(s, 0, 'takas')));
  assert.ok(!isBoardPickable(give(s, 0, 'taksi')));
});

test('Kamulastirma: rakip mulkleri parlar, tiklama karti hedefle oynatir', () => {
  const s = started();
  own(s, 0, a);
  own(s, 1, b);
  const uid = give(s, 0, 'kamulastirma');
  const v = view(s);
  assert.deepEqual(pickSquares(v, uid, null), [b]);
  assert.deepEqual(pickClick(v, uid, null, b), { play: { sq: b } });
  assert.equal(pickClick(v, uid, null, a), null, 'kendi mulkun secilemez');
});

test('Zorla Takas: once kendi mulkun, sonra rakibinki', () => {
  const s = started();
  own(s, 0, a);
  own(s, 1, b, c);
  const uid = give(s, 0, 'takas');
  const v = view(s);
  assert.deepEqual(pickSquares(v, uid, null), [a]);
  assert.equal(pickClick(v, uid, null, b), null, 'once vereceğin mulk secilmeli');
  assert.deepEqual(pickClick(v, uid, null, a), { swapMine: a });
  assert.deepEqual(pickSquares(v, uid, a).sort(), [b, c].sort());
  assert.deepEqual(pickClick(v, uid, a, c), { play: { mine: a, theirs: c } });
});

test('Tapu Dairesi: yalniz sirasi gelen oyuncuda parasi yeten sahipsiz kareler parlar', () => {
  const s = started();
  own(s, 1, a);
  s.pending = { type: 'tapu', p: 0 };
  const cheap = Math.min(...OWNABLE.filter((q) => q !== a).map((q) => price(s, q)));
  s.players[0].cash = cheap;
  const sq = tapuSquares(view(s));
  assert.ok(sq.length > 0 && !sq.includes(a), 'sahipli kare parlamaz');
  assert.ok(sq.every((q) => price(s, q) <= cheap), 'pahali kare parlamaz');
  assert.equal(tapuSquares({ ...s, you: 1 }), null, 'baskasinin tapusu');
  s.pending = null;
  assert.equal(tapuSquares(view(s)), null);
});
