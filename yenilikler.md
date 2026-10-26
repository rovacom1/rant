# RANT — Genel Değerlendirme Raporu, 2. sürüm (v0.14.0, 2026-10-25)

Bu sürüm kullanıcının 8 maddelik geri bildirimine göre güncellendi. İnceleme yine salt okunur: repoda hiçbir dosya değişmedi.

Bu sürümde yeni yapılanlar:
- 3 ekran boyutunda (1920x1080, 1366x768, 1366x768 karanlık) 40 ekran görüntüsü çekildi, gerçek yazı tipleriyle.
- Bir alt ajan bu görüntüler üzerinde **design-critique** çalıştırdı. Tam metni ayrı dosyada (`design-critique.md`), özeti 3. bölümde.
- Kart sıklığı, tur sayısı ve tempo için 2.000'den fazla bot oyunu oynatıldı.
- Kart sıklığının nasıl azalacağını denemek için motorun bir kopyası değiştirildi; bu kopya repoya girmedi.

---

## 1. Kullanıcı kararları ve raporun yeni yönü

| # | Karar | Rapora etkisi |
|---|---|---|
| 1 | Yeni mekanik yok, mevcut hal yeterli | Önceki raporun "yeni mekanikler" bölümü kaldırıldı (senet, hazır tepkiler, dönem ihalesi, avukatlık ücreti…). Öneriler yalnız var olanı ayarlıyor ya da çıkarıyor. |
| 2 | En büyük sorun görsel | 1. öncelik oldu; 3. bölüm. |
| 3 | Emoji oyuncu simgeleri değişmeli | 4. bölüm. |
| 4 | Seslendirme yok | ElevenLabs konuşma önerileri kaldırıldı. Yalnız müzik ve efekt kaldı (7. bölüm). |
| 5 | Denge Monopoly'yi baz alsın | Kart ve tur önerileri Monopoly temposuna göre (5. ve 6. bölüm). |
| 6 | Kartlar çok sık geliyor: a mı b mi? | Ölçtüm; öneri **b** (5. bölüm). |
| 7 | Oyun aşırı hızlı hissettiriyor | Ölçüldü; karar görsel düzeltmeden sonraya bırakıldı (8. bölüm). |
| 8 | 15 tur az | Ölçüldü; öneri **20 tur** (6. bölüm). |

**Hüküm (güncel): PIVOT.** Oyunu değil, işin sırasını değiştir:

1. Önce görünüm: tahta büyüsün, okunur olsun, sadeleşsin, oyuncu simgeleri değişsin.
2. Sonra Monopoly temposu: kart çekme seyrek olsun ve oyun 20 tur sürsün. Bu ikisi birlikte oyunun süresini neredeyse değiştirmiyor.
3. En son hız hissi yeniden değerlendirilsin.

Yeni mekanik eklenmiyor.

---

## 2. Önce yapılacaklar (güncel sıra)

| # | İş | Bölüm | Büyüklük |
|---|---|---|---|
| 1 | Tahtayı büyüt ve yerleşimi yeniden kur | 3.1 | orta-büyük |
| 2 | Tahta ortasını sadeleştir; üst üste binen katmanları kaldır | 3.2 | orta |
| 3 | Emoji simgeler yerine SVG oyuncu taşları | 4 | küçük-orta |
| 4 | Kart çekmeyi seyrekleştir (b) + bot pazarlığını güçlendir | 5 | küçük, sim ile |
| 5 | Varsayılan oyun 20 tur | 6 | çok küçük, sim ile |
| 6 | Gizli kart sahipliği sızıntısını kapat | 9.1 | küçük-orta |
| 7 | Kira dengesi, Monopoly'ye göre | 6.3 | küçük, sim ile |
| 8 | Hız hissini yeniden değerlendir (1-7 bittikten sonra) | 8 | — |
| 9 | Ev sahibi devri, telefon düzeni, CI | 9 | önceki rapordaki gibi |

