import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, defaultAction, moveOptions, cardBlock, cardTargets, viewFor, rentFor, rentBreakdown, buildBlock, netWorth, plotAt, boardOf, ZONES, MAHALLE, GUNDEM, GameError } from '../src/engine/index.js';
import { makePlayers, playBotGame } from '../tools/simlib.js';
import { act, actEv, give, stripAll } from './helpers.js';

// Mahalle oyunu; gündem ve kira etkileri sıfır, herkesin nakdi 1500, elde tepki kartı yok (beklemeler açılmasın).
function mh(n = 4, seed = 42) {
  const s = createGame({ players: makePlayers(n), seed, mode: 'mahalle' });
  s.index = 100;
  s.mods = {};
  s.groupMult = {};
  s.salary = MAHALLE.hakedis;
  for (const pl of s.players) pl.cash = 1500;
  stripAll(s, 'dayi');
  stripAll(s, 'itiraz');
  return s;
}

const P = plotAt;
const own = (s, p, ...qs) => qs.forEach((q) => (s.props[q].owner = p));
const at = (s, p, q) => (s.players[p].pos = q);
const dice = (s, a, b) => Object.assign(s.turn, { dice: [a, b], step: 'choose' });

// Sırası gelen herkes turu bitirir; yeni tur açılana kadar. Olaylar evs'e eklenir.
function nextRound(s, evs = []) {
  const r = s.round;
  while (s.round === r) {
    s.turn.step = 'free';
    s.pending = null;
    const x = actEv(s, s.turn.p, { type: 'endTurn' });
    evs.push(...x.events);
    s = x.state;
  }
  return s;
}

test('arazi: 36 arsa, bölgeler, fiyatlar, komşular', () => {
  const s = mh();
  const B = boardOf(s);
  assert.equal(B.squares.length, 36);
  assert.deepEqual(Object.fromEntries(Object.keys(ZONES).map((z) => [z, B.groupSquares[z].length])), { dis: 14, ic: 12, merkez: 4, kiyi: 6 });
  assert.equal(B.squares.reduce((t, q) => t + q.price, 0), 4560);
  assert.equal(B.squares[P(3, 5)].name, '3. satır 5. sütun');
  assert.equal(B.squares[P(3, 4)].group, 'merkez');
  assert.equal(B.squares[P(1, 6)].group, 'kiyi');
  assert.deepEqual(B.adj[P(1, 1)].sort(), [P(1, 2), P(2, 1)].sort());
  assert.equal(B.ring[P(3, 3)].length, 8);
});

test('kurulum: piyonlar dışarıda, 1 torpil, ilk oyuncuya hakediş, Ulaşıma Zam destede yok', () => {
  const s = createGame({ players: makePlayers(3), seed: 5, mode: 'mahalle' });
  assert.ok(s.players.every((pl) => pl.pos === null && pl.prev === null && pl.torpil === MAHALLE.torpilStart));
  assert.equal(s.players[0].cash, 1500 + MAHALLE.hakedis);
  assert.equal(s.salary, MAHALLE.hakedis);
  const all = [...s.gundemDeck, ...s.gundemDiscard];
  assert.ok(!all.some((u) => u.startsWith('ulasimZam:')));
  assert.equal(all.length, Object.values(GUNDEM).reduce((t, g) => t + g.count, 0) - GUNDEM.ulasimZam.count);
  assert.deepEqual({ park: s.props[0].park, avm: s.props[0].avm, gk: s.props[0].gk }, { park: false, avm: false, gk: null });
});

test('zar: (satır, sütun) ya da (sütun, satır) seçilir, piyon zıplar, süre dolunca ilki', () => {
  let s = mh();
  s = act(s, 0, { type: 'roll' });
  assert.equal(s.turn.step, 'choose');
  dice(s, 3, 5);
  assert.deepEqual(moveOptions(s), [P(3, 5), P(5, 3)]);
  assert.deepEqual(defaultAction(s, 0), { type: 'pick', sq: P(3, 5) });
  assert.throws(() => act(s, 0, { type: 'pick', sq: P(1, 1) }), GameError);
  const { state, events } = actEv(s, 0, { type: 'pick', sq: P(5, 3) });
  const mv = events.find((e) => e.type === 'move');
  assert.deepEqual({ path: mv.path, jump: mv.jump, from: mv.from }, { path: [P(5, 3)], jump: true, from: null });
  assert.equal(state.players[0].pos, P(5, 3));
  assert.deepEqual(state.pending, { type: 'buy', p: 0, sq: P(5, 3) });
});

