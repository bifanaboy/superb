#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
script="$REPO/skills/brainstorming/scripts/start-server.sh"

if grep -q 'Kill any existing server' "$script"; then
  echo "FAIL: the dead kill block comment is still present"
  exit 1
fi
if grep -q 'old_pid' "$script"; then
  echo "FAIL: the dead kill block is still present"
  exit 1
fi

bash -n "$script"
echo "start-server dead block check passed"
