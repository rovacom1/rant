// Oyunun sabit verisi: tahta, şehirler, kartlar. Kurallar docs/TASARIM.md'de.

export const RULES_VERSION = 1;

export const DEFAULT_CONFIG = {
  maxRounds: 15,
  startCash: 1500,
  salary: 200,
  startHand: 3,
  handLimit: 6,
  drawCap: 5, // sıra başı ve çift zar kartı yalnız elde bundan az kart varken gelir (kart birikmesin)
  konkordatoPenalty: 300,
  targetScore: 0, // 0: tur sayısıyla biter; >0: biri bu değere ulaşınca o tur sonunda biter
  // Masa ayarları: ev sahibi lobide açıp kapatır (docs/TASARIM.md 2. bölüm).
  rules: { ihale: true, surpriz: true, gundem: true, hedef: true },
};

export const RULE_LABELS = {
  ihale: { name: 'Açık artırma', icon: '🔨', off: 'Alınmayan arsa sahipsiz kalır.' },
  surpriz: { name: 'SÜRPRİZ kareleri', icon: '❓', off: 'SÜRPRİZ karesinde bir şey olmaz.' },
  gundem: { name: 'Gündem kartları', icon: '📰', off: 'Tur başında haber kartı açılmaz.' },
  hedef: { name: 'Gizli hedefler', icon: '🎯', off: 'Hedef seçilmez, bonus yok.' },
};

export const ROUND_OPTIONS = [10, 15, 20];
// Değer hedefi seçenekleri (bot simülasyonunda yaklaşık 9, 15, 22 tur) ve hedef hiç tutmazsa en geç biteceği tur.
export const TARGET_OPTIONS = [2500, 3500, 5000];
export const TARGET_ROUND_CAP = 30;

// gen: şehrin ilgi hali ("Konya'nın"), metinlerde kullanılır. tint: karenin buzlu camındaki ikinci renk.
export const GROUPS = {
  corum: { name: 'Çorum', gen: "Çorum'un", color: '#c62f2f', tint: '#2a2a33', kat: 50 },
  trabzon: { name: 'Trabzon', gen: "Trabzon'un", color: '#3fa7d6', tint: '#8c2346', kat: 50 },
  bursa: { name: 'Bursa', gen: "Bursa'nın", color: '#1e8f4e', tint: '#eef6f0', kat: 100 },
  konya: { name: 'Konya', gen: "Konya'nın", color: '#ee8a1c', tint: '#1f9e5a', kat: 100 },
  antalya: { name: 'Antalya', gen: "Antalya'nın", color: '#d93b3b', tint: '#f5c542', kat: 150, sahil: true },
  ankara: { name: 'Ankara', gen: "Ankara'nın", color: '#e6b800', tint: '#1e3a8a', kat: 150 },
  izmir: { name: 'İzmir', gen: "İzmir'in", color: '#2e9e5b', tint: '#3fb6d9', kat: 200, sahil: true },
  istanbul: { name: 'İstanbul', gen: "İstanbul'un", color: '#24408e', tint: '#d1495b', kat: 200 },
};




// Kiralar Monopoly cetvelinden: aynı fiyattaki arsanın arsa kirası ve 1-4 ev kirası (otel yok, en fazla 4 kat).
const prop = (name, group, price, rents) => ({ kind: 'prop', name, group, price, rents });

const air = (name) => ({ kind: 'transport', mode: 'air', name, icon: '✈️', price: 200 });
const rail = (name) => ({ kind: 'transport', mode: 'rail', name, icon: '🚂', price: 150 });
const SURPRIZ_SQ = { kind: 'surpriz', name: 'SÜRPRİZ', icon: '❓' };
const FIRSAT_SQ = { kind: 'chance', name: 'FIRSAT', icon: '🎴' };

