#!/usr/bin/env bash
# Test: brainstorming handoff offers implement or file-spec
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Brainstorming Handoff ==="

node "$SCRIPT_DIR/test-handoff-choice.mjs"

echo "  [PASS] Brainstorming handoff contract holds"
echo ""
echo "=== All brainstorming handoff tests passed ==="
