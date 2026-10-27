# RANT — Oyun Tasarımı (kaynak belge)

> Bu belge oyun kurallarının tek doğru kaynağıdır. Kod bu belgeyi izler; kural değişirse önce burası güncellenir.
> Kural sürümü: 1 (2026-10-25)

## 1. Fikir

Monopoly'nin atası "The Landlord's Game" ev sahipliğini eleştiren bir oyundu. RANT da aynı ruhla Türkiye'deki imar, kentsel dönüşüm, kaçak kat ve "dayı" kültürünü tiye alan, 4-5 kişilik, internetten oynanan bir emlak ve kart oyunudur.

Monopoly'den tanıdık olanlar: zar, tahta, mülk alma, set tamamlama, kat dikme, kira, pazarlık.
RANT'a özgü olanlar:

| Mekanik | Ne yapar | Neden eğlenceli |
|---|---|---|
| **Kestirme ve Taksi** | Zar toplamı kadar ilerlersin; kartla zarlardan birini seçer ya da 1-12 kare istediğin yere gidersin | Kirayı atlatma şansı değerli ve sınırlı kalır |
| **Gündem** | 3 turda bir herkesi etkileyen bir haber kartı açılır; kuralları 3 tur sürer | Ortak kahkaha, her oyun farklı |
| **Hamle kartları** | Elde tutulan aksiyon kartları (Kamulaştırma, İhtiyati Tedbir, Dava...) | Sıra sende olmasa da oyundasın |
| **İtiraz zinciri** | Sana oynanan karta İtiraz, İtiraz'a karşı İtiraz | Monopoly Deal'deki "Hayır!" gerilimi |
| **Kaçak Kat** | Set olmadan, yarı fiyata kat; ama Zabıta ve İhbar ile yıkılabilir | Risk-ödül, İmar Affı kumarı |
| **Açık artırma** | Almadığın arsa Monopoly'deki gibi açık artırmaya çıkar: sırayla artır ya da çekil | Herkes teklifi görür, pazarlık gerilimi |
| **Enflasyon Endeksi** | Fiyatlar ve kiralar endeksle artar, nakit erir | Erken yatırımı ödüllendirir |
| **Konkordato** | Batan oyuncu oyundan çıkmaz; borcu silinir, sonda ceza alır (iflas modunda batan elenir) | Kimse 20. dakikada izleyici olmaz |
| **Seçim Günü** | Oyun sabit tur sayısında (varsayılan 20) biter | Monopoly'nin bitmeyen oyun sorunu yok |

## 2. Temel bilgiler

- Oyuncu: 2-6 (denge 4-5 için ayarlı). Boş koltuklar botla doldurulabilir.
- Piyon lobide, adı altında yazan 15 figürden seçilir (her şehrin bir ya da birkaç simgesi). Her piyon masada bir kez bulunur; başkasının seçtiği piyon seçilemez. Seçicide piyonun etrafında renk çizgisi olmaz, oyuncu rengi tahtada görünür.
- Süre: ev sahibi lobide oyunun nasıl biteceğini seçer:
  - **Tur sayısıyla**: 15, 20 (varsayılan) ya da 25 tur. 20 tur 5 kişiyle yaklaşık 40-50 dakika (kartlar seyrek geldiği için 15 turluk eski oyunla aşağı yukarı aynı süre).
  - **Değer hedefiyle**: 2.500, 3.500 ya da 5.000 ₺. Bir oyuncunun değeri (nakit + mülk + katlar, oyuncu panelinde görünen) hedefe ulaşınca o tur tamamlanır ve Seçim Günü gelir; herkes eşit sayıda oynamış olur. Bot simülasyonunda yaklaşık 9, 15 ve 22 tur sürer. Oyun en geç 30. turda biter.
  - **Son kalan (iflas)**: Monopoly'deki gibi. Borcunu kapatamayan oyuncu konkordato yerine **iflas eder** ve oyundan çıkar (bkz. §6). Tek oyuncu kalınca oyun hemen biter, o kazanır. Oyun sonsuza uzamasın diye bu modda **kiralar her tur artar**: kira çarpanı 1. turda 1, sonra her tur 0,4 artar (5. tur 2,6; 10. tur 4,6; 20. tur 8,6 kat); çarpan üst çubukta görünür. Oyun en geç 40. turda biter; o zaman ayakta kalanlar arasında puanı en yüksek olan kazanır. Bot simülasyonunda (300 oyun) 5 kişiyle oyunların %96'sı, 4 kişiyle %98'i son kalanla biter, ortanca 25-26 tur. Çarpan olmadan yalnız %4'ü bitiyordu: maaş ve banka parası her tur herkesi zenginleştirdiğinden kimse batmıyordu.
- Başlangıç: 1500 TL nakit, 3 Hamle kartı. Oturma sırası rastgeledir; sonra oynayan her oyuncu 30 fazla nakitle başlar (5 kişide 1500, 1530, 1560, 1590, 1620), çünkü ilk mülklere geç kalır. Kartlar seyrek gelince ilk oyuncu %24, beşinci %15 kazanıyordu; farkla hepsi %19-21.
- Kazanan: Seçim Günü'nde (son turun sonunda) en yüksek **puan**a sahip oyuncu. Değer hedefine ilk ulaşan değil, Seçim Günü'nde puanı en yüksek olan kazanır. İflas modunda kazanan son kalan oyuncudur.