---

## 3. Görsel tasarım (design-critique özeti)

Tam eleştiri `design-critique.md` dosyasında. O dosya alt ajan tarafından Türkçe harfler (ç, ş, ğ, ı, ö, ü) kullanılmadan yazıldı. Aşağıdaki özet onun düzeltilmiş ve kısaltılmış halidir.

**Genel izlenim:** İlk bakışta göz tahtaya değil üç şeye gidiyor: ortadaki beyaz gündem kartı, sağdaki beş oyuncu kartı ve kırmızı "Zar At" düğmesi. Tahta dekor gibi kalıyor. Parçaların kalitesi iyi: yazı tipleri, kart görselleri, SVG ikonlar, satın alma ve sonuç ekranları. Sorun **yerleşim ve önceliklendirmede**.

### 3.1 Tahta küçük ve yazılar okunmuyor (kritik)

Tarayıcıda ölçülen değerler:

| Ekran | Kare | Semt adı | Şehir adı | Piyon |
|---|---|---|---|---|
| 1366x768 | 60x60 px | 9,6 px | **5,9 px** | 17 px |
| 1920x1080 | 91x91 px | 14,1 px | 8,6 px | 25 px |

Göz ekranda 11-12 pikselin altındaki yazıyı rahat okumaz; 6 piksel hiç okunmaz.

**Neden küçük:** Tahta kare ve ekran yüksekliğine göre boyutlanıyor (`main.css:174`). Genişlik boş kalıyor: 1920'de tahtanın iki yanında toplam 556 px boş alan var.

**Önerilen çözüm (A): aynı 10x10 ızgara, yatay dikdörtgen tahta.**
- Köşeler (Başlangıç, Tapu, Çay Ocağı, Zabıta), kurallar, motor ve kayıt biçimi aynı kalıyor. Neredeyse yalnız CSS işi.
- Tahta en fazla yüksekliğinin 1,45 katı genişliğe kadar yayılıyor.
- Yan panel 380 px'ten 280-330 px'e iniyor.
- Şehir adı kareden kalkıyor; şehir zaten çerçevenin iki renginden ve kare penceresinden anlaşılıyor.

Alt ajan bunu tarayıcıda geçici CSS ile denedi ve ölçtü:

| Ekran | Kare: şimdi → A | Semt adı: şimdi → A |
|---|---|---|
| 1366x768 | 60x60 → **91x61** | 9,6 → **12,4 px** |
| 1920x1080 | 91x91 → **137x92** | 14,1 → **18,2 px** |

Önce/sonra görüntüleri: `proto/proto-1366.png`, `proto/proto-1920.png`. Ek kazanç:
- Üst çubuk incelir (48 → 36-40 px). Endeks ve Maaş bir ipucunun arkasına geçer.
- El şeridi tahtanın alt kenarına 20-30 px biner.
- İkisiyle 1366'da kare yüksekliği ~64, yazı ~13 px olur.

**Önerilmeyenler:**
- Gerçek 12x8 halka. Köşe kareleri değişir, şehir grupları köşede bölünür ve TASARIM'daki tahta düzeni değişir.
- Yan paneli tamamen kaldırmak. Kareler aşırı uzar.

### 3.2 Tahta ortası: katmanlar üst üste biniyor (kritik)

- **1366'da içerik kesiliyor:**
  - Hedef seçiminde başlık gündem kartının altında kayboluyor, ikinci hedef kesiliyor.
  - Kestirme seçiminde "Toplam" düğmesi gündemin altına giriyor.
  - Sebep tek satır: `.prompt` hem ortalanmış hem kaydırılabilir (`main.css:253`). Çözüm `justify-content: safe center`.
