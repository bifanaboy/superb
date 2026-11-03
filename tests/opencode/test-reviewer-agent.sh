#!/usr/bin/env bash
# Test: review and cavecrew agent definitions
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Reviewer Agents ==="

node "$SCRIPT_DIR/test-reviewer-agent.mjs"

echo "  [PASS] agent definitions"
echo ""
echo "=== All reviewer agent tests passed ==="
