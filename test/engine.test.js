import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, defaultAction, botAction, cardBlock, viewFor, waitingFor, rentFor, price, netWorth, scoreOf, BOARD, SURPRIZ, GameError } from '../src/engine/index.js';
import { makePlayers } from '../tools/simlib.js';
import { started, act, actEv, give, strip, own } from './helpers.js';

// Gündem kartının etkisini sıfırlayıp ekonomiyi öngörülebilir yapar.
function calm(s) {
  s.index = 100;
  s.mods = {};
  s.groupMult = {};
  s.salary = 200;
  for (const pl of s.players) pl.cash = 1500;
  return s;
}

const taksi = (s, p, steps) => act(s, p, { type: 'playCard', uid: give(s, p, 'taksi'), target: { steps } });

test('kurulum: el ve ilk tur, oyun hemen başlar', () => {
  const s = createGame({ players: makePlayers(5), seed: 7 });
  for (const pl of s.players.slice(1)) assert.equal(pl.hand.length, 3);
  assert.equal(s.pending, null);
  assert.deepEqual(waitingFor(s), [0]);
  assert.equal(s.phase, 'play');
  assert.equal(s.round, 1);
  assert.ok(s.gundem.id);
  assert.equal(s.turn.p, 0);
  assert.equal(s.turn.step, 'preroll');
  assert.ok(s.players[0].hand.length >= 4, 'sıra başında kart çekilir');
});

test('aynı tohum aynı oyunu üretir', () => {
  const a = started(4, 99);
  const b = started(4, 99);
  assert.deepEqual(a, b);
});

test('başkasının hamlesi ve sıra dışı hamle reddedilir', () => {
  const s = started();
  assert.throws(() => applyAction(s, 1, { type: 'roll' }), GameError);
  assert.throws(() => applyAction(s, 0, { type: 'endTurn' }), /Önce zar/);
  assert.throws(() => applyAction(s, 0, { type: 'hackle' }), GameError);
});

test('zar: toplam kadar ilerler ve sıra serbest evreye geçer', () => {
  let s = calm(started());
  strip(s, 0, 'kestirme');
  const from = s.players[0].pos;
  const r = actEv(s, 0, { type: 'roll' });
  s = r.state;
  const [a, b] = s.turn.dice;
  assert.equal(s.players[0].pos, (from + a + b) % BOARD.length);
  assert.equal(s.turn.step, 'free');
  assert.ok(r.events.some((e) => e.type === 'move'));
});

test('Kestirme: zarlardan biriyle ilerlenir', () => {
  let s = calm(started(4, 42, { rules: { surpriz: false } }));
  const uid = give(s, 0, 'kestirme');
  s = act(s, 0, { type: 'roll' });
  assert.equal(s.turn.step, 'choose');
  const die = s.turn.dice[1];
  s = act(s, 0, { type: 'playCard', uid, target: { die: 1 } });
  assert.equal(s.players[0].pos, die);
});

test('satın alma ve maaş', () => {
  let s = calm(started());
  s = taksi(s, 0, 1);
  assert.equal(s.pending.type, 'buy');
  s = act(s, 0, { type: 'buy' });
  assert.equal(s.props[1].owner, 0);
  assert.equal(s.players[0].cash, 1500 - 60);
  // Turu bitirip başa geçince maaş
  s.players[0].pos = 34;
  s.turn = { ...s.turn, step: 'preroll', hamle: false };
  s = taksi(s, 0, 3);
  assert.equal(s.players[0].pos, 1);
  assert.equal(s.players[0].cash, 1500 - 60 + 200);
});

test('kira: set, kat seviyesi, ipotek, tedbir ve gündem çarpanları', () => {
  const s = calm(started());
  own(s, 1, 28);
  assert.equal(rentFor(s, 28), 25, 'Monopoly cetveli 26, 5e yuvarlanır');
  own(s, 1, 30, 32);
  assert.equal(rentFor(s, 28), 50, 'tam set temel kirayı ikiye katlar');
  s.props[28].kat = 2;
  assert.equal(rentFor(s, 28), 390);
  s.props[28].kacak = 1;
  assert.equal(rentFor(s, 28), 900);
  s.mods.turizm = true;
  assert.equal(rentFor(s, 28), 1800);
  s.mods = {};
  s.index = 115;
  assert.equal(rentFor(s, 28), 1035);
  s.props[28].tedbir = 1;
  assert.equal(rentFor(s, 28), 0);
  s.props[30].ipotek = true;
  assert.equal(rentFor(s, 30), 0);
});

