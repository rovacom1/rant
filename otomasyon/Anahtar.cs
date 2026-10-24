// Masaüstündeki "Otomatik Geliştirme Aç-Kapat" düğmesi.
// otomasyon\DURDUR dosyası varken zamanlanmış geliştirme oturumu hiçbir şey yapmadan çıkar.
// Derleme: otomasyon\kur.ps1
using System;
using System.IO;
using System.Windows.Forms;

class Anahtar
{
    [STAThread]
    static void Main()
    {
        string dosya = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "DURDUR");
        bool durmus = File.Exists(dosya);
        string soru = durmus
            ? "Otomatik geliştirme şu an DURDURULMUŞ.\n\nYeniden başlatılsın mı?"
            : "Otomatik geliştirme şu an AÇIK.\nClaude uygulaması açıkken oyunu düzenli aralıklarla geliştiriyor ve GitHub'a yayınlıyor.\n\nDurdurulsun mu?";
        if (MessageBox.Show(soru, "RANT - Otomatik Geliştirme", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        if (durmus) File.Delete(dosya);
        else File.WriteAllText(dosya, "Bu dosya varken otomatik gelistirme calismaz. Olusturma: " + DateTime.Now);
        MessageBox.Show(durmus ? "Otomatik geliştirme yeniden AÇILDI." : "Otomatik geliştirme DURDURULDU.", "RANT", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
}
