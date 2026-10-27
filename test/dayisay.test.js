import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayiMoment, DAYI_LINES, BIG_RENT } from '../src/ui/dayisay.js';

test('dayı balonu: büyük anı seçer, gürültüde susar', () => {
  const rent = (amount) => ({ type: 'money', from: 0, to: 1, amount, why: 'Kira' });
  assert.equal(dayiMoment([]), null);
  assert.equal(dayiMoment([{ type: 'dice' }, { type: 'move' }, rent(BIG_RENT - 5)]), null, 'küçük kira sessiz');
  assert.equal(dayiMoment([{ type: 'build', sq: 1 }]), null, 'yasal kat sessiz');
  assert.equal(dayiMoment([rent(BIG_RENT)]), 'kira');
  assert.equal(dayiMoment([{ type: 'money', from: 0, to: null, amount: 500, why: 'Vergi' }]), null);
  assert.equal(dayiMoment([{ type: 'build', sq: 1, kacak: true }]), 'kacak');
  assert.equal(dayiMoment([{ type: 'gundem', id: 'imarAffi' }]), 'af');
  assert.equal(dayiMoment([{ type: 'gundem', id: 'enflasyon' }]), null);
  assert.equal(dayiMoment([rent(400), { type: 'demolish', p: 1, n: 2 }]), 'yikim', 'yıkım kiradan önce');
  assert.equal(dayiMoment([{ type: 'demolish' }, { type: 'iflas', p: 2 }]), 'iflas', 'iflas en önde');
  assert.equal(dayiMoment([{ type: 'konkordato', p: 2 }]), 'konkordato');
});

test('dayı lafları kısa, her an için 4 tane (şapkalı harfi npm run check yakalar)', () => {
  for (const [k, lines] of Object.entries(DAYI_LINES)) {
    assert.equal(lines.length, 4, k);
    for (const l of lines) {
      assert.ok(l.length <= 60, l);
    }
  }
});