// 10x10 tahta: köşeler 0, 9, 18, 27; her kenarda 5 mülk, 1 gar, 1 havalimanı, 1 FIRSAT/SÜRPRİZ.
export const BOARD = [
  { kind: 'start', name: 'BAŞLANGIÇ NOKTASI', icon: '💰' },
  prop('İskilip', 'corum', 60, [2, 10, 30, 90, 160]),
  prop('Osmancık', 'corum', 80, [4, 20, 60, 180, 320]),
  SURPRIZ_SQ,
  rail('DOĞU EKSPRESİ'),
  prop('Ortahisar', 'trabzon', 100, [6, 30, 90, 270, 400]),
  prop('Akçaabat', 'trabzon', 100, [6, 30, 90, 270, 400]),
  air('KAPADOKYA'),
  prop('Uzungöl', 'trabzon', 120, [8, 40, 100, 300, 450]),
  { kind: 'tapu', name: 'TAPU DAİRESİ', icon: '📜' },
  prop('İnegöl', 'bursa', 140, [10, 50, 150, 450, 625]),
  FIRSAT_SQ,
  prop('Nilüfer', 'bursa', 160, [12, 60, 180, 500, 700]),
  rail('KONYA GARI'),
  prop('Karatay', 'konya', 180, [14, 70, 200, 550, 750]),
  prop('Meram', 'konya', 180, [14, 70, 200, 550, 750]),
  air('DALAMAN'),
  prop('Selçuklu', 'konya', 200, [16, 80, 220, 600, 800]),
  { kind: 'cay', name: 'ÇAY OCAĞI', icon: '🫖' },
  prop('Kaleiçi', 'antalya', 220, [18, 90, 250, 700, 875]),
  prop('Konyaaltı', 'antalya', 220, [18, 90, 250, 700, 875]),
  SURPRIZ_SQ,
  rail('ANKARA GARI'),
  prop('Lara', 'antalya', 240, [20, 100, 300, 750, 925]),
  prop('Kızılay', 'ankara', 260, [22, 110, 330, 800, 975]),
  air('ESENBOĞA'),
  prop('Çankaya', 'ankara', 280, [24, 120, 360, 850, 1025]),
  { kind: 'zabita', name: 'ZABITA', icon: '🚨' },
  prop('Karşıyaka', 'izmir', 300, [26, 130, 390, 900, 1100]),
  FIRSAT_SQ,
  prop('Bornova', 'izmir', 300, [26, 130, 390, 900, 1100]),
  rail('HAYDARPAŞA'),
  prop('Alsancak', 'izmir', 320, [28, 150, 450, 1000, 1200]),
  prop('Kadıköy', 'istanbul', 350, [35, 175, 500, 1100, 1300]),
  air('SABİHA GÖKÇEN'),
  prop('Bebek', 'istanbul', 400, [50, 200, 600, 1400, 1700]),
];

// Kira, sahibinin aynı türden (ipoteksiz) kaç ulaşımı olduğuna göre: havalimanı her biri için ikiye katlanır, gar orantılı artar.
export const TRANSPORT_RENT = { air: [0, 25, 50, 100, 200], rail: [0, 30, 60, 90, 120] };
export const TRANSPORT_LABEL = { air: 'Havalimanı', rail: 'Gar' };

export const OWNABLE = BOARD.map((s, i) => (s.kind === 'prop' || s.kind === 'transport' ? i : -1)).filter((i) => i >= 0);

export const GROUP_SQUARES = Object.fromEntries(
  Object.keys(GROUPS).map((g) => [g, BOARD.map((s, i) => (s.group === g ? i : -1)).filter((i) => i >= 0)]),
);

export const TRANSPORT_SQUARES = BOARD.map((s, i) => (s.kind === 'transport' ? i : -1)).filter((i) => i >= 0);
export const MODE_SQUARES = {
  air: TRANSPORT_SQUARES.filter((i) => BOARD[i].mode === 'air'),
  rail: TRANSPORT_SQUARES.filter((i) => BOARD[i].mode === 'rail'),
};

// Sabit para değerleri (Endeks ile ölçeklenir).
export const AMOUNTS = {
  cay: 25,
  zabitaFine: 25,
  ihbarFine: 25,
  piyango: 100,
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
  surMiras: 150,
  surRadar: 75,
  surDugun: 25,
  surHesap: 20,
  surRobin: 100,
  surTeselli: 50,
  surTarla: 100,
  surVergi: 15,
};

