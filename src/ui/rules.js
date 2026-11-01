// "Nasıl Oynanır?" penceresinin "Bütün kurallar" bölümü. Ayrıntılı kurallar docs/TASARIM.md'de.
import { ic } from './icons.js';

export const RULES_HTML = `
<div class="rules">
<p><b>Rantçı Dayı</b> bir emlak ve kart oyunu. Belirlenen tur sayısı dolunca ya da biri lobide seçilen <b>değer hedefine</b> ulaşıp o tur bitince <b>Seçim Günü</b> gelir; en yüksek puanı (nakit + mülkler + katlar) toplayan kazanır. "Son kalan" modunda batan elenir, son kalan kazanır.</p>
<h3>Sıran geldiğinde</h3>
<ul>
<li><b>Hamle kartı</b>, Başlangıç Noktası'ndan geçince (elinde 5'ten az kart varsa 1) ve Fırsat karesinde (2) gelir. Turda en fazla 1 Hamle kartı oynayabilirsin.</li>
<li><b>Zar at</b>, toplam kadar ilerle. <b>Çift</b> atarsan beklemeden bir daha atarsın (en fazla 2 kez). <b>Kestirme</b> kartın varsa zarlardan birini seçebilirsin.</li>
<li>Sahipsiz arsaya gelince <b>satın al</b> ya da <b>açık artırmaya</b> çıkar: sırayla herkes ya teklifi artırır ya çekilir, son kalan kazanır.</li>
<li>Başkasının mülküne gelince kira ödersin. <b>Dayın Çıktı</b> kartın varsa ödemezsin.</li>
<li>Kat dik, ipotek et, pazarlık teklif et, sonra <b>Turu Bitir</b>.</li>
<li>Pazarlık teklifini her an, sıran değilken de yapabilirsin. Masada başka bir karar bekleniyorsa teklifin sıraya girer, o karar bitince iletilir.</li>
</ul>
<h3>Kat ve kaçak kat</h3>
<ul>
<li><b>Yasal kat</b> için şehrin tüm mülkleri sende olmalı. Kat kirayı katlar (en fazla 4 seviye). Katlar eşit çıkar: önce her mülke 1'er, sonra 2'şer kat; bir mülke bir anda 4 kat dikilmez.</li>
<li><b>Kaçak kat</b> set istemez, yarı fiyatına; ama set tamamlanmadan katların kirası yarıdır. <b>İhbar</b> kartı, <b>Zabıta</b> karesi ya da <b>Belediye Operasyonu</b> yıkar. <b>İmar Affı</b> gelirse yasallaşır.</li>
</ul>
<h3>Gar, havalimanı ve Sürpriz</h3>
<ul>
<li>Tahtada 4 <b>havalimanı</b> var: sende olan her havalimanı kirayı <b>ikiye katlar</b> (25 / 50 / 100 / 200).</li>
<li>4 <b>gar</b> var: kira elindeki gar sayısıyla <b>orantılı</b> artar (30 / 60 / 90 / 120).</li>
<li><b>Sürpriz</b> karesine gelince 15 etkiden biri hemen uygulanır: miras, radar cezası, düğün takısı, ışınlanma, kapkaç, dededen kalma tarla...</li>
</ul>
<h3>Kartlar</h3>
<ul>
<li><b>Hamle</b> kartları (Kamulaştırma, İhtiyati Tedbir, Dava Aç, Taksi...) sıran sende iken oynanır.</li>
<li><b>Tepki</b> kartları gerektiğinde sana sorulur. <b>İtiraz</b> sana oynanan kartı iptal eder; itiraza karşı da itiraz edilir!</li>
<li>Elinde en fazla 6 kart tutabilirsin.</li>
</ul>
<h3>3 turda bir Gündem</h3>
<p>Her 3 turda bir (1., 4., 7. ... tur) bir haber kartı açılır: enflasyon, imar affı, turizm sezonu, deprem yönetmeliği... Para ve kat etkileri hemen bir kez uygulanır; "Bu dönem" diye başlayan kurallar gündem değişene kadar, 3 tur boyunca geçerlidir. Tahtanın ortasındaki gündem şeridi kaç tur kaldığını gösterir. <b>Endeks</b> yükseldikçe fiyat ve kiralar artar, nakit erir.</p>
<h3>Borç ve Konkordato</h3>
<p>Para eksiye düşebilir; sıranı bitirmeden kat satıp ipotek ederek ya da pazarlıkla mülk satarak borcunu kapatmalısın ("Borcu Kapat" bunu otomatik yapar). Satacak bir şeyin kalmazsa konkordato ilan edersin: borcun silinir, oyunda kalırsın, sonda 300 puan ceza.</p>
<p><b>Son kalan (iflas) modu:</b> konkordato yoktur; borcunu kapatamayan iflas eder, mülkleri bankaya döner ve oyundan çıkar. Tek oyuncu kalınca o kazanır. Oyun uzamasın diye kiralar her tur artar (10. turda 4,6 kat); en geç 40. turda ayakta kalanlardan puanı en yüksek olan kazanır.</p>
<h3>Masa ayarları</h3>
<p>Ev sahibi lobide açık artırmayı, Sürpriz karelerini ve gündem kartlarını açıp kapatabilir; oyunun hızını da seçer. Açık artırma kapalıysa alınmayan arsa sahipsiz kalır.</p>
<p><b>Bot seviyesi:</b> Kolay botlar pazarlık yapmaz ve sık unutur; Zor botlar eksik parçayı pazarlıkla toplar, kaçak kata girmez.</p>
<h3>Tahtadaki işaretler</h3>
<ul>
<li><b>Karenin iç kenarındaki şerit</b>: ince ve soluksa sahipsiz, kalın ve renkliyse o oyuncunun. ${ic('star')} şehrin tamamı tek kişide (tam set), arsa kirası 2 katı.</li>
<li><b>Karenin çerçevesi ve buzlu cam rengi</b>: hangi şehre ait olduğu (aynı renk aynı set).</li>
<li>${ic('house')}×N: yasal kat sayısı. ${ic('kacak')}: kaçak kat (İhbar, Zabıta ya da Belediye operasyonu yıkabilir). ${ic('ipotek')}: ipotekli, kira alınmaz. ${ic('tedbir')}: ihtiyati tedbir, kira yok.</li>
<li><b>Oyuncu renginde parlayan kare</b>: sırası gelen oyuncunun durduğu kare. <b>Altın parlayan kare</b>: karar bekleyen ya da seçilebilen kare.</li>
<li><b>Altın parlayan kart</b>: şu an oynanabilir; tahtaya sürükle ya da tıkla.</li>
<li>Oyuncuya tıklayınca nakdi, değeri, kart sayısı ve mülkleri görünür. Simgelerin üzerine gelince açıklaması çıkar.</li>
</ul>
</div>`;

