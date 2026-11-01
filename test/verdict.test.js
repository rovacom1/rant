import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdict } from '../src/ui/verdict.js';

const zero = { kacak: 0, ihale: 0, dava: 0, gasp: 0, yikim: 0, kira: 0 };
function view(stats, extra = {}) {
  const players = stats.map((st, i) => ({ name: `P${i}`, stats: { ...zero, ...st }, konkordato: 0, out: 0, ...(extra[i] || {}) }));
  const ranking = players.map((_, i) => i);
  const scores = players.map((_, i) => ({ total: 1000 - i * 100 }));
  return { round: 12, players, results: { ranking, scores } };
}

test('kazananin one ciktigi is yorumu ve videoyu secer', () => {
  const v = verdict(view([{ dava: 4 }, { dava: 1 }, {}]));
  assert.equal(v.win.p, 0);
  assert.equal(v.win.clip, 'alkis');
  assert.match(v.win.text, /dava|mahkeme|Hakim/i);
});

test('kimse one cikmazsa genel yorum, sonuncuya ayri yorum', () => {
  const v = verdict(view([{ kacak: 1 }, { kacak: 1 }, {}]));
  assert.equal(v.win.clip, 'gurur');
  assert.equal(v.lose.p, 2);
  assert.ok(v.lose.text.length > 10);
  assert.equal(v.lose.text[0], v.lose.text[0].toLocaleLowerCase('tr'), 'adin ardindan kucuk harfle baslar');
});

test('masadaki toplamin yuzde 40indan azini yapan one cikmaz', () => {
  const v = verdict(view([{ kira: 300 }, { kira: 500 }, { kira: 400 }]));
  assert.notEqual(v.win.clip, 'para');
});

test('konkordato ilan eden ve iflas eden sonuncu kendi yorumunu alir; son kalan icin ayri yorum', () => {
  assert.match(verdict(view([{}, {}, {}], { 2: { konkordato: 1 } })).lose.text, /^konkordato/);
  assert.match(verdict(view([{}, {}, {}], { 2: { out: 1 } })).lose.text, /^(iflas|masadan)/);
  const s = verdict(view([{}, {}, {}], { 1: { out: 2 }, 2: { out: 1 } }));
  assert.match(s.win.text, /batırdın|tek ev sahibi|kimse kalmadı/);
});

test('eski kayitta stats yoksa cokmez; herkes ayni cumleyi gorur', () => {
  const v = view([{}, {}]);
  v.players.forEach((pl) => delete pl.stats);
  assert.deepEqual(verdict(v), verdict(v));
});

test('Mahalle: gecekondu, AVM, park ve tahliye isleri kazananin one ciktigi is olur; klasikte aranmaz', () => {
  const m = (stats, extra) => ({ ...view(stats, extra), mode: 'mahalle' });
  assert.equal(verdict(m([{ gecekondu: 3 }, { gecekondu: 1 }, {}])).win.clip, 'gurur');
  assert.equal(verdict(m([{ avm: 2 }, { avm: 1 }, {}])).win.clip, 'para');
  assert.equal(verdict(m([{ park: 3 }, {}, {}])).win.clip, 'alkis');
  assert.equal(verdict(m([{ tahliye: 2 }, {}, {}])).win.clip, 'para');
  // en yuksek pay kazanir
  assert.equal(verdict(m([{ gecekondu: 2, avm: 1 }, { gecekondu: 3, avm: 0 }, {}])).win.clip, 'para');
  // pay yuzde 40in altindaysa one cikmaz
  assert.equal(verdict(m([{ avm: 1 }, { avm: 3 }, {}])).win.clip, 'gurur');
  // klasikte Mahalle sayaclari yok sayilir
  const k = verdict(view([{ gecekondu: 5, avm: 5 }, {}, {}]));
  assert.equal(k.win.clip, 'gurur');
  assert.match(k.win.text, /yolsuzluğun|anlamadı|gençliğimi/i);
});

test('Mahalle: hic gecekondu, park, AVM yapmayan sonuncu ayri azar yer; klasikte yer almaz', () => {
  const v = { ...view([{ gecekondu: 2 }, {}, {}]), mode: 'mahalle' };
  assert.match(verdict(v).lose.text, /^(mahallede|arsaya)/);
  const yapan = { ...view([{}, {}, { park: 1 }]), mode: 'mahalle' };
  assert.doesNotMatch(verdict(yapan).lose.text, /^(mahallede|arsaya)/);
  assert.doesNotMatch(verdict(view([{}, {}, {}])).lose.text, /^(mahallede|arsaya)/);
  assert.match(verdict({ ...view([{}, {}, {}], { 2: { out: 1 } }), mode: 'mahalle' }).lose.text, /^(iflas|masadan)/, 'iflas yine kendi yorumu');
});
