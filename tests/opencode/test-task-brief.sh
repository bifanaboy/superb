#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

cd "$T"
git init -q
mkdir -p docs
cat > docs/plan.md <<'EOF'
## Task 1: One

Do one.

## Task 2: Two

Do two.

#### Detail

Keep this.

## Notes

Do not include this.
EOF

brief=$(bash "$REPO/skills/subagent-driven-development/scripts/task-brief" docs/plan.md 2 \
  | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')

grep -q 'Do two' "$brief"
grep -q 'Keep this' "$brief"
if grep -q 'Do not include this' "$brief"; then
  echo "FAIL: the brief includes the trailing Notes section"
  cat "$brief"
  exit 1
fi

echo "task-brief trailing section passed"
