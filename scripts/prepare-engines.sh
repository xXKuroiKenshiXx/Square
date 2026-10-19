#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p src-tauri/engines
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
curl -fL https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o "$WORK/ffmpeg.tar.xz"
tar -xJf "$WORK/ffmpeg.tar.xz" -C "$WORK"
cp "$WORK"/ffmpeg-*-linux64-gpl/bin/ffmpeg src-tauri/engines/ffmpeg.bin
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/3.12.1/pandoc-3.12.1-linux-amd64.tar.gz
curl -fL "$PANDOC_URL" -o "$WORK/pandoc.tar.gz"
tar -xzf "$WORK/pandoc.tar.gz" -C "$WORK"
cp "$WORK"/pandoc-*/bin/pandoc src-tauri/engines/pandoc.bin
