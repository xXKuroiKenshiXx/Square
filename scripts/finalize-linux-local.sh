#!/usr/bin/env bash
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
BUILD=/root/square-build
DOWNLOADS=/root/square-downloads
mkdir -p "$DOWNLOADS"
cd "$BUILD"
cp "$SOURCE"/src/main.tsx "$SOURCE"/src/style.css src/
cp "$SOURCE"/src-tauri/src/main.rs src-tauri/src/
cp "$SOURCE"/src-tauri/tauri.conf.json src-tauri/
tar -xJf "$DOWNLOADS/ffmpeg.tar.xz" -C "$DOWNLOADS"
cp "$DOWNLOADS"/ffmpeg-*-linux64-gpl/bin/ffmpeg src-tauri/engines/ffmpeg.bin
if [ ! -x "$DOWNLOADS/node-v22.23.3-linux-x64/bin/node" ]; then
  curl -fL https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-x64.tar.xz -o "$DOWNLOADS/node.tar.xz"
  tar -xJf "$DOWNLOADS/node.tar.xz" -C "$DOWNLOADS"
fi
export PATH="$DOWNLOADS/node-v22.23.3-linux-x64/bin:/root/.cargo/bin:$PATH"
cargo test --manifest-path src-tauri/Cargo.toml
APPIMAGE_EXTRACT_AND_RUN=1 npm run tauri build -- --bundles appimage
mkdir -p "$SOURCE/release"
cp src-tauri/target/release/bundle/appimage/*.AppImage "$SOURCE/release/"