- **Bildirimler tahtanın üst sırasını kapatıyor ve tekrar ediyor.**
  - "Sıra sende!" balonu neredeyse her görüntüde Kızılay/Esenboğa karelerinin üstünde.
  - "Şu an hamle sırası sende değil" iki kez alt alta çıkıyor.
  - Çözüm: bildirimler tahta ortasına alınsın, aynı metin tekrar etmesin. "Sıra sende!" bildirimi kalksın; ortadaki yazı ve ses yeterli.
- **Açılan el kartı tahtanın alt sırasını kapatıyor.** Kart oynarken hedef kareyi göremiyorsun. Büyüyen kart tahta ortasında dursun.
- **Orta alanın yeni öncelik sırası:**

| Öğe | Karar |
|---|---|
| İstem (Zar At / Satın Al / seçim) | En büyük ve tek ana düğme olarak kalsın |
| Gündem kartı | Tek satıra insin (ikon + ad + etki çipi + kalan tur). Açıklama tıklayınca açılsın. 80 → ~40 px. |
| Tur sayacı | Üst çubukta ve gündem halkasında iki kez var; biri kalksın |
| Süre çubuğu | İnce ve nötr renkte olsun; saniye yalnız son 10 saniyede görünsün. Kırmızı, oyuncunun kaydırma çubuğuna kalsın. |
| Zarlar | Atıştan 2-3 sn sonra gizlensin |
| Olay akışı | 5 satırdan 3 satıra insin, yazı 14-15 px olsun |
| Kart ve sürpriz gösterimi | Kalsın; ama gösterilirken arkadaki yazılar soluklaşsın |
| "RANT" filigranı, damalı zemin | Kalksın, zemin düz krem olsun |

### 3.3 Fazla sayı ve yazı ("az yazı" ilkesine aykırı)

- **Yan panel:** aynı anda ~20 sayı var: 5 oyuncu × nakit, değer, mülk, kart. Kartta yalnız simge, ad ve nakit kalsın; gerisi oyuncuya tıklayınca açılan pencerede (zaten var).
- **Kare penceresi:** küçük değil, kural kitabı gibi. "Zar At" düğmesinin üstüne açılıyor, 1920'de tahtanın altından taşıyor. Yalnız başlık, sahip ve 5 satırlık kira tablosu kalsın; açıklamalar "?" işaretinin arkasına.
- **Açık artırma:**
  - Çiplerde "bekliyor/sırada" yazıları var; bunlar yerine yalnız simge kalsın (sıradaki parlasın, çekilen soluk görünsün).
  - Hazır tutar düğmeleri ve kaydırma çubuğu aynı işi yapıyor.
  - Kaydırma çubuğu ile süre çubuğu ikisi de kırmızı.
- **Kart penceresi:** yarısı boş ve kart adı iki kez yazıyor. Pencere kart genişliğinde olsun, altında tek düğme ya da tek satırlık sebep.
- **Pazarlık:** hiçbir şey yapılmadan "Boş teklif olmaz." uyarısı çıkıyor.

### 3.4 Kare görünümü

- **Bulanık renkler:** buzlu camdaki iki şehir rengi aşırı bulanık ve üç lekeye bölünmüş; Trabzon pembe-mor bir lekeye dönüyor. İki sade bölge ve daha az bulanıklık olsun.
- **Şeritler kaydırma çubuğuna benziyor:** sol ve sağ sütundaki gri sahipsiz şeritler tarayıcı kaydırma çubuğu gibi duruyor.
  - Sahipsiz şerit **ince ve soluk** olsun, sahipli şerit **kalın ve parlak**.
  - Kural ("sahipsizken gri") korunuyor; gri yalnız geri plana çekiliyor ve sahiplik tek bakışta ayrışıyor.
- **Başlangıç karesi:** 5 piyon "BAŞLANGIÇ NOKTASI" yazısının üstüne biniyor. Köşelerde piyonlar üst kenara alınsın.
- **Uçan para yazıları:** "+30 ₺" gibi yazılar yan paneldeki nakit sayılarının üstüne biniyor.

### 3.5 Karanlık mod