// target: none | self-prop | opp-prop | opp-player | swap | steps | die
// when: preroll (zardan önce) | choose (zardan sonra, ilerlemeden önce) | buy (satın alma kararında) | yoksa serbest
// react: true ise hedef İtiraz ile cevap verebilir.
export const CARDS = {
  itiraz: { name: 'İtiraz', icon: '✋', count: 6, type: 'tepki', hukuk: true, text: 'Sana oynanan bir Hamle kartını iptal et. İtiraz\'a karşı da oynanır.' },
  dayi: { name: 'Dayın Çıktı', icon: '🧔', count: 2, type: 'tepki', text: 'Ödeyeceğin bir kirayı ödemezsin. "Bizim çocuk o, kira falan istemez."' },
  taksi: { name: 'Taksi', icon: '🚕', count: 2, type: 'hamle', when: 'preroll', target: 'steps', text: 'Zar atmak yerine 1-12 kare arasında istediğin kadar ilerle.' },
  kestirme: { name: 'Kestirme', icon: '🛵', count: 3, type: 'hamle', when: 'choose', target: 'die', text: 'Zar attıktan sonra oyna: toplam yerine zarlardan birini seçip o kadar ilerle.' },
  geriVites: { name: 'Geri Vites', icon: '↩️', count: 2, type: 'hamle', when: 'preroll', target: 'none', text: 'Bu tur zarla geri yönde ilerlersin. Başlangıç Noktası\'ndan geçersen maaş yok.' },
  kamulastirma: { name: 'Kamulaştırma', icon: '🏛️', count: 3, type: 'hamle', target: 'opp-prop', react: true, hukuk: true, text: 'Rakibin katsız, ipoteksiz ve set dışı bir mülkünü, fiyatını ona ödeyerek al.' },
  takas: { name: 'Zorla Takas', icon: '🔁', count: 3, type: 'hamle', target: 'swap', react: true, text: 'Katsız bir mülkünü rakibin katsız, set dışı bir mülküyle değiştir.' },
  tedbir: { name: 'İhtiyati Tedbir', icon: '⚖️', count: 2, type: 'hamle', target: 'opp-prop', react: true, hukuk: true, text: 'Rakibin bir mülkü 2 tur boyunca kira alamaz, üstüne kat dikilemez.' },
  ihbar: { name: 'İhbar', icon: '📢', count: 4, type: 'hamle', target: 'opp-player', react: true, hukuk: true, text: 'Bir rakibin tüm kaçak katları yıkılır, kat başı 25 ceza öder.' },
  kiraZammi: { name: 'Kira Zammı', icon: '📈', count: 3, type: 'hamle', target: 'none', text: 'Bir sonraki sıran gelene kadar tahsil edeceğin ilk kira 2 katı.' },
  muteahhit: { name: 'Müteahhit Dostu', icon: '👷', count: 3, type: 'hamle', target: 'self-prop', text: 'O şehirden en az 2 mülkün varsa birine bedava 1 yasal kat. Tam set şartı yok, ruhsatı dostun halletti.' },
  piyango: { name: 'Piyango', icon: '🎟️', count: 2, type: 'hamle', target: 'none', text: 'Yılbaşı biletin tuttu: bankadan 100 al.' },
  aidat: { name: 'Aidat Günü', icon: '🏢', count: 3, type: 'hamle', target: 'none', react: true, text: 'Diğer her oyuncu sana 30 aidat öder. Her biri ayrı İtiraz edebilir.' },
  dava: { name: 'Dava Aç', icon: '👨‍⚖️', count: 3, type: 'hamle', target: 'opp-player', react: true, hukuk: true, text: 'Bir rakiple zar atarsın; büyük atan 100 alır. Eşitlikte davalı kazanır.' },
  pazarlik: { name: 'Pazarlık Ustası', icon: '🤝', count: 3, type: 'hamle', when: 'buy', target: 'none', text: 'Satın alma kararı sırasında oyna: arsayı yarı fiyatına al.' },
};

// Gündem bir dönem boyunca geçerlidir: dönem GUNDEM_PERIOD tur sürer (1., 4., 7., 10., 13. tur).
export const GUNDEM_PERIOD = 3;