test('havalimanı kirası her biri için ikiye katlanır, gar kirası orantılı artar', () => {
  const s = calm(started());
  const air = [7, 16, 25, 34];
  const rail = [4, 13, 22, 31];
  assert.ok(air.every((q) => BOARD[q].mode === 'air') && rail.every((q) => BOARD[q].mode === 'rail'));
  [25, 50, 100, 200].forEach((rent, i) => {
    own(s, 2, air[i]);
    assert.equal(rentFor(s, air[0]), rent, `${i + 1} havalimanı`);
  });
  [30, 60, 90, 120].forEach((rent, i) => {
    own(s, 3, rail[i]);
    assert.equal(rentFor(s, rail[0]), rent, `${i + 1} gar`);
  });
  own(s, 3, air[3]);
  assert.equal(rentFor(s, air[0]), 100, 'başkasına geçen havalimanı sayılmaz');
  assert.equal(rentFor(s, rail[0]), 120, 'havalimanı gar sayısını etkilemez');
  s.props[rail[1]].ipotek = true;
  assert.equal(rentFor(s, rail[0]), 90, 'ipotekli gar sayılmaz');
  s.mods.ulasimZam = true;
  assert.equal(rentFor(s, air[0]), 200, 'Ulaşıma Zam: 2 katı');
});

test('kiraya gelen oyuncu öder; Kira Zammı ikiye katlar', () => {
  let s = calm(started());
  own(s, 1, 5);
  s.players[1].kiraZammi = true;
  strip(s, 0, 'dayi');
  s = taksi(s, 0, 5);
  assert.equal(s.players[0].cash, 1500 - 10, 'arsa kirası 6 -> 5, zamla 10');
  assert.equal(s.players[1].cash, 1500 + 10);
  assert.equal(s.players[1].kiraZammi, false, 'zam bir kez kullanılır');
});

test('Dayın Çıktı ile kira ödenmez', () => {
  let s = calm(started());
  own(s, 1, 5);
  const dayi = give(s, 0, 'dayi');
  s = taksi(s, 0, 5);
  assert.equal(s.pending.type, 'rent');
  s = act(s, 0, { type: 'react', uid: dayi });
  assert.equal(s.players[0].cash, 1500);
  assert.equal(s.pending, null);
});

test('açık artırma: sırayla artır ya da çekil, son kalan kazanır', () => {
  let s = calm(started(4));
  s = taksi(s, 0, 2);
  s = act(s, 0, { type: 'decline' });
  assert.equal(s.pending.type, 'auction');
  assert.deepEqual(waitingFor(s), [1], 'reddedenden sonraki oyuncu başlar');
  assert.throws(() => applyAction(s, 1, { type: 'raise', amount: 5 }), /En az/);
  s = act(s, 1, { type: 'raise', amount: 40 });
  assert.deepEqual(waitingFor(s), [2]);
  s = act(s, 2, { type: 'pass' });
  s = act(s, 3, { type: 'raise', amount: 60 });
  s = act(s, 0, { type: 'raise', amount: 70 });
  assert.deepEqual(waitingFor(s), [1], 'reddeden de katılır, çekilen atlanır');
  assert.equal(viewFor(s, 2).pending.high, 70, 'teklifler herkese açık');
  s = act(s, 1, { type: 'pass' });
  s = act(s, 3, { type: 'pass' });
  assert.equal(s.pending, null, 'lider dışında herkes çekilince biter');
  assert.equal(s.props[2].owner, 0);
  assert.equal(s.players[0].cash, 1500 - 70);
});

test('açık artırma: teklif yoksa sahipsiz kalır, süre dolunca çekilir, nakdi yetmeyen çekilir', () => {
  let s = calm(started(4));
  s = taksi(s, 0, 2);
  s = act(s, 0, { type: 'decline' });
  for (let k = 0; k < 4; k++) s = act(s, waitingFor(s)[0], defaultAction(s, waitingFor(s)[0]));
  assert.equal(s.pending, null);
  assert.equal(s.props[2].owner, null);
  let t = calm(started(4));
  t.players[2].cash = 30;
  t = taksi(t, 0, 2);
  t = act(t, 0, { type: 'decline' });
  t = act(t, 1, { type: 'raise', amount: 40 });
  assert.deepEqual(waitingFor(t), [3], 'nakdi 50 teklife yetmeyen sıra almaz');
  assert.ok(t.pending.out.includes(2));
});

