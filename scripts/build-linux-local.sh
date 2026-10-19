#!/usr/bin/env bash
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="${SQUARE_LINUX_BUILD_DIR:-$HOME/.cache/square-build}"
mkdir -p "$BUILD"
if [ -n "${SQUARE_NODE_BIN:-}" ]; then export PATH="$SQUARE_NODE_BIN:$PATH"; fi
command -v node >/dev/null || { echo 'Install Node.js 22+ or set SQUARE_NODE_BIN.' >&2; exit 1; }
command -v cargo >/dev/null || { echo 'Install Rust and add cargo to PATH.' >&2; exit 1; }
tar -C "$SOURCE" --exclude=node_modules --exclude=dist --exclude=src-tauri/target --exclude=src-tauri/engines --exclude=.git --exclude=release --exclude=docs/demo.mp4 --exclude=docs/demo.webp -cf - . | tar -C "$BUILD" -xf -
cd "$BUILD"
if [ ! -s src-tauri/engines/ffmpeg.bin ] || [ ! -s src-tauri/engines/pandoc.bin ]; then bash scripts/prepare-engines.sh; fi
npm ci
cargo test --manifest-path src-tauri/Cargo.toml --bin square
APPIMAGE_EXTRACT_AND_RUN=1 npm run tauri build -- --bundles appimage
mkdir -p "$SOURCE/release"
cp src-tauri/target/release/bundle/appimage/*.AppImage "$SOURCE/release/"
