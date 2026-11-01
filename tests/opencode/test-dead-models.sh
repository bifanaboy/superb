#!/usr/bin/env bash
# Test: a failed subagent dispatch does not inject MODEL SKIP
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Dead Model Tracking ==="

node "$SCRIPT_DIR/test-dead-models.mjs" "$SCRIPT_DIR/../../src/superb.js"

echo "  [PASS] no MODEL SKIP is injected"
echo ""
echo "=== All dead model tests passed ==="