test('İtiraz zinciri: itiraza karşı itiraz kartı geçirir', () => {
  let s = calm(started());
  own(s, 1, 5);
  for (const p of [0, 1]) strip(s, p, 'itiraz');
  const kam = give(s, 0, 'kamulastirma');
  const it1 = give(s, 1, 'itiraz');
  const it0 = give(s, 0, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: kam, target: { sq: 5 } });
  assert.equal(s.pending.type, 'react');
  assert.deepEqual(waitingFor(s), [1]);
  s = act(s, 1, { type: 'react', uid: it1 });
  assert.deepEqual(waitingFor(s), [0], 'saldıran karşı itiraz edebilir');
  s = act(s, 0, { type: 'react', uid: it0 });
  assert.equal(s.pending, null);
  assert.equal(s.props[5].owner, 0);
  assert.equal(s.players[1].cash, 1500 + 100);
});

test('İtiraz kartı iptal eder; turda tek Hamle kuralı', () => {
  let s = calm(started());
  own(s, 1, 5);
  strip(s, 0, 'itiraz');
  const ted = give(s, 0, 'tedbir');
  const it = give(s, 1, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: ted, target: { sq: 5 } });
  s = act(s, 1, { type: 'react', uid: it });
  assert.equal(s.props[5].tedbir, 0);
  assert.throws(() => applyAction(s, 0, { type: 'playCard', uid: give(s, 0, 'piyango') }), /zaten bir Hamle/);
});

test('Aidat Günü her rakipten ayrı ayrı alınır', () => {
  let s = calm(started(4));
  for (let p = 0; p < 4; p++) strip(s, p, 'itiraz');
  const it = give(s, 2, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: give(s, 0, 'aidat') });
  assert.deepEqual(waitingFor(s), [2]);
  s = act(s, 2, { type: 'react', uid: it });
  assert.equal(s.players[0].cash, 1500 + 60);
  assert.equal(s.players[2].cash, 1500);
});

test('kaçak kat, ihbar cezası ve imar affı', () => {
  let s = calm(started());
  own(s, 0, 24);
  s = act(s, 0, { type: 'buildKacak', sq: 24 });
  assert.equal(s.props[24].kacak, 1);
  assert.equal(s.players[0].cash, 1500 - 75);
  assert.equal(rentFor(s, 24), 55, 'set dışı mülkte kat kirası yarı');
  assert.throws(() => applyAction(s, 0, { type: 'build', sq: 24 }), /tüm mülkleri/);
  // Rakip ihbar eder
  s.turn = { ...s.turn, p: 1, hamle: false };
  strip(s, 0, 'itiraz');
  s = act(s, 1, { type: 'playCard', uid: give(s, 1, 'ihbar'), target: { player: 0 } });
  assert.equal(s.props[24].kacak, 0);
  assert.equal(s.players[0].cash, 1500 - 75 - 25);
});

test('yasal kat set ister; kat satışı yarı fiyat; ipotek', () => {
  let s = calm(started());
  own(s, 0, 1, 2);
  s = act(s, 0, { type: 'build', sq: 1 });
  s = act(s, 0, { type: 'build', sq: 1 });
  assert.equal(s.props[1].kat, 2);
  assert.equal(s.players[0].cash, 1400);
  assert.throws(() => applyAction(s, 0, { type: 'mortgage', sq: 1 }), /katları/);
  s = act(s, 0, { type: 'sellFloor', sq: 1 });
  assert.equal(s.players[0].cash, 1425);
  s = act(s, 0, { type: 'mortgage', sq: 2 });
  assert.equal(s.players[0].cash, 1465);
  assert.throws(() => applyAction(s, 0, { type: 'build', sq: 1 }), /ipotekli/);
  s = act(s, 0, { type: 'unmortgage', sq: 2 });
  assert.equal(s.players[0].cash, 1465 - 45);
});

