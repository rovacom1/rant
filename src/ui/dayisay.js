// Büyük anlarda dayı balonu: tahtanın ortasının köşesinde yuvarlak dayı resmi ve tek satır laf (yalnız istemcide).
// Dayı yolsuzluğu över, dürüstle dalga geçer (verdict.js ile aynı ağız). Seçim rastgele olabilir; oyuna etkisi yok.

export const DAYI_LINES = {
  iflas: [
    'Paranı önceden kaçırsaydın ya!',
    'Dürüst kalırsan böyle olur işte.',
    'Batan gemiden ilk ben inerim, bilirsin.',
    'Masadan biri kalktı. Sandalyesi bizim.',
  ],
  konkordato: [
    'Borcunu ödememek de bir sanattır.',
    'Konkordato mu? Akıllı çocuk.',
    'Alacaklılar beklesin, sen keyfine bak.',
    'Batmadın, yeniden yapılandın. Aferin.',
  ],
  af: [
    'Ben demedim mi? Seçim yaklaşınca af gelir.',
    'Dün kaçaktı, bugün tapulu. Devlet babadır.',
    'Ruhsat bekleyen saflara geçmiş olsun.',
    'Kaçak yapan kazandı, sıraya giren yandı.',
  ],
  yikim: [
    'İhbar edeni tebrik ederim, iş bilir.',
    'Kaçak dediğin yakalanmaz, yeğenim. Ders olsun.',
    'Zabıtayı kim çağırdıysa ona bir çay söyleyin.',
    'Yıkılan kat değil, gururdur. Yarın yine dikilir.',
  ],
  kira: [
    'İşte kira dediğin böyle olur!',
    'Kiracı ağlar, ev sahibi güler.',
    'Makbuz istemesin, yeter.',
    'Bu kirayla bir kat daha çıkar.',
  ],
  kacak: [
    'Ruhsat mı? Onu sonra hallederiz.',
    'Gece yarısı bir kat daha. Aferin!',
    'Zabıta uyurken çalışan kazanır.',
    'Kolonu az, kazancı çok!',
  ],
};

export const BIG_RENT = 300;

// Olaylardan dayının konuşacağı an (en önemlisi), yoksa null. Sıra: iflas, konkordato, af, yıkım, büyük kira, kaçak kat.
export function dayiMoment(events) {
  const has = (f) => events.some(f);
  if (has((e) => e.type === 'iflas')) return 'iflas';
  if (has((e) => e.type === 'konkordato')) return 'konkordato';
  if (has((e) => e.type === 'gundem' && e.id === 'imarAffi')) return 'af';
  if (has((e) => e.type === 'demolish')) return 'yikim';
  if (has((e) => e.type === 'money' && e.from !== null && e.to !== null && /^Kira/.test(e.why || '') && e.amount >= BIG_RENT)) return 'kira';
  if (has((e) => e.type === 'build' && e.kacak)) return 'kacak';
  return null;
}

export const DAYI_MS = 2400;
let shown = null;

// board: tahta öğesi. Ekranda bir balon varken yenisi açılmaz.
export function dayiSay(board, moment) {
  const lines = DAYI_LINES[moment];
  if (!board || !lines || (shown && shown.isConnected)) return false;
  const el = document.createElement('div');
  el.className = 'dayi-pop';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span class="face" aria-hidden="true"></span><span class="bub"></span>';
  el.querySelector('.bub').textContent = lines[Math.floor(Math.random() * lines.length)];
  board.appendChild(el);
  shown = el;
  setTimeout(() => el.remove(), DAYI_MS); // giriş ve çıkış CSS'te (dayiPop, 2,4 sn)
  return true;
}
