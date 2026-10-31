#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

if [ -e hooks/hooks.json ] || [ -e hooks/session-start ]; then
  echo "FAIL: orphaned hook files still exist"
  exit 1
fi
if grep -q 'hooks/session-start' .gitattributes; then
  echo "FAIL: .gitattributes still names the deleted hook"
  exit 1
fi
if grep -q '^\*\.cmd' .gitattributes; then
  echo "FAIL: .gitattributes still has the deleted cmd rule"
  exit 1
fi

echo "orphan hook check passed"
