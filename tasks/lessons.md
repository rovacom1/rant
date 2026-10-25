# Dersler

Her hatadan sonra buraya kısa bir kural yaz; oturum başında oku.

- **Zar seçimi kirayı öldürdü (2026-10-25):** "İki zardan birini ya da toplamı seç" kuralı oyuncuya kirayı neredeyse her zaman atlatma imkanı verdi (oyun başına 8 kira ödemesi). Hareket özgürlüğü veren her mekanik kira sayısını düşürür; sim raporundaki "Kira: oyun başına N ödeme" satırını izle (sağlıklı aralık ~15-25). Seçim hakkını karta (Kestirme, Taksi) bağla.
- **Sınıf adı çakışması (2026-10-25):** `.center` hem tahta ortası hem hizalama yardımcısıydı; düğmelerin arkasında kutu çıktı. Bölge sınıflarına önek ver (`board-center`), log satırlarında `t-` öneki kullan (`.dice` gibi düzen sınıflarıyla çakışmasın).
- **Ev sahibi önce planlar, sonra yayınlar:** `schedule()` süre bilgisini (`deadlines`) üretir; `broadcast()`'tan önce çağrılmazsa istemciler bir adım eski süreyi görür.
- **Python ile dosya yazımı CRLF üretir (Windows):** `.gitattributes` `eol=lf` ile normalize ediliyor; sorun değil ama düzenleme için Edit aracını tercih et.
- **Taşlar ve yeniden boyutlandırma:** Taş konumları hücre ölçülerine bağlı; `window.resize` yetmez, `ResizeObserver` kullan.
- **Arayüz, Host'un iç kapılarını sahte istemciyle çağırmasın (2026-10-25):** Koltuk güvenliği eklenince `startLocal` içindeki `host.onLobby({ playerId })` çağrısı reddedildi ve "Botlarla dene" canlıda bozuldu; testler yakalamadı çünkü yol app.js'teydi. Arayüzün ihtiyaç duyduğu işlemi Host'ta ayrı bir yöntem yap (`addBot()`) ve testle. Güvenlik değişikliğinden sonra tarayıcıda menüdeki üç yolu da dene: Oda Kur, Katıl, Botlarla dene.
- **Zamanlanmış oturumda tarayıcı önizlemesi açılamayabilir:** Otomatik oturum izin alamazsa arayüz değişikliği yalnız testlerle doğrulanır; günlüğe yaz ki elle denensin.
