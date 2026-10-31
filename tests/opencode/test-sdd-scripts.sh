#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

cd "$T"
git init -q
git config user.email test@example.com
git config user.name test

SDD="$REPO/skills/subagent-driven-development/scripts"
TASK_DONE="$REPO/skills/executing-plans/scripts/task-done"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

# Test 1: two plans with the same basename get different workspaces.
mkdir -p docs/alpha docs/beta
printf '## Task 1: alpha\n' > docs/alpha/plan.md
printf '## Task 1: beta\n' > docs/beta/plan.md

a=$(bash "$SDD/sdd-workspace" docs/alpha/plan.md)
b=$(bash "$SDD/sdd-workspace" docs/beta/plan.md)
[ "$a" != "$b" ] || fail "workspace paths collide: $a"
[ "$(cat "$a/plan-path")" = "docs/alpha/plan.md" ] || fail "alpha workspace marker"
[ "$(cat "$b/plan-path")" = "docs/beta/plan.md" ] || fail "beta workspace marker"
grep -q '^\*$' .superb/sdd/.gitignore || fail "self-ignoring .gitignore"

# Test 2: task-done records a pass and records nothing on a failure.
cat > docs/plan.md <<'EOF'
## Task 1: one

## Task 2: two
EOF
git add -A
git commit -qm base
base=$(git rev-parse HEAD)

bash "$TASK_DONE" docs/plan.md 1 "$base" -- bash -c 'echo ok' >/dev/null
ledger="$(bash "$SDD/sdd-workspace" docs/plan.md)/progress.md"
grep -q 'Task 1: complete' "$ledger" || fail "passing task not recorded"

set +e
bash "$TASK_DONE" docs/plan.md 2 "$base" -- bash -c 'exit 1' >/dev/null 2>&1
code=$?
set -e
[ "$code" -eq 1 ] || fail "failing task exited $code, expected 1"
if grep -q 'Task 2' "$ledger"; then fail "failing task recorded"; fi

# Test 3: review-package writes the commit list and guards the range.
echo one > one.txt
git add -A
git commit -qm 'first change'
base=$(git rev-parse HEAD)
echo two > two.txt
git add -A
git commit -qm 'second change'

out=$(bash "$SDD/review-package" docs/plan.md "$base" HEAD)
file=$(printf '%s\n' "$out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* commit(s), .*$/\1/p')
[ -n "$file" ] || fail "review-package did not print a file path: $out"
grep -q '## Commits' "$file" || fail "review package missing commit list"
grep -q 'second change' "$file" || fail "review package missing second commit"

set +e
bash "$SDD/review-package" docs/plan.md HEAD HEAD >/dev/null 2>&1
code=$?
set -e
[ "$code" -eq 3 ] || fail "empty range exited $code, expected 3"

echo "SDD scripts passed"