test('borç: tur bitmez, Borcu Kapat satar ve ipotek eder, gerekirse konkordato', () => {
  let s = calm(started());
  strip(s, 0, 'kestirme');
  own(s, 0, 1, 2);
  s.props[1].kat = 1;
  s = act(s, 0, { type: 'roll' });
  while (s.pending) s = act(s, waitingFor(s)[0], defaultFor(s));
  s.players[0].cash = -50;
  assert.throws(() => applyAction(s, 0, { type: 'endTurn' }), /Borcun var/);
  s = act(s, 0, { type: 'settleDebt' });
  assert.equal(s.props[1].kat, 0);
  assert.ok(s.props[1].ipotek, 'önce kat satılır, sonra en ucuz mülk ipotek edilir');
  assert.ok(s.players[0].cash >= 0);
  assert.equal(s.players[0].konkordato, 0);
  s.players[0].cash = -5000;
  s = act(s, 0, { type: 'settleDebt' });
  assert.equal(s.players[0].cash, 0);
  assert.equal(s.players[0].konkordato, 1);
});

function defaultFor(s) {
  const pd = s.pending;
  if (pd.type === 'buy') return { type: 'decline' };
  if (pd.type === 'auction') return { type: 'pass' };
  if (pd.type === 'rent' || pd.type === 'react') return { type: 'react', uid: null };
  if (pd.type === 'tapu') return { type: 'tapuBuy', sq: null };
  if (pd.type === 'zabita') return { type: 'zabitaTarget', target: pd.options[0] };
  throw new Error(pd.type);
}

test('pazarlık: kabul, ret ve katlı mülk yasağı', () => {
  let s = calm(started());
  own(s, 1, 10);
  own(s, 0, 12);
  s = act(s, 0, { type: 'proposeTrade', to: 1, give: { cash: 200, props: [] }, take: { cash: 0, props: [10] } });
  assert.deepEqual(waitingFor(s), [1]);
  s = act(s, 1, { type: 'tradeRespond', accept: true });
  assert.equal(s.props[10].owner, 0);
  assert.equal(s.players[0].cash, 1300);
  assert.equal(s.players[1].cash, 1700);
  s = act(s, 0, { type: 'build', sq: 10 });
  assert.throws(() => applyAction(s, 0, { type: 'proposeTrade', to: 1, give: { props: [10] }, take: { cash: 10 } }), /katsız/);
  s = act(s, 0, { type: 'proposeTrade', to: 2, give: { cash: 10 }, take: {} });
  s = act(s, 2, { type: 'tradeRespond', accept: false });
  assert.equal(s.players[0].cash, 1300 - 100);
});

test('görünüm: başkasının eli gizli', () => {
  const s = started(4);
  const v = viewFor(s, 1);
  assert.deepEqual(v.players[0].hand, []);
  assert.ok(v.players[0].handCount > 0);
  assert.equal(v.players[1].hand.length, s.players[1].hand.length);
  assert.equal(typeof v.deck, 'number');
  assert.equal(v.rng, 0);
});

test('el sınırı: fazla kart tur sonunda atılır', () => {
  let s = calm(started());
  strip(s, 0, 'kestirme');
  const fill = ['dava', 'takas', 'ihbar', 'tedbir', 'aidat', 'piyango'];
  for (let i = 0; s.players[0].hand.length < 9; i++) give(s, 0, fill[i % fill.length]);
  s = act(s, 0, { type: 'roll' });
  while (s.pending) s = act(s, waitingFor(s)[0], defaultFor(s));
  const n = s.players[0].hand.length;
  s = act(s, 0, { type: 'endTurn' });
  assert.equal(s.pending.type, 'discard');
  assert.equal(s.pending.count, n - 6);
  s = act(s, 0, { type: 'discard', uids: s.players[0].hand.slice(0, n - 6) });
  assert.equal(s.players[0].hand.length, 6);
  assert.equal(s.turn.p, 1);
});

test('puan: net değerden konkordato cezası düşer', () => {
  const s = calm(started(4));
  own(s, 0, 1, 2);
  s.players[0].konkordato = 1;
  const sc = scoreOf(s, 0);
  assert.equal(sc.total, netWorth(s, 0) - 300);
  assert.equal(netWorth(s, 0), 1500 + price(s, 1) + price(s, 2));
});

// Kart oynamadan, satın almadan sırayı ilerleten en basit hamle.
function simpleStep(s) {
  const p = waitingFor(s)[0];
  const pd = s.pending;
  let a;
  if (pd?.type === 'discard') a = { type: 'discard', uids: s.players[p].hand.slice(0, pd.count) };
  else if (pd) a = defaultFor(s);
  else if (s.turn.step === 'preroll') a = { type: 'roll' };
  else if (s.turn.step === 'choose') a = { type: 'move', steps: s.turn.dice[0] + s.turn.dice[1] };
  else if (s.players[p].cash < 0) a = { type: 'settleDebt' };
  else a = { type: 'endTurn' };
  return actEv(s, p, a);
}

