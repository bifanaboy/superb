#!/usr/bin/env bash
# Test: competing-hypotheses reference and Phase 1 link
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Competing Hypotheses ==="

node "$SCRIPT_DIR/test-competing-hypotheses.mjs"

echo "  [PASS] Competing-hypotheses contract holds"
echo ""
echo "=== All competing-hypotheses tests passed ==="
