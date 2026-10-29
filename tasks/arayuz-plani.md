# Arayüz kalite planı (2026-10-29)

Amaç: oyun "birkaç saatte yapılmış" gibi değil, elden geçmiş bir masa oyunu gibi görünsün ve hissettirsin. Bu plan yalnız arayüzü kapsar; kural, kart ve görsel üretimi önerileri `tasks/buyuk-fikirler.md`'de.
Kaynaklar: `avoid-ai-design` denetimi (tarayıcı: P0 0, P1 5, P2 7), `game-ui-ux`, `game-feel`, `card-game` gözden geçirmesi, yerel sunucuda iki temada ekran görüntüleri, `node tools/sim.js 200 5`.

## Yön: "tapu dairesi ve kahvehane masası"
Tahta zaten kraft kağıt, tapu kartı ve mühür diliyle konuşuyor; sorun bu dilin tahtanın kenarında bitmesi. Sağ sütun, pencereler, giriş kartı ve koyu tema her uygulamada görülen yüzen yuvarlak kutular. Yeni bir stil icat etmiyoruz: kağıt, evrak ve mühür dilini tahtanın dışına taşıyoruz.
Tek imza: **mühür.** Tapu dairesinin ıslak mührü önemli anlarda karelerin ve tapuların üstüne vurulur (SATILDI değil, yazısız: oyuncu renginde yuvarlak mühür izi). Mühür sesi zaten var (`muhur`), görseli yok.

