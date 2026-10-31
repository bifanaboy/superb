#!/usr/bin/env bash
# Test: dispatching-parallel-agents write-surface contract
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Dispatch Write Surface ==="

node "$SCRIPT_DIR/test-dispatch-write-surface.mjs"

echo "  [PASS] Dispatch write-surface contract holds"
echo ""
echo "=== All dispatch write-surface tests passed ==="