export const GUNDEM = {
  enflasyon: { name: 'Enflasyon Açıklandı', icon: '📊', count: 3, text: 'Endeks 15 puan arttı. Fiyatlar ve kiralar kalıcı olarak yükseldi.' },
  dolar: { name: 'Dolar Rekor Kırdı', icon: '💵', count: 1, text: 'Herkes nakdinin %10\'unu kaybeder.' },
  asgari: { name: 'Asgari Ücrete Zam', icon: '🧾', count: 2, text: 'Maaş kalıcı olarak 50 arttı.' },
  imarAffi: { name: 'İmar Affı', icon: '🎉', count: 1, text: 'Tüm kaçak katlar yasallaştı!' },
  operasyon: { name: 'Belediye Operasyonu', icon: '🚜', count: 1, text: 'Kepçeler geldi: tüm kaçak katlar yıkıldı.' },
  turizm: { name: 'Turizm Sezonu', icon: '🏖️', count: 1, mod: 'turizm', text: 'Bu dönem Antalya ve İzmir kiraları 2 katı.' },
  ulasimZam: { name: 'Ulaşıma Zam', icon: '🎫', count: 1, mod: 'ulasimZam', text: 'Bu dönem gar ve havalimanı kiraları 2 katı.' },
  deprem: { name: 'Deprem Yönetmeliği', icon: '🏚️', count: 1, text: 'Güçlendirme zamanı: yasal kat başı 15, kaçak kat başı 30 öde.' },
  emlakVergisi: { name: 'Emlak Vergisi', icon: '🏦', count: 1, text: 'Mülk başı 10 vergi öde.' },
  kiraTavani: { name: 'Kira Artış Sınırı', icon: '🧯', count: 1, mod: 'kiraTavani', text: 'Bu dönem tüm kiralar yarıya indi.' },
  kiraArtisi: { name: 'Kira Artışı', icon: '🔥', count: 1, mod: 'kiraArtisi', text: 'Ev sahipleri bayramda: bu dönem tüm kiralar 1,5 katı.' },
  bayram: { name: 'Bayram İkramiyesi', icon: '🍬', count: 2, text: 'Herkese 100 ikramiye.' },
  kentsel: { name: 'Kentsel Dönüşüm', icon: '🏗️', count: 1, text: 'Rastgele bir şehirde sahipli her mülke bedava 1 yasal kat.' },
  secimVaadi: { name: 'Seçim Vaadi', icon: '📣', count: 1, text: 'Net değeri en düşük oyuncuya 250 destek.' },
  rantVergisi: { name: 'Rant Vergisi', icon: '🧐', count: 1, text: 'Net değeri en yüksek oyuncu 200 öder.' },
  grev: { name: 'Bankacılar Grevde', icon: '🪧', count: 1, mod: 'grev', text: 'Bu dönem Başlangıç Noktası\'nda maaş ödenmez.' },
  durgunluk: { name: 'Piyasa Durgun', icon: '🥶', count: 1, mod: 'durgunluk', text: 'Bu dönem kimse kat dikemez.' },
  kampanya: { name: 'Konut Kampanyası', icon: '🏷️', count: 1, mod: 'kampanya', text: 'Bu dönem kat fiyatları yarı fiyatına.' },
  faizIndirimi: { name: 'Faiz İndirimi', icon: '📉', count: 1, mod: 'faizIndirimi', text: 'Bu dönem ipotek kaldırmak yarı fiyatına.' },
  faizUctu: { name: 'Faizler Uçtu', icon: '🚀', count: 1, text: 'İpotekli mülk başı 20 faiz öde.' },
  zabitaIzinde: { name: 'Zabıta İzinde', icon: '🏝️', count: 1, mod: 'zabitaIzinde', text: 'Bu dönem İhbar oynanamaz, Zabıta karesi işlemez.' },
  metro: { name: 'Metro Müjdesi', icon: '🚇', count: 1, text: 'Rastgele bir şehrin fiyat ve kiraları kalıcı olarak %25 arttı.' },
  komsuluk: { name: 'Komşuluk Hakkı', icon: '🎁', count: 1, text: 'Herkes elinden rastgele bir kartı sonraki oyuncuya verir.' },
  sakin: { name: 'Gündem Sakin', icon: '☕', count: 2, text: 'Sakin bir dönem, bir şey olmuyor. Çaylar benden.' },
};