- Mülk kareleri çamurlu: şehir renkleri yarı opak ve koyu zeminde kahverengi-gri oluyor (`main.css:757-763`).
- Tren ikonunun koyu hatları koyu karede kayboluyor; açık bir dış ışık gerekli.
- Pasif "Pazarlık" düğmesi okunmuyor.
- Kare penceresinin başlığı iki temada da gri; şehir renginde olsun.
- İpucu balonu koyu zeminde koyu; ince açık bir kenarlık eklenmeli.

### 3.6 Uygulama sırası (5 adım)

1. Yatay dikdörtgen tahta, şehir adı yok, yan panel daha dar.
2. `safe center` ve sade orta alan: tek satır gündem, filigran yok, 3 satır akış.
3. Bildirimler taşınsın ve tekrar etmesin; "Sıra sende!" bildirimi kalksın.
4. Emoji yerine SVG piyonlar (4. bölüm).
5. Yan panel ve kare penceresi az sayıya insin; karanlık modda cam renkleri ve tren ikonu düzelsin.

**Claude tasarım aracıyla deneme:** 1-3. adımlar kod yazılmadan önce bir tasarım taslağında görülebilir. Prototip ölçümleri hazır olduğu için taslak gerçek oranlarla çizilebilir.

---

## 4. Oyuncu simgeleri (emoji yerine)

Şu an simge 12 emojiden biri (`AVATARS`, `src/engine/data.js`). Tahtada taş 1366'da 17 px, 1920'de 25 px. Bu boyutta emoji ayrıntısı seçilmiyor; oyuncu taşı rengiyle ve şekliyle tanınmalı.

Emojinin sorunları:
- Her işletim sisteminde farklı çiziliyor (Windows'ta düz, Mac'te parlak).
- Tahtadaki elle çizilmiş SVG tarzına uymuyor.
- 17 px'te tilki ile kaplan aynı turuncu lekeye dönüyor.
- Türkiye temasıyla ilgisi yok.

| Seçenek | Artı | Eksi |
|---|---|---|
| **1. Kalın hatlı SVG piyonlar** (`icons.js` tarzı, önerilen) | Her bilgisayarda aynı. 17-20 px'te de siluetinden tanınır. Tahtadaki ikonlarla aynı dil. Dosya gerekmez. Oyuncu rengine boyanır. | 12 ikonun çizilmesi gerekir (yaklaşık yarım günlük iş). Küçük boyda okunsun diye çok sade olmalı. |
| **2. Resimli portreler** (kart tarzında karikatür tipler, Higgsfield ile) | Kişilik ve espri katar, bot adlarıyla uyumlu, sonuç ekranında güzel durur. | Piyon boyunda okunmaz; yine ayrı bir piyon ikonu gerekir. Yalnız yan panel ve sonuç ekranı için uygun. |
| **3. Harf + desen rozeti** | En okunaklı, renk körlüğüne dayanıklı. | Eğlenceli değil, tema yok. |

**Öneri:** Seçenek 1. İstenirse sonra Seçenek 2 yalnız yan panel ve sonuç ekranı için eklenir; tahtadaki piyon yine SVG kalır.

**12 piyon önerisi:**
1. Simit
2. Nazar boncuğu
3. Lale
4. Martı
5. Van kedisi
6. Boğaz vapuru
7. Kapadokya balonu
8. Fes
9. Cezve
10. Dolmuş
11. Galata Kulesi
12. Bağlama

Çay bardağı, tren, uçak, taksi, vinç ve zar bilerek dışarıda bırakıldı; tahtada ve kartlarda zaten kullanılıyorlar, karışırlar.

**Teknik not:**
- Simge kimlikleri emoji yerine metne (`'simit'` gibi) dönünce PROTOCOL artmalı.
- Eski kayıtlar ve profillerdeki emojiler yeni kimliklere eşlenmeli (ör. 🦊 → simit).
- Değişecek yerler: `data.js:232`, `host.js:71`, `state.js:16`, `board.js:122`, `gameview.js:92/366/408/467/569`, `app.js:54/72`.
- Bu, renk körlüğü sorununu da kısmen çözer: sahiplik şeridine sahibin küçük piyon ikonu eklenebilir.

