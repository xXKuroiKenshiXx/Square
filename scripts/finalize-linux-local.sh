#!/usr/bin/env bash
# Compatibility wrapper for the previous local build command.
set -euo pipefail
exec bash "$(dirname "$0")/build-linux-local.sh"
