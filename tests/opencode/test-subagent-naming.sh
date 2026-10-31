#!/usr/bin/env bash
# Test: subagent descriptions name the role and task
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Subagent Naming Contract ==="

node "$SCRIPT_DIR/test-subagent-naming.mjs"

echo "  [PASS] subagent descriptions name the role and task"
echo ""
echo "=== All subagent naming tests passed ==="
