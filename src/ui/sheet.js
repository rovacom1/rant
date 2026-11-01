// Telefon düzeninde (body.tel) alttan açılan sayfaların yığını: el, oyuncu, ses ve ayarlar, kare, gündem, pencereler.
// Sayfalar oyunun durumundan çizilir (app.ui); burada yalnız hangisinin açık olduğu ve nasıl kapandığı kayıtlıdır. Geri
// hareketi ve Escape önce en üstteki sayfayı kapatır, açık sayfa kalmayınca oyundan çıkma uyarısı gelir (phone.js).
// Pencere gibi çizilip silinen sayfaların odağı focus.js withDialog ile; burada sürekli sayfada duran sayfalar (el, oyuncu).
const layers = []; // alttan üste: { open(), close() }

// Sayfa kaydı; sıra yığının sırasıdır (sonra kaydedilen üstte).
export function sheetLayer(open, close) {
  layers.push({ open, close });
}

// En üstteki açık sayfayı kapatır; kapattıysa true.
export function closeTop() {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (!layers[i].open()) continue;
    layers[i].close();
    return true;
  }
  return false;
}

// Sayfada hep duran kutu (el, oyuncu ayrıntısı) telefon düzeninde alttan sayfa olur: açılınca odak içine girer, kapanınca
// onu açan öğeye döner. Masaüstünde (sheet false) kutu yerinde durur, pencere sayılmaz.
const openers = new WeakMap();
export function sheetBox(el, open, label, sheet = true) {
  const was = el.classList.contains('open');
  el.classList.toggle('open', open && sheet);
  if (!sheet) {
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
    return;
  }
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', label);
  el.tabIndex = -1;
  if (open === was) return;
  if (open) {
    const a = document.activeElement;
    openers.set(el, a && a !== document.body ? a : null);
    el.focus({ preventScroll: true });
    return;
  }
  const back = openers.get(el);
  openers.delete(el);
  const a = document.activeElement;
  if (back?.isConnected && (!a || a === document.body || el.contains(a))) back.focus({ preventScroll: true });
}
