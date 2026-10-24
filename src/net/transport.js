// Bağlantı nesneleri: { send(msg), close(), onmessage, onclose }.
// localPair: aynı sayfadaki ev sahibi ile kendi arayüzü arasında.
// PeerJS: farklı bilgisayarlar arasında WebRTC veri kanalı.

const PREFIX = 'rant-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPRSTUVYZ23456789';

export function randomCode(len = 5) {
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  return [...a].map((x) => CODE_CHARS[x % CODE_CHARS.length]).join('');
}

export const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

export function localPair() {
  const make = () => ({ onmessage: null, onclose: null, closed: false });
  const a = make();
  const b = make();
  const link = (from, to) => {
    from.send = (msg) => {
      if (from.closed) return;
      const copy = JSON.parse(JSON.stringify(msg));
      queueMicrotask(() => to.onmessage && to.onmessage(copy));
    };
    from.close = () => {
      from.closed = to.closed = true;
      to.onclose && to.onclose();
    };
  };
  link(a, b);
  link(b, a);
  return [a, b];
}

function wrap(dc) {
  const w = { onmessage: null, onclose: null };
  let closed = false;
  const fireClose = () => {
    if (closed) return;
    closed = true;
    w.onclose && w.onclose();
  };
  w.send = (msg) => {
    if (dc.open) dc.send(msg);
  };
  w.close = () => {
    try {
      dc.close();
    } catch {}
    fireClose();
  };
  dc.on('data', (m) => w.onmessage && w.onmessage(m));
  dc.on('close', fireClose);
  dc.on('error', fireClose);
  return w;
}

const peerOptions = () => ({ debug: 1 });

// Odayı açar. onConn her yeni oyuncu bağlantısı için çağrılır.
export function openRoom(code, onConn, onStatus = () => {}) {
  return new Promise((resolve, reject) => {
    if (!window.Peer) return reject(new Error('Bağlantı kütüphanesi yüklenemedi. İnternetini kontrol et.'));
    const peer = new window.Peer(PREFIX + code, peerOptions());
    let opened = false;
    peer.on('open', () => {
      opened = true;
      onStatus('online');
      resolve(peer);
    });
    peer.on('connection', (dc) => dc.on('open', () => onConn(wrap(dc))));
    peer.on('disconnected', () => {
      onStatus('reconnecting');
      setTimeout(() => !peer.destroyed && peer.reconnect(), 1500);
    });
    peer.on('error', (err) => {
      if (!opened) {
        peer.destroy();
        reject(Object.assign(new Error(err.type === 'unavailable-id' ? 'Bu oda kodu kullanımda.' : `Sunucuya bağlanılamadı (${err.type}).`), { type: err.type }));
      } else onStatus('error', err);
    });
  });
}

// Bir odaya bağlanır; bağlantı nesnesini döndürür.
export function joinRoom(code) {
  return new Promise((resolve, reject) => {
    if (!window.Peer) return reject(new Error('Bağlantı kütüphanesi yüklenemedi. İnternetini kontrol et.'));
    const peer = new window.Peer(peerOptions());
    let done = false;
    const fail = (msg) => {
      if (done) return;
      done = true;
      peer.destroy();
      reject(new Error(msg));
    };
    const timer = setTimeout(() => fail('Odaya ulaşılamadı (zaman aşımı). Kodu ve ev sahibinin sayfasının açık olduğunu kontrol et.'), 20000);
    peer.on('open', () => {
      const dc = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      dc.on('open', () => {
        done = true;
        clearTimeout(timer);
        const conn = wrap(dc);
        const close = conn.close;
        conn.close = () => {
          close();
          peer.destroy();
        };
        resolve(conn);
      });
    });
    peer.on('error', (err) => {
      clearTimeout(timer);
      fail(err.type === 'peer-unavailable' ? 'Bu kodla açık bir oda yok.' : `Bağlantı hatası (${err.type}).`);
    });
  });
}
