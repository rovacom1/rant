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
| Sürpriz kareleri | Sürpriz karesine gelince bir şey olmaz. |
| Gündem kartları | Tur başında Gündem kartı açılmaz; turlar yalnız sayılır. |

Ayrıca **Oyun hızı** (Yavaş / Normal / Hızlı): ev sahibi her hamleden sonra ekrandaki canlandırma (zar, yürüyüş, kart, sürpriz, haber) bitene kadar bekler; bot sonraki hamlesini, insanın süresi de o zaman başlar. Hız bu beklemeyi, canlandırmaları ve tepki pencerelerini 1,5 / 1 / 0,5 katına çeker: İtiraz ve Dayın Çıktı penceresi yavaşta 15, normalde 10, hızlıda 5 saniye; Kestirme penceresi (zardan sonra) yavaşta 2,25, normalde 1,5, hızlıda 0,75 saniye; rakibin oynadığı kart normalde 5,5 saniye ortada kalır.

**Oyun türü** (Klasik / Mahalle): Klasik bu belgenin 3-9. bölümlerindeki şehir tahtasıdır; Mahalle 6x6 arsalık ikinci oyun türüdür (bkz. §13; kuralları onaylandı, kodu henüz yok).

**Bot seviyesi** (Kolay / Normal / Zor) masadaki bütün botlara uygulanır. Kolay bot pazarlık önermez, kaçak kat dikmez, kat dikmeyi ve kart oynamayı yarı yarıya unutur, yedeğini bozacak arsayı almaz, artırmada çabuk çekilir. Zor bot kaçak kat dikmez (zabıta ve ihbar riskine girmez), eksik parçayı karşı tarafın kabul edeceği en düşük parayla ister, para yetmezse kendi işine yaramayan bir mülkü takasa koyar; artırmada tavanını şaşmadan hesaplar ve her seferinde en az artışla teklif verir.

## 3. Tahta (36 kare)

Kareler 0'dan 35'e dizilir, tahta 10x10 ızgaradır. Köşeler: 0, 9, 18, 27.
Her kenarda 5 mülk, 1 gar, 1 havalimanı ve 1 Fırsat ya da Sürpriz karesi var.

| # | Kare | Tür | Fiyat |
|---|---|---|---|
| 0 | BAŞLANGIÇ NOKTASI | köşe | geçince ya da gelince maaş ve 1 kart |
| 1 | Amasya (Çorum) | mülk | 60 |
| 2 | Çorum (Çorum) | mülk | 80 |
| 3 | Sürpriz | sürpriz | rastgele etki, hemen uygulanır |
| 4 | Doğu Ekspresi | gar | 150 |
| 5 | Giresun (Trabzon) | mülk | 100 |
| 6 | Rize (Trabzon) | mülk | 100 |
| 7 | Kapadokya | havalimanı | 200 |
| 8 | Trabzon (Trabzon) | mülk | 120 |
| 9 | TAPU DAİRESİ | köşe | sahipsiz herhangi bir mülkü al |
| 10 | Balıkesir (Bursa) | mülk | 140 |
| 11 | Fırsat | kart | 2 Hamle kartı çek |
| 12 | Bursa (Bursa) | mülk | 160 |
| 13 | Konya Garı | gar | 150 |
| 14 | Aksaray (Konya) | mülk | 180 |
| 15 | Nevşehir (Konya) | mülk | 180 |
| 16 | Dalaman | havalimanı | 200 |
| 17 | Konya (Konya) | mülk | 200 |
| 18 | ÇAY OCAĞI | köşe | herkesten çay parası |
| 19 | Adana (Antalya) | mülk | 220 |
| 20 | Mersin (Antalya) | mülk | 220 |
| 21 | Sürpriz | sürpriz | rastgele etki, hemen uygulanır |
| 22 | Ankara Garı | gar | 150 |
| 23 | Antalya (Antalya) | mülk | 240 |
| 24 | Eskişehir (Ankara) | mülk | 260 |
| 25 | Esenboğa | havalimanı | 200 |
| 26 | Ankara (Ankara) | mülk | 280 |
| 27 | ZABITA | köşe | bir oyuncuyu ihbar et |
| 28 | Aydın (İzmir) | mülk | 300 |
| 29 | Fırsat | kart | 2 Hamle kartı çek |
| 30 | Manisa (İzmir) | mülk | 300 |
| 31 | Haydarpaşa | gar | 150 |
| 32 | İzmir (İzmir) | mülk | 320 |
| 33 | İstanbul Anadolu (İstanbul) | mülk | 350 |
| 34 | Sabiha Gökçen | havalimanı | 200 |
| 35 | İstanbul Avrupa (İstanbul) | mülk | 400 |

