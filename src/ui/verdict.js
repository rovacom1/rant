// Oyun sonu dayı yorumu: kazananın oyunda en çok öne çıktığı iş (motorun saydığı stats) bir yorum ve video seçer;
// sonuncu için ayrı bir yorum. Seçim yalnız oyunun sonucuna bağlı, böylece masadaki herkes aynı cümleyi görür.
// Cümleler oyuncunun adıyla başlayan bir hitap olarak okunur ("Deniz, karşı taraf..."); ilk harf küçültülür.

const WIN = {
  kacak: ['gurur', [
    'Zabıta katlarını saymaya geldi, merdivenleri çıkamayıp geri döndü. Aslan yeğenim!',
    'Binan yamuk ama tapun dimdik. Asıl önemli olan da o.',
    'Tek bir katının ruhsatı vardı, onu da sonradan aldın. Dayısının yeğeni olduğun belli.',
  ]],
  ihale: ['alkis', [
    'İhaleleri tek tek kazandın. Zarfları açmadan sonucu bilmen ayrı bir yetenek.',
    'Rakiplerin ihaleye girdi, sen ihaleyi hazırladın. Fark burada, yeğenim.',
    'Herkes teklif verdi, sen sadece gülümsedin. Dayın sana bunu boşuna öğretmedi.',
  ]],
  dava: ['alkis', [
    'Karşı taraf avukat tuttu, sen mahkemeyi tuttun.',
    'Haklı olduğun tek dava yoktu ama hepsini kazandın. Hukuk dediğin budur!',
    'Bütün davaları kazandın. Hakim bey bayramda elini öpmeye gelecekmiş.',
  ]],
  gasp: ['para', [
    'Komşunun arsası güzeldi. Şimdi daha da güzel, çünkü senin.',
    'Bu oyunda kimse sana mülk satmadı. Sen de zaten sormadın.',
    'Kamulaştırdın, takas ettin, bir de teşekkür ettirdin. Benim yeğenim işte!',
  ]],
  yikim: ['alkis', [
    'Kendi kaçağın dururken komşununkini ihbar ettin. Zeka bu, yeğenim!',
    'Rakiplerin kat dikti, sen bir telefon açtın. Bugün o arsalarda senin katın var.',
    'Zabıtayı sen çağırdın, yıkılan katlara da en çok sen üzüldün. Rolünü de iyi oynadın.',
  ]],
  kira: ['para', [
    'Herkes sana kira ödedi, üstüne çay parası da verdi. Ev sahibi dediğin böyle olur!',
    'Kirayı zamladın, aidatı topladın, kimseye makbuz kesmedin. Tam bir dayı yeğeni!',
    'Kiracıların seni görünce yolunu değiştiriyor. Saygı böyle kazanılır.',
  ]],
  son: ['gurur', [
    'Herkesi tek tek batırdın, taziyelerine de gittin. Hem acımasızsın hem görgülü, maşallah!',
    'Şehirde tek ev sahibi kaldı, o da sensin. Artık seçime de gerek yok.',
    'Masada senden başka kimse kalmadı. Ben bile bu kadar çabuk temizlemezdim.',
  ]],
  genel: ['gurur', [
    'Yolsuzluğun her türlüsünü yaptın, tek bir ceza yemedin. Dayın seninle gurur duyuyor.',
    'Ne yaptığını kimse anlamadı ama kazandın. Bizim işte asıl başarı budur.',
    'Sende kendi gençliğimi görüyorum! Ben de senin yaşında ilk gecekondumu apartman yapmıştım.',
  ]],
};

const LOSE = {
  sonuncu: [
    'Herkes kaçak kat çıktı, sen ruhsat bekledin. Bu saflık kime çekti, anlamadım.',
    'Sen bu işlere girme. Git memur ol, hiç değilse maaşın yatar.',
    'Arkanda dayın varken sonuncu olmak da marifet. Ailede bunu senden başka beceren çıkmadı.',
  ],
  konkordato: ['Konkordato ilan ettin, kimseye borcunu ödemiyorsun. Sonunda bir şeyi doğru yaptın.'],
  iflas: [
    'İflas ettin. Bari paranı önceden kaçırsaydın. Bunu da mı ben öğreteceğim?',
    'Masadan ilk sen kalktın. Çay ocağı bile senden uzun dayandı.',
  ],
};

// Kazananın öne çıktığı sayılmak için en az bu kadar yapmış ve masanın toplamından bu payı almış olmalı.
const MIN = { kacak: 2, ihale: 2, dava: 2, gasp: 2, yikim: 2, kira: 1 };
const SHARE = 0.4;

function trait(v, w) {
  if (v.players.filter((pl) => !pl.out).length === 1 && v.players.length > 1) return 'son';
  const st = (pl, k) => (pl.stats || {})[k] || 0;
  let best = 'genel', top = 0;
  for (const k of Object.keys(MIN)) {
    const mine = st(v.players[w], k);
    const all = v.players.reduce((t, pl) => t + st(pl, k), 0);
    const share = all ? mine / all : 0;
    if (mine >= MIN[k] && share >= SHARE && share > top) (best = k), (top = share);
  }
  return best;
}

const lower = (t) => t[0].toLocaleLowerCase('tr') + t.slice(1);

// { win: { p, text, clip }, lose: { p, text } | null }; text adın ardından gelir.
export function verdict(v) {
  const r = v.results;
  const w = r.ranking[0];
  const last = r.ranking[r.ranking.length - 1];
  const seed = r.ranking.reduce((t, p) => t + Math.round(r.scores[p].total), 0) + v.round;
  const [clip, lines] = WIN[trait(v, w)];
  const win = { p: w, text: lower(lines[seed % lines.length]), clip };
  if (last === w) return { win, lose: null };
  const pl = v.players[last];
  const lose = LOSE[pl.out ? 'iflas' : pl.konkordato ? 'konkordato' : 'sonuncu'];
  return { win, lose: { p: last, text: lower(lose[(seed + 1) % lose.length]) } };
}
