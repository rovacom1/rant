# Yenilikler planı (27 Ekim 2026)

Kullanıcının geri bildirim atölyesinde (https://claude.ai/artifact/38TFTsSwMJHTukYdo6kMv5) seçtikleri oyuna işlenir.
Kararlar kullanıcınındır; bu belge ajanlar için ortak başvuru. Kurallar `docs/TASARIM.md`, proje kuralları `CLAUDE.md`.

## Kesin kararlar

1. **İller.** Kareler ilçe değil il. Set anahtarları (`GROUPS` id'leri) aynı kalır, yalnız ad ve renk değişir.
   Tahtadaki sıra ve fiyatlar aynı. Kare adları (BOARD dizini → ad):
   1 Amasya, 2 Çorum (corum) · 5 Giresun, 6 Rize, 8 Trabzon (trabzon) · 10 Balıkesir, 12 Bursa (bursa) ·
   14 Aksaray, 15 Nevşehir, 17 Konya (konya) · 19 Adana, 20 Mersin, 23 Antalya (antalya) · 24 Eskişehir, 26 Ankara (ankara) ·
   28 Aydın, 30 Manisa, 32 İzmir (izmir) · 33 İstanbul Anadolu, 35 İstanbul Avrupa (istanbul).
   Grup adları (`GROUPS[x].name`) şehir adı olarak kalır (Çorum, Trabzon, Bursa, Konya, Antalya, Ankara, İzmir, İstanbul).
2. **Set renkleri** (ucuzdan pahalıya): corum `#5e3a1e`, trabzon `#6cc4ee`, bursa `#22a35a`, konya `#f5c518`,
   antalya `#f0761a`, ankara `#c47ad8`, izmir `#d8283c`, istanbul `#1b2f7a`. Karede tam doygun üst bant.
3. **Oyuncu renkleri** (il renklerinden uzak; en yakın oyuncu-il ΔE 31,6): turkuaz `#009c9c`, fuşya `#e81c8c`,
   fıstık `#a6e000`, elektrik `#4a3aff`, kömür `#2b2f38`, beyaz `#ffffff` (beyaz/kömür şeritte ince koyu kenarla).
4. **Sahiplik**: karenin iç kenarındaki kalın renk şeridi (bugünkü sistem), beyaz kenarlı. Şekilli rozet yok.
5. **Kareler simgesiz.** Bina yoksa kare boş (bant + ad + şerit). Bina varsa setin mimarisinde kat kat resim:
   `assets/bina/<grup>/<ad>.png`. Seviye L = yasal kat + kaçak (en fazla 4).
   - kaçak yok: `L.png` (1-4); L=0 resim yok. `0.png` (boş arsa, bayrak) yalnız tapu cetvelinin "Arsa" satırında.
   - üst kat kaçak: `k{L-1}.png` (k0 = yalnız gecekondu, k1 = 1 yasal + kaçak, k2, k3).
   - İmar affından sonra görüntü değişmez: affedilen kat kaçak gibi çirkin görünmeye devam eder (motorda bayrak gerekir).
   - `yikik.png` yalnız yıkım canlandırmasında kısa süre görünür.
   - Resimler aynı kutuda kırpıldı: kat çıktıkça bina gerçekten yükselir. Hep `object-fit: contain`, asla esnemez.
6. **Köşeler: kaldırım düzeni.** Yol yok. Piyon durduğu karenin iç kenarında, ortadaki alana hafifçe taşarak durur;
   köşede köşe karesinin iç köşesinde. Köşe kareleri lacivert zeminde pirinç simgeyle (iki temada). Sırası gelen
   oyuncunun durduğu kare onun renginde çerçevelenir (kullanıcı bunu özellikle beğendi).
7. **Piyonlar**: ayağın altında oyuncu renginde oval kaide (beyaz halka), yumuşak gölge, figürde beyaz kontur.
   Sırası gelen biraz büyük ve hafifçe zıplar (hareket azaltmada durur).
8. **Ortadaki harita**: `assets/harita/turkiye.svg` (gerçek sınır, viewBox 1040×461), soluk. Simge/landmark yok.
   20 ilin yeri yuvarlakla işaretli; yuvarlağın içi sahibinin renginde dolar (sahipsizse boş, set renginde ince halka).
   Kat dikilince o ilin binası (karedeki resmin aynısı) haritada ilin yerinde, karedekinden büyük durur.
   Ortadaki olay kartı her zaman haritanın önünde. Hareket az: yeni bina yaylı bir yükselişle belirir.
   İl koordinatları (viewBox birimi): Amasya 550.7,117 · Çorum 504.7,123.7 · Giresun 684.3,99.5 · Rize 795.6,92.1 ·
   Trabzon 753.8,93.5 · Balıkesir 135.5,184.2 · Bursa 197.1,147.9 · Aksaray 456.6,270.2 · Nevşehir 492.2,253.4 ·
   Konya 375.7,303.8 · Adana 524,362.3 · Mersin 488.5,375 · Antalya 282.7,369.7 · Eskişehir 273.3,175.5 ·
   Ankara 395.5,165.4 · Aydın 133.4,305.8 · Manisa 112,254.1 · İzmir 96.8,266.8 · İstanbul Anadolu 207,94.8 ·
   İstanbul Avrupa 183.5,88.8.
9. **Zar: "Savruk" fizik.** İki zar kenarlardan seker, birbirine çarpar. Atış görünmeden baştan sona hesaplanır, üstte
   kalan yüz bulunur ve motorun verdiği sayı o yüze yazılır (24 küp dönüşünden uygun etiketleme): zar sonunda
   ASLA çevrilmez. Son an kenarında sallanıp en yakın yüzüne devrilir, hafif ağır çekim, sonra toplam parlar.
   Köşeler yuvarlak, noktalar gömük, gölge yükseklikle büyür. Örnek uygulama artifact'in kaynağında (`simulate`).
10. **Yürüyüş**: kalkışta hızlanır, varışta yavaşlar, her adımda yay, inişte ezilme ve toz halkası, varışta kısa duraklama.
    Toplam süre bugünkü bütçeyi (host `PACE.step`) aşmaz.
11. **Kartlar**: türüne göre renkli çerçeve ve yeni tek nesneli resimler (`assets/kart/*.jpg` yenilendi).
    Saldırı kırmızı `#d8283c` (kamulaştırma, takas, tedbir, ihbar, dava) · Kazanç hardal `#e9b10c` (kiraZammi,
    muteahhit, piyango, aidat, pazarlik) · Savunma turkuaz `#14918a` (itiraz, dayi) · Hareket mor `#6a3fb0`
    (taksi, kestirme, geriVites). Çerçeve her kartta aynı; yazı alanı sabit, kısa kural asla taşmaz/kesilmez.
    Üstüne gelince imlece doğru hafif 3B eğilme ve parlama; çekilen kart desteden dönerek gelir; oynanan kart döner, masaya iner.
12. **Tapu**: sade. Üstte set renginde bant: mülk adı + setin illeri ("Giresun · Rize · Trabzon"). Fiyat, sahibin rengi
    ve adı. Kira cetvelinin her satırında o kattaki bina resmi; şu anki seviye vurgulu; kaçak ise "üstü kaçak" (kırmızı),
    affedildiyse "kaçaktı, affedildi" (yeşil). Altta setle arsa, kat, kaçak bedelleri. Damga, mühür, ada/parsel YOK.
13. **Mevcut canlandırmalar korunur ve yeni görünüme taşınır**: tur başı (turnFx), mülk alma (ownFx: kenar + şerit),
    tam set (setFx), kat dikme (buildFx: artık bina resmi yükselir), kaçak yıkımı (demolishFx: bina sallanır, toz, yıkıntı),
    iflas (iflasFx), jeton uçuşları ve sesleri. Sesler canlandırmayla aynı anda başlar, aynı anda biter.
14. **Ortak hareket ölçüleri** (CSS değişkeni): dokunuş 120 ms, arayüz 240 ms, iniş 420 ms; eğriler çıkış
    `(.2,.8,.3,1)`, gidiş-dönüş `(.65,0,.35,1)`, yay `(.3,1.45,.5,1)`; gölge 1/2/3 = 2/6/14 px.
15. Ayrıca (2. dalga): kareye gelince hafif kalkma, düğmelerin basılması, oyuncu satırına gelince mülklerinin parlaması,
    büyük anlarda dayı balonu, hazır tepki çıkartmaları, kirada sayarak değişen bakiye, "Nereye gidiyorsun?"
    penceresinin beklemeden geçmesi, yapacak bir şey yoksa turun kendiliğinden bitmesi.

16. **Monopoly yönü** (kullanıcı, 27 Ekim): kenar derinliği her yanda aynı (`--d`), köşeler kare. Karenin içeriği (`.face`)
    dıştan içe bakar: alt sıra dik, sol sütun 90, üst sıra 180, sağ sütun -90 derece. Bant ortaya bakan kenarda, ad dış kenarda.
    Piyonlar kenar derinliğinin 0,56'sı; haritadaki binalar harita genişliğinin %10'u boyunda.
17. **27 Ekim ikinci tur** (kullanıcı): kareye gelince kare dış kenarına yaslı %8 büyür, altın kenar ve gölge alır (canlandırmada
    kare yine büyümez). Köşeler siyaha yakın lacivert değil, kraft kağıdı zeminde renkli simgeyle. "Sıra sende" isteminde piyon resmi
    yok. Harita normalde soluk; değişen il bir an parlar, kareye gelince ili parlar, harita düğmesiyle öne alınır (`.mapfocus`).
    Haritadaki il noktaları içi dolu. Ulaşım karelerinin sahiplik şeridi mülk karelerininkiyle aynı hizada (bandın altı).
18. **Zar, ikinci tur** (kullanıcı, 27 Ekim): bakış 30 derece, tepsi 2,8 zar boyu yüksekliğinde (basıkken zarlar iç içe
    geçiyordu); çarpışma küpün dönük boyuyla. Atış gerçek hızında (PACE.roll 2000, dice 2300). Basılı tut, sürükle, bırak:
    zarlar ele alınır, el hızıyla savrulur (en az SAVRUK.v, en çok TOSS_MAX katı; hızlıysa daha çok döner); eldeki yüzler
    değişmesin diye `simulateTo` istenen sonucu o yüzlerle veren atışı arar. Performans: zar gölgesi her karede bulanıklık
    değiştirmez, piyon yürüyüşü transform ile, piyonlar kendi katmanında, sahne katmanında arka plan bulanıklığı yok.
19. **Harita, üçüncü tur** (kullanıcı, 27 Ekim): harita modu dışında daha soluk (zemin .08, nokta .4, bina .18) ve
    hiçbir şey parlamaz (kareye gelince il parlaması ve değişince parlama kaldırıldı). Harita modunda ile (nokta ya da bina)
    gelince tapusu ilin yanında açılır; düğmeden haritaya geçerken mod kapanmaz.

## Kaldırılanlar

Şehir simgeleri, haritadaki landmark resmi, meydan, yol, şekilli rozetler, harita/zemin seçenekleri, tapu damgaları,
kart resimlerindeki sahneler (yeni resimler geldi), karedeki "ev ×N" çipi (bina resmi gösteriyor; erişilebilir ad kalır).

## Dalgalar ve dosya sahipliği

Ajanlar aynı klasörde (`rant-yenilikler`) çalışır, commit atmaz. Bir dosyayı yalnız sahibi değiştirir.
`main.css`'e kimse dokunmaz: yeni kurallar kendi CSS dosyasına (sonra yüklenir, aynı seçiciyle ezer). Kaldırılması
gereken eski kuralları raporlarında listelerler; 2. dalgada silinir.

- **Dalga 1 / A · Tahta**: `src/engine/*`, `docs/TASARIM.md`, `src/ui/board.js` (Dice sınıfı hariç), `boardfx.js`,
  `slots.js`, `pawns.js`, yeni `src/ui/map.js`, `styles/tahta.css`, `src/ui/gameview.js`, ilgili testler.
- **Dalga 1 / B · Zar**: yeni `src/ui/dice.js` (board.js'teki `Dice` ile aynı arayüz), `styles/zar.css`, `test/dice.test.js`.
- **Dalga 1 / C · Kart ve tapu**: `src/ui/hand.js`, yeni `src/ui/deed.js`, `styles/kart.css`, `docs/GORSEL_STIL.md`,
  `test/hand.test.js`.
- **Dalga 2 / D · Bağlama ve his**: Dice ve deed modüllerini bağlama, 15. madde, `main.css` temizliği, sürüm artırımı,
  bütün testler ve tarayıcı denetimi.
