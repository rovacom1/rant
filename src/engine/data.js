// Oyunun sabit verisi: tahta, şehirler, kartlar. Kurallar docs/TASARIM.md'de.

export const RULES_VERSION = 1;

export const DEFAULT_CONFIG = {
  maxRounds: 15,
  startCash: 1500,
  salary: 200,
  startHand: 3,
  handLimit: 6,
  konkordatoPenalty: 300,
};

export const ROUND_OPTIONS = [10, 15, 20];

// gen: şehrin ilgi hali ("Konya'nın"), metinlerde kullanılır.
export const GROUPS = {
  erzurum: { name: 'Erzurum', gen: "Erzurum'un", color: '#8d5b3e', kat: 50 },
  trabzon: { name: 'Trabzon', gen: "Trabzon'un", color: '#3fa7d6', kat: 50 },
  eskisehir: { name: 'Eskişehir', gen: "Eskişehir'in", color: '#b0569c', kat: 100 },
  konya: { name: 'Konya', gen: "Konya'nın", color: '#ee8a1c', kat: 100 },
  antalya: { name: 'Antalya', gen: "Antalya'nın", color: '#d93b3b', kat: 150, sahil: true },
  ankara: { name: 'Ankara', gen: "Ankara'nın", color: '#e6b800', kat: 150 },
  izmir: { name: 'İzmir', gen: "İzmir'in", color: '#2e9e5b', kat: 200, sahil: true },
  istanbul: { name: 'İstanbul', gen: "İstanbul'un", color: '#24408e', kat: 200 },
};

const RENT_MULT = [1, 5, 14, 30, 40];
const round5 = (x) => Math.round(x / 5) * 5;
const rents = (base) => RENT_MULT.map((m, i) => (i === 0 ? base : round5(base * m)));

const prop = (name, group, price, base) => ({ kind: 'prop', name, group, price, rents: rents(base) });

export const BOARD = [
  { kind: 'start', name: 'MAAŞ GÜNÜ', icon: '💰' },
  prop('Yakutiye', 'erzurum', 60, 6),
  prop('Palandöken', 'erzurum', 80, 8),
  { kind: 'chance', name: 'FIRSAT', icon: '🎴' },
  prop('Ortahisar', 'trabzon', 100, 10),
  prop('Akçaabat', 'trabzon', 100, 10),
  prop('Uzungöl', 'trabzon', 120, 12),
  { kind: 'tapu', name: 'TAPU DAİRESİ', icon: '📜' },
  prop('Odunpazarı', 'eskisehir', 140, 14),
  prop('Tepebaşı', 'eskisehir', 160, 16),
  { kind: 'transport', name: 'YHT GARI', icon: '🚄', price: 200 },
  prop('Karatay', 'konya', 180, 18),
  prop('Meram', 'konya', 180, 18),
  prop('Selçuklu', 'konya', 200, 20),
  { kind: 'cay', name: 'ÇAY OCAĞI', icon: '🫖' },
  prop('Kaleiçi', 'antalya', 220, 22),
  prop('Konyaaltı', 'antalya', 220, 22),
  { kind: 'chance', name: 'FIRSAT', icon: '🎴' },
  prop('Lara', 'antalya', 240, 24),
  prop('Kızılay', 'ankara', 260, 26),
  prop('Çankaya', 'ankara', 280, 28),
  { kind: 'zabita', name: 'ZABITA', icon: '🚨' },
  prop('Karşıyaka', 'izmir', 300, 30),
  prop('Bornova', 'izmir', 300, 30),
  prop('Alsancak', 'izmir', 320, 32),
  { kind: 'transport', name: 'HAVALİMANI', icon: '✈️', price: 200 },
  prop('Kadıköy', 'istanbul', 350, 35),
  prop('Bebek', 'istanbul', 400, 50),
];

export const TRANSPORT_RENT = [0, 25, 60];

export const OWNABLE = BOARD.map((s, i) => (s.kind === 'prop' || s.kind === 'transport' ? i : -1)).filter((i) => i >= 0);

