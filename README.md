# RANT — Kentsel Dönüşümün Kart Oyunu

Türkiye temalı, 4-5 kişilik (2-6), internetten oynanan bir emlak ve kart oyunu. Monopoly'nin tanıdık iskeleti üstüne kaçak kat, açık artırma, itiraz zinciri ve gündem kartları.

**Oyna:** https://rovacom1.github.io/rant/

Kurulum yok, hesap yok, sunucu yok. Biri "Oda Kur" der, davet linkini arkadaşlarına gönderir; herkes kendi bilgisayarından, kendi şehrinden katılır.

## Neden farklı?

- **Gündem:** 3 turda bir haber kartı açılır ve 3 tur sürer: enflasyon, imar affı, turizm sezonu, deprem yönetmeliği...
- **Kaçak kat:** Set tamamlamadan yarı fiyatına kat; ama İhbar, Zabıta ya da Belediye Operasyonu yıkar.
- **Açık artırma:** Almadığın arsa Monopoly'deki gibi artırmaya çıkar: sırayla artır ya da çekil.
- **Hamle ve Tepki kartları:** Kamulaştırma, İhtiyati Tedbir, Dava Aç, Taksi, Dayın Çıktı... İtiraz'a karşı İtiraz.
- **Endeks:** Fiyat ve kiralar enflasyonla artar, nakit erir.
- **Konkordato:** Kimse batıp oyundan düşmez. Oyun varsayılan 20 turda Seçim Günü ile biter.
- **Kartlar Monopoly temposunda:** Hamle kartı Başlangıç Noktası'ndan geçince ve FIRSAT karesinde gelir; her kart değerli.
- **Oyun sonu seçimi:** tur sayısı, değer hedefi ya da Monopoly gibi son kalan (batan elenir, son kalan kazanır).

Tüm kurallar: [docs/TASARIM.md](docs/TASARIM.md)

## Nasıl çalışıyor?

Oyun statik bir web sayfası (GitHub Pages). Odayı kuran oyuncunun tarayıcısı ev sahibi olur ve oyun motorunu çalıştırır; diğer oyuncular [PeerJS](https://peerjs.com/) (WebRTC) ile doğrudan ona bağlanır. Eşleşme için PeerJS'in ücretsiz sunucusu, sıkı ağlar için TURN aktarıcısı kullanılır. Ev sahibi sayfayı yenilerse oyun tarayıcı hafızasından devam eder.

```
src/engine/   oyun kuralları (saf JS, DOM yok): data, rules, game, bot
src/net/      ev sahibi (Host) ve bağlantı katmanı (PeerJS / yerel)
src/ui/       arayüz (bağımlılıksız, derleme adımı yok)
test/         node:test birim testleri ve bot simülasyonları
tools/        yerel sunucu, denge simülasyonu
otomasyon/    sürekli geliştirme döngüsünün talimatları
```

## Geliştirme

Node 20+ yeterli; npm paketi yok.

```bash
npm test          # birim testleri + tam bot oyunları
npm run sim       # denge raporu (200 oyun; --tur=N, --hedef=N, --iflas)
npm run dev       # http://127.0.0.1:4188
```

Yol haritası: [ROADMAP.md](ROADMAP.md) · Geliştirme günlüğü: [GELISTIRME_GUNLUGU.md](GELISTIRME_GUNLUGU.md)

## Emeği geçenler

- Kart görselleri: Google Gemini (Nano Banana) ile üretildi.
- Ses efektleri ve müzik: ElevenLabs ile üretildi.
- Yazı tipleri: Fredoka ve Nunito (Google Fonts).
