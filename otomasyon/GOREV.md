# Sürekli geliştirme oturumu talimatı

Bu dosyayı Claude masaüstü uygulamasındaki zamanlanmış görev ("RANT geliştirme döngüsü") her çalışmada okur.
Bilgisayar açılıp uygulama başlayınca kaçırılan çalışma hemen yapılır, sonra düzenli aralıklarla devam eder.
Oturumlar birbirini hatırlamaz; hafıza bu repodaki dosyalardır.

Repo: `C:\Dev\Rant` (tek dal `main`, uzak: github.com/rovacom1/rant, push = canlı site güncellenir: https://rovacom1.github.io/rant/)

## Adımlar

1. **Durdurma anahtarı:** `otomasyon/DURDUR` dosyası varsa hiçbir şey yapmadan çık.
2. **Kilit:** `.git/autodev.lock` varsa ve içindeki zaman 3 saatten yeniyse çık. Yoksa şimdiki zamanla oluştur; oturum nasıl biterse bitsin çıkarken sil.
3. **Oyun kontrolü:** `tasklist` çıktısında League of Legends ya da VALORANT varsa (kullanıcı oyunda) tarayıcı penceresi açan denemeler yapma; yalnız testlerle doğrulanabilen işleri seç ya da oturumu atla.
4. **Senkron:** `git status` temiz değilse önceki yarım işe bak: testler geçiyorsa commit'le, geçmiyorsa `git stash push -m "autodev yarım iş"` yap ve günlüğe yaz. Sonra `git pull --rebase origin main`.
5. **Oku:** `CLAUDE.md`, `docs/TASARIM.md`, `ROADMAP.md`, `tasks/lessons.md` ve `GELISTIRME_GUNLUGU.md`'nin son 15 satırı.
6. **İş seç:** Günlükteki son oturum numarası +1 bu oturumun numarasıdır.
   - Numara 5'in katıysa **bakım oturumu**: ölü kod/TODO temizliği, tekrarları sadeleştirme, `node tools/sim.js 300 5` ile denge kontrolü (bir oyuncu sırası %30'dan fazla kazanıyorsa, hedef tutturma %20'nin altına ya da %60'ın üstüne çıktıysa düzelt), PeerJS sürümü ve CDN kontrolü, metin cilası.
   - Değilse `ROADMAP.md` > **Sıradaki** listesinin en üstündeki işaretsiz madde. Madde büyükse ilk çalışan dilimini yap, kalanını alt madde olarak bırak.
   - Kullanıcıya soru sorma ve bekleme; belirsizlikte en basit iyi seçeneği uygula, varsayımı günlüğe yaz.
7. **Uygula:** Küçük ve bitmiş bir değişiklik (yaklaşık 30-45 dakikalık iş). Kural değişikliğinde önce `docs/TASARIM.md`. Motor değişikliğine test ekle. `src/version.js`'de APP_VERSION'ı artır (uyumsuz protokol değişikliğinde PROTOCOL'ü de).
8. **Doğrula:**
   - `npm test` ve `npm run check` yeşil olmalı (GitHub Actions da her push'ta aynısını çalıştırır). Kırmızıysa düzelt; düzeltemezsen değişiklikleri geri al (`git checkout -- .`), sorunu `tasks/lessons.md` ve günlüğe yaz, push etme.
   - Kural ya da bot değişikliğinde `node tools/sim.js 200 5` çalıştır, öncekiyle karşılaştır.
   - Arayüz değişikliğinde yerel sunucuyu (launch adı `rant` ya da `node tools/serve.js 4188`) başlatıp tarayıcı araçlarıyla dene: ekran görüntüsü, konsol hataları, ilgili tıklamalar. Tarayıcı aracı yoksa bunu günlüğe yaz.
   - `npm run check` (şapkalı harf denetimi) temiz geçmeli.
9. **Yayınla:** İngilizce açıklayıcı commit (sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), sonra `git push origin main`. Testler yeşil değilse asla push etme.
10. **Kayıt:** `ROADMAP.md`'de maddeyi işaretleyip Tamamlananlar'a taşı (sürümüyle). Sıradaki listesinde 8'den az madde kaldıysa 2-3 yeni fikir ekle (eğlenceyi artıran, basit tutulabilen). `GELISTIRME_GUNLUGU.md`'ye bir satır ekle: gerçek tarih-saat, oturum no, ne yapıldı, nasıl doğrulandı, sürüm. Bu kayıtları da commit'leyip push et.
11. **Kilidi sil** ve kısa bir Türkçe özet ver: ne yapıldı, test sonucu, commit, sıradaki iş.

## Sınırlar

- Force push, geçmişi yeniden yazma, dal ya da repo silme yok.
- Zamanlanmış görevin kendisini, Windows ayarlarını ya da repo dışındaki dosyaları değiştirme (yalnız `C:\Dev\Rant`).
- Ücretli servis, analitik/takip, kişisel veri toplama, yeni hesap gerektiren servis yok.
- Oyunu karmaşıklaştırma: her yeni mekanik bir cümleyle anlatılabilmeli ve simülasyonda dengeyi bozmamalı.
