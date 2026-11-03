#!/usr/bin/env bash
# Test: caveman registration
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Caveman Registration ==="

node "$SCRIPT_DIR/test-caveman-registration.mjs"

echo "  [PASS] caveman registration"
echo ""
echo "=== All caveman registration tests passed ==="
