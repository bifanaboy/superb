#!/usr/bin/env bash
# Test: the builder check also critiques the design's shape
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Builder Check Shape Critique ==="

node "$SCRIPT_DIR/test-builder-check.mjs"

echo "  [PASS] builder check critiques the design's shape"
echo ""
echo "=== All builder check tests passed ==="
