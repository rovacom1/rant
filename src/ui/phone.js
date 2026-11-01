// Telefonda oyun ekranı: dikey tutulan telefonda telefon düzeni (body.tel, styles/telefon.css), yan tutulunca bugünkü yatay
// düzen; ikisinde de korumalar: yanlışlıkla geri kaydırma oyunu kapatmaz (önce en üstteki alttan sayfa kapanır, sheet.js),
// sayfa yakınlaşmaz, ekran kararmaz. Aşağı çekip yenilemeyi CSS kapatır (overscroll-behavior, touch-action).
const touch = matchMedia('(hover: none)');
// Telefon düzeni: dar ve dikey ekran (dar masaüstü penceresi de; yatay telefon değil). CSS eşikleri styles/telefon.css'te
// bu sınıfa bağlı, el kartları (hand.js) aynı sorguyu kullanır.
export const TEL = matchMedia('(max-width: 760px) and (orientation: portrait), (max-width: 760px) and (min-height: 521px)');
const viewport = document.querySelector('meta[name=viewport]');
const VIEWPORT = viewport?.content;
let on = false;
let armed = false;
let lock = null;
let onBack = () => {};
let onTel = () => {};

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

function applyTel() {
  const tel = on && TEL.matches;
  if (document.body.classList.contains('tel') === tel) return;
  document.body.classList.toggle('tel', tel);
  onTel(tel);
}

document.addEventListener('visibilitychange', wake);
addEventListener('pointerup', arm, true);
TEL.addEventListener('change', applyTel);
// iPhone Safari iki parmakla yakınlaşmayı viewport ayarına rağmen yapar; oyun ekranında durdurulur.
document.addEventListener('gesturestart', (e) => on && e.preventDefault());

// Davet linki telefonda paylaşma penceresiyle (WhatsApp vb.) gider.
export const canShare = () => !!navigator.share && touch.matches;
export const isTel = () => document.body.classList.contains('tel');

// next: oyun ekranı açık mı; back: geri hareketinde çağrılır; tel(on): telefon düzenine girince ya da çıkınca.
export function phoneGame(next, back = () => {}, tel = () => {}) {
  onBack = back;
  onTel = tel;
  if (next !== on) {
    on = next;
    if (viewport) viewport.content = on ? `${VIEWPORT}, maximum-scale=1, user-scalable=no` : VIEWPORT;
    if (on) wake();
    else {
      armed = false;
      lock?.release();
    }
  }
  applyTel();
}
