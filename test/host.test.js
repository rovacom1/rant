import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Host, idFromToken } from '../src/net/host.js';

// Ağsız sahte bağlantı: gönderilen mesajları biriktirir.
function fakeConn() {
  const c = { out: [], onmessage: null, onclose: null };
  c.send = (m) => c.out.push(m);
  c.say = (m) => c.onmessage(m);
  return c;
}

const HOST_TOKEN = 'h'.repeat(32);
const hello = (token, name) => ({ t: 'hello', v: 1, token, name, avatar: '🦊' });

function room() {
  const host = new Host({ code: 'TEST1', hostToken: HOST_TOKEN, hostName: 'Ev', hostAvatar: '🦊' });
  const me = fakeConn();
  host.attach(me, { local: true });
  me.say(hello(HOST_TOKEN, 'Ev'));
  return { host, me };
}

test('oyuncu katılır, lobi herkese yayınlanır', () => {
  const { host, me } = room();
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  assert.equal(host.seats.length, 2);
  assert.ok(ali.out.some((m) => m.t === 'welcome'));
  assert.ok(me.out.some((m) => m.t === 'lobby' && m.lobby.seats.length === 2));
  assert.ok(!JSON.stringify(me.out).includes('a'.repeat(32)), 'tokenler yayınlanmaz');
});

test('ev sahibi koltuğu ve lobi komutları uzaktan ele geçirilemez', () => {
  const { host } = room();
  const evil = fakeConn();
  host.attach(evil);
  evil.say(hello(HOST_TOKEN, 'Sahte'));
  assert.equal(evil.out.at(-1).reason, 'taken');
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  ali.say({ t: 'lobby', cmd: 'start' });
  assert.equal(host.game, null);
  assert.equal(ali.out.at(-1).t, 'error');
});

test('başkasının koltuğu farklı tokenle alınamaz, aynı tokenle geri dönülür', () => {
  const { host, me } = room();
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  host.secrets[idFromToken('b'.repeat(32))] = 'a'.repeat(32); // çakışan kimlik benzetimi
  const evil = fakeConn();
  host.attach(evil);
  evil.say(hello('b'.repeat(32), 'Sahte'));
  assert.equal(evil.out.at(-1).reason, 'taken');
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  assert.ok(host.game);
  const back = fakeConn();
  host.attach(back);
  back.say(hello('a'.repeat(32), 'Ali'));
  const st = back.out.find((m) => m.t === 'state');
  assert.ok(st && st.view.you >= 0, 'aynı token aynı koltuğa döner');
  clearTimeout(host.timer);
});

test('oyunda geçersiz hamle istemciye hata olarak döner, durum bozulmaz', () => {
  const { host, me } = room();
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  const seq = host.game.seq;
  me.say({ t: 'act', action: { type: 'endTurn' } });
  assert.equal(me.out.at(-1).t, 'error');
  assert.equal(host.game.seq, seq);
  clearTimeout(host.timer);
});
