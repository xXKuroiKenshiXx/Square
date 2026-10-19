#!/usr/bin/env bash
set -uo pipefail
APPIMAGE=/root/square-build/src-tauri/target/release/bundle/appimage/Square_0.1.0_amd64.AppImage
APPIMAGE_EXTRACT_AND_RUN=1 xvfb-run -a timeout 20s "$APPIMAGE" > /root/square-appimage-smoke.log 2>&1
RESULT=$?
cat /root/square-appimage-smoke.log
if [ "$RESULT" -eq 124 ]; then
  echo 'PASS: AppImage remained running during the startup check.'
  exit 0
fi
echo "AppImage exited with code $RESULT before the startup check completed."
exit 1
