#!/usr/bin/env bash
# Test: the repository has no old plugin-name references
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Build the old name from two parts so this file does not match itself.
old_name="super""powers"

echo "=== Test: Old plugin name is gone ==="

cd "$REPO_ROOT"

matches="$(git grep -I -i -n -e "$old_name" -- . || true)"
if [ -n "$matches" ]; then
    echo "  [FAIL] Found the old plugin name in tracked files:"
    echo "$matches" | sed 's/^/    /'
    exit 1
fi

echo "  [PASS] No tracked text file contains the old plugin name"
echo ""
echo "=== Old plugin name check passed ==="
