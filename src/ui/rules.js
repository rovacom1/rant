// "Nasıl Oynanır?" penceresi. Ayrıntılı kurallar docs/TASARIM.md'de.
export const RULES_HTML = `
<div class="rules">
<p><b>RANT</b> bir emlak ve kart oyunu. 15 tur sonra <b>Seçim Günü</b> gelir; en yüksek puanı (nakit + mülkler + katlar + gizli hedef bonusu) toplayan kazanır. Kimse batıp oyundan çıkmaz.</p>
<h3>Sıran geldiğinde</h3>
<ul>
<li>Otomatik 1 <b>Hamle kartı</b> çekersin. Turda en fazla 1 Hamle kartı oynayabilirsin.</li>
<li><b>Zar at</b>, toplam kadar ilerle. Çift atarsan +1 kart. <b>Kestirme</b> kartın varsa zarlardan birini seçebilirsin.</li>
<li>Sahipsiz arsaya gelince <b>satın al</b> ya da <b>gizli ihaleye</b> çıkar: herkes aynı anda gizli teklif verir, en yüksek kazanır.</li>
<li>Başkasının mülküne gelince kira ödersin. <b>Dayın Çıktı</b> kartın varsa ödemezsin.</li>
<li>Kat dik, ipotek et, pazarlık teklif et, sonra <b>Turu Bitir</b>.</li>
</ul>
<h3>Kat ve kaçak kat</h3>
<ul>
<li><b>Yasal kat</b> için şehrin tüm mülkleri sende olmalı. Kat kirayı katlar (en fazla 4 seviye).</li>
<li><b>Kaçak kat</b> set istemez, yarı fiyatına. Ama <b>İhbar</b> kartı, <b>Zabıta</b> karesi ya da <b>Belediye Operasyonu</b> yıkar. <b>İmar Affı</b> gelirse yasallaşır.</li>
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
<h3>Her tur bir Gündem</h3>
<p>Tur başında bir haber kartı açılır: enflasyon, imar affı, turizm sezonu, deprem yönetmeliği... <b>Endeks</b> yükseldikçe fiyat ve kiralar artar, nakit erir.</p>
<h3>Borç ve Konkordato</h3>
<p>Para eksiye düşebilir; sıranı bitirmeden kat satıp ipotek ederek borcunu kapatmalısın ("Borcu Kapat" bunu otomatik yapar). Satacak bir şeyin kalmazsa konkordato ilan edersin: borcun silinir, oyunda kalırsın, sonda 300 puan ceza.</p>
<h3>Gizli hedef</h3>
<p>Başta iki hedef kartından birini seçersin (ör. "Konya Hakimi", "Kaçak Ama Sağlam"). Kimse göremez; oyun sonunda tutarsa bonus alırsın.</p>
</div>`;