---

## 5. Kart sıklığı: a mı, b mi? → **b**

### 5.1 Ölçüm: bugün kart ne kadar sık?

200 oyun, 5 kişi, 15 tur:

| Ölçüt | Bugün |
|---|---|
| Oyuncu başına çekilen kart | **17,1** (15 sırada; yani sıra başına 1'den fazla) |
| Oyuncu başına oynanan kart | **16,4** (neredeyse her sıra bir kart) |
| Elinde aynı türden iki kart olan sıra | **%44** |
| Bir oyuncunun oyun boyu gördüğü kart türü | 11,2 / 15 |
| İtirazla boşa düşen kart (oyun başına) | 6,2 |

Karşılaştırma için Monopoly: 40 karenin 6'sı kart karesi (3 Şans, 3 Kamu Fonu). Oyuncu kabaca 7 sırada bir kart görür; kartların neredeyse hepsi de hemen uygulanıp atılır. RANT'ta her sıra başı ve her çift zarda kart geliyor.

### 5.2 Neden b, neden a değil

- **a** (kart ana mekanik olsun, tür sayısı artsın) "aynı kartı görme" sorununu çözer. Ama her yeni tür yeni bir kural demek; bu 1. kararla çelişiyor. Bugün de "yeterince tür yok" değil, "her sıra kart geliyor" sorunu var: oyuncu 15 türün 11'ini zaten görüyor.
- **b** hem tekrar hissini hem gürültüyü hem İtiraz enflasyonunu birlikte azaltır. Monopoly temposuna da uyar.

### 5.3 Denenen b düzenlemesi (motor kopyasında)

Kurallar:
- Sıra başında ve çift zarda kart yok.
- Başlangıçta yine 3 kart.
- **Başlangıç Noktası'ndan geçince** elde 5'ten az kart varsa 1 kart. Monopoly'deki gibi tur atlayınca küçük bir ödül.
- FIRSAT karesi 2 kart vermeye devam ediyor.

| Ölçüt (5 kişi) | Bugün (15 tur) | b, 15 tur | **b, 20 tur** |
|---|---|---|---|
| Oyuncu başı çekilen kart | 17,1 | 4,3 | **5,9** |
| Oyuncu başı oynanan kart | 16,4 | 6,1 | **7,7** |
| Elde aynı türden iki kart | %44 | %8 | **%9** |
| İtirazla düşen kart / oyun | 6,2 | 2,1 | **2,7** |
| Canlandırma süresi / oyun | 12,3 dk | 8,9 dk | **11,5 dk** |
| Hiç set tamamlayamayan oyuncu | %29 | %52 | **%44** |

**b'nin bir yan etkisi var.** Bugün setler büyük ölçüde kartlarla tamamlanıyor (Zorla Takas, Kamulaştırma, Müteahhit Dostu). Kart azalınca setsiz biten oyuncu %29'dan %44-52'ye çıkıyor. Monopoly'de setler pazarlıkla tamamlanır. Bu yüzden b şunlarla birlikte gelmeli:

1. **Bot pazarlığını güçlendir.** Botlar bugün 5,4 teklifin yalnız 0,9'unu kabul ediyor. Kabul eşiği ve eksik parçayı isteme mantığı, Monopoly'deki "ikimize de set tamamlatan takas" gibi olmalı. Tüm botlar "zor" seviyeyle oynayınca setsiz oyuncu %44'ten %42'ye iniyor; bu yetmiyor, ayrı bir iş.
2. **Tapu Dairesi ve açık artırma zaten var.** Ek kural gerekmiyor.
3. İnsanlar sesli konuşarak pazarlık yapar; insan masasında setsiz oyuncu oranı muhtemelen daha düşük olur. Bu bir varsayım, 10. bölümdeki ölçütle kontrol edilmeli.

Daha yumuşak bir ara seçenek: sıra başı kart yalnız elde 2'den az kart varken gelsin (bugün 5). Oyuncu başı 8,6 kart çekiliyor, aynı türden iki kart %14, setsiz oyuncu %45.

### 5.4 Kart destesi Monopoly mantığıyla

Kart seyrekleşince her kart değerli olur; birkaç sayı ayarı gerekir (yeni tür yok):

- **İtiraz 6 → 4.** Kart azken 6 İtiraz, oynanan her saldırı kartını boşa çıkarır.
- **İhbar 4 → 2.** Bugün kaçak katların %80'i yıkılıyor.
- **Piyango ve Aidat** bedava para verir. Kart seyrekleşince önemleri azalır; değişmeleri gerekmiyor.

---

## 6. Tur sayısı ve oyun uzunluğu → **20 tur**

### 6.1 15 tur gerçekten az

- 36 karelik tahtada ortalama zar 7. 15 turda oyuncu tahtayı **yaklaşık 3 kez** dolaşıyor. Monopoly'de bir tur ortalama ~6 sıra sürer ve oyunlar çok daha uzundur ([Sumproduct](https://sumproduct.com/blog/article/excel-at-monopoly-6)).
- Mülkler oyunun ortasında bitiyor: %80'i 8. turda, tamamı 15. turda alınmış. Sorun "her yer alınmış olması" değil; yer alındıktan sonra **kat dikip kira toplamaya** yalnız 7 tur kalıyor.
- Oyun sonunda oyuncuların **%29'unun hiç seti, %28'inin hiç yasal katı yok.** "Hiçbir şey yapamadan bitti" hissinin ölçülen karşılığı bu.

### 6.2 Tur sayısı karşılaştırması (bugünkü kurallar, 200 oyun)

| Tur | Kira / maaş | Setsiz oyuncu | Konkordato / oyun | 5. tur lideri kazanır | Canlandırma |
|---|---|---|---|---|---|
| 15 | 0,81 | %29 | 0,4 | %35 | 12,3 dk |
| **20** | **1,07** | **%22** | **1,1** | **%39** (7. tur lideri) | **16,1 dk** |
| 25 | 1,35 | %19 | 2,5 | — | 19,8 dk |
| 30 | 1,58 | %17 | 4,4 | — | 23,2 dk |

- **20 turda kira ilk kez maaşı geçiyor** (1,07). Emlak oyununun özü olan "kira toplamak" o zaman anlam kazanıyor. Önceki raporda yazdığım "kira maaştan az" sorununun asıl sebebi tur azlığı.
- 25 tur ve üstünde konkordato hızla artıyor (oyun başına 2,5-4,4 batan oyuncu) ve oyun sonu "zombi" oyuncularla dolar. 20 tur bir denge noktası.
- Geriden gelme 20 turda da mümkün: oyunun üçte ikisinde önde olan oyuncu %59 kazanıyor (15 turda %65).

### 6.3 Süre tahmini

Varsayım: 5 insanlı masada insan başına ortalama 15-20 sn düşünme ve tıklama süresi.

| Kurgu | Canlandırma | Düşünme | Toplam |
|---|---|---|---|
| Bugün (15 tur, sık kart) | 12 dk | ~25 dk | **~37 dk** |
| 20 tur, sık kart | 16 dk | ~33 dk | ~49 dk |
| **20 tur + b (seyrek kart)** | **11,5 dk** | **~28 dk** (daha az kart kararı) | **~40 dk** |

**Sonuç: b ile 20 tur, bugünkü 15 turlu oyunla neredeyse aynı sürede biter.** Oyuncu ise %33 daha fazla sıra oynar, 4 tur daha dolaşır ve kira gerçek bir güce dönüşür. Lobideki 10/15/20 seçeneği 15/20/25 olabilir, varsayılan 20.

### 6.4 Kira dengesi, Monopoly'ye göre

20 tur ve b birlikte kira/maaş oranını 1,2'ye taşıyor. Monopoly'de ev ve otel kiraları oyunun sonunu belirler. RANT'ta değer hesabı katları maliyetinden saydığı için kat dikmek hiç puan kaybettirmiyor. Monopoly'de kat ancak yarı fiyatına geri satılır; değer hesabında katlar da yarıdan sayılabilir. Yeni kural değil, var olan "kat satışı yarı fiyat" kuralının puana da yansıması. Bot simülasyonunda bunun etkisi küçük çıktı, çünkü botlar puan hesabına göre oynamıyor. İnsanlar için "kat dikmek risk mi?" sorusunu açar. İsteğe bağlı.

---

## 7. Ses, müzik ve görseller (seslendirme yok)

- **Müzik (ElevenLabs müzik):** Tek bir 60 saniyelik döngü 40 dakikada ~40 kez tekrar ediyor. Lobi, oyun (2 parça) ve son tur için ayrı parçalar. Konuşma yok, yalnız enstrümantal.
- **Efekt:** zafer sesi 1 saniye; 3-4 saniyelik bir fanfar. Açık artırma için tokmak ve sayaç efekti (konuşmasız).
- **Higgsfield (tahta dışı):**
  - Oyuncu portreleri, 4. bölümdeki B seçeneği.
  - Gündem haber kartı görselleri (24, mevcut kart tarzında).
  - Sürpriz kartlarının arka yüzü (15).
  - Davet linki önizleme görseli (1200x630).
  - Kural (`tasks/lessons.md`): önce 1-2 örnek, onaydan sonra hepsi.
- **Claude tasarım aracı:** 3. bölümdeki yeni yerleşimi kod yazmadan önce bir tasarım taslağı olarak denemek mantıklı. İki yerleşimi (dikdörtgen tahta / kare tahta + alt şerit) yan yana görmek karar vermeyi kolaylaştırır.

---

## 8. "Oyun aşırı hızlı" hissi (ölçüm, karar sonraya)

Normal hızda bir bot sırasının süresi:

- ortanca **8,9 sn** (en kısa %10'luk dilim 6,1 sn, en uzun %10'luk dilim 14,9 sn)
- sıra başına ortanca 4 hamle (zar, yürüyüş, karar, bitir); botun en kısa düşünme süresi 0,9 sn

4 botun sırası sana gelene kadar ~36 saniyede geçiyor. Bu sürede ortalama 4 zar, 4 yürüyüş, 1-2 satın alma ve 4 civarı kart gösterimi oluyor.

Hız hissinin sebebi büyük olasılıkla tek tek animasyonların kısa olması değil. Olaylar küçük bir tahtada, birbirinin üstüne, aynı anda birkaç yerde oluyor:
- jetonlar uçarken kart ortada açılıyor;
- bildirim üstte beliriyor;
- olay akışı aşağıda kayıyor.

Göz neye bakacağını bilmiyor. Görsel düzeltmeden (3. bölüm) sonra bunu yeniden değerlendirmek doğru. Seçenekler, yeni mekanik olmadan:
1. "Her an tek odak": bir olay bitmeden diğeri başlamasın.
2. Bot sırası sonunda 1 saniyelik "ne oldu" özeti.
3. Varsayılan hızı "Yavaş" (×1,4) yapmak.

Kart b'ye göre seyrekleşirse oyun başına kart gösterimi 81'den ~38'e iner. Bu tek başına karmaşa hissini belirgin azaltır.

---

## 9. Önceki rapordan geçerliliğini koruyanlar (kısaltılmış)

### 9.1 Gizli kart sahipliği sızıyor (YÜKSEK)

Oyun, Dayın Çıktı ve İtiraz için yalnız kartı olan oyuncuyu bekletiyor (`game.js:382`, `game.js:793`); Kestirme'de de aynı şey var (`game.js:908`). Bekleme herkesin ekranında görünüyor, yani kimin elinde hangi tepki kartı olduğu belli oluyor.

Çözüm: kartı olsun olmasın herkes için aynı kısa bekleme. b uygulanınca kartlar daha değerli olacağı için bu daha da önemli.

### 9.2 Kaçak kat döngüsü

Kaçak katların %80'i yıkılıyor. İhbar 4 → 2 ile birlikte (5.4) %50 civarına inmesi beklenir; sim ile doğrulanmalı.

### 9.3 Teknik ve süreç

- Ev sahibinin sekmesi kapanınca oyun duruyor (ev sahibi devri).
- Telefonda (390 px) oyun oynanmıyor.
- GitHub'daki otomatik test (CI) kapalı ve otomatik döngü doğrudan canlıya push ediyor.
- `window.__rant` ev sahibine herkesin elini gösteriyor.
- İhtiyati Tedbir "2 tur" sürmüyor.
- README'de eski kurallar yazıyor.
- WhatsApp'ta davet linkinin önizlemesi yok.
- 4 kişide gizli hedef dengesi bozuk (%16-67).

### 9.4 Önceki rapordaki bir düzeltme

"BAŞLANGIÇ NOKTASI kelime ortasından bölünüyor" bulgusu, yazı tipi yüklenemediği ortamda görülmüştü. Gerçek Fredoka yazı tipiyle 1920 ve 1366'da sığıyor; yazı tipi geç yüklenirse kısa süre görülebilir. Önemi düşük.

---

## 10. Başarı ölçütleri (güncel)

| Ölçüt | Hedef | Bugün |
|---|---|---|
| 1366x768'de semt adı yazı boyutu | ≥ 12 px | 9,6 px |
| 1366x768'de şehir adı | ≥ 9 px ya da kaldır | 5,9 px |
| 1366x768'de tahta karesi | ≥ 75 px kısa kenar | 60 px |
| Oyuncu başı çekilen kart (20 tur) | 5-9 | 17,1 (15 tur) |
| Elde aynı türden iki kart | ≤ %15 | %44 |
| Kira / maaş | ≥ 1,0 | 0,81 |
| Hiç set tamamlayamayan oyuncu (sim) | ≤ %30 | %29 bugün; b ile %44 → bot pazarlığı şart |
| Konkordato / oyun | ≤ 1,2 | 0,4 |
| 5 insanlı gerçek oyun süresi | 35-50 dk | ~37 dk (tahmin) |
| Gerçek masada "hiçbir şey yapamadım" diyen | 0 | ölçülmedi |

## 11. Varsayımlar

- Bütün denge sayıları bot oyunlarından. İnsanlar daha çok pazarlık yapar; b'nin setsiz oyuncu oranı insan masasında daha düşük olabilir.
- Süre tahminindeki insan düşünme süresi (15-20 sn/sıra) bir varsayım.
- b denemesi motorun bir kopyasında yapıldı; botların kart oynama mantığı yeni sıklığa göre ayarlanmadı.
- Monopoly kıyasları genel kural bilgisinden; Monopoly'nin ortalama oyun süresi için güvenilir bir ölçüm bulunamadı.

## Kaynaklar

- [Sumproduct — Excel at Monopoly #6](https://sumproduct.com/blog/article/excel-at-monopoly-6) (Go'yu geçme süresi ~6 sıra)
- Rakip oyun kaynakları için 1. sürüme bakın: [Business Tour](https://store.steampowered.com/app/397900/Business Tour), [Rento Fortune](https://nodal.gg/game/663390), [Richup.io](https://alternativeto.net/software/richup-io/about), [Monopoly GO](https://www.pocketgamer.biz/scopelys-monopoly-go-fastest-mobile-game-to-hit-6-billion)