test('çift: satırda ya da sütunda serbest seçim, 1 kart, ek atış yok', () => {
  let s = mh();
  s = act(s, 0, { type: 'roll' });
  dice(s, 2, 2);
  const opts = moveOptions(s);
  assert.equal(opts.length, 11);
  assert.ok(opts.every((q) => boardOf(s).squares[q].row === 2 || boardOf(s).squares[q].col === 2));
  const hand = s.players[0].hand.length;
  own(s, 0, P(2, 6));
  s = act(s, 0, { type: 'pick', sq: P(2, 6) });
  assert.equal(s.players[0].hand.length, hand + 1);
  s = act(s, 0, { type: 'endTurn' });
  assert.equal(s.turn.p, 1, 'çift atan bir daha oynamaz');
});

test('torpil: zar 1 oynar (1-6), sırada bir kez, çift yapılabilir', () => {
  let s = mh();
  s = act(s, 0, { type: 'roll' });
  dice(s, 1, 2);
  assert.throws(() => act(s, 0, { type: 'torpil', die: 0, delta: -1 }), GameError, '1 altına inmez');
  const { state, events } = actEv(s, 0, { type: 'torpil', die: 0, delta: 1 });
  assert.deepEqual(state.turn.dice, [2, 2]);
  assert.equal(state.players[0].torpil, MAHALLE.torpilStart - 1);
  assert.equal(events[0].type, 'torpil');
  assert.equal(moveOptions(state).length, 11);
  state.players[0].torpil = 1;
  assert.throws(() => act(state, 0, { type: 'torpil', die: 1, delta: 1 }), GameError, 'sırada bir kez');
  const s2 = mh();
  assert.throws(() => act(s2, 0, { type: 'torpil', die: 0, delta: 1 }), GameError, 'zar atılmadan olmaz');
});

test('kartlar: Kestirme bir zarı yeniden atar, Taksi satır/sütun, Geri Vites önceki arsa', () => {
  let s = mh();
  assert.ok(cardBlock(s, 0, 'taksi', { sq: P(1, 2) }), 'piyon dışarıdayken Taksi olmaz');
  assert.ok(cardBlock(s, 0, 'geriVites', {}));
  s = act(s, 0, { type: 'roll' });
  dice(s, 3, 3);
  const k = give(s, 0, 'kestirme');
  s = act(s, 0, { type: 'playCard', uid: k, target: { die: 1 } });
  assert.equal(s.turn.step, 'choose');
  assert.equal(s.turn.dice[0], 3);

  s = mh();
  at(s, 0, P(2, 3));
  s.players[0].prev = P(5, 5);
  assert.equal(cardTargets(s, 0, 'taksi').length, 10);
  assert.ok(cardBlock(s, 0, 'taksi', { sq: P(3, 4) }), 'çaprazdaki arsa olmaz');
  const t = give(s, 0, 'taksi');
  let s1 = act(s, 0, { type: 'playCard', uid: t, target: { sq: P(2, 6) } });
  assert.equal(s1.players[0].pos, P(2, 6));
  assert.equal(s1.players[0].prev, P(2, 3));
  assert.equal(s1.turn.step, 'free');
  const g = give(s, 0, 'geriVites');
  s1 = act(s, 0, { type: 'playCard', uid: g });
  assert.equal(s1.players[0].pos, P(5, 5));
});

test('inşaat: yalnız piyonun yanında; yasal kat komşu ister, eşitlik yok; kaçak şart aramaz', () => {
  const s = mh();
  own(s, 0, P(3, 3), P(3, 4), P(5, 5));
  at(s, 0, P(3, 3));
  assert.equal(buildBlock(s, 0, P(3, 3), false), null);
  assert.equal(buildBlock(s, 0, P(3, 4), false), null, 'komşu arsada da');
  assert.match(buildBlock(s, 0, P(5, 5), false), /piyonunun/);
  s.props[P(3, 3)].kat = 3;
  assert.equal(buildBlock(s, 0, P(3, 3), false), null, 'eşitlik kuralı yok');
  at(s, 0, P(5, 5));
  assert.match(buildBlock(s, 0, P(5, 5), false), /komşu/);
  assert.equal(buildBlock(s, 0, P(5, 5), true), null, 'kaçak kat komşu istemez');
  s.players[0].pos = null;
  assert.match(buildBlock(s, 0, P(3, 3), false), /piyonunun/);
});

