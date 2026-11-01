#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Test: No Model Policy ==="
node "$SCRIPT_DIR/test-no-model-policy.mjs"
echo ""
echo "=== All no-model-policy tests passed ==="
