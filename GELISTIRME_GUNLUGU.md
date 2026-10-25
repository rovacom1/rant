# Geliştirme Günlüğü

Her oturum bir satır ekler: tarih-saat, oturum no, ne yapıldı, nasıl doğrulandı, sürüm.

| Tarih | No | Ne yapıldı | Doğrulama | Sürüm |
|---|---|---|---|---|
| 2026-10-25 | 1 | İlk sürüm: motor, botlar, arayüz, P2P çok oyunculu, testler, yol haritası, otomasyon | 27 test + 125 bot oyunu yeşil; tarayıcıda iki sekmeyle çevrimiçi oyun, ihale, pazarlık, sohbet, yeniden bağlanma denendi | 0.1.0 |
| 2026-10-25 04:45 | 2 | Sıra sende bildirimi: src/ui/notify.js, üst çubukta 🔔/🔕 düğmesi (izin yalnız tıklayınca istenir), sekme arkadayken sıra sana geçince tek bildirim, sıra geçince/sekmeye dönünce kapanır. Varsayım: ses seçeneği için mevcut 🔊 düğmesi ve 'turn' sesi yeterli | 32 test yeşil (yeni notify testi dahil); npm run check temiz; tarayıcı önizlemesi başlatılamadı (izin verilmedi), yalnız node --check ile sözdizimi denetlendi; bir sonraki arayüz oturumunda tarayıcıda denenmeli | 0.1.1 |
| 2026-10-25 06:35 | 3 | Elle düzeltme: "Botlarla dene" v0.1.0'daki koltuk güvenliği değişikliğinden beri çalışmıyordu (yerel mod Host.onLobby'yi yerel işareti olmadan çağırıyordu); Host.addBot() eklendi. 0.1.1 bildirim düğmesi tarayıcıda denendi | 33 test yeşil (yeni botlarla-dene testi); tarayıcıda bot oyunu başlatıldı, zil düğmesi izin reddinde doğru uyarıyı veriyor, konsol temiz | 0.1.2 |
| 2026-10-25 06:50 | 4 | Hedefi tahtadan seç: src/ui/pick.js (saf yardımcı), kart penceresinde "🎯 Tahtadan seç" düğmesi; Kamulaştırma/Tedbir/Müteahhit/Takas'ta geçerli kareler turkuaz parlar, diğerleri soluklaşır, tıklayınca kart oynanır; Takas önce kendi sonra rakip mülk; orta alanda Vazgeç, Esc ile çıkış. Varsayım: listeden seçim de kalır | 36 test yeşil (yeni pick testleri dahil); npm run check temiz; tarayıcı önizlemesi izin verilmediği için açılamadı, node --check ile sözdizimi denetlendi; bir sonraki arayüz oturumunda tarayıcıda denenmeli | 0.1.3 |
