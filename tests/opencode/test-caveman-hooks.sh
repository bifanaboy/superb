#!/usr/bin/env bash
# Test: caveman hooks
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Caveman Hooks ==="

node "$SCRIPT_DIR/test-caveman-hooks.mjs"

echo "  [PASS] caveman hooks"
echo ""
echo "=== All caveman hooks tests passed ==="
