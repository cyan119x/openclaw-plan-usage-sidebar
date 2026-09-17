#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR=${1:?Usage: apply-patch.sh <openclaw-source-dir> <patch-repo-dir>}
PATCH_REPO=${2:?Usage: apply-patch.sh <openclaw-source-dir> <patch-repo-dir>}
EXPECTED_COMMIT=1391f7cd2d40ab5bbcf2f5f831d3a64f520e72d7
PATCH_FILE="$PATCH_REPO/patches/openclaw-v2026.9.3.patch"

[[ -e "$SOURCE_DIR/.git" ]] || { echo "OpenClaw source checkout not found: $SOURCE_DIR" >&2; exit 1; }
[[ -f "$PATCH_FILE" ]] || { echo "Patch file not found: $PATCH_FILE" >&2; exit 1; }

ACTUAL_COMMIT=$(git -C "$SOURCE_DIR" rev-parse HEAD)
[[ "$ACTUAL_COMMIT" == "$EXPECTED_COMMIT" ]] || {
  echo "Expected OpenClaw $EXPECTED_COMMIT; found $ACTUAL_COMMIT. Refusing to apply." >&2
  exit 1
}

git -C "$SOURCE_DIR" apply --check "$PATCH_FILE"
git -C "$SOURCE_DIR" apply "$PATCH_FILE"
echo "Applied Plan Usage Sidebar patch to $SOURCE_DIR"