Şehir grupları ve kat fiyatları: Çorum 50, Trabzon 50, Bursa 100, Konya 100, Antalya 150, Ankara 150, İzmir 200, İstanbul 200.
Sahil grupları: Antalya, İzmir.

Kareler il adını taşır; set (şehir grubu) adı ve anahtarı aynı kalır (ör. Trabzon seti: Giresun, Rize, Trabzon).

### Tahtanın görünüşü

- Set renkleri (ucuzdan pahalıya): Çorum `#5e3a1e`, Trabzon `#6cc4ee`, Bursa `#22a35a`, Konya `#f5c518`, Antalya `#f0761a`, Ankara `#c47ad8`, İzmir `#d8283c`, İstanbul `#1b2f7a`. Monopoly gibi kenar derinliği her yanda aynı, köşeler kare; karelerin içeriği dört kenarda da dik durur, adlar baş çevirmeden okunur (2026-11-01). Mülk karesinin ortaya bakan kenarında (alt sırada üstte, sol sütunda sağda, üst sırada altta, sağ sütunda solda) setin tam doygun rengindeki bant ve hemen yanında sahiplik şeridi, ortasında bina resmi, dış tarafında il adı (hiçbir şey adı örtmez; sığmazsa yazısı küçülür, kelime bölünmez). Üst sırada ad üstte, bina tabanı banda yakın; yan sütunlarda ad altta, şeridin yanında biter. Şerit her karede kenarın boyunca aynı boyda ve aynı kalınlıkta (2026-11-01, kullanıcı: "yanlarda kısa kalıyor, hepsinde eşit olsun").
- Köşe, ulaşım ve Fırsat/Sürpriz kareleri simgeleri `assets/kare/<tür>.webp` (`baslangic`, `tapu`, `cay`, `zabita`, `firsat`, `surpriz`, `gar`, `havalimani`; bkz. `docs/GORSEL_STIL.md`). Aynı resim oyuncu satırında, geçmişte, kare penceresinde ve ulaşım tapusunda da kullanılır.
- Oyuncu renkleri il renklerinden uzak seçildi: turkuaz `#009c9c`, fuşya `#e81c8c`, fıstık `#a6e000`, elektrik `#4a3aff`, kömür `#2b2f38`, beyaz `#ffffff`. Beyaz ve kömür, çizildikleri her yerde (şerit, piyon kaidesi, harita) ince koyu kenarla görünür.
- Sahiplik: ortaya bakan kenardaki şerit; sahipsizken ince ve soluk, sahipliyken kalın, beyaz kenarlı ve sahibinin renginde.
- Bina resmi `assets/bina/<set>/`: seviye L (yasal + kaçak) 0 ise resim yok; kaçak yoksa `L.png`; üst kat kaçaksa `k{L-1}.png`. İmar Affı'yla yasallaşan mülk (motorda `affed`) katı kalana dek kaçak resmiyle görünür. `0.png` yalnız tapu cetvelinde, `yikik.png` yalnız yıkım canlandırmasında. Resim hep oranını korur (`contain`).
- Köşe kareleri kraft kağıdı zeminde (koyu temada koyu kraft) kendi renkli simgesiyle. Yol yok: piyon durduğu karenin iç kenarında, ortaya hafifçe taşarak durur (köşede iç köşede); aynı karedeki piyonlar iç kenar boyunca dizilir. Piyonun altında oyuncu renginde beyaz halkalı oval kaide ve yumuşak gölge, figürde beyaz kontur; sırası gelen biraz büyük ve hafifçe zıplar, durduğu kare onun renginde çerçevelenir.
- Ortada soluk Türkiye haritası: 20 ilin yerinde içi dolu yuvarlak (sahipsizken set renginde, sahipliyken büyük ve sahibinin renginde); katlı ilin binası (karedekinin aynısı, daha büyük) ilin yerinde durur, yeni bina yaylı yükselir. Harita modu dışında harita yalnız orada bir şey olduğu belli olacak kadar soluktur, hiçbir şey parlamaz; istem ve zar önde okunur. Ortanın sol altındaki harita düğmesine basınca (üstüne gelmek yetmez) yazılar çekilir, harita öne çıkar; bu modda bir ile gelince tapusu açılır.

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
4. **Zar**: İki zar atılır, toplamı kadar ilerlersin. Elinde *Kestirme* varsa zarı gördükten sonra zarlardan birini seçebilirsin: zarlar durunca kısa bir pencere (normal hızda 1,5 sn) açılır; o sürede Kestirme oynamazsan piyon toplam kadar kendiliğinden yürür. Kartı olmayan hiçbir düğme görmez, yalnız zarı görür; tıklamaya gerek yoktur. Çift zar kart vermez ama Monopoly'deki gibi **bir daha oynatır**: "Turu bitir"e basmadan doğrudan yeniden zar atarsın (kat, kart, pazarlık zar öncesinde de yapılır; borcun ya da elinde fazla kartın varsa önce onları halledersin); üst üste en fazla 2 kez (üçüncü çiftte ek hak yok). Turda tek Hamle kartı kuralı ek atışta da geçerlidir.
   (İlk taslakta her turda zar seçimi vardı; simülasyonda oyuncular kirayı neredeyse hiç ödemediği için karta taşındı.)