export const GROUP_SQUARES = Object.fromEntries(
  Object.keys(GROUPS).map((g) => [g, BOARD.map((s, i) => (s.group === g ? i : -1)).filter((i) => i >= 0)]),
);

export const TRANSPORT_SQUARES = BOARD.map((s, i) => (s.kind === 'transport' ? i : -1)).filter((i) => i >= 0);

// Sabit para değerleri (Endeks ile ölçeklenir).
export const AMOUNTS = {
  cay: 25,
  zabitaFine: 25,
  ihbarFine: 25,
  piyango: 150,
  aidat: 30,
  dava: 100,
  depremKat: 15,
  depremKacak: 30,
  emlakVergisi: 10,
  bayram: 100,
  secimVaadi: 250,
  rantVergisi: 200,
  faizUctu: 20,
  asgari: 50,
  enflasyon: 15,
};

// target: none | self-prop | opp-prop | opp-player | swap | steps | die
// when: preroll (zardan önce) | choose (zardan sonra, ilerlemeden önce) | buy (satın alma kararında) | yoksa serbest
// react: true ise hedef İtiraz ile cevap verebilir.
export const CARDS = {
  itiraz: { name: 'İtiraz', icon: '✋', count: 6, type: 'tepki', hukuk: true, text: 'Sana oynanan bir Hamle kartını iptal et. İtiraz\'a karşı da oynanır.' },
  dayi: { name: 'Dayın Çıktı', icon: '🧔', count: 4, type: 'tepki', text: 'Ödeyeceğin bir kirayı ödemezsin. "Bizim çocuk o, kira falan istemez."' },
  taksi: { name: 'Taksi', icon: '🚕', count: 3, type: 'hamle', when: 'preroll', target: 'steps', text: 'Zar atmak yerine 1-12 kare arasında istediğin kadar ilerle.' },
  kestirme: { name: 'Kestirme', icon: '🛵', count: 4, type: 'hamle', when: 'choose', target: 'die', text: 'Zar attıktan sonra oyna: toplam yerine zarlardan birini seçip o kadar ilerle.' },
  geriVites: { name: 'Geri Vites', icon: '↩️', count: 2, type: 'hamle', when: 'preroll', target: 'none', text: 'Bu tur zarla geri yönde ilerlersin. Maaş Günü\'nden geçersen maaş yok.' },
  kamulastirma: { name: 'Kamulaştırma', icon: '🏛️', count: 3, type: 'hamle', target: 'opp-prop', react: true, hukuk: true, text: 'Rakibin katsız, ipoteksiz ve set dışı bir mülkünü, fiyatını ona ödeyerek al.' },
  takas: { name: 'Zorla Takas', icon: '🔁', count: 3, type: 'hamle', target: 'swap', react: true, text: 'Katsız bir mülkünü rakibin katsız, set dışı bir mülküyle değiştir.' },
  tedbir: { name: 'İhtiyati Tedbir', icon: '⚖️', count: 3, type: 'hamle', target: 'opp-prop', react: true, hukuk: true, text: 'Rakibin bir mülkü 2 tur boyunca kira alamaz, üstüne kat dikilemez.' },
  ihbar: { name: 'İhbar', icon: '📢', count: 4, type: 'hamle', target: 'opp-player', react: true, hukuk: true, text: 'Bir rakibin tüm kaçak katları yıkılır, kat başı 25 ceza öder.' },
  kiraZammi: { name: 'Kira Zammı', icon: '📈', count: 3, type: 'hamle', target: 'none', text: 'Bir sonraki sıran gelene kadar tahsil edeceğin ilk kira 2 katı.' },
  muteahhit: { name: 'Müteahhit Dostu', icon: '👷', count: 3, type: 'hamle', target: 'self-prop', text: 'Bir mülküne bedava 1 yasal kat. Set şartı yok, ruhsatı dostun halletti.' },
  piyango: { name: 'Piyango', icon: '🎟️', count: 3, type: 'hamle', target: 'none', text: 'Yılbaşı biletin tuttu: bankadan 150 al.' },
  aidat: { name: 'Aidat Günü', icon: '🏢', count: 3, type: 'hamle', target: 'none', react: true, text: 'Diğer her oyuncu sana 30 aidat öder. Her biri ayrı İtiraz edebilir.' },
  dava: { name: 'Dava Aç', icon: '👨‍⚖️', count: 3, type: 'hamle', target: 'opp-player', react: true, hukuk: true, text: 'Bir rakiple zar atarsın; büyük atan 100 alır. Eşitlikte davalı kazanır.' },
  pazarlik: { name: 'Pazarlık Ustası', icon: '🤝', count: 3, type: 'hamle', when: 'buy', target: 'none', text: 'Satın alma kararı sırasında oyna: arsayı yarı fiyatına al.' },
};

