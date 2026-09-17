#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR=${1:?Usage: publish-custom-root.sh <dist-control-ui-dir> <custom-root-dir>}
CUSTOM_ROOT=${2:?Usage: publish-custom-root.sh <dist-control-ui-dir> <custom-root-dir>}

[[ -f "$BUILD_DIR/index.html" ]] || { echo "Control UI build not found: $BUILD_DIR" >&2; exit 1; }
mkdir -p "$CUSTOM_ROOT"
rsync -a --delete "$BUILD_DIR/" "$CUSTOM_ROOT/"
printf 'Published custom Control UI root: %s\n' "$CUSTOM_ROOT"
printf 'Next: review gateway.controlUi.root, restart the Gateway, and hard-reload the Control UI.\n'
