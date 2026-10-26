// Oyunun sabit verisi: tahta, şehirler, kartlar. Kurallar docs/TASARIM.md'de.

export const RULES_VERSION = 1;

export const DEFAULT_CONFIG = {
  maxRounds: 20,
  startCash: 1500,
  seatBonus: 30, // sıra sırasına göre başlangıç nakdi farkı (ilk oyuncu 1500, beşinci 1620)
  salary: 200,
  startHand: 3,
  handLimit: 6,
  drawCap: 5, // Başlangıç Noktası'ndan geçince kart yalnız elde bundan az kart varken gelir (kart birikmesin)
  konkordatoPenalty: 300,
  targetScore: 0, // 0: tur sayısıyla biter; >0: biri bu değere ulaşınca o tur sonunda biter
  iflas: false, // true: borcunu kapatamayan konkordato yerine iflas edip elenir, son kalan kazanır
  iflasKira: 0.4, // iflas modunda kira çarpanı her tur bu kadar artar (rules.js iflasMult)
  // Masa ayarları: ev sahibi lobide açıp kapatır (docs/TASARIM.md 2. bölüm).
  rules: { ihale: true, surpriz: true, gundem: true },
  botLevel: 'normal', // masadaki bütün botların seviyesi (BOT_LEVELS)
};

export const BOT_LEVELS = ['kolay', 'normal', 'zor'];

export const RULE_LABELS = {
  ihale: { name: 'Açık artırma', off: 'Alınmayan arsa sahipsiz kalır.' },
  surpriz: { name: 'SÜRPRİZ kareleri', off: 'SÜRPRİZ karesinde bir şey olmaz.' },
  gundem: { name: 'Gündem kartları', off: 'Tur başında haber kartı açılmaz.' },
};

export const ROUND_OPTIONS = [15, 20, 25];
// Değer hedefi seçenekleri (bot simülasyonunda yaklaşık 9, 15, 22 tur) ve hedef hiç tutmazsa en geç biteceği tur.
export const TARGET_OPTIONS = [2500, 3500, 5000];
export const TARGET_ROUND_CAP = 30;
// İflas modunda tek oyuncu kalmazsa oyun en geç bu turda biter.
export const IFLAS_ROUND_CAP = 40;

// gen: şehrin ilgi hali ("Konya'nın"), metinlerde kullanılır. color: şehrin tek rengi (buzlu cam ve set çerçevesi).
// Renkler renk körlüğüne göre seçildi: tahtada komşu şehirler koyu/açık sırayla, hiçbiri oyuncu rengine benzemez.
export const GROUPS = {
  corum: { name: 'Çorum', gen: "Çorum'un", color: '#552b47', kat: 50 },
  trabzon: { name: 'Trabzon', gen: "Trabzon'un", color: '#89bea4', kat: 50 },
  bursa: { name: 'Bursa', gen: "Bursa'nın", color: '#364c33', kat: 100 },
  konya: { name: 'Konya', gen: "Konya'nın", color: '#ab8f5f', kat: 100 },
  antalya: { name: 'Antalya', gen: "Antalya'nın", color: '#a1354d', kat: 150, sahil: true },
  ankara: { name: 'Ankara', gen: "Ankara'nın", color: '#a0a8df', kat: 150 },
  izmir: { name: 'İzmir', gen: "İzmir'in", color: '#467062', kat: 200, sahil: true },
  istanbul: { name: 'İstanbul', gen: "İstanbul'un", color: '#b6b681', kat: 200 },
};




// Kiralar Monopoly cetvelinden: aynı fiyattaki arsanın arsa kirası ve 1-4 ev kirası (otel yok, en fazla 4 kat).
const prop = (name, group, price, rents) => ({ kind: 'prop', name, group, price, rents });

const air = (name) => ({ kind: 'transport', mode: 'air', name, price: 200 });
const rail = (name) => ({ kind: 'transport', mode: 'rail', name, price: 150 });
const SURPRIZ_SQ = { kind: 'surpriz', name: 'SÜRPRİZ' };
const FIRSAT_SQ = { kind: 'chance', name: 'FIRSAT' };