### Masa ayarları

Ev sahibi lobide üç kuralı açıp kapatabilir; hepsi varsayılan olarak açıktır. Oyun başlayınca değişmez.

| Ayar | Kapalıyken |
|---|---|
| Açık artırma | Alınmayan arsa artırmaya çıkmaz, sahipsiz kalır. |
| SÜRPRİZ kareleri | SÜRPRİZ karesine gelince bir şey olmaz. |
| Gündem kartları | Tur başında Gündem kartı açılmaz; turlar yalnız sayılır. |

Ayrıca **Oyun hızı** (Yavaş / Normal / Hızlı): ev sahibi her hamleden sonra ekrandaki canlandırma (zar, yürüyüş, kart, sürpriz, haber) bitene kadar bekler; bot sonraki hamlesini, insanın süresi de o zaman başlar. Hız bu beklemeyi, canlandırmaları ve tepki pencerelerini 1,5 / 1 / 0,5 katına çeker: İtiraz ve Dayın Çıktı penceresi yavaşta 15, normalde 10, hızlıda 5 saniye; Kestirme penceresi (zardan sonra) yavaşta 2,25, normalde 1,5, hızlıda 0,75 saniye; rakibin oynadığı kart normalde 5,5 saniye ortada kalır.

**Bot seviyesi** (Kolay / Normal / Zor) masadaki bütün botlara uygulanır. Kolay bot pazarlık önermez, kaçak kat dikmez, kat dikmeyi ve kart oynamayı yarı yarıya unutur, yedeğini bozacak arsayı almaz, artırmada çabuk çekilir. Zor bot kaçak kat dikmez (zabıta ve ihbar riskine girmez), eksik parçayı karşı tarafın kabul edeceği en düşük parayla ister, para yetmezse kendi işine yaramayan bir mülkü takasa koyar; artırmada tavanını şaşmadan hesaplar ve her seferinde en az artışla teklif verir.

## 3. Tahta (36 kare)

Kareler 0'dan 35'e dizilir, tahta 10x10 ızgaradır. Köşeler: 0, 9, 18, 27.
Her kenarda 5 mülk, 1 gar, 1 havalimanı ve 1 FIRSAT ya da SÜRPRİZ karesi var.

| # | Kare | Tür | Fiyat |
|---|---|---|---|
| 0 | BAŞLANGIÇ NOKTASI | köşe | geçince ya da gelince maaş ve 1 kart |
| 1 | Amasya (Çorum) | mülk | 60 |
| 2 | Çorum (Çorum) | mülk | 80 |
| 3 | SÜRPRİZ | sürpriz | rastgele etki, hemen uygulanır |
| 4 | DOĞU EKSPRESİ | gar | 150 |
| 5 | Giresun (Trabzon) | mülk | 100 |
| 6 | Rize (Trabzon) | mülk | 100 |
| 7 | KAPADOKYA | havalimanı | 200 |
| 8 | Trabzon (Trabzon) | mülk | 120 |
| 9 | TAPU DAİRESİ | köşe | sahipsiz herhangi bir mülkü al |
| 10 | Balıkesir (Bursa) | mülk | 140 |
| 11 | FIRSAT | kart | 2 Hamle kartı çek |
| 12 | Bursa (Bursa) | mülk | 160 |
| 13 | KONYA GARI | gar | 150 |
| 14 | Aksaray (Konya) | mülk | 180 |
| 15 | Nevşehir (Konya) | mülk | 180 |
| 16 | DALAMAN | havalimanı | 200 |
| 17 | Konya (Konya) | mülk | 200 |
| 18 | ÇAY OCAĞI | köşe | herkesten çay parası |
| 19 | Adana (Antalya) | mülk | 220 |
| 20 | Mersin (Antalya) | mülk | 220 |
| 21 | SÜRPRİZ | sürpriz | rastgele etki, hemen uygulanır |
| 22 | ANKARA GARI | gar | 150 |
| 23 | Antalya (Antalya) | mülk | 240 |
| 24 | Eskişehir (Ankara) | mülk | 260 |
| 25 | ESENBOĞA | havalimanı | 200 |
| 26 | Ankara (Ankara) | mülk | 280 |
| 27 | ZABITA | köşe | bir oyuncuyu ihbar et |
| 28 | Aydın (İzmir) | mülk | 300 |
| 29 | FIRSAT | kart | 2 Hamle kartı çek |
| 30 | Manisa (İzmir) | mülk | 300 |
| 31 | HAYDARPAŞA | gar | 150 |
| 32 | İzmir (İzmir) | mülk | 320 |
| 33 | İstanbul Anadolu (İstanbul) | mülk | 350 |
| 34 | SABİHA GÖKÇEN | havalimanı | 200 |
| 35 | İstanbul Avrupa (İstanbul) | mülk | 400 |