test('oyun son turun sonunda biter ve sıralama üretir', () => {
  let s = started(3, 5, { maxRounds: 2 });
  let guard = 0;
  while (s.phase !== 'over' && guard++ < 500) s = simpleStep(s).state;
  assert.equal(s.phase, 'over');
  assert.equal(s.round, 2);
  assert.equal(s.results.ranking.length, 3);
  assert.ok(viewFor(s, 0).players[1].hand, 'oyun sonunda eller açılır');
  assert.equal(s.worth.length, 3, 'oyun başı + her tur sonu net değer');
  assert.deepEqual(s.worth[0], [s.config.startCash, s.config.startCash, s.config.startCash]);
  assert.deepEqual(s.worth[2], s.players.map((_, p) => netWorth(s, p)));
  assert.deepEqual(viewFor(s, 1).worth, s.worth);
});

test('tur özeti: net değer farkı ve el değiştiren mülkler', () => {
  let s = started(3, 5);
  own(s, 0, 8);
  s.roundStart.owners[8] = 0;
  s.roundStart.net[0] = netWorth(s, 0);
  own(s, 1, 8);
  let ev = null;
  let guard = 0;
  while (s.round === 1 && guard++ < 200) {
    const r = simpleStep(s);
    ev = r.events.find((e) => e.type === 'summary') || ev;
    s = r.state;
  }
  assert.ok(ev, 'tur sonunda özet olayı yayınlanır');
  assert.match(ev.text, /^1\. tur özeti: /);
  assert.equal(s.summary.round, 1);
  assert.deepEqual(s.summary.changes, [{ sq: 8, from: 0, to: 1 }]);
  assert.ok(ev.text.includes(`${BOARD[8].name} (${s.players[0].name} → ${s.players[1].name})`));
  const top = Math.max(...s.summary.deltas);
  assert.equal(s.summary.deltas[s.summary.best], top);
  assert.ok(s.summary.deltas[0] < 0, 'mülkünü kaybeden net değer kaybeder');
});

// SÜRPRİZ karesine (3) Taksi ile gelir; rng'yi tarayıp istenen etkiyi çıkaran durumu döndürür.
function surprizWith(id, prep = () => {}) {
  for (let k = 1; k < 2000; k++) {
    const s = calm(started());
    prep(s);
    s.rng = k;
    const r = applyAction(s, 0, { type: 'playCard', uid: give(s, 0, 'taksi'), target: { steps: 3 } });
    const ev = r.events.find((e) => e.type === 'surpriz');
    if (ev && ev.id === id) return { before: s, after: r.state, events: r.events };
  }
  throw new Error(`etki bulunamadı: ${id}`);
}

test('SÜRPRİZ: her etki çıkabilir ve seçim beklemeden uygulanır', () => {
  assert.equal(BOARD.filter((q) => q.kind === 'surpriz').length, 2);
  assert.ok(Object.keys(SURPRIZ).length >= 10);
  for (const id of Object.keys(SURPRIZ)) {
    const { after } = surprizWith(id);
    assert.ok(!after.pending || ['buy', 'rent', 'tapu', 'zabita'].includes(after.pending.type), `${id}: seçim beklemez`);
  }
});

test('SÜRPRİZ: para, kart ve mülk etkileri', () => {
  let r = surprizWith('miras');
  assert.equal(r.after.players[0].cash, 1500 + 150);
  r = surprizWith('dugun');
  assert.equal(r.after.players[0].cash, 1500 + 25 * 3);
  r = surprizWith('tarla');
  assert.equal(r.after.props[1].owner, 0, 'en ucuz sahipsiz mülk İskilip');
  r = surprizWith('kapkac');
  const hand = (st) => st.players.reduce((n, pl) => n + pl.hand.length, 0);
  assert.equal(r.after.players[0].hand.length, r.before.players[0].hand.length, 'Taksi gitti, kapılan kart geldi');
  assert.equal(hand(r.after), hand(r.before) - 1, 'kart masadan kaybolmaz');
  r = surprizWith('catlak', (s) => {
    own(s, 0, 1);
    s.props[1].kat = 2;
    s.props[1].kacak = 1;
  });
  assert.equal(r.after.props[1].kacak, 0, 'önce kaçak kat çöker');
  assert.equal(r.after.props[1].kat, 2);
});

