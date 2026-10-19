#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPIMAGE="${SQUARE_APPIMAGE:-$ROOT/release/Square_0.2.0_amd64.AppImage}"
LOG=$(mktemp)
APPIMAGE_EXTRACT_AND_RUN=1 dbus-run-session -- xvfb-run -a timeout 20s "$APPIMAGE" > "$LOG" 2>&1
RESULT=$?
cat "$LOG"
rm -f "$LOG"
if [ "$RESULT" -eq 124 ]; then echo 'PASS: AppImage remained running during the startup check.'; exit 0; fi
echo "AppImage exited with code $RESULT before the startup check completed."
exit 1
