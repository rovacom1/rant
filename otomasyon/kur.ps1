# RANT yerel kurulumu: simge ve masaüstü klasörü.
# Çalıştırma: powershell -ExecutionPolicy Bypass -File C:\Dev\Rant\otomasyon\kur.ps1
$ErrorActionPreference = 'Stop'
$repo = 'C:\Dev\Rant'
$oto = Join-Path $repo 'otomasyon'
$desk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'RANT'

# 1) Simge: mercan kare üstünde krem "R" (PNG gömülü ICO)
Add-Type -AssemblyName System.Drawing
$ico = Join-Path $oto 'rant.ico'
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 56; $path.AddArc(0, 0, $r, $r, 180, 90); $path.AddArc(256 - $r, 0, $r, $r, 270, 90); $path.AddArc(256 - $r, 256 - $r, $r, $r, 0, 90); $path.AddArc(0, 256 - $r, $r, $r, 90, 90); $path.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(209, 73, 91))), $path)
$font = New-Object System.Drawing.Font('Arial Black', 150, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
$g.DrawString('R', $font, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 240))), (New-Object System.Drawing.RectangleF 0, 8, 256, 256), $fmt)
$g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(237, 174, 73))), 186, 30, 36, 36)
$ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $png = $ms.ToArray()
$fs = [System.IO.File]::Create($ico); $bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)
$bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([uint16]1); $bw.Write([uint16]32); $bw.Write([uint32]$png.Length); $bw.Write([uint32]22)
$bw.Write($png); $bw.Close(); $g.Dispose(); $bmp.Dispose()

# 2) Masaüstü klasörü
New-Item -ItemType Directory -Force $desk | Out-Null
function UrlShortcut($name, $url) {
  $lines = @('[InternetShortcut]', "URL=$url", "IconFile=$ico", 'IconIndex=0')
  [System.IO.File]::WriteAllLines((Join-Path $desk "$name.url"), $lines, (New-Object System.Text.UTF8Encoding $false))
}
UrlShortcut 'RANT - Oyna' 'https://rovacom1.github.io/rant/'
UrlShortcut 'GitHub Deposu' 'https://github.com/rovacom1/rant'
UrlShortcut 'Yol Haritası' 'https://github.com/rovacom1/rant/blob/main/ROADMAP.md'
UrlShortcut 'Geliştirme Günlüğü' 'https://github.com/rovacom1/rant/blob/main/GELISTIRME_GUNLUGU.md'
$sh = New-Object -ComObject WScript.Shell
$l = $sh.CreateShortcut((Join-Path $desk 'Kaynak Kod.lnk')); $l.TargetPath = $repo; $l.IconLocation = "$ico,0"; $l.Save()
Copy-Item (Join-Path $oto 'BENI_OKU.txt') (Join-Path $desk 'BENİ OKU.txt') -Force

'Kurulum tamam.'
