#!/bin/sh
# Dayı ve şehir videolarını Higgsfield ham dosyalarından hazırlar: sh tools/giris_video.sh [ham klasörü]
# Ham: giris/senaryo-1..4.mp4 ve giris/sehir.mp4 (giriş ekranı), sonu/gurur|alkis|para|kayip.mp4 (oyun sonu).
# Dayılar tools/dayi_video.js ile saydamlık maskesi altta, 640 px olur. Şehir kendi boyunda kalır; ses atılır,
# düz çizgi film için x264 "animation" ayarı kullanılır. ffmpeg gerekir (PATH'te ya da FFMPEG ortam değişkeninde).
set -e
SRC=${1:-tasks/gorsel-ham}
FF=${FFMPEG:-ffmpeg}
"$FF" -v error -y -i "$SRC/giris/sehir.mp4" -an -c:v libx264 -preset veryslow -tune animation -crf 22 -pix_fmt yuv420p -movflags +faststart assets/giris/sehir.mp4
mkdir -p assets/sonu
node tools/dayi_video.js "$SRC"
ls -l assets/giris assets/sonu
