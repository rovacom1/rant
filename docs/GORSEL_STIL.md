# Kart görseli ve ses rehberi

Yeni bir kart eklenirse görseli aynı tarzda üretilir; tutarlılık oyunun kalitesi için önemli.

## Kart görseli

- Araç: Gemini (Nano Banana). `python C:\Dev\Ekip\ekip.py gemini "<komut>" --tur gorsel --gorsel tasks/gorsel-ham/<kartId>.jpg`
  Gemini kotası dolarsa ElevenLabs bağlantısında `gemini-3.1-flash-image` modeli kullanılır (görsel başına yaklaşık 7 sent; geniş gelir, ortadan kare kırpılır).
- Ham dosyalar `tasks/gorsel-ham/` altına (repoya girmez), sonra `python tools/kart_gorsel_hazirla.py` ile `assets/kart/<kartId>.jpg` (360x360, yaklaşık 35 KB) üretilir. Kart arkası `arka.jpg` dikey kırpılır.
- Komut kalıbı (değiştirmeden kullan, yalnız "Subject" kısmını yaz):

```
Use your image generation tool. Square 1:1 trading card illustration, artwork only: no frame, no border, no text, no letters, no numbers, no watermark. Style: rich painterly digital fantasy card art like Hearthstone, warm cinematic lighting, saturated colors, slightly exaggerated cartoon proportions, strong centered subject, softly blurred detailed background. Setting: modern Turkey. Subject: <sahne>
```

- Sahne, kartın esprisini tek bakışta anlatmalı (ör. Dayın Çıktı: kasketli, tespihli bir dayının ev sahibini savuşturması).

## Özel kare görselleri

- `assets/kare/<ad>.jpg` (300x300): maas, firsat, tapu, cay, zabita, yht, havalimani (+ secim, şimdilik kullanılmıyor).
- Kredi tasarrufu için 8 kutucuk tek görselde 4x2 ızgara olarak üretildi, koyu aralıklar otomatik bulunup kesildi. Model istenmese de altlara İngilizce yazı basabiliyor; kesimde alt %22 atılıyor. Ham dosya: `tasks/gorsel-ham/kareler.png`.

## Ses

- Efektler ve müzik ElevenLabs ile üretildi (`assets/ses/*.mp3`). Yeni efekt: kısa (1-2 sn), temiz, "close mic" komutlu. Kod sesi kendisi kırpar ve düzeyini eşitler (`src/ui/sound.js`).
- Müzik: `assets/ses/muzik.mp3`, 60 sn, döngüde 3 sn geçişle çalar.
