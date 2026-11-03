#!/usr/bin/env bash
# Test: caveman installer
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Caveman Installer ==="

node "$SCRIPT_DIR/test-caveman-installer.mjs"

echo "  [PASS] caveman installer"
echo ""
echo "=== All caveman installer tests passed ==="
