#!/usr/bin/env bash
# Test: review dispatch contract
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Review Dispatch ==="

node "$SCRIPT_DIR/test-review-dispatch.mjs"

echo "  [PASS] review dispatch"
echo ""
echo "=== All review dispatch tests passed ==="
