#!/usr/bin/env bash
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
BUILD=/root/square-build
mkdir -p "$BUILD"
tar -C "$SOURCE" --exclude=node_modules --exclude=src-tauri/target --exclude=src-tauri/engines --exclude=.git --exclude=release -cf - . | tar -C "$BUILD" -xf -
apt-get update -qq
apt-get install -y -qq libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf curl xz-utils
cd "$BUILD"
mkdir -p src-tauri/engines /tmp/square-linux-engines
curl -fL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o /tmp/square-linux-engines/node-sha.txt
NODE_ARCHIVE=$(awk '/linux-x64.tar.xz$/ {print $2}' /tmp/square-linux-engines/node-sha.txt)
curl -fL "https://nodejs.org/dist/latest-v22.x/$NODE_ARCHIVE" -o "/tmp/square-linux-engines/$NODE_ARCHIVE"
(cd /tmp/square-linux-engines; grep " $NODE_ARCHIVE\$" node-sha.txt | sha256sum -c -)
tar -xJf "/tmp/square-linux-engines/$NODE_ARCHIVE" -C /tmp/square-linux-engines
export PATH="/tmp/square-linux-engines/${NODE_ARCHIVE%.tar.xz}/bin:/root/.cargo/bin:$PATH"
curl -fL https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o /tmp/square-linux-engines/ffmpeg.tar.xz
tar -xJf /tmp/square-linux-engines/ffmpeg.tar.xz -C /tmp/square-linux-engines
cp /tmp/square-linux-engines/ffmpeg-*-linux64-gpl/bin/ffmpeg src-tauri/engines/ffmpeg.bin
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/3.12.1/pandoc-3.12.1-linux-amd64.tar.gz
curl -fL "$PANDOC_URL" -o /tmp/square-linux-engines/pandoc.tar.gz
tar -xzf /tmp/square-linux-engines/pandoc.tar.gz -C /tmp/square-linux-engines
cp /tmp/square-linux-engines/pandoc-*/bin/pandoc src-tauri/engines/pandoc.bin
export PATH=/root/.cargo/bin:$PATH
npm ci
cargo test --manifest-path src-tauri/Cargo.toml
APPIMAGE_EXTRACT_AND_RUN=1 npm run tauri build -- --bundles appimage
mkdir -p "$SOURCE/release"
cp src-tauri/target/release/bundle/appimage/*.AppImage "$SOURCE/release/"