test('SÜRPRİZ: hareket etkileri', () => {
  let r = surprizWith('ucak');
  assert.equal(r.after.players[0].pos, 7, 'ilk havalimanı Kapadokya');
  assert.equal(r.after.pending.type, 'buy');
  r = surprizWith('tersKose', (s) => {
    s.players.forEach((pl, i) => i && (pl.pos = 20));
  });
  assert.equal(r.after.players[0].pos, 20);
  assert.equal(r.after.players.filter((pl) => pl.pos === 3).length, 1, 'rakip SÜRPRİZ karesine geçer');
  r = surprizWith('isinlan');
  assert.notEqual(BOARD[r.after.players[0].pos].kind, 'surpriz');
});

test('masa ayarı: ihale kapalıysa alınmayan arsa sahipsiz kalır', () => {
  let s = calm(started(4, 42, { rules: { ihale: false } }));
  s = taksi(s, 0, 2);
  assert.equal(s.pending.type, 'buy');
  s = act(s, 0, { type: 'decline' });
  assert.equal(s.pending, null, 'ihale açılmaz');
  assert.equal(s.props[2].owner, null);
});

test('masa ayarı: SÜRPRİZ kapalıysa karede bir şey olmaz', () => {
  const s = calm(started(4, 42, { rules: { surpriz: false } }));
  const cash = s.players[0].cash;
  const r = applyAction(s, 0, { type: 'playCard', uid: give(s, 0, 'taksi'), target: { steps: 3 } });
  assert.ok(!r.events.some((e) => e.type === 'surpriz'));
  assert.equal(r.state.players[0].pos, 3);
  assert.equal(r.state.players[0].cash, cash);
});

test('masa ayarı: gündem kapalıysa tur başında kart açılmaz', () => {
  const s = started(4, 42, { rules: { gundem: false } });
  assert.equal(s.gundem, null);
  assert.equal(s.index, 100);
  assert.equal(s.gundemDeck.length + s.gundemDiscard.length > 0, true);
  assert.equal(s.gundemDiscard.length, 0, 'deste el değmeden durur');
  assert.ok(s.log.some((l) => l.type === 'round' && l.text.startsWith('— 1. tur —')));
});

test('gündem 3 turda bir değişir, dönem kuralları 3 tur sürer', () => {
  let s = started(4, 11);
  s.gundem = { id: 'turizm', detail: null, until: 3 };
  s.mods = { turizm: true };
  const seen = {};
  let guard = 0;
  while (s.phase === 'play' && s.round <= 9 && guard++ < 20000) {
    seen[s.round] ??= { id: s.gundem.id, until: s.gundem.until, drawn: s.gundemDiscard.length, turizm: !!s.mods.turizm, head: s.log.findLast((l) => l.type === 'round' || l.type === 'gundem').text };
    const seat = waitingFor(s)[0];
    s = applyAction(s, seat, botAction(s, seat)).state;
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => seen[r].drawn), [1, 1, 1, 2, 2, 2, 3, 3, 3], 'yalnız 1., 4. ve 7. turda kart açılır');
  for (const r of [2, 3]) assert.equal(seen[r].turizm, true, `${r}. turda dönem kuralı sürer`);
  assert.equal(seen[4].turizm, seen[4].id === 'turizm', 'yeni gündem eski kuralı bitirir');
  assert.equal(seen[4].until, 6);
  assert.equal(seen[7].until, 9);
  assert.match(seen[2].head, /^— 2\. tur — Gündem sürüyor: Turizm Sezonu \(1 tur daha\)\.$/);
  assert.match(seen[3].head, /\(son turu\)/);
  assert.match(seen[4].head, /^— 4\. tur — Gündem: /);
});

test('gündem dönemi oyunun son turunu aşmaz', () => {
  const s = started(4, 5, { maxRounds: 5 });
  assert.equal(s.gundem.until, 3);
  let t = s;
  let guard = 0;
  while (t.phase === 'play' && t.round < 4 && guard++ < 20000) {
    const seat = waitingFor(t)[0];
    t = applyAction(t, seat, botAction(t, seat)).state;
  }
  assert.equal(t.gundem.until, 5);
});

