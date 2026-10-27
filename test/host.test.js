import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Host, idFromToken, paceOf, PACE, STICKERS, STICKER_GAP } from '../src/net/host.js';
import { PROTOCOL } from '../src/version.js';

// Ağsız sahte bağlantı: gönderilen mesajları biriktirir.
function fakeConn() {
  const c = { out: [], onmessage: null, onclose: null };
  c.send = (m) => c.out.push(m);
  c.say = (m) => c.onmessage(m);
  return c;
}

const HOST_TOKEN = 'h'.repeat(32);
const hello = (token, name) => ({ t: 'hello', v: PROTOCOL, token, name, avatar: 'galata' });

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

test('oyun sonu: son kalan (iflas) modu motora geçer', () => {
  const { host, me } = room();
  me.say({ t: 'lobby', cmd: 'config', endMode: 'iflas' });
  assert.equal(host.config.endMode, 'iflas');
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  assert.equal(host.game.config.iflas, true);
  assert.equal(host.game.config.targetScore, 0);
  assert.equal(host.game.config.maxRounds, 40);
});

test('tempo: bekleme süresi olayların canlandırma süresinden hesaplanır', () => {
  assert.equal(paceOf([]), 0);
  assert.equal(paceOf([{ type: 'dice' }, { type: 'move', path: [1, 2, 3] }]), PACE.dice + PACE.step * 4);
  assert.equal(paceOf([{ type: 'card' }]), PACE.card);
  assert.equal(paceOf([{ type: 'summary' }, { type: 'gundem' }]), PACE.newsSum);
  assert.equal(paceOf([{ type: 'money' }, { type: 'money' }]), PACE.money + PACE.moneyStep);
  assert.ok(PACE.card >= 5000 && PACE.bot >= 1500, 'normal hız okunacak kadar yavaş');
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

test('ev sahibi devri: yedek oyuncu tam kopyayı alır, ev sahibi düşünce oyunu aynı yerden sürdürür', () => {
  const { host, me } = room();
  const ALI = 'a'.repeat(32);
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello(ALI, 'Ali'));
  me.say({ t: 'lobby', cmd: 'addBot' });
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  const backups = ali.out.filter((m) => m.t === 'backup');
  assert.ok(backups.length, 'yedek kopya gönderilir');
  assert.ok(!me.out.some((m) => m.t === 'backup'), 'ev sahibinin kendisine gitmez');
  const snap = backups.at(-1).snap;
  assert.equal(snap.backupId, idFromToken(ALI));
  assert.deepEqual(snap.secrets, {}, 'koltuk anahtarları gönderilmez');
  assert.ok(!JSON.stringify(snap).includes(HOST_TOKEN), 'ev sahibinin tokeni kopyada yok');

  // Ali yeni ev sahibi olur.
  const host2 = new Host({ code: 'TEST1', hostToken: ALI, hostName: 'Ali', hostAvatar: 'galata', saved: snap });
  const ali2 = fakeConn();
  host2.attach(ali2, { local: true });
  ali2.say(hello(ALI, 'Ali'));
  clearTimeout(host2.timer);
  assert.equal(host2.hostId, idFromToken(ALI));
  assert.equal(host2.game.seq, host.game.seq, 'oyun kaldığı yerden sürer');
  assert.ok(ali2.out.some((m) => m.t === 'state'));
  // Eski ev sahibi uzaktan, kendi koltuğuna oyuncu olarak döner; başkası onun koltuğunu alamaz.
  const ev = fakeConn();
  host2.attach(ev);
  ev.say(hello(HOST_TOKEN, 'Ev'));
  clearTimeout(host2.timer);
  assert.equal(ev.out.find((m) => m.t === 'welcome').spectator, false);
  const evil = fakeConn();
  host2.attach(evil);
  evil.say(hello('z'.repeat(32), 'Sahte'));
  clearTimeout(host2.timer);
  assert.equal(evil.out.find((m) => m.t === 'welcome').spectator, true, 'yabancı yalnız izler');
});

test('aynı piyon iki koltukta olmaz', () => {
  const { host } = room();
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  const ev = host.seats[0].avatar;
  ali.say({ t: 'profile', name: 'Ali', avatar: ev });
  assert.notEqual(host.seats[1].avatar, ev, 'başka oyuncunun piyonuna geçilemez');
  host.addBot();
  host.addBot();
  assert.equal(new Set(host.seats.map((s) => s.avatar)).size, host.seats.length);
});

// İki insanlı (ev sahibi + Ali) başlamış masa.
function twoHumans() {
  const { host, me } = room();
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  const conn = (id) => (id === host.hostId ? me : ali);
  return { host, me, ali, conn };
}

test('çıkartma: herkese yayılır, 2 sn sınırı var, listede olmayan reddedilir', () => {
  const { host, me, ali } = twoHumans();
  const got = (c) => c.out.filter((m) => m.t === 'sticker');
  ali.say({ t: 'sticker', id: 1 });
  const aliSeat = host.seatIndex(idFromToken('a'.repeat(32)));
  assert.deepEqual(got(me).at(-1), { t: 'sticker', p: aliSeat, id: 1 }, 'ev sahibine gider');
  assert.equal(got(ali).length, 1, 'gönderen de görür');
  ali.say({ t: 'sticker', id: 2 });
  assert.equal(got(me).length, 1, '2 saniye dolmadan ikincisi gitmez');
  me.say({ t: 'sticker', id: 0 });
  assert.equal(got(ali).length, 2, 'sınır oyuncu başına');
  host.stickerAt[idFromToken('a'.repeat(32))] -= STICKER_GAP;
  for (const bad of [-1, STICKERS.length, 1.5, '1', null, 'Selam millet']) ali.say({ t: 'sticker', id: bad });
  assert.equal(got(me).length, 2, 'geçersiz çıkartma ve serbest yazı yayılmaz');
  ali.say({ t: 'sticker', id: 5 });
  assert.equal(got(me).at(-1).id, 5, 'süre dolunca yeniden gönderilir');
  const spy = fakeConn();
  host.attach(spy);
  spy.say(hello('z'.repeat(32), 'İzleyici'));
  spy.say({ t: 'sticker', id: 0 });
  assert.equal(got(me).length, 3, 'izleyici çıkartma gönderemez');
  assert.ok(!JSON.stringify(host.game).includes('sticker'), 'oyun durumuna girmez');
  clearTimeout(host.timer);
});

test('Nereye gidiyorsun: Kestirme penceresi kartı olana da olmayana da aynı kısa süre, sonra piyon kendiliğinden yürür', () => {
  for (const holder of [true, false]) {
    const { host, conn } = twoHumans();
    const g = host.game;
    const p = g.turn.p;
    const other = 1 - p;
    for (const pl of g.players) for (let i = pl.hand.length - 1; i >= 0; i--) if (pl.hand[i].startsWith('kestirme:')) g.deck.push(...pl.hand.splice(i, 1));
    const k = g.deck.findIndex((u) => u.startsWith('kestirme:'));
    g.players[holder ? p : other].hand.push(...g.deck.splice(k, 1));
    g.turn.step = 'preroll';
    g.pending = null;
    conn(g.players[p].id).say({ t: 'act', action: { type: 'roll' } });
    clearTimeout(host.timer);
    assert.equal(host.game.turn.step, 'choose');
    const d = host.deadlines[g.players[p].id];
    assert.equal(d.span, 1500, `normal hızda 1,5 sn (kart ${holder ? 'zar atanda' : 'başkasında'})`);
    assert.equal(d.mode, 'default');
    const pos = host.game.players[p].pos;
    host.runDeadline(d);
    clearTimeout(host.timer);
    assert.notEqual(host.game.turn.step, 'choose', 'süre dolunca toplam kadar yürür');
    assert.ok(host.game.players[p].pos !== pos || host.game.players[p].jail, 'piyon yürüdü');
  }
});

test('Kestirme penceresi oyun hızıyla ölçeklenir', () => {
  const { host, me } = room();
  me.say({ t: 'lobby', cmd: 'config', speed: 'fast' });
  const ali = fakeConn();
  host.attach(ali);
  ali.say(hello('a'.repeat(32), 'Ali'));
  me.say({ t: 'lobby', cmd: 'start' });
  clearTimeout(host.timer);
  host.game.turn.step = 'choose';
  host.game.turn.dice = [1, 2];
  host.game.pending = null;
  host.schedule();
  clearTimeout(host.timer);
  assert.equal(host.deadlines[host.game.players[host.game.turn.p].id].span, 750);
});
