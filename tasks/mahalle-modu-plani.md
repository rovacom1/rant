# Mahalle modu planı (2026-11-01, kurallar onaylandı)

Çizim: https://claude.ai/artifact/WKd7QWXGmviH4XQX58tjXw, "Yeni oyun fikirleri" sayfası, "Mahalle modu: plan"
(fikir aşamasındaki adı Koordinat). Bugünkü oyuna lobiden seçilen ikinci oyun türü: Klasik / Mahalle. Ayrı şehir kurma
oyununa sonra başka ad bulunur. Bütün sayılar simülasyonla ayarlanır (kullanıcı kararı).

## Arazi
- Şehir yok, köşe ve özel kare yok (Fırsat, Sürpriz, gar, havalimanı, Tapu, Çay, Zabıta yok). 6x6 = 36 adsız arsa, yeri ile anılır
  (3. satır 5. sütun). Arkada kuşbakışı arazi, bir kenarı (6. sütun) deniz.
- Fiyat yere göre (ilk değer): dış halka 80, iç halka 140, merkezdeki 4 arsa 200, kıyı sütunu 160. Her bölge fiyatı ona yakın
  bugünkü setin kat fiyatını, kira cetvelini ve bina resimlerini kullanır (dışta sade, merkezde kule, kıyıda sahil binası).
- Kıyı arsası kirası +%25.

## Tur
- Zar: (satır, sütun) ya da (sütun, satır); biri seçilir, piyon zıplar. Çift: aynı satır ya da sütunda serbest seçim + 1 kart, ek atış yok.
- Torpil jetonu: bir zar ±1 (1-6); başta 1, en çok 3.
- Rakibin yapılı arsası: kira; rakibin boş arsası: küçük arsa kirası. Sahipsiz: satın al / artırma / gecekondu.
- İnşaat yalnız vardığın arsada ve ona bitişik kendi arsalarında.
- Her sıra başında hakediş (maaş yerine). Her 3 turda gündem ve herkese 1 kart.

## Yapılar ve komşuluk (hepsi ilk sürümde; komşu = dört yan, AVM için çevredeki 8)
- Kat: yasal kat için bitişikte bir arsan daha olmalı; en çok 4. Kaçak kat şart aramaz.
- Site: 2x2 bloğun dördü de seninse ve hepsinde en az 1 kat varsa kira x2.
- Park: kendi boş arsana; kira almaz, dört komşunun kirası +%50 (kimin olursa).
- AVM: 4 yasal katlı arsa AVM'ye çevrilir; çevredeki 8 arsada ödenen kiradan %20 pay.
- Blok: komşulardan en az ikisi de seninse kira +%25.
- Gecekondu: sahipsiz arsaya, kaçak kat bedelinin yarısına; sıra başında küçük gelir; komşu konut kirası -%25. Arsayı alan
  tahliye bedeli öder (2x) ya da İhbar ile yıktırır. İmar Affı: gecekondulu sahipsiz arsa kondurana geçer. Operasyon hepsini yıkar.
- Etkiler kiraya çarpan; arsaya dokununca hangileri işlediği görünür.

## Bugünkü oyundan
- Aynı: hamle/tepki kartları, gündem, artırma, pazarlık, kaçak ve af, ipotek, konkordato, puan, 20 tur.
- Kartlarda "tam set" yerine "site". Taksi = aynı satır/sütunda istediğin arsa; Kestirme = bir zarı yeniden at; Geri Vites = önceki arsana dön.
- Sürpriz etkileri ve köşeler yok; Zabıta'nın işini İhbar ve Operasyon görür. Şehre bağlı gündemler (Turizm Sezonu, Metro Müjdesi)
  bölgeye (kıyı, merkez) bağlanır. Mekanik planı onaylanırsa iki türde de geçerli.

## Adımlar
- [x] K0 Kurallar (2-3 gün): TASARIM.md'ye "Mahalle modu" bölümü, ilk sayılarla (§13).
- [x] K1 Çekirdek (bitti: `engine/core.js` ortak parçalar, `engine/klasik.js` klasik tahtanın mod nesnesi, `engine/board.js` tahta
      verisi `s.mode`'a bağlı; sim raporu ve 120 oyunluk olay olay karşılaştırma aynı) (1 hafta): motorun ortak parçaları (para, kart, artırma, pazarlık, borç, gündem) tahtadan ayrılır, tahta verisi
      oyunun durumuna bağlanır. Klasik oyun değişmez: bütün testler, 125 bot oyunu ve sim raporu aynı.
- [x] K2 Mahalle motoru (bitti: `engine/mahalle.js` mod nesnesi, `board.js` 6x6 arazi, `rules.js` Mahalle bölümü ve
      `rentBreakdown`, botlar, `test/mahalle.test.js` ve 25 bot oyunu, `sim.js 200 5 mahalle`; simülasyonla kira cetveli x3,
      torpil en çok 2 ve 10./19. turda; klasik oyun olay olay aynı) (1,5 hafta): `engine/mahalle.js`; 36 arsa, bölge fiyatları, `pick` hamlesi ve zıplama olayı, hakediş,
      torpil, kat kuralı, site, park, AVM, blok, gecekondu, tahliye, af; kart ve gündem uyarlamaları; botlar;
      `test/mahalle.test.js`; `tools/sim.js` mod argümanı. Sayılar simülasyonla: konkordato klasikten fazla değil, 20 tur,
      park/AVM/gecekondu oyun başına kullanılıyor. PROTOCOL ve SAVE_VERSION artar.
- [x] K3 Arayüz (2 hafta, mevcut planın 6. adımından sonra): lobide oyun türü; `ui/arazi.js` (masaüstünde 6x6, telefonda eğik);
      zar sonrası iki arsa parlar, dokunarak seçilir; yay çizen zıplama; arsa penceresinde kira ve etkiler; park, AVM, gecekondu, torpil.
- [ ] K4 Deneme (1 hafta): arkadaş oyunu (kullanıcı); [x] Nasıl oynanır, dayının yorumları (Mahalle kural kartları, oyun sonu yorumları, dayı balonları). v0.47.

## Higgsfield (bu hafta, ~12 kredi)
Arazi zemini (6x6 kuşbakışı, bir kenarı kıyı, iki tema), park, AVM, torpil jetonu. Ev ve apartman için bugünkü set binaları,
gecekondu için setlerin k0 resmi.
