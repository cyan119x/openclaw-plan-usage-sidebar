#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR=${1:?Usage: build-control-ui.sh <patched-openclaw-source-dir>}
[[ -f "$SOURCE_DIR/package.json" ]] || { echo "OpenClaw package.json not found: $SOURCE_DIR" >&2; exit 1; }

(
  cd "$SOURCE_DIR"
  corepack pnpm exec vitest run \
    ui/src/lib/provider-quota-summary.test.ts \
    ui/src/components/app-sidebar.test.ts \
    ui/src/components/provider-quota-card.test.ts \
    ui/src/components/sidebar-plan-usage.test.ts \
    ui/src/pages/chat/chat-composer-context.test.ts
  corepack pnpm tsgo:ui
  corepack pnpm ui:build
  git diff --check
)

echo "Built Control UI: $SOURCE_DIR/dist/control-ui"
