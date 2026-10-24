// Arayüzün ortak durumu ve ev sahibine mesaj gönderme.
import { AVATARS } from '../engine/index.js';
import { store } from './dom.js';

function newToken() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  const t = [...a].map((x) => x.toString(16).padStart(2, '0')).join('');
  store.set('token', t);
  return t;
}

export const profile = {
  token: store.get('token') || newToken(),
  name: store.get('name', ''),
  avatar: store.get('avatar', AVATARS[Math.floor(Math.random() * AVATARS.length)]),
};

export const app = {
  screen: 'menu',
  mode: null, // host | join | local
  conn: null,
  host: null,
  peer: null,
  me: null,
  hostId: null,
  code: null,
  spectator: false,
  lobby: null,
  view: null,
  meta: null,
  chat: [],
  unread: 0,
  status: '',
  error: '',
  leaving: false,
  ui: { tab: 'log', dialog: null, selected: [], bid: '', trade: null, swapMine: null, seenOver: false, lastPromptKey: '' },
};

export const send = (msg) => app.conn && app.conn.send(msg);
export const act = (action) => send({ t: 'act', action });
export const isHost = () => app.me && app.me === app.hostId;
