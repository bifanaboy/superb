#!/usr/bin/env bash
# Test: fixed-choice questions go through the harness question tool
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Question Tool Contract ==="

node "$SCRIPT_DIR/test-question-tool.mjs"

echo "  [PASS] root agents route fixed-choice questions through the question tool"
echo ""
echo "=== All question tool tests passed ==="