test('kira: cetvel x3, kıyı, blok, site, park ve gecekondu çarpanları; arsada hangileri işlediği görünür', () => {
  const s = mh();
  const R = MAHALLE.rent;
  own(s, 0, P(1, 2));
  assert.equal(rentFor(s, P(1, 2)), Math.round((4 * R) / 5) * 5, 'boş dış arsa: küçük arsa kirası, 5e yuvarlanır');
  own(s, 0, P(1, 6));
  assert.deepEqual(rentBreakdown(s, P(1, 6)).items, [{ key: 'kiyi', mult: 1.25 }]);
  assert.equal(rentFor(s, P(1, 6)), 45);
  // Blok: iki komşu benim.
  own(s, 0, P(1, 1), P(1, 3));
  assert.deepEqual(rentBreakdown(s, P(1, 2)).items.map((x) => x.key), ['blok']);
  // Site: 2x2'nin dördü benim ve hepsinde kat var.
  own(s, 1, P(3, 3), P(3, 4), P(4, 3), P(4, 4));
  for (const q of [P(3, 3), P(3, 4), P(4, 3), P(4, 4)]) s.props[q].kat = 1;
  const b = rentBreakdown(s, P(3, 3));
  assert.deepEqual(b.items.map((x) => x.key), ['site', 'blok']);
  assert.equal(b.amount, 80 * R * 2 * 1.25);
  // Park komşusu +%50, gecekondu komşusu -%25.
  own(s, 2, P(2, 3));
  s.props[P(2, 3)].park = true;
  s.props[P(3, 2)].gk = { p: 3, cost: 25 };
  const c = rentBreakdown(s, P(3, 3));
  assert.deepEqual(c.items.map((x) => x.key), ['site', 'blok', 'park', 'gecekondu']);
  assert.equal(c.amount, Math.round((80 * R * 2 * 1.25 * 1.5 * 0.75) / 5) * 5);
  assert.equal(rentFor(s, P(2, 3)), 0, 'park kira almaz');
  assert.equal(rentBreakdown(s, P(2, 3)).none, 'park');
  s.mods.turizm = true;
  assert.ok(rentBreakdown(s, P(1, 6)).items.some((x) => x.key === 'turizm'));
});

test('park: kendi boş arsana, bedeli 1 kat; ipotek edilmez, kat dikilmez, park arsasında kira yok', () => {
  let s = mh();
  own(s, 0, P(2, 2), P(2, 3));
  at(s, 0, P(2, 2));
  s.props[P(2, 3)].kat = 1;
  assert.throws(() => act(s, 0, { type: 'park', sq: P(2, 3) }), GameError, 'katlı arsaya park olmaz');
  s = act(s, 0, { type: 'park', sq: P(2, 2) });
  assert.equal(s.props[P(2, 2)].park, true);
  assert.equal(s.players[0].cash, 1400);
  assert.equal(s.players[0].stats.park, 1);
  assert.throws(() => act(s, 0, { type: 'mortgage', sq: P(2, 2) }), GameError);
  assert.match(buildBlock(s, 0, P(2, 2), false), /Park/);
  s.turn.step = 'free';
  s = act(s, 0, { type: 'endTurn' });
  s = act(s, 1, { type: 'roll' });
  dice(s, 2, 2);
  const r = actEv(s, 1, { type: 'pick', sq: P(2, 2) });
  assert.ok(!r.events.some((e) => e.type === 'money' && e.from === 1), 'park arsasına gelmek kira doğurmaz');
  assert.equal(r.state.pending, null);
});

