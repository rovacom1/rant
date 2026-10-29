# Büyük fikirler: görseller, his, mekanik, yeniden oynanabilirlik (2026-10-29)

Öneri listesi; hiçbiri karar değil. Kural değişikliği seçilirse önce `docs/TASARIM.md`, sonra kod, sonra `node tools/sim.js 200 5` karşılaştırması.
Bugünkü arayüz işleri ayrı: `tasks/arayuz-plani.md`.

## 1. Görseller

### Durum
Oyunda dört ayrı çizim dili var: gündem kartları (retro baskı karikatürü, krem zemin, insanlı sahneler), el kartları (doygun düz zeminli simge), binalar (ince mürekkep, ayrıntılı), piyonlar (düz, kalın hat). En güçlü ve en "Türkiye" olanı **gündem kartları**: Gırgır/Leman geleneğinden gelen bıyıklı adam, teyze, işçi; espri resimde. En zayıfı **el kartları**: okunaklı ama herhangi bir simge paketinden çıkmış gibi; espri ve yer duygusu yok.

### El kartları (yeniden çizim önerisi)
- **Karışan çift:** Kamulaştırma ve Dava Aç ikisi de tokmak. Küçük boyda ayırt edilmiyor.
- **Türkiye'ye özgü olmayan nesneler:** Aidat Günü'nde Amerikan posta kutuları; İhbar'da düdük (Zabıta köşesiyle de çakışıyor); Pazarlık Ustası'nda etiket ve makas; Kira Zammı'nda dolar destesine benzeyen yeşil para.
- **Önerilen nesneler** (tek nesne kuralı kalır, yazı yok):
  | Kart | Şimdi | Öneri |
  |---|---|---|
  | Kamulaştırma | tokmak + ev | belediye tebligat zarfı, üstünde kırmızı mühür, içinden ev anahtarı |
  | Dava Aç | tokmak | mavi karton dava dosyası, kurdeleli, üstünde terazi |
  | İhbar | düdük | eski kırmızı telefon ahizesi (Alo 153 havası), sesi dalga dalga |
  | Aidat Günü | posta kutuları | apartman giriş kapısı ve asılı aidat çizelgesi (yazısız, sütunlu kağıt) ya da yönetici makbuz koçanı |
  | Pazarlık Ustası | etiket + makas | pazar tezgahında sıkışan iki el |
  | Kira Zammı | para + ok | kira kontratı, üstünde kırmızı kalemle büyütülmüş rakam yeri (rakamsız), yukarı ok |
  | Zorla Takas | iki anahtar | çapraz duran iki tapu senedi, araya dönen ok |
  | Piyango | yıldızlı bilet | Milli Piyango çeyrek bileti havası, konfeti, yılbaşı çamı |
  | Müteahhit Dostu | baret + tuğla | beton mikseri ya da vinç ucunda sallanan kat |
  | Dayın Çıktı, Taksi, Tedbir, Kestirme, İtiraz | iyi | kalsın |
- **Stil:** zemin tür rengi kalsın (okunurluk için kullanıcı seçimi), ama çizgi ve doku gündem kartlarından alınsın: hafif baskı kayması, sınırlı palet (lacivert hat, krem, domates, turkuaz, hardal). Böylece el ve gündem aynı gazetenin sayfası gibi durur. Stil referansı olarak `itiraz.jpg` yerine bir gündem resmi + bir el kartı birlikte verilir.

