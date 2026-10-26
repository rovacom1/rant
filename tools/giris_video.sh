#!/bin/sh
# Giriş ekranı videolarını Higgsfield ham dosyalarından küçültür: sh tools/giris_video.sh [ham klasörü]
# Ham: senaryo-1..4.mp4 (dayı, 940x940) ve sehir.mp4. Ses atılır, düz çizgi film için x264 "animation" ayarı kullanılır.
# CRF 20 dayıda gözle fark edilmez (SSIM ~0,995); tuval 400 px olduğu için 480 px yeterli. Şehir kendi boyunda kalır.
set -e
SRC=${1:-tasks/gorsel-ham/giris}
OUT=assets/giris
enc() { ffmpeg -v error -y -i "$1" -an -vf "$2" -c:v libx264 -preset veryslow -tune animation -crf "$3" -pix_fmt yuv420p -movflags +faststart "$4"; }
for i in 1 2 3 4; do enc "$SRC/senaryo-$i.mp4" scale=480:480:flags=lanczos 20 "$OUT/dayi-$i.mp4"; done
enc "$SRC/sehir.mp4" null 22 "$OUT/sehir.mp4"
ls -l "$OUT"