export const GUNDEM = {
  enflasyon: { name: 'Enflasyon Açıklandı', icon: '📊', count: 3, text: 'Endeks 15 puan arttı. Fiyatlar ve kiralar kalıcı olarak yükseldi.' },
  dolar: { name: 'Dolar Rekor Kırdı', icon: '💵', count: 1, text: 'Herkes nakdinin %10\'unu kaybeder.' },
  asgari: { name: 'Asgari Ücrete Zam', icon: '🧾', count: 2, text: 'Maaş kalıcı olarak 50 arttı.' },
  imarAffi: { name: 'İmar Affı', icon: '🎉', count: 1, text: 'Tüm kaçak katlar yasallaştı!' },
  operasyon: { name: 'Belediye Operasyonu', icon: '🚜', count: 1, text: 'Kepçeler geldi: tüm kaçak katlar yıkıldı.' },
  turizm: { name: 'Turizm Sezonu', icon: '🏖️', count: 1, mod: 'turizm', text: 'Bu tur Antalya ve İzmir kiraları 2 katı.' },
  ulasimZam: { name: 'Ulaşıma Zam', icon: '🎫', count: 1, mod: 'ulasimZam', text: 'Bu tur YHT ve Havalimanı kiraları 3 katı.' },
  deprem: { name: 'Deprem Yönetmeliği', icon: '🏚️', count: 1, text: 'Güçlendirme zamanı: yasal kat başı 15, kaçak kat başı 30 öde.' },
  emlakVergisi: { name: 'Emlak Vergisi', icon: '🏦', count: 1, text: 'Mülk başı 10 vergi öde.' },
  kiraTavani: { name: 'Kira Artış Sınırı', icon: '🧯', count: 1, mod: 'kiraTavani', text: 'Bu tur tüm kiralar yarıya indi.' },
  kiraArtisi: { name: 'Kira Artışı', icon: '🔥', count: 1, mod: 'kiraArtisi', text: 'Ev sahipleri bayramda: bu tur tüm kiralar 1,5 katı.' },
  bayram: { name: 'Bayram İkramiyesi', icon: '🍬', count: 2, text: 'Herkese 100 ikramiye.' },
  kentsel: { name: 'Kentsel Dönüşüm', icon: '🏗️', count: 1, text: 'Rastgele bir şehirde sahipli her mülke bedava 1 yasal kat.' },
  secimVaadi: { name: 'Seçim Vaadi', icon: '📣', count: 1, text: 'Net değeri en düşük oyuncuya 250 destek.' },
  rantVergisi: { name: 'Rant Vergisi', icon: '🧐', count: 1, text: 'Net değeri en yüksek oyuncu 200 öder.' },
  grev: { name: 'Bankacılar Grevde', icon: '🪧', count: 1, mod: 'grev', text: 'Bu tur Maaş Günü ödemesi yok.' },
  durgunluk: { name: 'Piyasa Durgun', icon: '🥶', count: 1, mod: 'durgunluk', text: 'Bu tur kimse kat dikemez.' },
  kampanya: { name: 'Konut Kampanyası', icon: '🏷️', count: 1, mod: 'kampanya', text: 'Bu tur kat fiyatları yarı fiyatına.' },
  faizIndirimi: { name: 'Faiz İndirimi', icon: '📉', count: 1, mod: 'faizIndirimi', text: 'Bu tur ipotek kaldırmak yarı fiyatına.' },
  faizUctu: { name: 'Faizler Uçtu', icon: '🚀', count: 1, text: 'İpotekli mülk başı 20 faiz öde.' },
  zabitaIzinde: { name: 'Zabıta İzinde', icon: '🏝️', count: 1, mod: 'zabitaIzinde', text: 'Bu tur İhbar oynanamaz, Zabıta karesi işlemez.' },
  metro: { name: 'Metro Müjdesi', icon: '🚇', count: 1, text: 'Rastgele bir şehrin fiyat ve kiraları kalıcı olarak %25 arttı.' },
  komsuluk: { name: 'Komşuluk Hakkı', icon: '🎁', count: 1, text: 'Herkes elinden rastgele bir kartı sonraki oyuncuya verir.' },
  sakin: { name: 'Gündem Sakin', icon: '☕', count: 2, text: 'Bugün bir şey olmadı. Çaylar benden.' },
};

