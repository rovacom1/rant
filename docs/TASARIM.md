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
| **Gündem** | Her tur başında herkesi etkileyen bir haber kartı açılır | Ortak kahkaha, her oyun farklı |
| **Hamle kartları** | Elde tutulan aksiyon kartları (Kamulaştırma, İhtiyati Tedbir, Dava...) | Sıra sende olmasa da oyundasın |
| **İtiraz zinciri** | Sana oynanan karta İtiraz, İtiraz'a karşı İtiraz | Monopoly Deal'deki "Hayır!" gerilimi |
| **Kaçak Kat** | Set olmadan, yarı fiyata kat; ama Zabıta ve İhbar ile yıkılabilir | Risk-ödül, İmar Affı kumarı |
| **Gizli İhale** | Almadığın arsa herkesin gizli teklif verdiği ihaleye çıkar | Çevrimiçi oyuna özel, hızlı ve şaşırtıcı |
| **Gizli Hedef** | Başta 2 hedef kartından 1'ini seçersin, sonda açılır | Blöf, pazarlıkta gizli niyet |
| **Enflasyon Endeksi** | Fiyatlar ve kiralar endeksle artar, nakit erir | Erken yatırımı ödüllendirir |
| **Konkordato** | Batan oyuncu oyundan çıkmaz; borcu silinir, sonda ceza alır | Kimse 20. dakikada izleyici olmaz |
| **Seçim Günü** | Oyun sabit tur sayısında (varsayılan 15) biter | Monopoly'nin bitmeyen oyun sorunu yok |

## 2. Temel bilgiler

- Oyuncu: 2-6 (denge 4-5 için ayarlı). Boş koltuklar botla doldurulabilir.
- Süre: 15 tur; 5 kişiyle yaklaşık 35-45 dakika. Kısa (10) ve uzun (20) seçenekleri var.
- Başlangıç: 1500 TL nakit, 3 Hamle kartı, 2 Hedef kartından 1'i seçilir.
- Kazanan: Seçim Günü'nde (son turun sonunda) en yüksek **puan**a sahip oyuncu.

## 3. Tahta (36 kare)

Kareler 0'dan 35'e dizilir, tahta 10x10 ızgaradır. Köşeler: 0, 9, 18, 27.
Her kenarda 5 mülk, 1 gar, 1 havalimanı ve 1 FIRSAT ya da SÜRPRİZ karesi var.

| # | Kare | Tür | Fiyat |
|---|---|---|---|
| 0 | MAAŞ GÜNÜ | köşe | geçince ya da gelince maaş |
| 1 | Yakutiye (Erzurum) | mülk | 60 |
| 2 | Palandöken (Erzurum) | mülk | 80 |
| 3 | SÜRPRİZ | sürpriz | rastgele etki, hemen uygulanır |
| 4 | DOĞU EKSPRESİ | gar | 150 |
| 5 | Ortahisar (Trabzon) | mülk | 100 |
| 6 | Akçaabat (Trabzon) | mülk | 100 |
| 7 | KAPADOKYA | havalimanı | 200 |
| 8 | Uzungöl (Trabzon) | mülk | 120 |
| 9 | TAPU DAİRESİ | köşe | sahipsiz herhangi bir mülkü al |
| 10 | Odunpazarı (Eskişehir) | mülk | 140 |
| 11 | FIRSAT | kart | 2 Hamle kartı çek |
| 12 | Tepebaşı (Eskişehir) | mülk | 160 |
| 13 | KONYA GARI | gar | 150 |
| 14 | Karatay (Konya) | mülk | 180 |
| 15 | Meram (Konya) | mülk | 180 |
| 16 | DALAMAN | havalimanı | 200 |
| 17 | Selçuklu (Konya) | mülk | 200 |
| 18 | ÇAY OCAĞI | köşe | herkesten çay parası |
| 19 | Kaleiçi (Antalya) | mülk | 220 |
| 20 | Konyaaltı (Antalya) | mülk | 220 |
| 21 | SÜRPRİZ | sürpriz | rastgele etki, hemen uygulanır |
| 22 | ANKARA GARI | gar | 150 |
| 23 | Lara (Antalya) | mülk | 240 |
| 24 | Kızılay (Ankara) | mülk | 260 |
| 25 | ESENBOĞA | havalimanı | 200 |
| 26 | Çankaya (Ankara) | mülk | 280 |
| 27 | ZABITA | köşe | bir oyuncuyu ihbar et |
| 28 | Karşıyaka (İzmir) | mülk | 300 |
| 29 | FIRSAT | kart | 2 Hamle kartı çek |
| 30 | Bornova (İzmir) | mülk | 300 |
| 31 | HAYDARPAŞA | gar | 150 |
| 32 | Alsancak (İzmir) | mülk | 320 |
| 33 | Kadıköy (İstanbul) | mülk | 350 |
| 34 | SABİHA GÖKÇEN | havalimanı | 200 |
| 35 | Bebek (İstanbul) | mülk | 400 |

