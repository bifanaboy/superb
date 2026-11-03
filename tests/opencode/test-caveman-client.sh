#!/usr/bin/env bash
# Test: caveman CLI client
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Caveman Client ==="

node "$SCRIPT_DIR/test-caveman-client.mjs"

echo "  [PASS] caveman client"
echo ""
echo "=== All caveman client tests passed ==="
