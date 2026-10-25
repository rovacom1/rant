# RANT Yol Haritası

Otomatik geliştirme döngüsü her oturumda **Sıradaki** listesinin en üstündeki işaretsiz maddeyi alır.
Liste 8 maddenin altına düşerse döngü yeni fikirler ekler (oyun eğlencesini artıran, basit tutulabilen işler).
Her 5. oturum bakım oturumudur (bkz. otomasyon/GOREV.md).

## Sıradaki

- [ ] **Taşlar kare adını kapatmasın:** Taşları karenin kenarına yerleştir ya da küçült; birden çok taş varsa yan yana diz.
- [ ] **Hedef dengesi:** 300 oyunluk simde hedefler %5 (Trabzon Hakimi) ile %62 (Hukuk Dünyası) arasında; en kolay ve en zor 3-4 hedefin eşiklerini %15-45 aralığına çek.
- [ ] **Para animasyonu:** Kira ve transferlerde oyuncudan oyuncuya uçan jeton; kat dikince karede küçük inşaat animasyonu.
- [ ] **Oyun sonu grafiği:** Sonuç penceresinde tur tur net değer çizgisi (motor her tur sonu net değerleri kaydetsin).
- [ ] **Bot zorluk seviyesi:** Lobide Kolay / Normal / Zor. Zor bot mülk-mülk takası önersin, ihalede daha akıllı teklif versin.
- [ ] **Açık pazarlık:** Sırası olmayan oyuncular da birbirine teklif yapabilsin (aynı anda tek teklif kuralıyla).
- [ ] **Mobil düzen:** 400-800 px genişlikte tahta ve panelin rahat kullanımı (alt sekmeli panel).
- [ ] **İlk oyun rehberi:** İlk oyunda adım adım ipuçları (zar, satın alma, kart oynama, kat dikme); "bir daha gösterme".
- [ ] **Yeni harita: İstanbul:** İlçelerden oluşan ikinci tahta; lobide harita seçimi (tahta verisi data.js'te haritaya göre).
- [ ] **Yeni kartlar (denge simülasyonuyla):** "Kat Karşılığı" (rakibin arsasına onunla ortak kat), "Kredi Kartı" (şimdi 300 al, 2 tur sonra 360 öde), "Torpil" (ihalede ikinci en yüksek teklifle kazan).
- [ ] **Yeni gündem kartları:** "Deprem" (en yüksek katlı mülk 1 kat kaybeder), "Arsa Spekülasyonu", "Altın Rekor".
- [ ] **Ev sahibi devri:** Ev sahibi düşerse en eski oyuncu kayıttan oyunu devralsın (her oyuncuda son durum kopyası).
- [ ] **PWA:** Masaüstüne kurulabilir uygulama (manifest + service worker); botlarla çevrimdışı oynama.
- [ ] **Erişilebilirlik:** Klavyeyle tam oynanış, renk körleri için şehir desenleri, ekran okuyucu etiketleri.
- [ ] **İsteğe bağlı sunucu:** P2P'nin çalışmadığı ağlar için aynı protokolle küçük bir WebSocket aktarıcısı (Cloudflare Workers + Durable Objects), varsayılan kapalı.

## Tamamlananlar

- [x] Kart yelpazesinde titremesiz üzerine gelme (fare konumuna göre seçim, komşular açılır), kart adı kartın üstünde, karede 🏠×N kat göstergesi, özel kareler için resimli kutucuklar, ceviz-altın tahta çerçevesi, karanlık mod, sohbet kaldırıldı, sade ve büyük yazılı olaylar paneli (v0.4.0)
- [x] Hearthstone tarzı el (yelpaze, büyüme, sürükleyip oynama, desteden çekme, oynanan kartın ortada gösterilmesi), 16 kart görseli, yeni sağ panel, gündem barı ve haber kartı, ElevenLabs ses efektleri ve arka plan müziği, ses ayarları; tahtada şerit rengiyle sahiplik (v0.3.0)
- [x] Kullanıcı geri bildirimiyle sade arayüz: Fredoka + Nunito yazı tipi, 3 boyutlu zar, gri/oyuncu rengi tahta, karelerde fiyat-kira yok (tıklayınca kira penceresi), pazarlık ve ihalede kaydırma çubuğu (v0.2.0)
- [x] Oyun motoru, kurallar, kartlar, gündem, ihale, itiraz zinciri, pazarlık, borç/konkordato (v0.1.0)
- [x] Sezgisel botlar ve denge simülasyonu (v0.1.0)
- [x] Web arayüzü, lobi, P2P çok oyunculu, yeniden bağlanma, kayıttan devam (v0.1.0)
- [x] Sıra sende bildirimi: üst çubukta 🔔 düğmesi, sekme arkadayken masaüstü bildirimi; ses mevcut 🔊 düğmesiyle (v0.1.1)
- [x] Hedefi tahtadan seç: mülk hedefli kartlarda "🎯 Tahtadan seç", geçerli kareler parlar, Takas iki adımlı, Esc/Vazgeç ile çıkış (v0.1.3)
- [x] Bakım 1: ölü kod (squareLabel) silindi, denge kontrolü (300 oyun: sıra en çok %22, hedef %29, kira 18.6/oyun), PeerJS 1.5.5 güncel ve CDN erişilebilir (v0.1.4)
- [x] Tur özeti: her tur sonunda olay akışına özet satırı (en çok kazanan/kaybeden, el değiştiren mülkler); sonraki turun "Son dakika" kartında "N. turun özeti" kutusu (v0.1.5)
- [x] Tapu Dairesi tahtadan: parası yeten sahipsiz kareler parlar, kareye tıklayınca bilgi penceresinde "📜 Tapudan al"; uzun liste kaldırıldı (v0.2.1)