// Mahalle'nin "Bütün kurallar" bölümü (kısa; ayrıntı docs/TASARIM.md §13).
export const MAHALLE_RULES_HTML = `
<div class="rules">
<p><b>Mahalle</b>da şehir yok: 6x6 adsız arsa var, her biri yeriyle anılır ("3. satır 5. sütun"). Tur dolunca ya da değer hedefine ulaşılınca <b>Seçim Günü</b> gelir; en yüksek puan (nakit + arsalar + katlar) kazanır.</p>
<h3>Sıran geldiğinde</h3>
<ul>
<li>Sıra başında bankadan <b>50 hakediş</b> gelir. Her 3 turda herkes 1 kart çeker; 10. ve 19. turda 1 torpil alırsın.</li>
<li>İki zar atılır. Çift değilse zarlar iki arsa gösterir (satır-sütun ya da sütun-satır); birini seçersin, piyon oraya zıplar, aradaki arsalar işlemez. <b>Çift</b> gelirse o numaralı satırda ya da sütunda istediğin arsayı seçersin; ek atış yok.</li>
<li><b>Torpil</b> zar atıldıktan sonra bir zarı 1 artırır ya da azaltır (turda 1 kez, en çok 2 jeton tutarsın).</li>
<li>Sahipsiz arsada: <b>satın al</b>, <b>ihaleye çıkar</b> ya da <b>gecekondu kondur</b>. Rakibin arsasında kira ödersin; boş arsanın da küçük kirası vardır.</li>
</ul>
<h3>İnşaat</h3>
<ul>
<li>Kat yalnız piyonunun durduğu arsada ve ona komşu kendi arsalarında dikilir. <b>Yasal kat</b> için arsanın komşularından biri de senin olmalı (en fazla 4 kat).</li>
<li><b>Kaçak kat</b> komşu istemez, yarı fiyatına, arsa başına 1. İhbar ve Belediye Operasyonu yıkar, İmar Affı yasallaştırır.</li>
</ul>
<h3>Yapılar ve komşuluk</h3>
<ul>
<li><b>Site:</b> 2x2 bloğun dört arsası da senin ve hepsinde kat var: kiraları x2. <b>Blok:</b> iki komşun da senin: arsanın kirası +%25.</li>
<li><b>Park:</b> kendi boş arsana. Park kira almaz, dört komşusunun kirasını +%50 yapar (kimin olursa olsun).</li>
<li><b>AVM:</b> 4 katlı arsan AVM olur. Çevresindeki 8 arsada ödenen her kiranın %20'si AVM sahibine gider.</li>
<li><b>Gecekondu:</b> sahipsiz arsaya kondurulur, arsa sahipsiz kalır. Konduran her sıra başı 10 alır, komşu arsaların kirası -%25 olur. Arsayı alan, kondurana tahliye bedeli (kondurma bedelinin 2 katı) öder. Oyuncu başına en çok 3.</li>
</ul>
<h3>Kartlar ve gündem</h3>
<p>Kartlar ve gündem klasikteki gibi; arsaya bağlı olanlar uyarlanır (Taksi satırda ya da sütunda gider, Kamulaştırma siteye oynanmaz, İhbar ve Operasyon gecekonduyu da yıkar, Turizm Sezonu kıyı kiralarını artırır). Ulaşım ve Sürpriz yoktur.</p>
<h3>Borç ve Konkordato</h3>
<p>Klasikteki gibi: borcunu kat satarak, ipotekle ya da pazarlıkla kapatırsın; satacak bir şeyin kalmazsa konkordato ilan edersin, borç silinir, sonda 300 puan ceza.</p>
<h3>Arazideki işaretler</h3>
<ul>
<li>Arsanın iç kenarındaki şerit sahibini gösterir. Üstündeki bina kat sayısıdır (çirkin kat kaçaktır).</li>
<li>Arsaya tıklayınca hangi etkilerin kirasını değiştirdiği görünür.</li>
</ul>
</div>`;
