// "Nasıl Oynanır?" penceresi. Ayrıntılı kurallar docs/TASARIM.md'de.
export const RULES_HTML = `
<div class="rules">
<p><b>RANT</b> bir emlak ve kart oyunu. Belirlenen tur sayısı dolunca ya da biri lobide seçilen <b>değer hedefine</b> ulaşıp o tur bitince <b>Seçim Günü</b> gelir; en yüksek puanı (nakit + mülkler + katlar, eksi konkordato cezası) toplayan kazanır. Son kalan modu dışında kimse batıp oyundan çıkmaz.</p>
<h3>Sıran geldiğinde</h3>
<ul>
<li>Elinde 5'ten az kart varsa 1 <b>Hamle kartı</b> çekersin. Turda en fazla 1 Hamle kartı oynayabilirsin.</li>
<li><b>Zar at</b>, toplam kadar ilerle. Çift atarsan +1 kart. <b>Kestirme</b> kartın varsa zarlardan birini seçebilirsin.</li>
<li>Sahipsiz arsaya gelince <b>satın al</b> ya da <b>açık artırmaya</b> çıkar: sırayla herkes ya teklifi artırır ya çekilir, son kalan kazanır.</li>
<li>Başkasının mülküne gelince kira ödersin. <b>Dayın Çıktı</b> kartın varsa ödemezsin.</li>
<li>Kat dik, ipotek et, pazarlık teklif et, sonra <b>Turu Bitir</b>.</li>
</ul>
<h3>Kat ve kaçak kat</h3>
<ul>
<li><b>Yasal kat</b> için şehrin tüm mülkleri sende olmalı. Kat kirayı katlar (en fazla 4 seviye).</li>
<li><b>Kaçak kat</b> set istemez, yarı fiyatına; ama set tamamlanmadan katların kirası yarıdır. <b>İhbar</b> kartı, <b>Zabıta</b> karesi ya da <b>Belediye Operasyonu</b> yıkar. <b>İmar Affı</b> gelirse yasallaşır.</li>
</ul>
<h3>Gar, havalimanı ve SÜRPRİZ</h3>
<ul>
<li>Tahtada 4 <b>havalimanı</b> var: sende olan her havalimanı kirayı <b>ikiye katlar</b> (25 / 50 / 100 / 200).</li>
<li>4 <b>gar</b> var: kira elindeki gar sayısıyla <b>orantılı</b> artar (30 / 60 / 90 / 120).</li>
<li><b>SÜRPRİZ</b> (❓) karesine gelince 15 etkiden biri hemen uygulanır: miras, radar cezası, düğün takısı, ışınlanma, kapkaç, dededen kalma tarla...</li>
</ul>
<h3>Kartlar</h3>
<ul>
<li><b>Hamle</b> kartları (Kamulaştırma, İhtiyati Tedbir, Dava Aç, Taksi...) sıran sende iken oynanır.</li>
<li><b>Tepki</b> kartları gerektiğinde sana sorulur. <b>İtiraz</b> sana oynanan kartı iptal eder; itiraza karşı da itiraz edilir!</li>
<li>Elinde en fazla 6 kart tutabilirsin.</li>
</ul>
<h3>3 turda bir Gündem</h3>
<p>1., 4., 7., 10. ve 13. turun başında bir haber kartı açılır: enflasyon, imar affı, turizm sezonu, deprem yönetmeliği... Para ve kat etkileri hemen bir kez uygulanır; "Bu dönem" diye başlayan kurallar gündem değişene kadar, 3 tur boyunca geçerlidir. Üstteki gündem çubuğu kaç tur kaldığını gösterir. <b>Endeks</b> yükseldikçe fiyat ve kiralar artar, nakit erir.</p>
<h3>Borç ve Konkordato</h3>
<p>Para eksiye düşebilir; sıranı bitirmeden kat satıp ipotek ederek borcunu kapatmalısın ("Borcu Kapat" bunu otomatik yapar). Satacak bir şeyin kalmazsa konkordato ilan edersin: borcun silinir, oyunda kalırsın, sonda 300 puan ceza.</p>
<p><b>Son kalan (iflas) modu:</b> konkordato yoktur; borcunu kapatamayan iflas eder, mülkleri bankaya döner ve oyundan çıkar. Tek oyuncu kalınca o kazanır. Oyun uzamasın diye kiralar her tur artar (10. turda 4,6 kat); en geç 40. turda ayakta kalanlardan puanı en yüksek olan kazanır.</p>
<h3>Masa ayarları</h3>
<p>Ev sahibi lobide açık artırmayı, SÜRPRİZ karelerini ve gündem kartlarını açıp kapatabilir; oyunun hızını da seçer. Açık artırma kapalıysa alınmayan arsa sahipsiz kalır.</p>
<p><b>Bot seviyesi:</b> Kolay botlar pazarlık yapmaz ve sık unutur; Zor botlar eksik parçayı pazarlıkla toplar, kaçak kata girmez.</p>
<h3>Tahtadaki işaretler</h3>
<ul>
<li><b>Karenin iç kenarındaki şerit</b>: gri ise sahipsiz, renkliyse o oyuncunun. Şeritte <b>★</b>: şehrin tamamı tek kişide (tam set), arsa kirası 2 katı.</li>
<li><b>Karenin çerçevesi ve buzlu cam rengi</b>: hangi şehre ait olduğu (aynı renkler aynı set).</li>
<li><b>🏠×N</b>: yasal kat sayısı. <b>🚧</b>: kaçak kat (İhbar, Zabıta ya da Belediye operasyonu yıkabilir). <b>🔒</b>: ipotekli, kira alınmaz. <b>⚖️</b>: ihtiyati tedbir, kira yok.</li>
<li><b>Altın halkalı taş</b>: sırası gelen oyuncu. <b>Yanıp sönen kare</b>: karar bekleyen kare.</li>
<li><b>Yeşil parlayan kart</b>: şu an oynanabilir; tahtaya sürükle ya da tıkla.</li>
<li>Oyuncu panelinde <b>📜 mülk</b>, <b>kart</b> sayısı ve <b>değer</b> (nakit + mülk + katlar) yazar. Simgelerin üzerine gelince açıklaması çıkar.</li>
</ul>
</div>`;
