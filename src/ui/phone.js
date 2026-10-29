// Telefonda oyun ekranının korumaları: yanlışlıkla geri kaydırma oyunu kapatmaz, sayfa yakınlaşmaz, ekran kararmaz.
// Aşağı çekip yenilemeyi CSS kapatır (overscroll-behavior, touch-action: styles/main.css).
const touch = matchMedia('(hover: none)');
const viewport = document.querySelector('meta[name=viewport]');
const VIEWPORT = viewport?.content;
let on = false;
let armed = false;
let lock = null;
let onBack = () => {};

// Geri hareketi (iPhone'da kenardan kaydırma, Android'de geri) önce bu boş adımı tüketir; sayfa yerinde kalır.
// Chrome dokunuşsuz eklenen adımı atlar; bu yüzden adım dokunuşun sonunda (pointerup), eksikse yeniden eklenir.
function arm() {
  if (!on || armed) return;
  armed = true;
  history.pushState({ rantGuard: 1 }, '', location.href);
}

addEventListener('popstate', () => {
  if (!on || !armed) return;
  armed = false;
  onBack();
});

// Oyun açıkken ekran kararmasın: kilitlenen telefon arkaya geçer, bağlantı kopar.
async function wake() {
  if (!on || !touch.matches || lock || document.hidden || !navigator.wakeLock) return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => (lock = null));
    if (!on) lock.release();
  } catch {}
}

document.addEventListener('visibilitychange', wake);
addEventListener('pointerup', arm, true);
// iPhone Safari iki parmakla yakınlaşmayı viewport ayarına rağmen yapar; oyun ekranında durdurulur.
document.addEventListener('gesturestart', (e) => on && e.preventDefault());

// Davet linki telefonda paylaşma penceresiyle (WhatsApp vb.) gider.
export const canShare = () => !!navigator.share && touch.matches;

export function phoneGame(next, back = () => {}) {
  onBack = back;
  if (next === on) return;
  on = next;
  if (viewport) viewport.content = on ? `${VIEWPORT}, maximum-scale=1, user-scalable=no` : VIEWPORT;
  if (on) return wake();
  armed = false;
  lock?.release();
}
