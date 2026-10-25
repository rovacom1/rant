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

## Tahta kareleri

- Özel kareler (Maaş Günü, Fırsat, SÜRPRİZ, Tapu, Çay Ocağı, Zabıta) ve ulaşım (gar, havalimanı) resim değil, `src/ui/icons.js` içindeki elle çizilmiş SVG ikonlardır (64x64). Kullanıcı yapay zeka resimlerini kalabalık buldu (v0.6); istenen, orijinal Monopoly gibi tek bakışta okunan, kalın hatlı sade ikon.
- Yeni ikon: tek nesne, 2-3 ana renk, koyu dış çizgi (1.6-2.4), hafif gradyan; açık ve koyu zeminde okunmalı.
- Mülk kareleri: şehrin `color` ve `tint` renkleri buzlu camın arkasında bulanık görünür; iç kenarda plaka kodu rozeti (`GROUPS[g].plate`).

## Ses

- Efektler ve müzik ElevenLabs ile üretildi (`assets/ses/*.mp3`). Yeni efekt: kısa (1-2 sn), temiz, "close mic" komutlu. Kod sesi kendisi kırpar ve düzeyini eşitler (`src/ui/sound.js`).
- Müzik: `assets/ses/muzik.mp3`, 60 sn, döngüde 3 sn geçişle çalar.