## Bulgular (özet)
| # | Bulgu | Önem | Kaynak |
|---|---|---|---|
| 1 | Klavye odağı görünmüyor; `:focus-visible` yok, `.input` `outline: none` | erişilebilirlik | kod |
| 2 | Pencere açılınca odak içeri girmiyor, kapanınca dönmüyor; çoğu pencerede `role="dialog"` yok | erişilebilirlik | kod |
| 3 | Koyu tema hazır "koyu panel" laciverti (#0c1220/#151d33/#1b2540); kraft köşeler üstünde yama gibi | P1 | ekran |
| 4 | Her yüzey aynı yuvarlak kutu + yumuşak gölge; 19 farklı köşe yarıçapı | P1 | kod + ekran |
| 5 | Büyük harf aralıklı etiketler (`.kicker`: ELİN, 2. TUR, TEKLİFİN) 10 yerde | P1 | kod |
| 6 | Girişte başlığın arkasındaki radyal hale koyu temada gri leke | P1 | ekran |
| 7 | Düğmeye iliştirilmiş ok: "Katıl →", "Turu bitir →" | P1 | kod |
| 8 | Geist (zevkli ücretsiz yazı kümesi) ve konuyla bağı olmayan başlık yazısı | P1 | kod |
| 9 | 30 ayrı yazı boyu; 12-13 px okunan metin 15 yerde | P2 | kod |
| 10 | Tokenların dışında sabit renkler (#1b2233 18 kez, #e4572e, #fde8e4 ...) | P2 | kod |
| 11 | Pencere başlıklarında orta noktalı alt yazılar ("bütün setlerin tek yerde · katlar eşit çıkar") | P2 | kod |
| 12 | `.cell.hl` 22 px altın parıltı | P2 | kod |
| 13 | Elde 3 kart varken sağ sütunun yarısı boş; deste yalnız "27" çipi | his | ekran |
| 14 | Önemli anların (kamulaştırma, büyük kira, ihale bitişi) tahtada izi yok; hepsi aynı şiddette | his | kod |

Dokunulmayacaklar: resimli kartlar ve tür renkli çerçeve, kraft köşeler, harita, piyonlar, dayı videoları, pirinç tabanlı ana düğme, 3B zar, yürüyüş/kat/yıkım canlandırmaları. Yaylanan giriş canlandırmaları ve iki renkli logo bilinçli seçim, tarayıcıda `avoid-ai-design-ignore` ile işaretlenir.

## Yazı tipi kararı
Denendi: 16 aday, oyunun kendi öğeleriyle (logo, haber manşeti, Zar At, para, kart adı, olay satırı) iki turda. Türkçe denetimi tarayıcıda harf harf yapıldı: Google'ın listesinde Türkçe görünse de **Lilita One, Titan One, Fredoka, Chango, Bagel Fat One, Sniglet, Erica One, Passion One** ş/ğ/İ'yi başka yazıdan ödünç alıyor (Fredoka v0.2'de kullanılmıştı). Eksiksiz olanlar: Alfa Slab One, Rubik, Shrikhand, Rammetto One, Calistoga, Righteous, Grandstander, Baloo 2, Nunito, Onest, Luckiest Guy.

**Seçim: Alfa Slab One (manşet) + Rubik (her şey).**
- Alfa Slab One: kalın tırnaklı afiş ve gazete manşeti yazısı; Yeşilçam afişi, tabela ve "SON DAKİKA" diliyle aynı aileden, gündem resimlerinin retro baskı tarzına oturuyor. Tek kalınlık, tablo rakamı yok; bu yüzden **yalnız** logo, haber kartı başlığı, köşe adları, oyun sonu başlığı, dayı balonu ve büyük an etiketlerinde.
- Rubik: hafif yuvarlak köşeleri kartların kalın hatlı çizimiyle uyumlu, 400-800 kalınlık, rakamları eşit genişlikte (denendi). Düğmeler, sayılar, kart adları, metin.
- Elenenler: Rammetto One (çok geniş, kare adına sığmaz), Shrikhand (italik süs, yalnız logoya yarar), Luckiest Guy (yalnız büyük harf), Calistoga (güzel ama Alfa kadar konuşmuyor).
- Yüklenen yazı ailesi sayısı değişmez (2). CLAUDE.md "Yazı tipleri" satırı güncellenir.

## Koyu tema: ceviz
Lacivert yerine ceviz ve tütün tonları; siyaha yakın değil (CLAUDE.md kuralı), kraft köşelerle aynı aileden. Değerler ilk öneri, WCAG AA kontrastı ölçülerek sabitlenir.
| token | şimdi | öneri |
|---|---|---|
| `--page` | #0c1220 | #2a211a |
| `--center` | #151d33 | #33291f |
| `--panel` | #1b2540 | #3c3126 |
| `--panel2` / `--chip` | #141c31 / #25304d | #30271e / #4a3d30 |
| `--line` | #2c3858 | #5a4a3a |
| `--ink` / `--muted` | #eef1f8 / #a9b2c8 | #f4ead6 / #c9b89c |
Oyuncu renkleri (turkuaz, fuşya, elektrik ...) sıcak zeminde yeniden denenir; `--me` mavisi gerekirse ayarlanır.

## Bugünkü adımlar
Her adım ayrı commit, sonunda `npm test`, `npm run check`, iki temada ve 1568x744, 844x340, 667x320'de tarayıcı denemesi, konsol temiz.

### Adım 1 — erişilebilirlik ve kalıplar (risk yok)
- [x] `:focus-visible { outline: 3px solid var(--pr); outline-offset: 2px }`; `.input:focus` aynı halkaya; kare ve kartta `outline-offset: -3px`.
- [x] Pencere odağı (`app.js` / `gameview.js`): açılınca ilk düğmeye ya da kapat düğmesine odak, Tab pencere içinde döner, kapanınca açan öğeye döner. Bütün `.sheet` pencerelerine `role="dialog" aria-modal="true" aria-labelledby`. `app.ui` bayrakları yerinde kalır.
- [x] "Katıl" ve "Turu bitir" okları kalkar (anlam taşıyan "kira 2 → 3" okları kalır).
- [x] `.kicker`: büyük harf ve harf aralığı kalkar, Rubik 13 px 700. "Elin" etiketi silinir, "3/6" kalır.
- [x] `.cell.hl`: düz 3 px altın halka, parıltısız.
- [x] Pencere başlıklarındaki "·" alt yazıları: bilgi gerekiyorsa ipucuna (`data-tip`), değilse silinir.

### Adım 2 — yazı tipi
- [x] `index.html` yükleme: `Alfa+Slab+One` + `Rubik:wght@400..800`; Bricolage ve Geist kalkar.
- [x] `--hf` Rubik, `--bf` Rubik, yeni `--df` Alfa Slab One. `--df` kullanılan yerler: `.title`, `.logo`, haber kartı başlığı, köşe kare adları, oyun sonu başlığı, dayı balonu.
- [x] Taşma denetimi: kare adları ("İstanbul Avrupa", "Sabiha Gökçen", "BAŞLANGIÇ NOKTASI"), kart adları ("Müteahhit Dostu", "Kamulaştırma"), düğmeler, telefon düzeni. `emWidth` (`hand.js`) gibi genişlik ölçen kod yeni yazıya göre denenir.
- [x] CLAUDE.md ve `main.css` başlık yorumu güncellenir.

### Adım 3 — token düzeni
- [x] Yarıçap: `--r-s: 6px` (kart, kare, rozet, çip), `--r-m: 10px` (düğme, satır, giriş kutusu), `--r-l: 14px` (pencere, panel); 999px yalnız hap. 19 değer bunlara iner.
- [x] Yazı ölçeği: 12 / 14 / 16 / 19 / 24 / 30 + başlıklar. Okunan metin en az 14 px; 12 px yalnız rozet/sayaç.
- [x] Sabit renkler tokena: `--ink-fixed`, `--err-bg/--err-ink`, `--title-red`, `--banner-*`.
- [x] Gölge yalnız `--sh-1/2/3`; büyük `--shadow` yalnız açılır pencerelerde.

### Adım 4 — ceviz koyu tema ve kağıt yüzeyler
- [x] Yukarıdaki koyu tema tablosu; kontrast ölçümü (metin 4.5:1, büyük yazı ve simge 3:1).
- [x] "Kağıt panel" tek bileşen: kağıt zemin, 1 px çizgi, 3 px içeride ikinci ince çizgi (tapu kartının çerçevesi), `--r-l`, gölge yok ya da `--sh-1`. Sağ sütun panelleri, `.sheet` pencereleri, giriş kartı, lobi panelleri bunu kullanır.
- [x] Girişteki radyal hale silinir; RANTÇI da DAYI gibi koyu kontur ve kayık gölge alır, şehir resminin üstünde kendi başına okunur.

### Adım 5 — his: mühür ve geri bildirim kademeleri (vakit kalırsa bugün, kalmazsa yarın)
- [x] `boardfx.js`'te üç kademe: **küçük** (maaş, küçük kira, kart çekme: ses + sayı), **orta** (satın alma, kat, ihale kazanma, kart oynama: + mühür ya da kare çerçevesi), **büyük** (kamulaştırma, yıkım, iflas, ≥ 300 kira, İmar Affı: + 80 ms duraklama, tahtanın kısa sarsıntısı, dayı balonu). Her olay bir kademeye yazılır, şiddet tek yerden ayarlanır.
- [x] Mühür izi: satın almada karenin iç kenarına oyuncu renginde yuvarlak mühür vurulur (0,35 sn içinde ezilip oturur, sonra şeride dönüşür); Kamulaştırma ve Zorla Takas'ta eski sahibin mührünün üstüne yenisi çarpraz vurulur; tapu penceresinde ipotek ve tedbir mühür olarak görünür.
- [x] Sarsıntı yalnız tahtanın görsel kabında (`transform`), hareket azaltma açıksa yok; ses penceresine "Sarsıntı" anahtarı.
- [x] Açık artırma bitişi: son teklifte "gidiyor ... gidiyor ..." iki tokmak vuruşu, üçüncüsünde satış (zaman çizelgesi mevcut 15 sn sayaçla çakışmaz, yalnız görsel ve ses).

### Adım 6 — el bölgesi (card-game)
- [x] Sağ sütunun boş altına deste ve atılan kart yığını: deste kart arkası yığını (kalan kart kadar kalınlık), atılanlar son oynanan kartın yüzüyle. Çekilen kart desteden, oynanan kart yığına uçar; "27" çipi yığının üstüne iner.
- [x] Sıra sende değilken oynanabilir tepki kartı (İtiraz, Dayın Çıktı) şimşek rozetini zaten taşıyor; bekleme penceresinde o kart elde hafifçe kalkar.

## Durum (2026-10-29)
Altı adım uygulandı (v0.37.0). Uygulanmayan: büyük anda 80 ms duraklama (DOM'da durumu bekletmeden yapılamıyor; sarsıntı ve mühür yetti), tapu penceresinde tedbirin mühür olarak görünmesi (ipotek mühür etiketi oldu). Telefonda deste ve atılan kart yığını yer olmadığından gizli, deste sayısı başlıkta.

## Kabul
- Tarayıcı (`detect.mjs`): P0 yok; P1 yalnız işaretli bilinçli seçimler.
- İki temada tahta dışındaki her yüzey "aynı oyunun kağıdı" gibi; koyu tema lacivert değil.
- Tab ile her düğmede halka; açık pencereden Tab ile çıkılmaz, Escape kapatır, odak döner.
- 1568x744, 1920x1080, 844x340, 667x320'de metin taşmaz, okunan metin 14 px altına (telefonda 12) düşmez.
- `npm test` yeşil, `npm run check` temiz, APP_VERSION artmış, CLAUDE.md arayüz ilkeleri güncel.