Şehir grupları ve kat fiyatları: Erzurum 50, Trabzon 50, Eskişehir 100, Konya 100, Antalya 150, Ankara 150, İzmir 200, İstanbul 200.
Sahil grupları: Antalya, İzmir.

### Kira

- Temel kira fiyatın yaklaşık %10'u (tablo: `src/engine/data.js`).
- Seviye L = yasal kat + kaçak kat (en fazla 4).
- L = 0: temel kira; şehrin tüm mülkleri aynı kişideyse **2 katı**.
- L = 1..4: temel kira x 5 / 14 / 30 / 40 (5'e yuvarlanır).
- Havalimanı: kira sahibinin havalimanı sayısıyla **her biri için ikiye katlanır**: 1'i varsa 25, 2'si 50, 3'ü 100, 4'ü 200.
- Gar: kira elindeki gar sayısıyla **orantılı** artar: gar başı 30 (1'i 30, 2'si 60, 3'ü 90, 4'ü 120).
- Gar ve havalimanı ayrı sayılır; ipotekli olan sayılmaz. Bunlara kat dikilmez.
- Tüm para değerleri **Endeks / 100** ile çarpılır (başlangıçta Endeks 100) ve 5'e yuvarlanır.
- İpotekli ya da İhtiyati Tedbirli mülk kira almaz.

## 4. Tur akışı

1. **Tur başı** (ilk oyuncudan önce): Gündem kartı açılır ve uygulanır. Önceki turun geçici etkileri biter, Tedbir sayaçları 1 azalır.
2. **Sıra başı**: 1 Hamle kartı çekersin. Kira Zammı etkin kaldıysa burada biter.
3. **Zar öncesi**: Hamle kartı oynayabilir (turda en fazla 1), kat dikebilir, ipotek yapabilir, pazarlık teklif edebilirsin.
4. **Zar**: İki zar atılır, toplamı kadar ilerlersin. Elinde *Kestirme* varsa zarı gördükten sonra zarlardan birini seçebilirsin. Çift gelirse +1 kart.
   (İlk taslakta her turda zar seçimi vardı; simülasyonda oyuncular kirayı neredeyse hiç ödemediği için karta taşındı.)
5. **Kareye geliş** (aşağıda).
6. **Serbest evre**: Hamle (bu tur oynamadıysan), kat, ipotek, pazarlık; sonra **Turu Bitir**.
7. Turu bitirmek için: bekleyen karar yok, nakit >= 0, elde en fazla 6 kart.
8. **Tur sonu** (son oyuncudan sonra): Tur özeti açıklanır: net değeri en çok artan ve en çok düşen oyuncu, el değiştiren mülkler. Yalnız bilgi verir, kurala etkisi yoktur.

### Karelere geliş

- **Sahipsiz mülk**: Liste fiyatına **Satın Al** ya da **İhaleye Çıkar**. Parası yetmeyen ihaleye çıkarır.
- **Başkasının mülkü**: Kira ödenir. Elinde *Dayın Çıktı* varsa kullanıp ödemeyebilirsin.
- **Kendi mülkün**: bir şey olmaz.
- **FIRSAT**: 2 Hamle kartı çek.
- **SÜRPRİZ**: Rastgele bir Sürpriz etkisi açılır ve **hemen** uygulanır, seçim yapılmaz (bkz. bölüm 8b).
- **MAAŞ GÜNÜ**: İleri yönde geçince ya da gelince maaş (200; Asgari Ücret zammıyla artar).
- **TAPU DAİRESİ**: Tahtadaki sahipsiz herhangi bir mülkü fiyatına alabilirsin. Alacak yoksa 1 kart.
- **ÇAY OCAĞI**: Diğer her oyuncu sana 25 çay parası öder (nakdi yettiği kadar).
- **ZABITA**: Kaçak katı olan bir rakibi seç; tüm kaçak katları yıkılır, kat başı 25 ceza öder.

### Gizli İhale

Nakdi 0'dan fazla olan tüm oyuncular aynı anda gizli teklif verir (0 = pas). En yüksek teklif kazanır; eşitlikte sırası en yakın gelecek oyuncu kazanır. Teklifler sonunda herkese gösterilir. Kimse teklif vermezse arsa sahipsiz kalır. Süre 25 sn.

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

## 7. Hamle kartları (50)

Sıra sendeyken turda en fazla 1 Hamle kartı oynanır. Tepki kartları (İtiraz, Dayın Çıktı) bu sınıra girmez.

| Kart | Adet | Etki | Karşı hamle |
|---|---|---|---|
| İtiraz | 6 | TEPKİ: Sana oynanan bir Hamle'yi iptal et. İtiraz'a karşı da oynanır. | - |
| Dayın Çıktı | 4 | TEPKİ: Ödeyeceğin bir kirayı ödemezsin. | - |
| Taksi | 3 | Zar atmadan önce: zar yerine 1-12 kare arasında istediğin kadar ilerle. | - |
| Kestirme | 4 | Zar attıktan sonra: toplam yerine zarlardan birini seçip o kadar ilerle. | - |
| Geri Vites | 2 | Zar atmadan önce: bu tur geri yönde ilerlersin (maaş yok). | - |
| Kamulaştırma | 3 | Rakibin katsız, ipoteksiz, set dışı bir mülkünü fiyatını ona ödeyerek al. | İtiraz |
| Zorla Takas | 3 | Katsız bir mülkünü rakibin katsız, set dışı bir mülküyle değiştir. | İtiraz |
| İhtiyati Tedbir | 3 | Rakibin bir mülkü 2 tur boyunca kira alamaz, kat dikilemez. | İtiraz |
| İhbar | 4 | Bir rakibin tüm kaçak katları yıkılır, kat başı 25 ceza. | İtiraz |
| Kira Zammı | 3 | Bir sonraki sıran gelene kadar tahsil edeceğin ilk kira 2 katı. | - |
| Müteahhit Dostu | 3 | Bir mülküne bedava 1 yasal kat (set şartı yok). | - |
| Piyango | 3 | Bankadan 150 al. | - |
| Aidat Günü | 3 | Diğer her oyuncu sana 30 öder. | Her hedef ayrı İtiraz edebilir |
| Dava Aç | 3 | Bir rakiple zar atarsın; büyük atan 100 alır (eşitlikte davalı). | İtiraz |
| Pazarlık Ustası | 3 | Satın alma kararı sırasında: arsayı yarı fiyata al. | - |

Kartlardaki para miktarları Endeks ile ölçeklenir.

## 8. Gündem kartları (29)

| Kart | Adet | Etki |
|---|---|---|
| Enflasyon Açıklandı | 3 | Endeks +15 (kalıcı) |
| Dolar Rekor Kırdı | 1 | Herkes nakdinin %10'unu kaybeder |
| Asgari Ücrete Zam | 2 | Maaş +50 (kalıcı) |
| İmar Affı | 1 | Tüm kaçak katlar yasallaşır |
| Belediye Operasyonu | 1 | Tüm kaçak katlar yıkılır |
| Turizm Sezonu | 1 | Bu tur Antalya ve İzmir kiraları 2 katı |
| Ulaşıma Zam | 1 | Bu tur gar ve havalimanı kiraları 2 katı |
| Deprem Yönetmeliği | 1 | Yasal kat başı 15, kaçak kat başı 30 güçlendirme bedeli |
| Emlak Vergisi | 1 | Mülk başı 10 vergi |
| Kira Artış Sınırı | 1 | Bu tur tüm kiralar yarıya iner |
| Kira Artışı | 1 | Bu tur tüm kiralar 1,5 katı |
| Bayram İkramiyesi | 2 | Herkese 100 |
| Kentsel Dönüşüm | 1 | Rastgele bir şehirde sahipli her mülke bedava 1 yasal kat |
| Seçim Vaadi | 1 | Net değeri en düşük oyuncuya 250 |
| Rant Vergisi | 1 | Net değeri en yüksek oyuncu 200 öder |
| Bankacılar Grevde | 1 | Bu tur maaş yok |
| Piyasa Durgun | 1 | Bu tur kat dikilemez |
| Konut Kampanyası | 1 | Bu tur kat fiyatları yarı fiyat |
| Faiz İndirimi | 1 | Bu tur ipotek kaldırma yarı fiyat |
| Faizler Uçtu | 1 | İpotekli mülk başı 20 faiz |
| Zabıta İzinde | 1 | Bu tur İhbar oynanamaz, Zabıta karesi işlemez |
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
| Belediyeden Jest | Rastgele bir mülküne bedava 1 yasal kat. Uygun mülk yoksa 50 teselli. |
| Dededen Kalma Tarla | Sahipsiz en ucuz mülk bedavaya senin olur. Sahipsiz mülk yoksa 100 al. |
| Bedava Uçak Bileti | İleri yöndeki ilk havalimanına uçarsın (Maaş Günü'nden geçersen maaş), o kareye gelmiş sayılırsın. |
| Işınlanma | Rastgele bir kareye ışınlanırsın (maaş yok), o kareye gelmiş sayılırsın. SÜRPRİZ karelerine ışınlanılmaz. |
| Ters Köşe | Rastgele bir rakiple yerini değiştirirsin; ikiniz için de kare etkisi işlemez. |
| Kapkaç | Rastgele bir rakibin elinden rastgele bir kart kaparsın. Kimsenin kartı yoksa 1 kart çek. |
| Kayıp Bavul | Elindeki rastgele 1 kart gider. |
| Haciz Memuru | Nakdinin %10'u haczedilir. |
| Vergi İadesi | Mülk başı 15 iade al. |

## 9. Gizli Hedefler (16)

Başta herkese 2 hedef dağıtılır, 1'i seçilir. Oyun sonunda tutarsa bonus alınır. Eşikler bot simülasyonunda tutturma oranı %25-50 olacak şekilde ayarlandı.

- 8 şehir hedefi: "<Şehir> Hakimi" — o şehrin tüm mülkleri sonda sende (2'li şehir +250, 3'lü şehir +300).
- Kat Kat Üstüne: sonda en az 7 katın (kaçak dahil) var, +300.
- Ulaşım Baronu: sonda en az 3 gar ya da havalimanı sende, +250.
- Nakit Kraldır: sonda en çok nakit sende (eşitlik dahil), +300.
- Arsa Avcısı: sonda en az 6 mülkün var, +300.
- Kaçak Ama Sağlam: sonda en az 2 kaçak katın ayakta, +300.
- Hukuk Dünyası: oyun boyunca en az 6 hukuk kartı (Kamulaştırma, Tedbir, İhbar, Dava, İtiraz) oynadın, +300.
- İhale Kralı: en az 2 ihale kazandın, +250.
- Temiz Sicil: hiç ipotek yapmadın, konkordato yok, sonda en az 5 mülk, +250.

## 10. Net Değer ve puan

Net Değer = nakit + mülklerin güncel fiyatı (ipotekli ise yarısı) + yasal kat x kat fiyatı + kaçak kat x kat fiyatının yarısı.
Puan = Net Değer + tutan hedef bonusu - 300 x konkordato. Eşitlikte nakdi fazla olan kazanır.

## 11. Çevrimiçi mimari

- Oyun statik bir sitedir (GitHub Pages). Oyun sunucusu yoktur.
- Odayı kuran oyuncunun tarayıcısı **ev sahibidir**: oyun motoru orada çalışır, botları o yönetir, kuralları o doğrular.
- Diğer oyuncular PeerJS (WebRTC) ile doğrudan ev sahibine bağlanır. Eşleşme için PeerJS'in ücretsiz sunucusu, ağ engeline karşı PeerJS'in TURN sunucuları kullanılır.
- Her oyuncu yalnız kendi görünümünü alır (başkalarının eli ve hedefi gizli). Zar ve desteler ev sahibindedir.
- Ev sahibi sayfayı yenilerse oyun tarayıcı hafızasından geri yüklenir; oyuncular otomatik yeniden bağlanır.
- Pazarlık teklifini yalnız sırası gelen oyuncu yapar (turda en fazla 3 teklif).
- Bağlantısı kopan oyuncunun yerine bir süre sonra bot oynar; dönünce koltuk geri verilir.
- Motor taşıma katmanından bağımsızdır; ileride bir WebSocket sunucusu aynı protokolle eklenebilir.

## 12. Protokol (v1)

İstemci -> ev sahibi: `hello {v, name, avatar, token}`, `act {action}`, `lobby {cmd}`, `profile {...}`, `pong`.
Ev sahibi -> istemci: `welcome {seat}`, `reject {reason}`, `lobby {...}`, `state {view, events}`, `error {msg}`, `ping`. (Sohbet 2026-10-25 kullanıcı isteğiyle kaldırıldı.)
Sürüm uyuşmazsa istemciye "sayfayı yenile" denir.