### Binalar
- Kaçak kat küçük boyda (karede ~40 px) yasal kattan ayırt edilmiyor; fark yalnız gri bir çatı. Öneri: kaçak katın üstünde **filiz demirleri** (çatıdan çıkan inşaat demirleri, Türkiye'nin en tanıdık "kat çıkılacak" işareti), mavi branda, gaz beton (beyaz-gri) duvar. Bunlar uzaktan da okunur ve espriyi tek bakışta anlatır.
- Gecekondu `k0` iyi; yıkıntı görseli büyük anda daha çok görünür kalabilir.

### Karakterler
- Girişteki dayı (hawai gömleği, altın zincir, tespih) ile gündem kartlarındaki bıyıklı turkuaz takımlı adam iki ayrı "dayı" gibi duruyor. Öneri: tek karakter sayfası (dayı, teyze, zabıta, müteahhit, emlakçı) üretilip bütün yeni resimlerde referans olarak verilsin; gündemdeki adam "vatandaş", dayı her zaman gömlekli dayı.
- Botların adları (Emlakçı Nuri, Kooperatif Sevim, Hacı Müteahhit) çok iyi; botlara piyon yerine küçük portre (karikatür) verilirse masa daha canlı olur.

### Diğer
- Kart arkası ve sürpriz arkası (çini desenli) iyi, kalsın.
- Köşe simgeleri (SVG) sade ve okunaklı; Çay Ocağı ve Zabıta gündem diliyle küçük bir karikatür olabilir ama acele değil.

## 2. His (game-feel)
Zaten iyi olanlar: yürüyüş (hızlanma, ezilme, toz), kat düşmesi, yıkım, iflas, jeton uçuşu, bakiye sayacı, dayı balonu, vuruşa denk gelen sesler, 3B zar. Eksik olan **kademe**: neredeyse her olay aynı şiddette; büyük anlar yeterince büyük değil.
- **Üç kademe** (arayüz planı adım 5): küçük / orta / büyük; duraklama ve tahta sarsıntısı yalnız büyükte.
- **Mühür** imzası (arayüz planı): satın alma, el değiştirme, ipotek, tedbir.
- **Kira büyüklüğü:** ödenen tutar yazısı tutarla büyüsün (25 küçük, 1.000 ekranın ortasında, jetonlar daha çok ve daha ağır).
- **Dava zarı:** iki tarafın zarı aynı anda değil, sırayla; ikinci zar dönerken kısa gerilim duraklaması, kazanan tarafa tokmak.
- **Açık artırma:** "gidiyor ... gidiyor ... satıldı" tokmak ritmi (arayüz planı).
- **İtiraz zinciri:** her İtiraz bir öncekinin üstüne çarparak biner, zincir uzadıkça ses perdesi yükselir.
- **Oyun sonu:** Seçim Günü'nde sonuçlar tek tek açılsın (sonuncudan birinciye, "sandık açılıyor" havası), birinci açılmadan önce kısa sessizlik.
- **Erişilebilirlik:** ses penceresine "Sarsıntı" ve "Yanıp sönme" anahtarları; hareket azaltma tercihine uyulmaya devam.

## 3. Kart sistemi (card-game)
Ölçüm (`sim.js 200 5`): oyuncu başına oyun boyunca **7,2 kart** çekiliyor, turda en fazla 1 kart oynanıyor. Oyunun kendine özgü katmanı (Hamle kartları) seyrek; oyunun çoğu Monopoly döngüsü (zar, yürü, öde).
- **Kart akışı:** her dönem başında (gündem değişince) herkese 1 kart; ya da kira ödeyen oyuncu "teselli" olarak kart çeker (yalnız elinde 3'ten az varsa). Hedef oyuncu başına 10-12 kart.
- **Deste ve atılanlar görünür:** atılan kart yığını herkese açık olsun (hangi kartların çıktığını bilmek İtiraz zamanlamasını oyunlaştırır). Arayüz planı adım 6 görselini hazırlıyor.
- **Kombinasyonlar:** şu an kartlar tek başına çalışıyor. Örnek ikili etkiler: Kira Zammı + Tedbir aynı tur (rakibin kira alamaz, sen iki kat alırsın), Müteahhit Dostu + İmar Affı beklentisi. Kartlara "aynı tur başka bir Saldırı oynadıysan +50" gibi küçük bağlar düşünülebilir; dikkat, sadelik ilkesi.
- **Elde aynı türden iki kart** sıraların %10'unda; ikili oynama (aynı iki kartı birlikte oynayınca güçlü sürüm: iki Piyango = 250) elde biriken kartı değerli kılar.

## 4. Mekanik eleştirisi
Ölçüm (200 oyun, 5 bot): birinci ile sonuncu arası ortalama **5.896** puan; oyun başına **2,9 konkordato**; oyuncuların **%26'sı hiç set tamamlamıyor**; en büyük kira ortalama 1.194 (başlangıç nakdi 1.500).
- **Kartopu etkisi:** önde olan hızla kaçıyor, batanlar oyunda kalıyor ama söz hakları yok. Konkordatolu oyuncu 20. dakikada izleyiciye dönüyor (TASARIM.md'nin kaçınmak istediği şey). Öneriler:
  - **Muhalefet:** sonuncu ve konkordatolu oyuncu her dönem başında 1 ek kart çeker; Saldırı kartları birinciye karşı oynanınca İtiraz edilemez (ya da yarı fiyat).
  - **Rant Vergisi** (gündem) tek seferlik; liderin her Başlangıç geçişinde küçük bir "göz önünde olma" vergisi düşünülebilir.
  - Batan oyuncuya "kayyum" rolü: kendi sırasında bir rakibin mülküne Tedbir koyma hakkı gibi zayıf ama oyunda tutan bir eylem.
- **Set tamamlamak zor:** %26 hiç set yok. Pazarlık açık ama botlar ve insanlar takas etmiyor olabilir; set eksiği olanın eksik parçayı istemesini kolaylaştıran bir arayüz ("Bu set için eksik: Rize, sahibi Sevim, öner") hem mekanik hem arayüz kazancı.
- **Ölü sıralar:** zar at, yürü, kira öde, turu bitir. Sıranın çoğunda karar yok. Kart akışını artırmak (bölüm 3) ve her sırada küçük bir seçim (ör. Başlangıç'ta maaş ya da kart seçimi) bunu azaltır.
- **Bekleme:** tepki pencereleri (10 sn) adil ama masayı yavaşlatıyor; kimse tepki vermeyecekse "herkes geçti" olunca pencere hemen kapanmalı (gizlilik için bütün oyuncuların geçmesi gerekir, bot hemen geçer).
- **Oturma sırası:** 200 oyunda 3. oyuncu %14, diğerleri %17-24; büyük ihtimalle gürültü, 1000 oyunla yeniden ölçülmeli.

## 5. Yeniden oynanabilirlik
Gizli hedefler kaldırıldıktan sonra her oyunu farklı yapan şey yalnız gündem ve sürpriz.
- **Meslekler (asimetrik başlangıç):** oyun başında herkese 2 meslek kartı, biri seçilir. Örnekler: Müteahhit (kat %20 ucuz), Emlakçı (ihalede +10 yerine +5 artırabilir, ihaleyi beraberlikte kazanır), Avukat (Dava'da +1 zar), Muhtar (Çay Ocağı'nda iki kat), Belediye Meclis Üyesi (sonraki gündemi bir dönem önce görür), Kooperatif Başkanı (set dışı kat kirası yarı değil). Botlar zaten var, her mesleğe basit bir bot eğilimi yazılır. En büyük yeniden oynanma kazancı bu.
- **Kamu ihaleleri (açık hedefler):** her dönem masaya 3 açık görev çıkar (ör. "ilk 2 kaçak kat diken", "bir sahil ilinde 3 kat", "bu dönem en çok kira alan"); ilk yapan ödül alır. Gizli hedeflerin aksine herkes görür, yarış yaratır.
- **Senaryolar:** lobide "Masa": Normal, 2001 Krizi (enflasyon kartları sık, nakit erir), Seçim Yılı (vaat ve af kartları sık), Kentsel Dönüşüm (yıkım ve yeni kat kartları sık). Yalnız gündem destesinin karışımını değiştirir, kural eklemez.
- **İkinci harita:** İstanbul ilçeleri (yol haritasında var). Meslek ve senaryoyla birlikte büyük tazelik.
- **Oyun sonu ünvanları:** dayı yorumu zaten istatistikten seçiliyor; buna herkese bir ünvan ("Kaçak Kat Kralı", "Dava Canavarı", "Kiracı Dostu") eklemek oyun sonunu herkes için ilginç kılar ve bir sonraki oyunda başka ünvan kovalatır.
- **Günün masası:** her gün aynı tohumla aynı gündem sırası ve aynı başlangıç; arkadaşlar ayrı ayrı botlara karşı oynayıp puan karşılaştırır (sunucu gerekmez, puan paylaşma linki).