// 10x10 tahta: köşeler 0, 9, 18, 27; her kenarda 5 mülk, 1 gar, 1 havalimanı, 1 FIRSAT/SÜRPRİZ.
export const BOARD = [
  { kind: 'start', name: 'BAŞLANGIÇ NOKTASI' },
  prop('İskilip', 'corum', 60, [2, 10, 30, 90, 160]),
  prop('Osmancık', 'corum', 80, [4, 20, 60, 180, 320]),
  SURPRIZ_SQ,
  rail('DOĞU EKSPRESİ'),
  prop('Ortahisar', 'trabzon', 100, [6, 30, 90, 270, 400]),
  prop('Akçaabat', 'trabzon', 100, [6, 30, 90, 270, 400]),
  air('KAPADOKYA'),
  prop('Uzungöl', 'trabzon', 120, [8, 40, 100, 300, 450]),
  { kind: 'tapu', name: 'TAPU DAİRESİ' },
  prop('İnegöl', 'bursa', 140, [10, 50, 150, 450, 625]),
  FIRSAT_SQ,
  prop('Nilüfer', 'bursa', 160, [12, 60, 180, 500, 700]),
  rail('KONYA GARI'),
  prop('Karatay', 'konya', 180, [14, 70, 200, 550, 750]),
  prop('Meram', 'konya', 180, [14, 70, 200, 550, 750]),
  air('DALAMAN'),
  prop('Selçuklu', 'konya', 200, [16, 80, 220, 600, 800]),
  { kind: 'cay', name: 'ÇAY OCAĞI' },
  prop('Kaleiçi', 'antalya', 220, [18, 90, 250, 700, 875]),
  prop('Konyaaltı', 'antalya', 220, [18, 90, 250, 700, 875]),
  SURPRIZ_SQ,
  rail('ANKARA GARI'),
  prop('Lara', 'antalya', 240, [20, 100, 300, 750, 925]),
  prop('Kızılay', 'ankara', 260, [22, 110, 330, 800, 975]),
  air('ESENBOĞA'),
  prop('Çankaya', 'ankara', 280, [24, 120, 360, 850, 1025]),
  { kind: 'zabita', name: 'ZABITA' },
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
  itiraz: { name: 'İtiraz', count: 4, type: 'tepki', text: 'Sana oynanan bir Hamle kartını iptal et. İtiraz\'a karşı da oynanabilir.' },
  dayi: { name: 'Dayın Çıktı', count: 2, type: 'tepki', text: 'Ödemen gereken bir kirayı ödemezsin. "O bizim yeğen, ondan kira alınmaz!"' },
  taksi: { name: 'Taksi', count: 2, type: 'hamle', when: 'preroll', target: 'steps', text: 'Zar atmadan 1 ile 12 arasında istediğin sayıda kare ilerle.' },
  kestirme: { name: 'Kestirme', count: 3, type: 'hamle', when: 'choose', target: 'die', text: 'Zar attıktan sonra oyna: toplam yerine yalnız bir zarın gösterdiği kadar ilerle.' },
  geriVites: { name: 'Geri Vites', count: 2, type: 'hamle', when: 'preroll', target: 'none', text: 'Bu tur attığın zar kadar geri gidersin. Başlangıç Noktası\'ndan geçersen maaş alamazsın.' },
  kamulastirma: { name: 'Kamulaştırma', count: 3, type: 'hamle', target: 'opp-prop', react: true, text: 'Rakibinin katsız, ipoteksiz ve tam sette olmayan bir mülkünü, bedelini ona ödeyerek al.' },
  takas: { name: 'Zorla Takas', count: 3, type: 'hamle', target: 'swap', react: true, text: 'Katsız bir mülkünü, rakibinin tam sette olmayan katsız bir mülküyle değiştir.' },
  tedbir: { name: 'İhtiyati Tedbir', count: 2, type: 'hamle', target: 'opp-prop', react: true, text: 'Rakibinin seçtiğin mülkü 2 tur boyunca kira getirmez, üstüne kat da dikilemez.' },
  ihbar: { name: 'İhbar', count: 2, type: 'hamle', target: 'opp-player', react: true, text: 'Seçtiğin rakibin bütün kaçak katları yıkılır; rakip yıkılan her kat için 25 ceza öder.' },
  kiraZammi: { name: 'Kira Zammı', count: 3, type: 'hamle', target: 'none', text: 'Sıra yeniden sana gelene kadar alacağın ilk kira 2 katına çıkar.' },
  muteahhit: { name: 'Müteahhit Dostu', count: 3, type: 'hamle', target: 'self-prop', text: 'Aynı şehirde en az 2 mülkün varsa birine bedava 1 yasal kat dik. Ruhsatı dostun halletti.' },
  piyango: { name: 'Piyango', count: 2, type: 'hamle', target: 'none', text: 'Yılbaşı biletin tuttu: bankadan 100 al.' },
  aidat: { name: 'Aidat Günü', count: 3, type: 'hamle', target: 'none', react: true, text: 'Diğer oyuncuların her biri sana 30 aidat öder. Her biri ayrı ayrı İtiraz edebilir.' },
  dava: { name: 'Dava Aç', count: 3, type: 'hamle', target: 'opp-player', react: true, text: 'Bir rakibine dava aç, ikiniz zar atın: yüksek atan ötekinden 100 alır. Eşitlikte davalı kazanır.' },
  pazarlik: { name: 'Pazarlık Ustası', count: 3, type: 'hamle', when: 'buy', target: 'none', text: 'Bir mülkü satın alırken oyna: yarı fiyatına al.' },
};

