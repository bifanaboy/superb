#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

if [ -d skills/using-superb/references ]; then
  echo "FAIL: per-CLI reference directory still exists"
  exit 1
fi

names='Claude Code|Codex|Gemini CLI|Copilot CLI|Cursor|Antigravity|Hermes Agent|Muse'
paths='CLAUDE\.md|CLAUDE_MD_TESTING|GEMINI\.md|~/\.claude|~/\.codex|~/\.gemini|CODEX_CI|\.codex-plugin|codex-tools\.md|gemini-tools\.md|EnterWorktree'

set +e
matches=$(git grep -I -n -E "$names|$paths" -- README.md .opencode skills src index.js package.json)
code=$?
set -e

if [ "$code" -eq 1 ]; then
  echo "OpenCode-only guard passed"
  exit 0
fi
if [ "$code" -ne 0 ]; then
  echo "FAIL: git grep exited $code"
  exit 1
fi

echo "$matches"
echo "FAIL: a shipped file names another CLI"
exit 1
