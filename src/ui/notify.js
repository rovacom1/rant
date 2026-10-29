// Sekme arkadayken sıra sana gelince masaüstü bildirimi. İzin yalnız düğmeye basınca istenir.
import { store } from './dom.js';

// Telefon tarayıcısı sayfadan bildirim göstermez (Android hata verir, iPhone desteklemez); orada düğme de çıkmaz.
const touch = globalThis.matchMedia?.('(hover: none)');
const supported = () => typeof Notification !== 'undefined' && !touch?.matches;
let wanted = store.get('notify', false);
let wasMine = false;
let shown = null;

export const notifySupported = supported;
export const isNotifyOn = () => supported() && wanted && Notification.permission === 'granted';

export async function toggleNotify() {
  if (!supported()) return false;
  if (isNotifyOn()) {
    wanted = false;
  } else {
    const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    wanted = perm === 'granted';
  }
  store.set('notify', wanted);
  return wanted;
}

// Her saniye çağrılır; yalnız "sıra bende değil" -> "sıra bende" geçişinde ve sekme arkadayken bildirir.
// Telefon masada dururken sıra gelince kısa titrer (Android; iPhone titreşimi sayfaya açmaz).
export function watchTurn(mine, body) {
  if (mine && !wasMine && touch?.matches && !document.hidden && navigator.userActivation?.hasBeenActive) navigator.vibrate?.([60, 80, 60]);
  if (mine && !wasMine && document.hidden && isNotifyOn()) {
    try {
      shown = new Notification('Rantçı Dayı — Sıra sende!', { body, tag: 'rant-turn', icon: document.querySelector('link[rel=icon]')?.href });
      shown.onclick = () => {
        window.focus();
        shown.close();
      };
    } catch {}
  }
  if (!mine && shown) {
    shown.close();
    shown = null;
  }
  wasMine = mine;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && shown) {
    shown.close();
    shown = null;
  }
});
