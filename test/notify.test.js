import { test } from 'node:test';
import assert from 'node:assert/strict';

// Tarayıcı nesnelerinin en küçük sahtesi: bildirimleri biriktirir.
const shown = [];
let listener = null;
globalThis.document = { hidden: true, addEventListener: (_, fn) => (listener = fn), querySelector: () => null };
globalThis.window = { focus() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Notification = class {
  static permission = 'default';
  static requestPermission = async () => (globalThis.Notification.permission = 'granted');
  constructor(title, opts) {
    this.title = title;
    this.opts = opts;
    this.closed = false;
    shown.push(this);
  }
  close() {
    this.closed = true;
  }
};

const N = await import('../src/ui/notify.js');

test('bildirim yalniz izinle ve sira gecisinde, sekme arkadayken gelir', async () => {
  N.watchTurn(true, 'x');
  assert.equal(shown.length, 0, 'izin yokken bildirim yok');
  N.watchTurn(false, 'x');

  assert.equal(await N.toggleNotify(), true);
  assert.equal(N.isNotifyOn(), true);
  N.watchTurn(true, 'Masaya don');
  N.watchTurn(true, 'Masaya don');
  assert.equal(shown.length, 1, 'sira bende kaldikca tekrar bildirmez');
  N.watchTurn(false, 'x');
  assert.equal(shown[0].closed, true, 'sira gecince bildirim kapanir');

  document.hidden = false;
  N.watchTurn(true, 'x');
  assert.equal(shown.length, 1, 'sekme ondeyken bildirim yok');
  N.watchTurn(false, 'x');

  document.hidden = true;
  N.watchTurn(true, 'x');
  assert.equal(shown.length, 2);
  document.hidden = false;
  listener();
  assert.equal(shown[1].closed, true, 'sekmeye donunce kapanir');

  assert.equal(await N.toggleNotify(), false);
  N.watchTurn(false, 'x');
  document.hidden = true;
  N.watchTurn(true, 'x');
  assert.equal(shown.length, 2, 'kapatilinca bildirim yok');
});