test('gecekondu: sahipsiz arsaya kondurulur, en çok 3; alan tahliye bedeli öder', () => {
  let s = mh();
  s = act(s, 0, { type: 'roll' });
  dice(s, 1, 2);
  s = act(s, 0, { type: 'pick', sq: P(1, 2) });
  s = act(s, 0, { type: 'gecekondu' });
  assert.deepEqual(s.props[P(1, 2)].gk, { p: 0, cost: 15 });
  assert.equal(s.props[P(1, 2)].owner, null);
  assert.equal(s.players[0].cash, 1485);
  assert.equal(s.players[0].stats.gecekondu, 1);
  s = act(s, 0, { type: 'endTurn' });
  // Oyuncu 1 gecekondulu arsayı alır: fiyat + 2 x 15 tahliye, kondurana gider.
  s = act(s, 1, { type: 'roll' });
  dice(s, 2, 1);
  s = act(s, 1, { type: 'pick', sq: P(1, 2) });
  const c0 = s.players[0].cash;
  const c1 = s.players[1].cash;
  const r = actEv(s, 1, { type: 'buy' });
  assert.equal(r.state.props[P(1, 2)].gk, null);
  assert.equal(r.state.props[P(1, 2)].owner, 1);
  assert.equal(c1 - r.state.players[1].cash, 80 + 30);
  assert.equal(r.state.players[0].cash - c0, 30);
  assert.ok(r.events.some((e) => e.type === 'evict' && e.p === 0 && e.by === 1));
  // Sınır: 3 gecekondusu olan yenisini konduramaz.
  for (const q of [P(5, 5), P(5, 4), P(5, 3)]) s.props[q].gk = { p: 1, cost: 25 };
  s.pending = { type: 'buy', p: 1, sq: P(1, 2) };
  s.props[P(1, 2)].gk = null;
  assert.throws(() => act(s, 1, { type: 'gecekondu' }), /En çok 3/);
});

test('gecekondu geliri sıra başında gelir; konduran kendi alırsa tahliye yok', () => {
  let s = mh();
  s.props[P(1, 2)].gk = { p: 1, cost: 15 };
  s.props[P(5, 5)].gk = { p: 1, cost: 25 };
  const c = s.players[1].cash;
  s.turn.step = 'free';
  s = act(s, 0, { type: 'endTurn' });
  assert.equal(s.players[1].cash - c, MAHALLE.hakedis + 2 * MAHALLE.gecekonduIncome);
  s = act(s, 1, { type: 'roll' });
  dice(s, 1, 2);
  s = act(s, 1, { type: 'pick', sq: P(1, 2) });
  const before = s.players[1].cash;
  s = act(s, 1, { type: 'buy' });
  assert.equal(before - s.players[1].cash, 80);
  assert.equal(s.props[P(1, 2)].gk, null);
});

test('İhbar gecekonduları da yıkar; İmar Affı tapu verir; Operasyon yıkar; Deprem sayar', () => {
  let s = mh();
  own(s, 1, P(2, 2));
  s.props[P(2, 2)].kacak = 1;
  s.props[P(5, 5)].gk = { p: 1, cost: 25 };
  s.props[P(5, 4)].gk = { p: 2, cost: 25 };
  assert.equal(cardBlock(s, 0, 'ihbar', { player: 2 }), null, 'yalnız gecekondusu olan da ihbar edilir');
  const uid = give(s, 0, 'ihbar');
  const c = s.players[1].cash;
  const r = actEv(s, 0, { type: 'playCard', uid, target: { player: 1 } });
  assert.equal(r.state.props[P(2, 2)].kacak, 0);
  assert.equal(r.state.props[P(5, 5)].gk, null);
  assert.equal(r.state.props[P(5, 4)].gk.p, 2);
  assert.equal(c - r.state.players[1].cash, 50);
  const d = r.events.find((e) => e.type === 'demolish');
  assert.deepEqual({ n: d.n, gk: d.gk }, { n: 1, gk: 1 });

  const withGundem = (id, evs) => {
    const t = mh();
    t.props[P(5, 5)].gk = { p: 1, cost: 25 };
    t.gundem = null;
    t.gundemDeck = t.gundemDeck.filter((u) => u !== `${id}:0`);
    t.gundemDiscard = t.gundemDiscard.filter((u) => u !== `${id}:0`);
    t.gundemDeck.push(`${id}:0`);
    return nextRound(t, evs);
  };
  let t = withGundem('imarAffi');
  assert.deepEqual([t.props[P(5, 5)].owner, t.props[P(5, 5)].kat, t.props[P(5, 5)].gk, t.props[P(5, 5)].affed], [1, 1, null, true]);
  t = withGundem('operasyon');
  assert.equal(t.props[P(5, 5)].gk, null);
  assert.equal(t.props[P(5, 5)].owner, null);
  const evs = [];
  withGundem('deprem', evs);
  assert.equal(evs.find((e) => e.type === 'money' && e.from === 1 && e.why === 'Deprem güçlendirmesi').amount, 30, 'gecekondu kaçak kat gibi');
  t = withGundem('asgari');
  assert.equal(t.salary, MAHALLE.hakedis + MAHALLE.asgari);
});