Şehir grupları ve kat fiyatları: Çorum 50, Trabzon 50, Bursa 100, Konya 100, Antalya 150, Ankara 150, İzmir 200, İstanbul 200.
Sahil grupları: Antalya, İzmir.

Kareler il adını taşır; set (şehir grubu) adı ve anahtarı aynı kalır (ör. Trabzon seti: Giresun, Rize, Trabzon).

### Tahtanın görünüşü

- Set renkleri (ucuzdan pahalıya): Çorum `#5e3a1e`, Trabzon `#6cc4ee`, Bursa `#22a35a`, Konya `#f5c518`, Antalya `#f0761a`, Ankara `#c47ad8`, İzmir `#d8283c`, İstanbul `#1b2f7a`. Monopoly gibi kenar derinliği her yanda aynı, köşeler kare; karelerin içeriği dıştan içe bakar (alt sıra dik, sol sütun 90, üst sıra 180, sağ sütun -90 derece döner). Mülk karesinin ortaya bakan kenarında setin tam doygun rengindeki bant ve hemen altında sahiplik şeridi, ortasında bina resmi, dış kenarında il adı (hiçbir şey adı örtmez).
- Oyuncu renkleri il renklerinden uzak seçildi: turkuaz `#009c9c`, fuşya `#e81c8c`, fıstık `#a6e000`, elektrik `#4a3aff`, kömür `#2b2f38`, beyaz `#ffffff`. Beyaz ve kömür, çizildikleri her yerde (şerit, piyon kaidesi, harita) ince koyu kenarla görünür.
- Sahiplik: iç kenardaki şerit; sahipsizken ince ve soluk, sahipliyken kalın, beyaz kenarlı ve sahibinin renginde.
- Bina resmi `assets/bina/<set>/`: seviye L (yasal + kaçak) 0 ise resim yok; kaçak yoksa `L.png`; üst kat kaçaksa `k{L-1}.png`. İmar Affı'yla yasallaşan mülk (motorda `affed`) katı kalana dek kaçak resmiyle görünür. `0.png` yalnız tapu cetvelinde, `yikik.png` yalnız yıkım canlandırmasında. Resim hep oranını korur (`contain`).
- Köşe kareleri kraft kağıdı zeminde (koyu temada koyu kraft) kendi renkli simgesiyle. Yol yok: piyon durduğu karenin iç kenarında, ortaya hafifçe taşarak durur (köşede iç köşede); aynı karedeki piyonlar iç kenar boyunca dizilir. Piyonun altında oyuncu renginde beyaz halkalı oval kaide ve yumuşak gölge, figürde beyaz kontur; sırası gelen biraz büyük ve hafifçe zıplar, durduğu kare onun renginde çerçevelenir.
- Ortada soluk Türkiye haritası: 20 ilin yerinde içi dolu yuvarlak (sahipsizken set renginde, sahipliyken büyük ve sahibinin renginde); katlı ilin binası (karedekinin aynısı, daha büyük) ilin yerinde durur, yeni bina yaylı yükselir. Harita modu dışında harita çok soluk ve arkadadır, hiçbir şey parlamaz; istem ve zar önde okunur. Ortanın sol altındaki harita düğmesine gelince (ya da basınca) yazılar çekilir, harita öne çıkar; bu modda bir ile gelince tapusu açılır.

### Kira

- Kiralar **Monopoly cetvelinden** alınır: her mülk, Monopoly'de aynı fiyattaki arsanın arsa kirasını ve 1-4 ev kirasını kullanır (ör. Amasya 60: 2/10/30/90/160, İstanbul Avrupa 400: 50/200/600/1400/1700; tablo `src/engine/data.js`). Otel yok, en fazla 4 kat.
- Seviye L = yasal kat + kaçak kat (en fazla 4).
- L = 0: arsa kirası; şehrin tüm mülkleri aynı kişideyse **2 katı**.
- L = 1..4: cetveldeki 1-4 ev kirası. Şehir seti tamamlanmamışsa (kaçak kat ya da Müteahhit katı) bu kira **yarıdır**.
- Kira 5'e yuvarlanır ve en az 5'tir (Monopoly'nin 2-4'lük kiraları sıfıra düşmesin diye).
- Havalimanı: kira sahibinin havalimanı sayısıyla **her biri için ikiye katlanır**: 1'i varsa 25, 2'si 50, 3'ü 100, 4'ü 200.
- Gar: kira elindeki gar sayısıyla **orantılı** artar: gar başı 30 (1'i 30, 2'si 60, 3'ü 90, 4'ü 120).
- Gar ve havalimanı ayrı sayılır; ipotekli olan sayılmaz. Bunlara kat dikilmez.
- Tüm para değerleri **Endeks / 100** ile çarpılır (başlangıçta Endeks 100) ve 5'e yuvarlanır.
- İpotekli ya da İhtiyati Tedbirli mülk kira almaz.

## 4. Tur akışı

