import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, GROUPS, OWNABLE, price } from '../src/engine/index.js';
import { isBoardPickable, pickSquares, pickClick, tapuSquares, dropTargets } from '../src/ui/pick.js';
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

test('Kaldir-birak: kart, hedefin uzerine birakilinca o hedefle oynar', () => {
  const s = started();
  own(s, 0, a);
  own(s, 1, b, c);
  const v = view(s);
  const dest = (n) => (v.players[0].pos + n) % BOARD.length;
  const kam = dropTargets(v, give(s, 0, 'kamulastirma'), dest);
  assert.deepEqual([...kam.squares.entries()].sort(), [[b, { sq: b }], [c, { sq: c }]].sort());
  assert.equal(kam.players.size, 0);
  const tak = dropTargets(v, give(s, 0, 'takas'), dest);
  assert.deepEqual([...tak.squares.entries()], [[a, { swapMine: a }]], 'takasta once kendi mulkun');
  v.players.forEach((pl, i) => (pl.pos = [0, 5, 5, 9][i]));
  const dava = dropTargets(v, give(s, 0, 'dava'), dest);
  assert.deepEqual([...dava.players.keys()].sort(), [1, 2, 3]);
  assert.deepEqual([...dava.squares.entries()], [[9, { player: 3 }]], 'iki rakibin durdugu kare hedef degil');
  const taksi = dropTargets(v, give(s, 0, 'taksi'), dest);
  assert.equal(taksi.squares.size, 12);
  assert.deepEqual(taksi.squares.get(dest(5)), { steps: 5 });
  assert.equal(dropTargets(v, give(s, 0, 'piyango'), dest).squares.size, 0, 'hedefsiz kart tahtanin herhangi bir yerine birakilir');
});