test('değer hedefi: hedefe ulaşılan tur tamamlanınca Seçim Günü gelir', () => {
  let s = started(4, 42, { targetScore: 2500 });
  assert.equal(s.config.maxRounds, 30, 'değer hedefi tutmazsa en geç 30. turda biter');
  s.players[2].cash = 4000;
  let ev = null;
  let guard = 0;
  while (s.phase !== 'over' && guard++ < 400) {
    const r = simpleStep(s);
    ev = r.events.find((e) => e.type === 'target') || ev;
    s = r.state;
  }
  assert.equal(s.phase, 'over');
  assert.equal(s.round, 1, 'tur yarıda kesilmez, herkes oynar');
  assert.equal(s.finalRound, 1);
  assert.equal(ev.p, 2);
});

test('günlükte kart olayları kartı ve oynayanı taşır', () => {
  let s = calm(started());
  s = act(s, 0, { type: 'playCard', uid: give(s, 0, 'piyango') });
  const l = s.log.find((x) => x.type === 'card');
  assert.equal(l.card, 'piyango');
  assert.equal(l.p, 0);
});

test('denge: en az 5 kira, Müteahhit için şehirde 2 mülk, elde 5 kart varken sıra başı kartı gelmez', () => {
  const s = calm(started());
  own(s, 1, 1);
  assert.equal(rentFor(s, 1), 5, 'İskilip arsa kirası 2, en az 5');
  own(s, 0, 5);
  assert.match(cardBlock(s, 0, 'muteahhit', { sq: 5 }), /en az 2/);
  own(s, 0, 6);
  assert.equal(cardBlock(s, 0, 'muteahhit', { sq: 5 }), null);
  let t = calm(started(4, 42, { rules: { surpriz: false } }));
  while (t.players[1].hand.length < 5) give(t, 1, 'itiraz');
  let guard = 0;
  while (t.turn.p === 0 && guard++ < 60) t = simpleStep(t).state;
  assert.equal(t.turn.p, 1);
  assert.equal(t.players[1].hand.length, 5, 'el 5 iken kart çekilmez');
});

test('bot seviyesi: zor bot eksik parçaya mülk + az para önerir, normal ve kolay önermez', () => {
  const s = started(4, 21);
  for (const p of [0, 1]) for (const uid of [...s.players[p].hand]) strip(s, p, uid.split(':')[0]);
  own(s, 0, 33, 7); // İstanbul'un yarısı + bir havalimanı
  own(s, 1, 35, 16, 25); // İstanbul'un öbür yarısı + iki havalimanı (üçüncüsü ona daha değerli)
  s.players[0].cash = 700;
  s.turn.step = 'free';
  s.mods = { durgunluk: true }; // kat dikilemez: bot kaçak kat yerine takası düşünür
  const zor = botAction(s, 0, 'zor');
  assert.equal(zor.type, 'proposeTrade');
  assert.equal(zor.to, 1);
  assert.deepEqual(zor.give.props, [7], 'karşı tarafa daha değerli olan mülkü koyar');
  assert.deepEqual(zor.take.props, [35]);
  assert.ok(zor.give.cash > 0 && zor.give.cash < 600, `para tek başına yetmezdi: ${zor.give.cash}`);
  const t = act(s, 0, zor);
  assert.deepEqual(botAction(t, 1, 'normal'), { type: 'tradeRespond', accept: true }, 'karşı bot kabul eder');
  assert.equal(botAction(s, 0, 'normal').type, 'endTurn');
  assert.equal(botAction(s, 0, 'kolay').type, 'endTurn');
});

test('bot seviyesi: zor bot artırmada en az artışla, kolay bot daha erken çekilir', () => {
  const s = started(4, 22);
  s.pending = { type: 'auction', sq: 28, order: [1, 2, 3], out: [], high: 100, leader: 2, turn: 1 };
  s.players[1].cash = 1500;
  assert.deepEqual(botAction(s, 1, 'zor'), { type: 'raise', amount: 110 });
  s.pending.high = 260;
  assert.equal(botAction(s, 1, 'kolay').type, 'pass');
  assert.equal(botAction(s, 1, 'zor').type, 'raise');
});

test('bot seviyesi masa ayarından gelir', () => {
  const s = started(4, 21, { botLevel: 'zor' });
  assert.equal(s.config.botLevel, 'zor');
  assert.equal(started(4, 21).config.botLevel, 'normal');
});