1. **Tur başı** (ilk oyuncudan önce): her dönem başında (1., 4., 7. ... tur) yeni Gündem kartı açılır ve uygulanır; önceki gündemin dönem kuralları biter.
2. **Sıra başı**: Kart çekilmez. Kira Zammı etkin kaldıysa burada biter.
3. **Zar öncesi**: Hamle kartı oynayabilir (turda en fazla 1), kat dikebilir, ipotek yapabilir, pazarlık teklif edebilirsin.
4. **Zar**: İki zar atılır, toplamı kadar ilerlersin. Elinde *Kestirme* varsa zarı gördükten sonra zarlardan birini seçebilirsin: zarlar durunca kısa bir pencere (normal hızda 1,5 sn) açılır; o sürede Kestirme oynamazsan piyon toplam kadar kendiliğinden yürür. Kartı olmayan hiçbir düğme görmez, yalnız zarı görür; tıklamaya gerek yoktur. Çift zar kart vermez ama Monopoly'deki gibi **bir daha oynatır**: turunu (kat, kart, pazarlık) bitirince yeniden zar atarsın; üst üste en fazla 2 kez (üçüncü çiftte ek hak yok). Turda tek Hamle kartı kuralı ek atışta da geçerlidir.
   (İlk taslakta her turda zar seçimi vardı; simülasyonda oyuncular kirayı neredeyse hiç ödemediği için karta taşındı.)
5. **Kareye geliş** (aşağıda).
6. **Serbest evre**: Hamle (bu tur oynamadıysan), kat, ipotek, pazarlık; sonra **Turu Bitir**. Yapabileceğin hiçbir şey yoksa (oynanabilir kart, dikilebilir yasal ya da kaçak kat, kaldırılabilir ipotek yok, nakit eksi değil) tur 3 saniye sonra kendiliğinden biter; düğmede geri sayım görünür. Bu sürede ele gelmek, bir pencere açmak ya da tahtaya tıklamak kendiliğinden bitirmeyi o tur için durdurur. Yalnız arayüzdür: süre dolunca istemci normal Turu Bitir hamlesini gönderir, kural değişmez.

**Açık pazarlık:** Sırası olmayan oyuncular da, sıradaki oyuncu zar öncesi ya da serbest evredeyken (bekleyen karar yokken), herhangi bir oyuncuya turda bir pazarlık teklifi yapabilir. Masada aynı anda tek teklif bulunur.
7. Turu bitirmek için: bekleyen karar yok, nakit >= 0, elde en fazla 6 kart.
8. **Tur sonu** (son oyuncudan sonra): Tur özeti açıklanır: net değeri en çok artan ve en çok düşen oyuncu, el değiştiren mülkler. Yalnız bilgi verir, kurala etkisi yoktur.

### Karelere geliş

- **Sahipsiz mülk**: Liste fiyatına **Satın Al** ya da **İhaleye Çıkar**. Parası yetmeyen ihaleye çıkarır.
- **Başkasının mülkü**: Kira ödenir. Elinde *Dayın Çıktı* varsa kullanıp ödemeyebilirsin.
- **Kendi mülkün**: bir şey olmaz.
- **FIRSAT**: 2 Hamle kartı çek.
- **SÜRPRİZ**: Rastgele bir Sürpriz etkisi açılır ve **hemen** uygulanır, seçim yapılmaz (bkz. bölüm 8b).
- **BAŞLANGIÇ NOKTASI**: İleri yönde geçince ya da gelince maaş (200; Asgari Ücret zammıyla artar) ve elinde 5'ten az kart varsa 1 Hamle kartı. Kart, maaş ödenmeyen dönemde de (Bankacılar Grevde) verilir.
- **TAPU DAİRESİ**: Tahtadaki sahipsiz herhangi bir mülkü fiyatına alabilirsin. Alacak yoksa 1 kart.
- **ÇAY OCAĞI**: Diğer her oyuncu sana 25 çay parası öder (nakdi yettiği kadar).
- **ZABITA**: Kaçak katı olan bir rakibi seç; tüm kaçak katları yıkılır, kat başı 25 ceza öder.

### Açık artırma

Monopoly'deki gibi: satın almayı reddedenden sonraki oyuncudan başlayarak sırayla herkes ya **artırır** ya **çekilir**. Reddeden de katılır; nakdi olmayan katılamaz.