// Gündem bir dönem boyunca geçerlidir: dönem GUNDEM_PERIOD tur sürer (1., 4., 7., 10., 13. tur).
export const GUNDEM_PERIOD = 3;

export const GUNDEM = {
  enflasyon: { name: 'Enflasyon Açıklandı', count: 3, text: 'Endeks 15 puan arttı. Fiyatlar ve kiralar kalıcı olarak yükseldi.' },
  dolar: { name: 'Dolar Rekor Kırdı', count: 1, text: 'Herkes nakdinin %10\'unu kaybeder.' },
  asgari: { name: 'Asgari Ücrete Zam', count: 2, text: 'Maaş kalıcı olarak 50 arttı.' },
  imarAffi: { name: 'İmar Affı', count: 1, text: 'Tüm kaçak katlar yasallaştı!' },
  operasyon: { name: 'Belediye Operasyonu', count: 1, text: 'Kepçeler geldi: tüm kaçak katlar yıkıldı.' },
  turizm: { name: 'Turizm Sezonu', count: 1, mod: 'turizm', text: 'Bu dönem Antalya ve İzmir\'de kiralar 2 katına çıkar.' },
  ulasimZam: { name: 'Ulaşıma Zam', count: 1, mod: 'ulasimZam', text: 'Bu dönem gar ve havalimanı kiraları 2 katına çıkar.' },
  deprem: { name: 'Deprem Yönetmeliği', count: 1, text: 'Güçlendirme zamanı: yasal kat başı 15, kaçak kat başı 30 öde.' },
  emlakVergisi: { name: 'Emlak Vergisi', count: 1, text: 'Her mülkün için 10 emlak vergisi öde.' },
  kiraTavani: { name: 'Kira İndirimi', count: 1, mod: 'kiraTavani', text: 'Bu dönem bütün kiralar yarıya iner.' },
  kiraArtisi: { name: 'Kira Artışı', count: 1, mod: 'kiraArtisi', text: 'Ev sahiplerinin bayramı: bu dönem bütün kiralar 1,5 katına çıkar.' },
  bayram: { name: 'Bayram İkramiyesi', count: 2, text: 'Her oyuncu 100 ikramiye alır.' },
  kentsel: { name: 'Kentsel Dönüşüm', count: 1, text: 'Rastgele seçilen bir şehirde, sahibi olan her mülke bedava 1 yasal kat dikildi.' },
  secimVaadi: { name: 'Seçim Vaadi', count: 1, text: 'Net değeri en düşük oyuncu 250 destek alır.' },
  rantVergisi: { name: 'Rant Vergisi', count: 1, text: 'Net değeri en yüksek oyuncu 200 öder.' },
  grev: { name: 'Bankacılar Grevde', count: 1, mod: 'grev', text: 'Bu dönem Başlangıç Noktası\'nda maaş ödenmez.' },
  durgunluk: { name: 'Piyasa Durgun', count: 1, mod: 'durgunluk', text: 'Bu dönem kimse kat dikemez.' },
  kampanya: { name: 'Konut Kampanyası', count: 1, mod: 'kampanya', text: 'Bu dönem katlar yarı fiyatına.' },
  faizIndirimi: { name: 'Faiz İndirimi', count: 1, mod: 'faizIndirimi', text: 'Bu dönem ipotek kaldırmanın bedeli yarıya iner.' },
  faizUctu: { name: 'Faizler Uçtu', count: 1, text: 'İpotekli her mülkün için 20 faiz öde.' },
  zabitaIzinde: { name: 'Zabıta İzinde', count: 1, mod: 'zabitaIzinde', text: 'Bu dönem İhbar oynanamaz, Zabıta karesi işlemez.' },
  metro: { name: 'Metro Müjdesi', count: 1, text: 'Rastgele seçilen bir şehirde fiyatlar ve kiralar kalıcı olarak %25 arttı.' },
  komsuluk: { name: 'Komşuluk Hakkı', count: 1, text: 'Herkes elinden rastgele bir kartı sonraki oyuncuya verir.' },
  sakin: { name: 'Gündem Sakin', count: 2, text: 'Bu dönem hiçbir şey olmuyor. Çaylar benden!' },
};