test('her 3 turda herkese 1 kart; torpil 10. turda', () => {
  let s = mh();
  s.config.rules.gundem = false;
  s.gundem = null;
  for (const pl of s.players) pl.hand = pl.hand.slice(0, 1);
  s = nextRound(s);
  s = nextRound(s);
  const hands = s.players.map((pl) => pl.hand.length);
  const { state, events } = (() => {
    let t = s;
    const r = t.round;
    let evs = [];
    while (t.round === r) {
      t.turn.step = 'free';
      const x = actEv(t, t.turn.p, { type: 'endTurn' });
      evs = evs.concat(x.events);
      t = x.state;
    }
    return { state: t, events: evs };
  })();
  assert.equal(state.round, 4);
  assert.deepEqual(events.find((e) => e.type === 'grant'), { type: 'grant', card: true, torpil: false, text: 'Herkese 1 kart dağıtıldı.' });
  assert.deepEqual(state.players.map((pl) => pl.hand.length), hands.map((h) => h + 1));
  let u = state;
  for (let i = 0; i < 6; i++) u = nextRound(u);
  assert.equal(u.round, 10);
  assert.ok(u.players.every((pl) => pl.torpil === Math.min(MAHALLE.torpilMax, MAHALLE.torpilStart + 1)));
});

test('Kamulaştırma ve Takas: parklı, katlı ve sitedeki arsaya oynanmaz; Müteahhit komşu ister', () => {
  const s = mh();
  own(s, 1, P(2, 2), P(2, 3), P(3, 2), P(3, 3), P(5, 5));
  s.props[P(5, 5)].park = true;
  assert.match(cardBlock(s, 0, 'kamulastirma', { sq: P(5, 5) }), /Parklı/);
  assert.equal(cardBlock(s, 0, 'kamulastirma', { sq: P(2, 2) }), null);
  for (const q of [P(2, 2), P(2, 3), P(3, 2), P(3, 3)]) s.props[q].kacak = 1;
  assert.match(cardBlock(s, 0, 'kamulastirma', { sq: P(2, 2) }), /Katlı/);
  own(s, 0, P(6, 1));
  assert.ok(cardTargets(s, 0, 'takas').every((t) => t.theirs !== P(5, 5)));
  assert.match(cardBlock(s, 0, 'muteahhit', { sq: P(6, 1) }), /komşu/);
  own(s, 0, P(6, 2));
  assert.equal(cardBlock(s, 0, 'muteahhit', { sq: P(6, 1) }), null);
});

test('puan: AVM 4 kat sayılır, park arsası fiyatıyla, gecekondu değere girmez; görünüm eli gizler', () => {
  const s = mh();
  own(s, 0, P(3, 3), P(1, 1));
  Object.assign(s.props[P(3, 3)], { kat: 4, avm: true });
  s.props[P(1, 1)].park = true;
  s.props[P(5, 5)].gk = { p: 0, cost: 25 };
  assert.equal(netWorth(s, 0), 1500 + 200 + 4 * 100 + 80);
  const v = viewFor(s, 1);
  assert.deepEqual(v.players[0].hand, []);
  assert.equal(v.props[P(3, 3)].avm, true);
  assert.equal(v.players[0].torpil, s.players[0].torpil);
});

test('Mahalle: 25 bot oyunu tutarlı biter, 20 tur sürer; gecekondu, park ve AVM kullanılır', () => {
  const used = { gecekondu: 0, park: 0, avm: 0 };
  for (let g = 0; g < 25; g++) {
    const n = 2 + (g % 5);
    const config = g % 5 === 4 ? { mode: 'mahalle', iflas: true } : { mode: 'mahalle' };
    const { state, counts } = playBotGame(3000 + g, n, config, g % 3 === 0 ? ['zor', 'kolay'] : []);
    assert.equal(state.phase, 'over');
    assert.equal(state.results.ranking.length, n);
    if (!config.iflas) assert.equal(state.round, 20);
    for (const k of Object.keys(used)) used[k] += counts[k];
  }
  assert.ok(used.gecekondu > 25 && used.park > 10 && used.avm > 25, JSON.stringify(used));
});
