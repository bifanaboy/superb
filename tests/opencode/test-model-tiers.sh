#!/usr/bin/env bash
# Test: model role contract (fast/smart, paid/cheap/free)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Model Role Contract ==="

node "$SCRIPT_DIR/test-model-tiers.mjs"

echo "  [PASS] Model role contract holds across the setup skill and dispatch skills"
echo ""
echo "=== All model role tests passed ==="