const cityHedef = (g) => {
  const n = GROUP_SQUARES[g].length;
  return {
    name: `${GROUPS[g].name} Hakimi`,
    icon: '🏙️',
    bonus: n >= 3 ? 300 : 250,
    text: `Oyun sonunda ${GROUPS[g].gen} tüm mülkleri sende olsun.`,
    check: { type: 'group', group: g },
  };
};

export const HEDEF = {
  ...Object.fromEntries(Object.keys(GROUPS).map((g) => [`sehir_${g}`, cityHedef(g)])),
  katci: { name: 'Kat Kat Üstüne', icon: '🏢', bonus: 300, text: 'Oyun sonunda en az 7 katın olsun (kaçak dahil).', check: { type: 'floors', n: 7 } },
  ulasim: { name: 'Ulaşım Baronu', icon: '🚄', bonus: 250, text: 'Oyun sonunda YHT Garı ve Havalimanı sende olsun.', check: { type: 'transport' } },
  nakit: { name: 'Nakit Kraldır', icon: '💸', bonus: 300, text: 'Oyun sonunda en çok nakit sende olsun (eşitlik dahil).', check: { type: 'mostCash' } },
  arsa: { name: 'Arsa Avcısı', icon: '🗺️', bonus: 300, text: 'Oyun sonunda en az 6 mülkün olsun.', check: { type: 'props', n: 6 } },
  kacakci: { name: 'Kaçak Ama Sağlam', icon: '🚧', bonus: 300, text: 'Oyun sonunda en az 2 kaçak katın ayakta olsun.', check: { type: 'kacak', n: 2 } },
  hukukcu: { name: 'Hukuk Dünyası', icon: '📚', bonus: 300, text: 'Oyun boyunca en az 6 hukuk kartı oyna (Kamulaştırma, Tedbir, İhbar, Dava, İtiraz).', check: { type: 'hukuk', n: 6 } },
  ihaleci: { name: 'İhale Kralı', icon: '🔨', bonus: 250, text: 'Oyun boyunca en az 2 ihale kazan.', check: { type: 'ihale', n: 2 } },
  temiz: { name: 'Temiz Sicil', icon: '🧼', bonus: 250, text: 'Hiç ipotek yapma, konkordato ilan etme ve oyunu en az 5 mülkle bitir.', check: { type: 'clean', n: 5 } },
};

export const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🐯', '🦁', '🐙', '🦉', '🐺', '🐮', '🐵', '🦄'];
export const PLAYER_COLORS = ['#e63946', '#1e6fd9', '#2b9348', '#8e44ad', '#f39c12', '#e84393'];
export const BOT_NAMES = ['Hacı Müteahhit', 'Emlakçı Nuri', 'Kooperatif Sevim', 'Tapucu Rıza', 'Arsa Kemal', 'Rezidans Bülent'];
