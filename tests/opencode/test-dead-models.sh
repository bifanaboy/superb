#!/usr/bin/env bash
# Test: a failed model is skipped for the rest of the session
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Dead Model Tracking ==="

node "$SCRIPT_DIR/test-dead-models.mjs" "$SCRIPT_DIR/../../.opencode/plugins/superb.js"

echo "  [PASS] failed models are skipped for the session"
echo ""
echo "=== All dead model tests passed ==="
