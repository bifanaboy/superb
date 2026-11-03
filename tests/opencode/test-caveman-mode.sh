#!/usr/bin/env bash
# Test: caveman mode helpers
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Caveman Mode ==="

node "$SCRIPT_DIR/test-caveman-mode.mjs"

echo "  [PASS] caveman mode"
echo ""
echo "=== All caveman mode tests passed ==="
