#!/bin/sh
# Dayı ve şehir videolarını Higgsfield ham dosyalarından küçültür: sh tools/giris_video.sh [ham klasörü]
# Ham: giris/senaryo-1..4.mp4 ve giris/sehir.mp4 (giriş ekranı), sonu/gurur|alkis|para|kayip.mp4 (oyun sonu).
# Ses atılır, düz çizgi film için x264 "animation" ayarı kullanılır. CRF 20 dayıda gözle fark edilmez (SSIM ~0,995);
# tuval 400 px olduğu için 480 px yeterli. Şehir kendi boyunda kalır.
set -e
SRC=${1:-tasks/gorsel-ham}
enc() { ffmpeg -v error -y -i "$1" -an -vf "$2" -c:v libx264 -preset veryslow -tune animation -crf "$3" -pix_fmt yuv420p -movflags +faststart "$4"; }
dayi() { enc "$1" scale=480:480:flags=lanczos 20 "$2"; }
for i in 1 2 3 4; do dayi "$SRC/giris/senaryo-$i.mp4" "assets/giris/dayi-$i.mp4"; done
enc "$SRC/giris/sehir.mp4" null 22 assets/giris/sehir.mp4
mkdir -p assets/sonu
for n in gurur alkis para kayip; do dayi "$SRC/sonu/$n.mp4" "assets/sonu/$n.mp4"; done
ls -l assets/giris assets/sonu
