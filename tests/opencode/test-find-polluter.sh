#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

cd "$T"
git init -q
mkdir -p src .pollution
: > src/a.test.ts
: > src/b.test.ts
: > .pollution/file

set +e
output=$(bash "$REPO/skills/systematic-debugging/find-polluter.sh" '.pollution/file' 'src/**/*.test.ts' 2>&1)
code=$?
set -e

if [ "$code" -ne 2 ]; then
  echo "FAIL: expected exit 2, got $code"
  echo "$output"
  exit 1
fi
if ! grep -q 'Pollution already exists' <<<"$output"; then
  echo "FAIL: expected a clear pre-existing pollution message"
  echo "$output"
  exit 1
fi
if grep -q 'No polluter found' <<<"$output"; then
  echo "FAIL: the script must not report a clean result"
  echo "$output"
  exit 1
fi

echo "find-polluter pre-existing pollution passed"
