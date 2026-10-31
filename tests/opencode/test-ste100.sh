#!/usr/bin/env bash
# Test: root prose uses Simplified Technical English
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Simplified Technical English Contract ==="

node "$SCRIPT_DIR/test-ste100.mjs"

echo "  [PASS] root prose follows ASD-STE100"
echo ""
echo "=== All STE100 tests passed ==="
