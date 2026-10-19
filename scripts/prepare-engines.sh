#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p src-tauri/engines
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
curl -fL https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o "$WORK/ffmpeg.tar.xz"
tar -xJf "$WORK/ffmpeg.tar.xz" -C "$WORK"
cp "$WORK"/ffmpeg-*-linux64-gpl/bin/ffmpeg src-tauri/engines/ffmpeg.bin
curl -fL https://api.github.com/repos/jgm/pandoc/releases/latest -o "$WORK/release.json"
PANDOC_URL=$(python3 -c 'import json,sys; print(next(a["browser_download_url"] for a in json.load(open(sys.argv[1]))["assets"] if a["name"].endswith("linux-amd64.tar.gz")))' "$WORK/release.json")
curl -fL "$PANDOC_URL" -o "$WORK/pandoc.tar.gz"
tar -xzf "$WORK/pandoc.tar.gz" -C "$WORK"
cp "$WORK"/pandoc-*/bin/pandoc src-tauri/engines/pandoc.bin
