# Geliştirme Günlüğü

Her oturum bir satır ekler: tarih-saat, oturum no, ne yapıldı, nasıl doğrulandı, sürüm.

| Tarih | No | Ne yapıldı | Doğrulama | Sürüm |
|---|---|---|---|---|
| 2026-10-25 | 1 | İlk sürüm: motor, botlar, arayüz, P2P çok oyunculu, testler, yol haritası, otomasyon | 27 test + 125 bot oyunu yeşil; tarayıcıda iki sekmeyle çevrimiçi oyun, ihale, pazarlık, sohbet, yeniden bağlanma denendi | 0.1.0 |
| 2026-10-25 04:45 | 2 | Sıra sende bildirimi: src/ui/notify.js, üst çubukta 🔔/🔕 düğmesi (izin yalnız tıklayınca istenir), sekme arkadayken sıra sana geçince tek bildirim, sıra geçince/sekmeye dönünce kapanır. Varsayım: ses seçeneği için mevcut 🔊 düğmesi ve 'turn' sesi yeterli | 32 test yeşil (yeni notify testi dahil); npm run check temiz; tarayıcı önizlemesi başlatılamadı (izin verilmedi), yalnız node --check ile sözdizimi denetlendi; bir sonraki arayüz oturumunda tarayıcıda denenmeli | 0.1.1 |
