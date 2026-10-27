import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewFor } from '../src/engine/index.js';
import { idleTurn } from '../src/ui/idle.js';
import { started, own, strip } from './helpers.js';

// Serbest evrede, sıra ilk oyuncuda, elinde kart yok.
function free(fn = () => {}) {
  const s = started();
  const p = s.turn.p;
  s.turn.step = 'free';
  s.turn.dice = [1, 2];
  s.pending = null;
  for (const id of new Set(s.players[p].hand.map((u) => u.split(':')[0]))) strip(s, p, id);
  fn(s, p);
  return { s, p };
}

test('turu kendiliğinden bitirme: yapacak bir şey yoksa evet, emin değilse hayır', () => {
  let { s, p } = free();
  assert.equal(idleTurn(viewFor(s, p)), true, 'mülksüz, kartsız: yapacak bir şey yok');
  assert.equal(idleTurn(viewFor(s, (p + 1) % s.players.length)), false, 'sıra başkasında');
  ({ s, p } = free((g, q) => own(g, q, 1)));
  assert.equal(idleTurn(viewFor(s, p)), false, 'kaçak kat dikebilir');
  ({ s, p } = free((g, q) => {
    own(g, q, 1);
    g.players[q].cash = 0;
  }));
  assert.equal(idleTurn(viewFor(s, p)), true, 'parası yetmiyor');
  ({ s, p } = free((g, q) => {
    own(g, q, 1);
    g.props[1].ipotek = true;
    g.props[1].kacak = 1;
  }));
  assert.equal(idleTurn(viewFor(s, p)), false, 'ipoteği kaldırabilir');
  ({ s, p } = free((g, q) => (g.players[q].cash = -10)));
  assert.equal(idleTurn(viewFor(s, p)), false, 'borçlu');
  ({ s, p } = free((g) => (g.turn.step = 'preroll')));
  assert.equal(idleTurn(viewFor(s, p)), false, 'zar atılmadı');
  ({ s, p } = free((g, q) => {
    const i = g.deck.findIndex((u) => u.startsWith('piyango:'));
    g.players[q].hand.push(...g.deck.splice(i, 1));
  }));
  assert.equal(idleTurn(viewFor(s, p)), false, 'oynanabilir kart var');
});
