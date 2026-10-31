#!/usr/bin/env bash
# Test: the finish menu is the gate before any pull request
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: PR Gate Contract ==="

node "$SCRIPT_DIR/test-pr-gate.mjs"

echo "  [PASS] PR gate contract holds across the finishing skill and both flows"
echo ""
echo "=== All PR gate tests passed ==="
