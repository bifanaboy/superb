#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node test-ui-skills.mjs
node test-ui-fixtures.mjs
