#!/usr/bin/env bash
# Test: observability-evidence reference, Phase 1 link, and instrumentation sites
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Observability Evidence ==="

node "$SCRIPT_DIR/test-observability-evidence.mjs"

echo "  [PASS] Observability-evidence contract holds"
echo ""
echo "=== All observability-evidence tests passed ==="