- Artırma en az en yüksek teklif + 10 (Endeks ile ölçeklenir) olmalı ve nakdi geçemez. Nakdi bu en düşük teklife yetmeyen kendiliğinden çekilir.
- Çekilen bir daha teklif veremez. Sıra lider dışındaki, çekilmemiş sonraki oyuncuya geçer.
- Lider dışında herkes çekilince lider kazanır ve teklifini öder. Hiç teklif yokken herkes çekilirse arsa sahipsiz kalır.
- Teklifler herkese açıktır. Her teklif sırası 15 sn; süre dolan çekilmiş sayılır.
- (İlk sürümde aynı anda verilen gizli teklif vardı; kullanıcı testinde Monopoly'deki açık artırma istendi.)

## 5. İnşaat

- **Yasal kat**: Şehrin tüm mülkleri sende ve hiçbiri ipotekli değilse. Fiyat: şehrin kat fiyatı.
- **Kaçak kat**: Herhangi bir mülküne (set şart değil) kat fiyatının yarısına. Mülk başına en fazla 1. İhbar, Zabıta ve Belediye Operasyonu ile yıkılır; İmar Affı ile yasallaşır.
- Seviye en fazla 4. Eşit dağıtım kuralı yok.
- **Kat satma**: Yasal kat için kat fiyatının yarısı, kaçak kat için kaçak maliyetinin yarısı geri gelir.
- **İpotek**: Katsız mülk için fiyatın %50'si alınır; kaldırmak fiyatın %55'i. İpotekli mülk kira almaz; o şehirde yasal kat dikilemez.

## 6. Borç ve Konkordato

- Ödemeler her zaman tam yapılır; nakit eksiye düşebilir.
- Eksi nakitle teklif veremez, kat dikemez, para isteyen kart oynayamazsın.
- Sıranı bitirmeden nakdini 0'ın üstüne çıkarmalısın (kat sat, ipotek et, pazarlık yap). "Borcu Kapat" düğmesi bunu otomatik yapar: önce kaçak katlar, sonra ucuz katlar, sonra ucuz mülkler ipotek.
- Satacak bir şey kalmadıysa **Konkordato**: nakit 0 olur, oyundan çıkmazsın, sonda konkordato başına 300 puan cezası.
- **İflas modunda** konkordato yoktur; satacak bir şey kalmayan oyuncu **iflas eder**: mülkleri katsız ve ipoteksiz olarak bankaya döner (sahipsiz, yeniden satın alınabilir), elindeki kartlar desteye gider, oyundan çıkar. Elenen oyuncunun sırası atlanır; aidat, çay parası, gündem ve sürpriz ödemelerine katılmaz; kartlara, pazarlığa ve artırmaya hedef olamaz. Sıralama: ayakta kalanlar puana göre, sonra elenenler son elenenden ilk elenene.

## 7. Hamle kartları (40)

Sıra sendeyken turda en fazla 1 Hamle kartı oynanır. Tepki kartları (İtiraz, Dayın Çıktı) bu sınıra girmez.

**Tepki beklemesi ve gizli el:** Oyun yalnız kartı olanı bekletirse kimde kart olduğu herkesin ekranında belli olur. Bu yüzden masada o karttan en az biri varsa ilgili oyuncuya, kartı olsun olmasın, aynı karar penceresi (normal hızda 10 sn) açılır: Hamle kartının hedefine İtiraz (zincirde karşı taraf da), kira ödeyene Dayın Çıktı. Kartı olmayan yalnız Kabul Et / Öde'yi görür. Zar atana Kestirme ile yol seçimi için pencere kısa ve tıklamasızdır (normal hızda 1,5 sn): kartı olan da olmayan da aynı süre bekler, kimse erken geçemez (kartı olanda Toplam düğmesi de yoktur), süre dolunca piyon toplam kadar yürür. Masada o karttan hiç yoksa beklenmez; böylece yalnız "masada biri bu karta sahip" bilgisi çıkar, kimin olduğu çıkmaz.

**İhtiyati Tedbir süresi:** Kartı oynayanın 2 sırası boyunca sürer: sayaç 2 başlar, oynayanın her sıra başında 1 azalır, 0 olunca kalkar. Oynayan iflas edip elenirse tedbir de kalkar.

| Kart | Adet | Etki | Karşı hamle |
|---|---|---|---|
| İtiraz | 4 | TEPKİ: Sana oynanan bir Hamle'yi iptal et. İtiraz'a karşı da oynanabilir. | - |
| Dayın Çıktı | 2 | TEPKİ: Ödemen gereken bir kirayı ödemezsin. | - |
| Taksi | 2 | Zar atmadan önce: zar yerine 1 ile 12 arasında istediğin sayıda kare ilerle. | - |
| Kestirme | 3 | Zar attıktan sonra: toplam yerine yalnız bir zarın gösterdiği kadar ilerle. | - |
| Geri Vites | 2 | Zar atmadan önce: bu tur attığın zar kadar geri gidersin (maaş yok). | - |
| Kamulaştırma | 3 | Rakibinin katsız, ipoteksiz ve tam sette olmayan bir mülkünü, bedelini ona ödeyerek al. | İtiraz |
| Zorla Takas | 3 | Katsız bir mülkünü, rakibinin tam sette olmayan katsız bir mülküyle değiştir. | İtiraz |
| İhtiyati Tedbir | 2 | Rakibinin seçtiğin mülkü 2 tur boyunca kira getirmez, üstüne kat da dikilemez. | İtiraz |
| İhbar | 2 | Seçtiğin rakibin bütün kaçak katları yıkılır; rakip yıkılan her kat için 25 ceza öder. | İtiraz |
| Kira Zammı | 3 | Sıra yeniden sana gelene kadar alacağın ilk kira 2 katına çıkar. | - |
| Müteahhit Dostu | 3 | Aynı şehirde en az 2 mülkün varsa birine bedava 1 yasal kat dik (setin tamamı gerekmez). | - |
| Piyango | 2 | Bankadan 100 al. | - |
| Aidat Günü | 3 | Diğer oyuncuların her biri sana 30 öder. | Her hedef ayrı ayrı İtiraz edebilir |
| Dava Aç | 3 | Bir rakibine dava aç, ikiniz zar atın: yüksek atan ötekinden 100 alır (eşitlikte davalı kazanır). | İtiraz |
| Pazarlık Ustası | 3 | Bir mülkü satın alırken oyna: yarı fiyatına al. | - |

Kartlardaki para miktarları Endeks ile ölçeklenir.

### Denge ayarı (kullanıcı testi, 2026-10-25)

Kira oyunu sürüklemiyordu: kirayı atlatan kartlar çok, kart birikiyordu, bedava para maaşın %78'iydi. Monopoly değerlerine yaklaştırıldı. 300 bot oyunu, 5 oyuncu:

| Ölçüm | Önce | Sonra |
|---|---|---|
| Oyun başına kira ödemesi | 17,7 | 21,0 |
| Dayın Çıktı ile silinen kira | %22 | %11 |
| Elde ortalama kart / 6+ kartla başlayan sıra | 4,7 / %29 | 4,3 / %3 |
| Bedava banka parası (maaşa oranı) | 2005 (%78) | 1290 (%47) |
| Konkordato / oyun | 0,27 | 0,34 |
| Oturma sırasına göre kazanma | %14-24 | %18-22 |

Kalan bedava paranın çoğu gündemden geliyordu (Bayram, Seçim vaadi). Gündem 3 turda bir değişince bu da azaldı (bkz. §8).

## 8. Gündem kartları (29)

Gündem bir **dönem** boyunca geçerlidir: dönem 3 tur sürer (tüm oyuncuların 3 kez oynaması). Kart 1., 4., 7., 10., 13., 16. ve 19. turun başında açılır; 20 turluk oyunda 7 gündem görülür. Para, kat ve endeks kartları açıldıkları anda bir kez uygulanır. "Bu dönem" diye başlayan kurallar dönem bitene kadar, yani 3 tur boyunca geçerlidir. Haber kartı yalnız gündem değişince ekrana gelir; aradaki turlarda gündem çubuğu kaç tur kaldığını gösterir. Ev sahibi gündemi lobiden tümüyle kapatabilir.

Ölçüm (300 bot oyunu, 5 kişi, her tur yerine 3 turda bir): oyun başına gündem 15 -> 5; oyun sonu Endeks ortalaması 123 -> 109; gündemden oyunculara giren para 715 -> 219, çıkan 559 -> 174; bedava banka parası maaşın %47'si -> %31'i; konkordato 0,33 (değişmedi). Bir dönem kuralının geçerli olduğu turların payı aynı kaldı (%31): kurallar daha seyrek gelir ama 3 kat uzun sürer.

| Kart | Adet | Etki |
|---|---|---|
| Enflasyon Açıklandı | 3 | Endeks +15 (kalıcı) |
| Dolar Rekor Kırdı | 1 | Herkes nakdinin %10'unu kaybeder |
| Asgari Ücrete Zam | 2 | Maaş +50 (kalıcı) |
| İmar Affı | 1 | Tüm kaçak katlar yasallaşır |
| Belediye Operasyonu | 1 | Tüm kaçak katlar yıkılır |
| Turizm Sezonu | 1 | Bu dönem Antalya ve İzmir kiraları 2 katı |
| Ulaşıma Zam | 1 | Bu dönem gar ve havalimanı kiraları 2 katı |
| Deprem Yönetmeliği | 1 | Yasal kat başı 15, kaçak kat başı 30 güçlendirme bedeli |
| Emlak Vergisi | 1 | Mülk başı 10 vergi |
| Kira İndirimi | 1 | Bu dönem tüm kiralar yarıya iner |
| Kira Artışı | 1 | Bu dönem tüm kiralar 1,5 katı |
| Bayram İkramiyesi | 2 | Herkese 100 |
| Kentsel Dönüşüm | 1 | Rastgele bir şehirde sahipli her mülke bedava 1 yasal kat |
| Seçim Vaadi | 1 | Net değeri en düşük oyuncuya 250 |
| Rant Vergisi | 1 | Net değeri en yüksek oyuncu 200 öder |
| Bankacılar Grevde | 1 | Bu dönem maaş yok |
| Piyasa Durgun | 1 | Bu dönem kat dikilemez |
| Konut Kampanyası | 1 | Bu dönem kat fiyatları yarı fiyat |
| Faiz İndirimi | 1 | Bu dönem ipotek kaldırma yarı fiyat |
| Faizler Uçtu | 1 | İpotekli mülk başı 20 faiz |
| Zabıta İzinde | 1 | Bu dönem İhbar oynanamaz, Zabıta karesi işlemez |
| Metro Müjdesi | 1 | Rastgele bir şehrin fiyat ve kiraları kalıcı olarak %25 artar |
| Komşuluk Hakkı | 1 | Herkes elinden rastgele bir kartı sonraki oyuncuya verir |
| Gündem Sakin | 2 | Bir şey olmaz, çaylar benden |

## 8b. Sürpriz etkileri (15)

SÜRPRİZ karesine gelen oyuncu için 15 etkiden biri eşit olasılıkla seçilir ve hemen uygulanır. Para değerleri Endeks ile ölçeklenir.

| Etki | Ne olur |
|---|---|
| Teyzeden Miras | Bankadan 150 al. |
| Radara Yakalandın | 75 hız cezası öde. |
| Düğün Var | Diğer her oyuncu sana 25 takı takar (nakdi yettiği kadar). |
| Hesap Senden | Diğer her oyuncuya 20 öde. |
| Robin Hood | Nakdi en çok olandan 100 alınır, nakdi en az olana verilir. |
| Duvarda Çatlak | En yüksek katlı mülkünden 1 kat çöker (önce kaçak kat). |
| Belediyeden Jest | Rastgele bir mülküne bedava 1 yasal kat dikilir. Uygun mülk yoksa 50 teselli. |
| Dededen Kalma Tarla | Sahipsiz en ucuz mülk bedavaya senin olur. Sahipsiz mülk yoksa 100 al. |
| Bedava Uçak Bileti | İleri yöndeki ilk havalimanına uçarsın (Başlangıç Noktası'ndan geçersen maaş), o kareye gelmiş sayılırsın. |
| Işınlanma | Rastgele bir kareye ışınlanırsın (maaş yok), o kareye gelmiş sayılırsın. SÜRPRİZ karelerine ışınlanılmaz. |
| Ters Köşe | Rastgele bir rakiple yerini değiştirirsin; ikiniz için de kare etkisi işlemez. |
| Kapkaç | Rastgele bir rakibin elinden rastgele bir kart kaparsın. Kimsenin kartı yoksa 1 kart çek. |
| Kayıp Bavul | Elindeki rastgele 1 kart gider. |
| Haciz Memuru | Nakdinin %10'u haczedilir. |
| Vergi İadesi | Mülk başı 15 iade al. |

## 9. Net Değer ve puan

Net Değer = nakit + mülklerin güncel fiyatı (ipotekli ise yarısı) + yasal kat x kat fiyatı + kaçak kat x kat fiyatının yarısı.
Puan = Net Değer - 300 x konkordato. Eşitlikte nakdi fazla olan kazanır.
Her tur sonunda herkesin net değeri kaydedilir; Seçim Günü sonuçlarında tur tur net değer çizgisi gösterilir (konkordato cezası çizgide yoktur, yalnız puanda).
Oyun sonu ekranındaki dayı yorumu için her oyuncunun diktiği kaçak kat, kazandığı açık artırma, kazandığı dava, itirazsız geçen Kamulaştırma ve Zorla Takas sayısı, ihbarı ya da zabıtasıyla yıkılan rakip kaçak katı ve aldığı toplam kira sayılır; puanı etkilemez.

## 10. Çevrimiçi mimari

- Oyun statik bir sitedir (GitHub Pages). Oyun sunucusu yoktur.
- Odayı kuran oyuncunun tarayıcısı **ev sahibidir**: oyun motoru orada çalışır, botları o yönetir, kuralları o doğrular.
- Diğer oyuncular PeerJS (WebRTC) ile doğrudan ev sahibine bağlanır. Eşleşme için PeerJS'in ücretsiz sunucusu, ağ engeline karşı PeerJS'in TURN sunucuları kullanılır.
- Her oyuncu yalnız kendi görünümünü alır (başkalarının eli gizli). Zar ve desteler ev sahibindedir.
- Ev sahibi sayfayı yenilerse oyun tarayıcı hafızasından geri yüklenir; oyuncular otomatik yeniden bağlanır.
- **Ev sahibi devri:** ev sahibi her hamleden sonra oyunun tam halini sıradaki bağlı insan oyuncuya (yedek) da gönderir; koltuk anahtarları gönderilmez. Ev sahibi 15 saniye dönmezse yedek aynı oda koduyla ev sahibi olur, diğerleri kendiliğinden ona bağlanır; koltuklar, kimliği o koltuğa denk gelen tokenle dönene verilir. Eski ev sahibi "Devam et" derse oda başkasında açık olduğu için oyuncu olarak katılır. Bedeli: yedek oyuncunun tarayıcısı da herkesin elini tutar (ev sahibininki gibi); arkadaş masası için kabul edildi.
- Sırası gelen oyuncu turda en fazla 3, diğerleri (sıradaki oyuncu zar atmadan önce ya da turunu bitirmeden) turda 1 pazarlık teklifi yapar; masada aynı anda tek teklif bekler. Teklifi alan kabul eder, reddeder ya da karşı teklif yapar: aynı pazarlık ters yönde sürer, bir pazarlıkta en fazla 2 karşı teklif olur.
- Bağlantısı kopan oyuncunun yerine bir süre sonra bot oynar; dönünce koltuk geri verilir.
- Motor taşıma katmanından bağımsızdır; ileride bir WebSocket sunucusu aynı protokolle eklenebilir.

## 11. Tahta animasyonları

Her animasyonun sabit bir zaman çizelgesi var (`src/ui/boardfx.js`, `T`). Sesler animasyona denk gelecek biçimde kısa vuruşlara bölünmüştür (`assets/ses/fx`, ElevenLabs): her vuruş görüntüdeki anına çalar, darbe seslerinin en yüksek yeri tam o ana gelir. Oyun bölünmez, tahta kararmaz.
- **Yürüyüş:** her adımda piyon yay çizerek sıçrar; kalkışta hızlanır, ortada hızlı, varışta yavaşlar (toplam süre adım başı bütçeyle aynı). Son inişte ezilir, altında küçük bir toz halkası açılır, kısa duraklar. Her inişte adım sesi.
- **Kurallar:** kare büyümez, yerinden oynamaz; vurgu karenin kenarında olur. Etiket ve tutar tahtanın üst yarısında piyonun altında, alt yarısında üstünde çıkar. Efektler piyonların altında kalır; yalnız jetonlar ve ± tutar piyonların üstünden geçer. Hareket azaltma açıksa zıplama, halka, kenar çizgisi ve uçuş olmaz; parlama, etiket ve sesler kalır. Aynı anda birkaç kare canlanırsa ses bir kez çalar.
- **Tur başı (1 sn):** piyon zıplar (`zipla`), 0,5. sn'de konar (`tak`), küçük bir sekişle 1. sn'de yine konar; oyuncu renginde 3 halka yayılır, karesi iki kez parlar. Kendi sıranda zil de çalar (`zil`). Piyonun yanında piyon resmi + ad ("Sıra sende!") yaklaşık 2,4 sn kalır.
- **Mülk alındı (1 sn):** alıcının rengi karenin kenarını 0,6 sn'de dolanır (`suzulme`), o anda mühür vurulur (`muhur`) ve şerit soldan o renkle dolar. İhale ve pazarlıkta kendi sesleri çalar.
- **Tam set (1,2 sn, mülk animasyonundan sonra):** setin kareleri sırayla sahibinin rengine boyanır; her kare tamamlanınca bir nota, giderek tizleşir (`nota`); sonunda şeritlerde yıldızlar parlar (`parilti`).
- **Kira ve maaş (0,9 sn):** jetonlar kalkarken fırlatma sesi (`firlat`), her jeton piyona konduğunda jeton sesi (`jeton`); tutar iki piyonun yanında belirir. Maaşta Başlangıç köşesi altın renkte parlar, kasa zili ilk parlamada (`kasa`). Diğer para hareketleri (kart, gündem, vergi) eskisi gibi oyuncu panelleri ve banka arasında uçar.
- **Kat dikildi (0,8 sn):** yeni bina resmi yukarıdan düşer (`dusus`), 0,44. sn'de yere çarpıp ezilir (`tok`), seker ve yine konar (`tak`).
- **Kaçak kat yıkıldı (1,3 sn):** zabıta düdüğüyle (`duduk`) kenar kırmızı iki kez yanar, binanın tepesi titrer (`tikirti`) ve 0,8. sn'de toza dönüşür (`puf`); kısa bir an yıkıntı görünür, sonra kalan bina.
- **İflas (1,8 sn):** piyon sallanır (`sallanma`), renksizleşip düşerek kaybolur (`huzun`), mülklerinin şeritleri sırayla griye döner (her birinde `cit`).
- **His:** kareye gelince kare 2 px kalkar ve gölgelenir (büyümez; kart sürüklerken ve kare seçerken kalkmaz); düğmeler üstüne gelince 1 px kalkar, basınca iner. Oyuncu satırının üstüne gelince o oyuncunun mülkleri kendi renginde parlar, diğer kareler solar.
- **Bakiye sayacı:** para el değiştirince oyuncu listesindeki bakiye ilk jeton kalkınca saymaya başlar, son jeton konunca biter (jeton uçuşuyla aynı süre).
- **Dayı balonu (2,4 sn):** büyük anlarda (biri kaçak kat diker, İhbar ya da Zabıta kaçakları yıkar, iflas, konkordato, en az 300'lük kira, İmar Affı) tahtanın ortasının sağ üst köşesinde yuvarlak dayı resmi ve tek satır laf belirir; ortadaki sahne açıksa o kapanınca. Dayı yolsuzluğu över, dürüstle dalga geçer. Aynı anda tek balon; hızlı oyunda çıkmaz.

## 12. Protokol (v1)

İstemci -> ev sahibi: `hello {v, name, avatar, token}`, `act {action}`, `lobby {cmd}`, `profile {...}`, `sticker {id}`, `pong`.
Ev sahibi -> istemci: `welcome {seat}`, `reject {reason}`, `lobby {...}`, `state {view, events}`, `sticker {p, id}`, `error {msg}`, `ping`. (Sohbet 2026-10-25 kullanıcı isteğiyle kaldırıldı.)

**Tepki çıkartmaları:** masadaki her oyuncu altı hazır çıkartmadan birini (Yuh!, Helal!, Olmaz öyle, Hadi ya, Dayııı!, Kira geldi) gönderebilir; herkesin ekranında o oyuncunun piyonundan yükselir. Serbest yazı yoktur. Ev sahibi kimliği ve listeyi doğrular, oyuncu başına 2 saniyede birden fazlasını yaymaz; çıkartma oyun durumuna ve kayda girmez, botlar göndermez.
Sürüm uyuşmazsa istemciye "sayfayı yenile" denir.