5. **Kareye geliş** (aşağıda).
6. **Serbest evre**: Hamle (bu tur oynamadıysan), kat, ipotek, pazarlık; sonra **Turu Bitir**. Yapabileceğin hiçbir şey yoksa (oynanabilir kart, dikilebilir yasal ya da kaçak kat, kaldırılabilir ipotek yok, nakit eksi değil) tur 3 saniye sonra kendiliğinden biter; düğmede geri sayım görünür. Bu sürede ele gelmek, bir pencere açmak ya da tahtaya tıklamak kendiliğinden bitirmeyi o tur için durdurur. Yalnız arayüzdür: süre dolunca istemci normal Turu Bitir hamlesini gönderir, kural değişmez.

**Açık pazarlık:** Herkes, sırası olsun olmasın, her an herhangi bir oyuncuya pazarlık teklif edebilir; teklif sayısı sınırsızdır. Masada aynı anda tek teklif karar bekler: o sırada başka bir karar (satın alma, artırma, kira, Kestirme, başka bir teklif) bekleniyorsa ya da piyon yürüyorsa teklif sıraya girer ve o karar bitince, sıradaki oyuncu zar öncesi ya da serbest evredeyken karşı tarafa düşer. Her oyuncunun sırada tek teklifi olur (yenisi eskisinin yerini alır); sıradaki teklif geri çekilebilir. Teklif açıldığı anda yeniden denetlenir, artık geçerli değilse düşer.
7. Turu bitirmek için: bekleyen karar yok, nakit >= 0, elde en fazla 6 kart.
8. **Tur sonu** (son oyuncudan sonra): Tur özeti açıklanır: net değeri en çok artan ve en çok düşen oyuncu, el değiştiren mülkler. Yalnız bilgi verir, kurala etkisi yoktur.

### Karelere geliş

- **Sahipsiz mülk**: Liste fiyatına **Satın Al** ya da **İhaleye Çıkar**. Parası yetmeyen ihaleye çıkarır.
- **Başkasının mülkü**: Kira ödenir. Elinde *Dayın Çıktı* varsa kullanıp ödemeyebilirsin.
- **Kendi mülkün**: bir şey olmaz.
- **Fırsat**: 2 Hamle kartı çek.
- **Sürpriz**: Rastgele bir Sürpriz etkisi açılır ve **hemen** uygulanır, seçim yapılmaz (bkz. bölüm 8b).
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