// SÜRPRİZ karesi: biri eşit olasılıkla seçilir, seçim beklemeden hemen uygulanır (game.js applySurpriz).
export const SURPRIZ = {
  miras: { name: 'Teyzeden Miras', text: 'Hiç tanımadığın bir teyzen sana 150 bıraktı.' },
  radar: { name: 'Radara Yakalandın', text: 'Hız cezası: 75 öde.' },
  dugun: { name: 'Düğün Var', text: 'Evleniyorsun! Diğer oyuncuların her biri sana 25 takı takar.' },
  hesap: { name: 'Hesap Senden', text: 'Herkese kebap ısmarladın: diğer oyuncuların her birine 20 öde.' },
  robin: { name: 'Robin Hood', text: 'Nakdi en çok olan oyuncudan 100 alınıp nakdi en az olana verildi.' },
  catlak: { name: 'Duvarda Çatlak', text: 'En yüksek katlı mülkünden 1 kat çöktü.' },
  jest: { name: 'Belediyeden Jest', text: 'Rastgele bir mülküne bedava 1 yasal kat dikildi.' },
  tarla: { name: 'Dededen Kalma Tarla', text: 'Sahipsiz mülklerin en ucuzu bedavaya senin oldu.' },
  ucak: { name: 'Bedava Uçak Bileti', text: 'Önündeki ilk havalimanına uçtun.' },
  isinlan: { name: 'Işınlanma', text: 'Rastgele bir kareye ışınlandın.' },
  tersKose: { name: 'Ters Köşe', text: 'Rastgele bir rakiple yer değiştirdin.' },
  kapkac: { name: 'Kapkaç', text: 'Rastgele bir rakibin elinden bir kart kaptın.' },
  bavul: { name: 'Kayıp Bavul', text: 'Elindeki rastgele 1 kart kayboldu.' },
  haciz: { name: 'Haciz Memuru', text: 'Nakdinin %10\'u haczedildi.' },
  vergiIade: { name: 'Vergi İadesi', text: 'Her mülkün için 15 vergi iadesi aldın.' },
};

// Oyuncu piyonları (resimleri assets/piyon/<ad>.png). Oyuncu rengi resmin kenarına çizilir.
export const AVATARS = ['semazen', 'kofte', 'leblebi', 'ankaray', 'galata', 'hitit'];
export const PAWN_NAMES = { semazen: 'Semazen', kofte: 'İnegöl Köftesi', leblebi: 'Çorum Leblebisi', ankaray: 'Ankaray', galata: 'Galata Kulesi', hitit: 'Hitit Güneşi' };
// Renk körlüğüne dayanıklı palet (kırmızı, mavi, zümrüt, koyu mor, sarı, pembe).
export const PLAYER_COLORS = ['#d1342f', '#2475e8', '#0e9f80', '#5a2d9c', '#f4b400', '#f472b6'];
export const BOT_NAMES = ['Hacı Müteahhit', 'Emlakçı Nuri', 'Kooperatif Sevim', 'Tapucu Rıza', 'Arsa Kemal', 'Rezidans Bülent'];