// SÜRPRİZ karesi: biri eşit olasılıkla seçilir, seçim beklemeden hemen uygulanır (game.js applySurpriz).
export const SURPRIZ = {
  miras: { name: 'Teyzeden Miras', icon: '👵', text: 'Hiç tanımadığın bir teyzen sana 150 bıraktı.' },
  radar: { name: 'Radara Yakalandın', icon: '📸', text: 'Hız cezası: 75 öde.' },
  dugun: { name: 'Düğün Var', icon: '💍', text: 'Kuzenin evleniyor: diğer herkes sana 25 takı takar.' },
  hesap: { name: 'Hesap Senden', icon: '🍢', text: 'Masaya kebap ısmarladın: diğer her oyuncuya 20 öde.' },
  robin: { name: 'Robin Hood', icon: '🏹', text: 'Nakdi en çok olandan 100 alınıp en az olana verildi.' },
  catlak: { name: 'Duvarda Çatlak', icon: '🏚️', text: 'En yüksek katlı mülkünden 1 kat çöktü.' },
  jest: { name: 'Belediyeden Jest', icon: '🏗️', text: 'Rastgele bir mülküne bedava 1 yasal kat.' },
  tarla: { name: 'Dededen Kalma Tarla', icon: '🌾', text: 'Sahipsiz en ucuz mülk bedavaya senin oldu.' },
  ucak: { name: 'Bedava Uçak Bileti', icon: '✈️', text: 'İleri yöndeki ilk havalimanına uçtun.' },
  isinlan: { name: 'Işınlanma', icon: '🌀', text: 'Rastgele bir kareye ışınlandın.' },
  tersKose: { name: 'Ters Köşe', icon: '🔄', text: 'Rastgele bir rakiple yer değiştirdin.' },
  kapkac: { name: 'Kapkaç', icon: '🦝', text: 'Rastgele bir rakibin elinden bir kart kaptın.' },
  bavul: { name: 'Kayıp Bavul', icon: '🧳', text: 'Elindeki rastgele 1 kart kayboldu.' },
  haciz: { name: 'Haciz Memuru', icon: '📋', text: 'Nakdinin %10\'u haczedildi.' },
  vergiIade: { name: 'Vergi İadesi', icon: '🧾', text: 'Mülk başı 15 iade aldın.' },
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
  ulasim: { name: 'Ulaşım Baronu', icon: '✈️', bonus: 250, text: 'Oyun sonunda en az 4 gar ya da havalimanı sende olsun.', check: { type: 'transport', n: 4 } },
  nakit: { name: 'Nakit Kraldır', icon: '💸', bonus: 300, text: 'Oyun sonunda en çok nakit sende olsun (eşitlik dahil).', check: { type: 'mostCash' } },
  arsa: { name: 'Arsa Avcısı', icon: '🗺️', bonus: 300, text: 'Oyun sonunda en az 7 mülkün olsun.', check: { type: 'props', n: 7 } },
  kacakci: { name: 'Kaçak Ama Sağlam', icon: '🚧', bonus: 300, text: 'Oyun sonunda en az 1 kaçak katın ayakta olsun.', check: { type: 'kacak', n: 1 } },
  hukukcu: { name: 'Hukuk Dünyası', icon: '📚', bonus: 300, text: 'Oyun boyunca en az 7 hukuk kartı oyna (Kamulaştırma, Tedbir, İhbar, Dava, İtiraz).', check: { type: 'hukuk', n: 7 } },
  ihaleci: { name: 'İhale Kralı', icon: '🔨', bonus: 250, text: 'Oyun boyunca en az 2 ihale kazan.', check: { type: 'ihale', n: 2 } },
  temiz: { name: 'Temiz Sicil', icon: '🧼', bonus: 250, text: 'Hiç ipotek yapma, konkordato ilan etme ve oyunu en az 6 mülkle bitir.', check: { type: 'clean', n: 6 } },
};

export const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🐯', '🦁', '🐙', '🦉', '🐺', '🐮', '🐵', '🦄'];
export const PLAYER_COLORS = ['#e63946', '#1e6fd9', '#2b9348', '#8e44ad', '#f39c12', '#e84393'];
export const BOT_NAMES = ['Hacı Müteahhit', 'Emlakçı Nuri', 'Kooperatif Sevim', 'Tapucu Rıza', 'Arsa Kemal', 'Rezidans Bülent'];
