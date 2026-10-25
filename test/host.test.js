import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Host, idFromToken, paceOf } from '../src/net/host.js';
import { PROTOCOL } from '../src/version.js';

// Ağsız sahte bağlantı: gönderilen mesajları biriktirir.
function fakeConn() {
  const c = { out: [], onmessage: null, onclose: null };
  c.send = (m) => c.out.push(m);
  c.say = (m) => c.onmessage(m);
  return c;
}

const HOST_TOKEN = 'h'.repeat(32);
const hello = (token, name) => ({ t: 'hello', v: PROTOCOL, token, name, avatar: '🦊' });

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

test('botlarla dene: yerel masa doğrudan bot oturtur ve başlar', () => {
  const host = new Host({ code: 'YEREL', hostToken: HOST_TOKEN, hostName: 'Ev', hostAvatar: '🦊' });
  for (let i = 0; i < 3; i++) assert.equal(host.addBot(), true);
  assert.equal(host.seats.length, 4);
  assert.equal(new Set(host.seats.map((s) => s.name)).size, 4, 'bot adları farklı');
  const me = fakeConn();
  host.attach(me, { local: true });
  me.say(hello(HOST_TOKEN, 'Ev'));
  me.say({ t: 'lobby', cmd: 'start' });
  assert.ok(host.game);
  assert.equal(host.addBot(), false, 'oyun başlayınca bot eklenmez');
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

test('masa ayarlarını yalnız ev sahibi değiştirir, oyun onlarla kurulur', () => {
  const { host, me } = room();
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  ali.say({ t: 'lobby', cmd: 'config', rules: { ihale: false } });
  assert.equal(host.config.rules.ihale, true, 'misafir değiştiremez');
  me.say({ t: 'lobby', cmd: 'config', rules: { ihale: false, gundem: 'evet', bilinmeyen: false } });
  assert.deepEqual(host.config.rules, { ihale: false, surpriz: true, gundem: true });
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  assert.equal(host.game.config.rules.ihale, false);
});

test('bot seviyesi: ev sahibi seçer, geçersiz değer reddedilir, oyuna geçer', () => {
  const { host, me } = room();
  assert.equal(host.config.botLevel, 'normal');
  me.say({ t: 'lobby', cmd: 'config', botLevel: 'imkansiz' });
  assert.equal(host.config.botLevel, 'normal');
  me.say({ t: 'lobby', cmd: 'config', botLevel: 'zor' });
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  assert.equal(host.game.config.botLevel, 'zor');
});

test('oyun sonu: değer hedefi seçilir, geçersiz tutar reddedilir', () => {
  const { host, me } = room();
  me.say({ t: 'lobby', cmd: 'config', endMode: 'score', targetScore: 1234 });
  assert.equal(host.config.endMode, 'score');
  assert.equal(host.config.targetScore, 3500);
  me.say({ t: 'lobby', cmd: 'config', targetScore: 5000 });
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  assert.equal(host.game.config.targetScore, 5000);
  assert.equal(host.game.config.maxRounds, 30);
});

test('tempo: bekleme süresi olayların canlandırma süresinden hesaplanır', () => {
  assert.equal(paceOf([]), 0);
  assert.equal(paceOf([{ type: 'dice' }, { type: 'move', path: [1, 2, 3] }]), 1250 + 600);
  assert.equal(paceOf([{ type: 'card' }]), 3500);
  assert.equal(paceOf([{ type: 'summary' }, { type: 'gundem' }]), 5600);
  assert.equal(paceOf([{ type: 'money' }, { type: 'money' }]), 910);
});

test('süreler toplam süreyle ve ev sahibinin saatiyle gönderilir', () => {
  const { host, me } = room();
  me.say({ t: 'lobby', cmd: 'config', speed: 'slow' });
  me.say({ t: 'lobby', cmd: 'config', speed: 'turbo' });
  assert.equal(host.config.speed, 'slow', 'geçersiz hız yok sayılır');
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  const m = host.meta();
  const first = host.game.players[host.game.turn.p].id; // oturma sırası rastgele; iki koltuk da insan
  assert.equal(typeof m.now, 'number');
  assert.equal(m.deadlines[first].span, 120000, 'sıra süresi 120 sn');
  assert.ok(m.deadlines[first].at >= m.now + 119000);
});
