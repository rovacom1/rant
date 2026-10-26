# Kart görseli ve ses rehberi

Yeni bir kart eklenirse görseli aynı tarzda üretilir; tutarlılık oyunun kalitesi için önemli.

## Kart görseli

- Stil (v0.16.1, kullanıcı seçti): kalın lacivert dış çizgili düz çizgi film; yalnız domates kırmızısı, turkuaz, hardal ve krem zemin; gradyan ve doku yok. Eski Hearthstone tarzı boyalı görseller "kalabalık, yapay zeka işi" bulundu.
- Araç: Higgsfield, `gpt_image_2_5`, `quality: medium`, 1:1 (görsel başına 0,5 kredi). Stil referansı olarak `assets/kart/itiraz.jpg` yüklenir (`image_references`); tutarlılığı bu sağlar.
- Ham dosyalar `tasks/gorsel-ham/<kartId>.jpg` olarak kaydedilir (repoya girmez), sonra `python tools/kart_gorsel_hazirla.py` ile `assets/kart/<kartId>.jpg` (360x360, yaklaşık 27 KB) üretilir. Kart arkası `arka.jpg` 3:4 üretilir, araç onu 5:7 kırpar.
- Komut kalıbı (değiştirmeden kullan, yalnız "Subject" kısmını yaz):

```
Square 1:1 card illustration, artwork only: no frame, no border, no text, no letters, no numbers. Match the art style of the reference image exactly (style only, not its characters or scene): bold flat vector cartoon, thick dark navy outlines, flat fills only in tomato red, teal and mustard plus a plain cream background, no gradients, no texture, big expressive caricature faces, modern indie board game look, lots of empty cream space, readable at small size. Setting: present-day Turkey, all clothing contemporary 2020s, no fez, no traditional costume. Subject: <sahne>
```

- Sahne, kartın esprisini tek bakışta anlatmalı (ör. Dayın Çıktı: deri ceketli, desenli gömlekli, altın zincirli, tespihli kıro bir dayının ev sahibini elini kaldırıp durdurması). Kıyafetler bugünün Türkiye'si: fes, şalvar, kuşak yok. Elde tutulan nesneler tek ve doğal olsun (tek sayfa fatura, bir anahtar); anlamı belli olmayan nesne (yerde zar gibi) çizilmez.

## Gündem kartları

- `assets/gundem/<gündemId>.jpg`, 360x360. Kart görseliyle aynı araç, aynı stil referansı (`assets/kart/itiraz.jpg`) ve aynı komut kalıbı; sahne gündemin esprisini anlatır. Komutun sonuna: "No portraits, no pictures on walls, no banknotes, no signs with writing."
- SÜRPRİZ kartının arka yüzü `assets/kart/surpriz.jpg` (250x350): `arka.jpg` referansıyla, aynı aileden ama domates kırmızısı zemin, ortada büyük "?".
- Davet linki önizlemesi `assets/davet.jpg` (1200x630): insan yok, yazı yok; İstanbul silueti, zar, kartlar, çay bardağı.

## Oyuncu piyonları

- `assets/piyon/<ad>.png` (semazen, kofte, leblebi, ankaray, galata, hitit): şeffaf zemin, görünen figüre kırpılmış, uzun kenarı 256 px. Oyuncu rengi resme değil, oyunda figürün kenarına çizilir; resimde halka ya da kaide olmaz.
- Araç ve stil referansı kartlarla aynı (`gpt_image_2_5`, `itiraz.jpg`); Hitit Güneşi için kullanıcının verdiği Ankara amblemi de referans verildi. Yeni piyon eklenirse `src/ui/pawns.js`'teki en/boy oranı tablosuna da yazılır.
- Komut kalıbı (yalnız "Subject" değişir):

```
Board game player token, a single compact figurine-like object, artwork only: no text, no letters, no numbers, no base, no pedestal, no ring. Match the art style of the reference image exactly (style only, not its characters or scene): bold flat vector cartoon, medium-weight dark navy outline (clear but not extra thick), flat fills only in tomato red, teal and mustard plus cream/off-white, no gradients, no texture, no shading. Compact figure that fills a roughly square area (not tall-thin, not wide-flat), no thin protruding parts, clean solid silhouette edge, readable at 36 px. Centered, whole object visible, filling about 85% of the frame, isolated on a fully transparent background, no shadow, no scenery. Subject: <figür>
```

## Tahta kareleri

- Özel kareler (Başlangıç Noktası, Fırsat, SÜRPRİZ, Tapu, Çay Ocağı, Zabıta) ve ulaşım (gar, havalimanı) resim değil, `src/ui/icons.js` içindeki elle çizilmiş SVG ikonlardır (64x64). Kullanıcı yapay zeka resimlerini kalabalık buldu (v0.6); istenen, orijinal Monopoly gibi tek bakışta okunan, kalın hatlı sade ikon.
- Yeni ikon: tek nesne, 2-3 ana renk, koyu dış çizgi (1.6-2.4), hafif gradyan; açık ve koyu zeminde okunmalı.
- Mülk kareleri: şehrin `color` ve `tint` renkleri buzlu camın arkasında bulanık görünür ve karenin çerçevesi bu iki renkten oluşur; sahiplik yalnız iç kenardaki şeritte. Kare zemini sahibin rengine boyanmaz.

## Ses

- Efektler ve müzik ElevenLabs ile üretildi (`assets/ses/*.mp3`). Yeni efekt: kısa (1-2 sn), temiz, "close mic" komutlu. Kod sesi kendisi kırpar ve düzeyini eşitler (`src/ui/sound.js`).
- Müzik: `assets/ses/muzik.mp3`, 60 sn, döngüde 3 sn geçişle çalar.