- **Yasal kat**: Şehrin tüm mülkleri sende ve hiçbiri ipotekli değilse. Fiyat: şehrin kat fiyatı. Monopoly'deki gibi eşit çıkar: önce setteki her mülke 1'er kat, sonra 2'şer, sonra 3'er; bir mülkün yasal katı setteki en az katlı mülkten fazla olamaz (seviyesi 4'e dolmuş mülk beklenmez). Bir mülke bir anda 4 kat dikilemez.
- **Kaçak kat**: Herhangi bir mülküne (set şart değil) kat fiyatının yarısına. Mülk başına en fazla 1. İhbar, Zabıta ve Belediye Operasyonu ile yıkılır; İmar Affı ile yasallaşır.
- Seviye en fazla 4. Kaçak kat eşitlik kuralına bağlı değildir. Kat satarken eşitlik aranmaz; Müteahhit Dostu ve Belediyeden Jest gibi bedava katlar da kurala bağlı değildir.
- **Kat satma**: Yasal kat için kat fiyatının yarısı, kaçak kat için kaçak maliyetinin yarısı geri gelir.
- **İpotek**: Katsız mülk için fiyatın %50'si alınır; kaldırmak fiyatın %55'i. İpotekli mülk kira almaz; o şehirde yasal kat dikilemez.

## 6. Borç ve Konkordato

- Ödemeler her zaman tam yapılır; nakit eksiye düşebilir.
- Eksi nakitle teklif veremez, kat dikemez, para isteyen kart oynayamazsın.
- Sıranı bitirmeden nakdini 0'ın üstüne çıkarmalısın (kat sat, ipotek et, pazarlık yap). Borç penceresinde satışın yanında Pazarlık düğmesi de vardır: mülkünü (ipotekli olanı da) rakibe para karşılığı önerebilirsin; teklif cevaplanana kadar turun bitmez. "Borcu Kapat" düğmesi bunu otomatik yapar: önce kaçak katlar, sonra ucuz katlar, sonra ucuz mülkler ipotek.
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

Sürpriz karesine gelen oyuncu için 15 etkiden biri eşit olasılıkla seçilir ve hemen uygulanır. Para değerleri Endeks ile ölçeklenir.

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
| Işınlanma | Rastgele bir kareye ışınlanırsın (maaş yok), o kareye gelmiş sayılırsın. Sürpriz karelerine ışınlanılmaz. |
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
- Pazarlık teklifi her an yapılır, sınır yoktur; masada aynı anda tek teklif bekler, ötekiler sıraya girer (bkz. Açık pazarlık). Teklifi alan kabul eder, reddeder ya da karşı teklif yapar: aynı pazarlık ters yönde sürer, bir pazarlıkta en fazla 2 karşı teklif olur.
- Bağlantısı kopan oyuncunun yerine bir süre sonra bot oynar; dönünce koltuk geri verilir.
- Motor taşıma katmanından bağımsızdır; ileride bir WebSocket sunucusu aynı protokolle eklenebilir.

## 11. Tahta animasyonları

Her animasyonun sabit bir zaman çizelgesi var (`src/ui/boardfx.js`, `T`). Sesler animasyona denk gelecek biçimde kısa vuruşlara bölünmüştür (`assets/ses/fx`, ElevenLabs): her vuruş görüntüdeki anına çalar, darbe seslerinin en yüksek yeri tam o ana gelir. Oyun bölünmez, tahta kararmaz.
- **Yürüyüş:** her adımda piyon yay çizerek sıçrar; kalkışta hızlanır, ortada hızlı, varışta yavaşlar (toplam süre adım başı bütçeyle aynı). Son inişte ezilir, altında küçük bir toz halkası açılır, kısa duraklar. Her inişte adım sesi.
- **Kurallar:** kare büyümez, yerinden oynamaz; vurgu karenin kenarında olur. Etiket ve tutar tahtanın üst yarısında piyonun altında, alt yarısında üstünde çıkar. Efektler piyonların altında kalır; yalnız jetonlar ve ± tutar piyonların üstünden geçer. Hareket azaltma açıksa zıplama, halka, kenar çizgisi ve uçuş olmaz; parlama, etiket ve sesler kalır. Aynı anda birkaç kare canlanırsa ses bir kez çalar.
- **Tur başı (1 sn):** piyon zıplar (`zipla`), 0,5. sn'de konar (`tak`), küçük bir sekişle 1. sn'de yine konar; oyuncu renginde 3 halka yayılır, karesi iki kez parlar. Kendi sıranda zil de çalar (`zil`). Piyonun yanında piyon resmi + ad ("Sıra sende!") yaklaşık 2,4 sn kalır.
- **Mülk alındı (1 sn):** alıcının rengi karenin kenarını 0,6 sn'de dolanır (`suzulme`), o anda mühür vurulur (`muhur`) ve şerit o renkle dolar (alt ve üst sırada soldan, yan sütunlarda yukarıdan). İhale ve pazarlıkta kendi sesleri çalar.
- **Tam set (1,2 sn, mülk animasyonundan sonra):** setin kareleri sırayla sahibinin rengine boyanır; her kare tamamlanınca bir nota, giderek tizleşir (`nota`); sonunda şeritlerde yıldızlar parlar (`parilti`).
- **Kademeler (`src/ui/fx.js`):** her olay üç kademeden birindedir. Küçük (maaş, kart, gündem, vergi): en çok 3 küçük jeton, kısık jeton sesi, küçük tutar; ilgili oyuncuda 8 ms titreşim. Orta (kira, satın alma, kat): 5-8 jeton, fırlatma ve her jetona ses, alanın piyonu ilk jetonda sekip oturur, kenarlı orta tutar; ilgiliye 15 ms. Büyük (en az 300'lük kira, iflas, yıkım, el koyma, konkordato, imar affı): darbe anında bütün canlandırmalar 90 ms donar, müzik bir an kısılır, tahta sarsılır, herkeste 30-40-60 ms titreşim; büyük kirada 18 jetonluk sağanak, ilk jetonda tok vuruş ve kasa zili, tahtanın ortasında büyük eğik tutar ve dayı balonu. Jetonlar resimdir (`assets/fx/jeton-a`, `jeton-b`), havuzdan gelir.
- **Kira ve maaş (0,9 sn):** jetonlar piyonlar arasında uçar (maaşta Başlangıç köşesinden), her jeton konduğunda jeton sesi (`jeton`); tutar iki piyonun yanında belirir. Maaşta Başlangıç köşesi altın renkte parlar, kasa zili ilk parlamada (`kasa`). Diğer para hareketleri (kart, gündem, vergi) oyuncu panelleri ve banka arasında uçar.
- **Kat dikildi (0,8 sn):** yeni bina resmi yukarıdan düşer (`dusus`), 0,44. sn'de yere çarpıp ezilir (`tok`), dibinde küçük bir toz bulutu kabarır (`assets/fx/toz`), seker ve yine konar (`tak`).
- **Kaçak kat yıkıldı (1,3 sn):** zabıta düdüğüyle (`duduk`) kenar kırmızı iki kez yanar, binanın tepesi titrer (`tikirti`) ve 0,8. sn'de toza dönüşür (`puf`, sekiz karelik toz şeridi `assets/fx/toz-sayfa`); kısa bir an yıkıntı görünür, sonra kalan bina.
- **İflas (1,8 sn):** piyon sallanır (`sallanma`), renksizleşip düşerek kaybolur (`huzun`; büyük an, düşüşte donma ve sarsıntı), mülklerinin şeritleri sırayla griye döner (her birinde `cit`).
- **His:** kareye gelince kare 2 px kalkar ve gölgelenir (büyümez; kart sürüklerken ve kare seçerken kalkmaz); düğmeler üstüne gelince 1 px kalkar, basınca iner. Oyuncu satırının üstüne gelince o oyuncunun mülkleri kendi renginde parlar, diğer kareler solar.
- **Bakiye sayacı (`src/ui/counter.js`):** para el değiştirince oyuncu listesindeki bakiye ilk jeton kalkınca saymaya başlar, son jeton konunca biter (jeton uçuşuyla aynı süre); sayarken artan yeşil, azalan kırmızı yazar.
- **Dayı balonu (2,4 sn):** büyük anlarda (biri kaçak kat diker, İhbar ya da Zabıta kaçakları yıkar, iflas, konkordato, en az 300'lük kira, İmar Affı) tahtanın ortasının sağ üst köşesinde yuvarlak dayı resmi ve tek satır laf belirir; ortadaki sahne açıksa o kapanınca. Dayı yolsuzluğu över, dürüstle dalga geçer. Aynı anda tek balon; hızlı oyunda çıkmaz.

## 12. Protokol (v1)

İstemci -> ev sahibi: `hello {v, name, avatar, token}`, `act {action}`, `lobby {cmd}`, `profile {...}`, `sticker {id}`, `pong`.
Ev sahibi -> istemci: `welcome {seat}`, `reject {reason}`, `lobby {...}`, `state {view, events}`, `sticker {p, id}`, `error {msg}`, `ping`. (Sohbet 2026-10-25 kullanıcı isteğiyle kaldırıldı.)

**Tepki çıkartmaları:** masadaki her oyuncu altı hazır çıkartmadan birini (Yuh!, Helal!, Olmaz öyle, Hadi ya, Dayııı!, Kira geldi) gönderebilir; herkesin ekranında o oyuncunun piyonundan yükselir. Serbest yazı yoktur. Ev sahibi kimliği ve listeyi doğrular, oyuncu başına 2 saniyede birden fazlasını yaymaz; çıkartma oyun durumuna ve kayda girmez, botlar göndermez.
Sürüm uyuşmazsa istemciye "sayfayı yenile" denir.

## 13. Mahalle modu (ikinci oyun türü)

> Kurallar onaylandı (2026-11-01, `tasks/mahalle-modu-plani.md`). Motor K2'de geldi (`src/engine/mahalle.js`, sayılar
> `data.js` `MAHALLE`), arayüzü K3'te gelir. Sayılar simülasyonla ayarlandı (`node tools/sim.js 200 5 mahalle`; hedef: konkordato
> klasikten fazla değil, 20 tur, park, AVM ve gecekondu oyun başına kullanılıyor; sonuç bölümün sonunda). Burada yazmayan her kural
> klasikle aynıdır.

### Arazi

- Şehir yok; köşe ve özel kare yok (Başlangıç, Tapu Dairesi, Çay Ocağı, Zabıta, Fırsat, Sürpriz, gar, havalimanı yok). 6x6 = 36 adsız
  arsa vardır, her biri yeriyle anılır: "3. satır 5. sütun". Satırlar yukarıdan aşağı, sütunlar soldan sağa 1-6. 6. sütun denize bakar.
- Komşu: bir arsanın dört yanındaki arsalar (sağ, sol, üst, alt). Yalnız AVM çevredeki 8 arsaya (çaprazlar dahil) bakar.
- Bölgeler ve fiyatlar (Endeks ile ölçeklenir):

| Bölge | Arsalar | Adet | Fiyat | Kat fiyatı | Kaynak kira cetveli (boş / 1-4 kat), x3 uygulanır | Binalar |
|---|---|---|---|---|---|---|
| Dış halka | 1. ve 6. satır, 1. sütun (kıyı hariç) | 14 | 80 | 50 | 4 / 20 / 60 / 180 / 320 (Çorum) | Çorum seti (sade ev) |
| İç halka | 2-5. satır x 2-5. sütun, merkez hariç | 12 | 140 | 100 | 10 / 50 / 150 / 450 / 625 (Balıkesir) | Bursa seti |
| Merkez | 3-4. satır x 3-4. sütun | 4 | 200 | 100 | 16 / 80 / 220 / 600 / 800 (Konya) | İstanbul seti (kule) |
| Kıyı | 6. sütun, 6 satırın hepsi | 6 | 160 | 100 | 12 / 60 / 180 / 500 / 700 (Bursa), sonra +%25 | Antalya seti (sahil binası) |

Her bölge, fiyatı ona en yakın bugünkü mülkün kira cetvelini ve o setin kat fiyatını kullanır; bina resmi bölgenin setinden gelir.
**Kiralar bu cetvelin 3 katıdır** (dış halkada boş arsa 10, 4 kat 960; merkezde 4 kat 2.400): oyuncu iki arsadan birini seçtiği
için kira klasiğe göre seyrek ödenir, cetvel aynı kalınca oyun başına dönen kira klasiğin onda biriydi. Arazinin toplam fiyatı 4.560.

### Başlangıç

- Nakit, oturma bonusu, el (3 kart), el sınırı (6), tur sayısı, bitiş seçenekleri (tur, değer hedefi, son kalan) klasikle aynıdır.
- Piyonlar arazinin dışında başlar; ilk zarla araziye iner.
- Her oyuncu 1 **Torpil** jetonuyla başlar (en çok 2).

### Bir sıra

1. **Sıra başı: hakediş.** Maaşın yerine her sıra başında bankadan **50 hakediş** gelir (Endeksle ölçeklenmez, klasikteki maaş gibi).
   Gecekondu geliri de burada gelir (aşağıda). Kira Zammı burada biter, İhtiyati Tedbir burada azalır (klasik gibi).
2. **Zar öncesi:** klasikteki gibi Hamle kartı (turda 1), inşaat (aşağıdaki sınırla), ipotek, pazarlık.
3. **Zar:** iki zar atılır. Çift değilse zarlar iki arsa gösterir: (satır, sütun) ya da (sütun, satır), örneğin 3 ve 5: "3. satır 5. sütun"
   ya da "5. satır 3. sütun". Oyuncu birini seçer, piyon oraya zıplar (yol yok, aradaki arsalar işlemez). Seçim süresi dolarsa ilki
   (birinci zar satır) seçilir.
   - **Torpil:** zar atıldıktan sonra, seçimden önce bir jeton harcanıp bir zar 1 artırılır ya da azaltılır (1 ile 6 arası, 6'dan 1'e
     dönmez). Sırada en çok 1 torpil. Torpille çift yapılabilir.
   - **Çift:** (n, n) gelirse n. satırda ya da n. sütunda istediğin arsayı seçersin (11 arsa) ve elinde 5'ten az kart varsa 1 kart
     çekersin. **Ek atış yok** (klasikteki "bir daha oyna" bu modda yok).
4. **Arsaya varış:**
   - Sahipsiz arsa: liste fiyatına **Satın Al**, **İhaleye Çıkar** (klasik açık artırma) ya da **Gecekondu Kondur** (aşağıda).
     Gecekondulu sahipsiz arsayı alan tahliye bedelini de öder.
   - Rakibin yapılı arsası: kira. Rakibin boş arsası: **küçük arsa kirası** (cetvelin "boş" sütunu, çarpanlarla). Kira en az 5'tir.
     Dayın Çıktı, ipotek ve İhtiyati Tedbir klasikteki gibi işler.
   - Kendi arsan: bir şey olmaz. Park arsasına gelmek kira doğurmaz.
5. **Serbest evre** ve **Turu Bitir** klasikteki gibi.

**Her 3 turda** (4., 7., 10., 13., 16., 19. tur başı, yeni gündemle birlikte) herkes 1 kart çeker (elinde 5'ten az kart varsa).
**10. ve 19. tur başında** herkes 1 Torpil alır (en çok 2). Gündem masada kapalıysa kart ve torpil yine bu turlarda gelir. (Torpil her
3 turda gelince botlar kiranın çoğunu atlattı: oyun başına 10 kira ödemesi.)

### İnşaat

- İnşaat (kat, kaçak kat, park, AVM) yalnız **piyonunun durduğu arsada ve ona komşu kendi arsalarında** yapılır. Zar öncesinde piyon
  önceki sıradaki yerindedir. Kat satma ve ipotek her arsada serbesttir.
- **Yasal kat:** arsanın komşularından en az biri de senin olmalı. Kat fiyatı bölgeden gelir. Seviye en fazla 4. Klasikteki eşitlik
  kuralı yoktur.
- **Kaçak kat:** komşu şartı yok, kat fiyatının yarısına, arsa başına en fazla 1. İhbar ve Belediye Operasyonu ile yıkılır, İmar
  Affı ile yasallaşır (klasik gibi).
- Kat satma, ipotek ve ipotek kaldırma klasikteki gibi; ipotekli arsaya kat dikilmez.

### Yapılar ve komşuluk

Bütün etkiler kiraya **çarpan** olarak eklenir ve birbiriyle çarpılır (iki park komşusu 1,5 x 1,5). Arsaya dokununca hangi etkilerin
işlediği görünür.

| Yapı | Nasıl | Etki |
|---|---|---|
| **Site** | 2x2'lik bir bloğun dört arsası da senin ve hepsinde en az 1 kat (yasal ya da kaçak) var | Bu dört arsanın kirası **x2** (bir arsa birkaç sitede olsa da bir kez) |
| **Blok** | Arsanın komşularından en az ikisi de senin | Kirası **+%25** |
| **Park** | Kendi boş (katsız, ipoteksiz) arsana, bedeli o arsanın 1 kat fiyatı | Park arsası kira almaz; dört komşusunun kirası **+%50**, kimin olursa olsun. Parka kat dikilmez, park kaldırılmaz, ipotek edilmez |
| **AVM** | 4 yasal katlı arsan AVM'ye çevrilir, bedeli 1 kat fiyatı | Kendi kirası 4 katlı arsa kirası. Çevresindeki 8 arsada ödenen her kiranın **%20'si** kiradan kesilip AVM sahibine gider. AVM'den kat satılırsa önce 4 katlı arsaya döner (bedeli geri gelmez) |
| **Gecekondu** | Sahipsiz arsaya, kaçak kat bedelinin yarısına (dış 15, öteki bölgeler 25) | Konduranına her sıra başında bankadan **10** (Endeksle ölçeklenir). Komşu arsaların kirası **-%25**. Kira almaz. Oyuncu başına en çok 3 |

**Gecekondu ayrıntısı:**
- Arsa sahipsiz kalır; gecekondu konduranındır. Kondurulan arsaya gelip alan ya da artırmada alan, fiyatın üstüne **tahliye bedeli**
  öder: kondurma bedelinin 2 katı, kondurana gider. Arsayı konduran kendisi alırsa tahliye yoktur, gecekondu yıkılır.
- **İhbar** gecekonduları da yıkar: hedef oyuncunun bütün kaçak katları ve gecekonduları gider, her biri için 25 ceza.
- **İmar Affı:** gecekondulu her sahipsiz arsa bedavaya kondurana geçer; gecekondu 1 yasal kata döner (affedilmiş kaçak kat gibi
  çirkin görünür).
- **Belediye Operasyonu:** bütün kaçak katlar ve bütün gecekondular yıkılır.
- **Deprem Yönetmeliği:** gecekondu başı kaçak kat gibi 30.
- Gecekondu net değere girmez.

### Kira hesabı

Kira = cetvel x 3 (boş arsa ya da 1-4 kat) x kıyı (+%25) x site (x2) x blok (+%25) x park komşusu (+%50 her biri) x gecekondu komşusu
(-%25 her biri) x gündem (Kira İndirimi, Kira Artışı, Turizm Sezonu, Metro) x iflas çarpanı; Endeks ile ölçeklenir, 5'e yuvarlanır,
en az 5. Klasikteki "set tamamlanmamışsa kat kirası yarı" kuralı yoktur (yasal kat zaten komşu ister). Kira Zammı ve AVM payı
bundan sonra uygulanır.

### Kartlar

Kartlar ve adetleri klasikle aynıdır; arsa ve hareket kartları şöyle uyarlanır:

| Kart | Mahalle'de |
|---|---|
| Taksi | Zar atmadan: piyonunun satırında ya da sütununda istediğin arsaya git (piyon henüz dışarıdayken oynanamaz) |
| Kestirme | Zar attıktan sonra, seçimden önce: zarlardan birini yeniden at |
| Geri Vites | Zar atmadan: zar yerine bir önceki arsana dön (önceki arsa yoksa oynanamaz) |
| Kamulaştırma, Zorla Takas | "Tam set" yerine "site": sitedeki arsaya oynanmaz; katlı, parklı ya da AVM'li arsaya da oynanmaz |
| Müteahhit Dostu | "Aynı şehirde 2 mülk" yerine: komşularından biri de senin olan bir arsana bedava 1 yasal kat (inşaat yeri sınırına bağlı değil) |
| İhbar | Kaçak katlarla birlikte gecekonduları da yıkar (Zabıta karesinin işini İhbar ve Operasyon görür) |
| Öbürleri | Klasikteki gibi |

### Gündem

Gündem destesi aynıdır; tahtaya bağlı kartlar bölgeye bağlanır:

| Kart | Mahalle'de |
|---|---|
| Turizm Sezonu | Bu dönem kıyı kiraları 2 katı |
| Metro Müjdesi | Rastgele bir bölgenin (dış, iç, merkez, kıyı) fiyat ve kiraları kalıcı olarak %25 artar |
| Kentsel Dönüşüm | Rastgele bir bölgede sahipli her arsaya bedava 1 yasal kat (park, AVM ve 4 seviyeli arsa hariç) |
| Asgari Ücrete Zam | Hakediş kalıcı olarak +10 |
| Bankacılar Grevde | Bu dönem hakediş ödenmez |
| Zabıta İzinde | Bu dönem İhbar oynanamaz |
| İmar Affı, Belediye Operasyonu, Deprem Yönetmeliği | Gecekondu ile birlikte (yukarıda) |
| Ulaşıma Zam | Mahalle destesinde yok (ulaşım yok) |
| Öbürleri | Klasikteki gibi |

### Puan

Net değer ve puan klasikteki gibi: nakit + arsa fiyatı (ipotekliyse yarısı) + yasal kat x kat fiyatı + kaçak kat x kat fiyatının
yarısı - konkordato cezası. AVM 4 yasal kat sayılır; park ve AVM dönüşüm bedeli ile gecekondu değere girmez. Oyun sonu sayaçlarına
kurulan gecekondu, park ve AVM de eklenir (dayının yorumu için; puanı etkilemez).

### Simülasyon (K2, 2026-11-01)

`node tools/sim.js 200 5 mahalle` (klasik `node tools/sim.js 200 5` karşısında):

| | Mahalle | Klasik |
|---|---|---|
| Tur | 20,0 | 20,0 |
| Konkordato / oyun | 1,6 | 2,9 |
| Kira ödemesi / oyun, ortalaması | 15,6 x 262 | 46,0 x 158 |
| En büyük kira ort. | 1.537 | 1.194 |
| Kira / maaş (hakediş) | 0,82 | 1,69 |
| Birinci-sonuncu farkı | 4.260 | 5.896 |
| Yasal / kaçak kat | 69,1 / 6,8 | 32,2 / 14,3 |
| Gecekondu / park / AVM / torpil (oyun başına) | 9,8 / 3,6 / 10,1 / 12,0 | |
| Kullanıldığı oyun: gecekondu / park / AVM | %100 / %96 / %100 | |

Oturma sırasına göre kazanma %17-25. Botlar site kurmayı zor buluyor (oyuncuların %78'inin oyun sonunda sitesi yok); ilk deneme
(cetvel x1, torpil her 3 turda) oyun başına 16 kira ödemesi (ortalama 26) ve konkordato 0 verdi; para dönmüyordu.
