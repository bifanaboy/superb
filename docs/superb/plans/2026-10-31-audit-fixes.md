# Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superb:subagent-driven-development (recommended) or superb:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 12 findings from the 2026-10-31 audit. Each code change gets a test or a static guard that fails before the change.

**Architecture:** Small, independent patches. Each task touches one file group and has its own test. The plugin keeps its `{ id, setup }` export. The companion server keeps its current auth behavior. The plan deletes the orphaned hook files, removes every other-CLI reference from the shipped files, and adds guards against the same drift.

**Tech Stack:** Node.js (ESM for tests, CommonJS for the server), bash, git. No new dependencies.

**Spec:** The audit report from the 2026-10-31 audit, findings 1-12. This plan repeats each finding's location and fix.

## Finding Map

| Audit finding | Plan task |
|---|---|
| 1. WebSocket scheme | Task 2 |
| 2. Integration title assertion | Task 9 |
| 3. Dead-model false positive | Task 1 |
| 4. Finish skill contradiction | Task 7 |
| 5. Orphaned hooks | Task 8 |
| 6. No server tests | Task 3 |
| 7. `find-polluter` false clean | Task 4 |
| 8. `task-brief` trailing sections | Task 5 |
| 9. No SDD script tests | Task 6 |
| 10. `timeout` portability | Task 9 |
| 11. Other-CLI references | Task 10 |
| 12. Dead start-server kill block | Task 11 |

## Global Constraints

- Add no runtime dependencies. Tests use Node built-ins and bash only.
- Keep the plugin default export `{ id, setup }`.
- Do not change the companion server's auth rules in this plan. Task 3 adds tests only.
- Superb targets OpenCode 2 only. Shipped files must not name another CLI.
- Keep the tool mapping, the install docs, and skill text unchanged outside the listed lines.
- Every new test runs from `tests/opencode/run-tests.sh` without OpenCode.
- Use `git commit` after each task.

## Review Focus

These inputs are likely to bite a user. Each one has a test in the named task.

- **An HTTPS page:** the companion must choose `wss://`. Task 2 test.
- **A task failure that mentions a provider word:** it must not kill the model. Task 1 test.
- **A trailing `##` section after the last task:** it must not enter the brief. Task 5 test.
- **A pollution path that already exists:** the script must stop, not report clean. Task 4 test.
- **A request without the session key:** the server must return 403. Task 3 test.
- **A shipped file that names another CLI:** the guard test must fail. Task 10 test.

---

### Task 1: Keep task failures out of the dead-model list

**Files:**
- Modify: `.opencode/plugins/superb.js:171-188`
- Test: `tests/opencode/test-dead-models.mjs`

**Interfaces:**
- Consumes: `MODEL_ERROR_PATTERNS`, `_isModelError(message)`, `event.error.message`.
- Produces: no new names. The array keeps the same shape.

- [ ] **Step 1: Write the failing tests**

Add these cases to `tests/opencode/test-dead-models.mjs` before the final `console.log`:

```js
// 12. A task failure that mentions a provider word does not kill the model.
{
  const h = await makeHarness();
  await h.fail('model-a', 'tests failed: 401 Unauthorized');
  assert.deepEqual(await h.context(), [], 'a task failure is not a model failure');
}

// 13. A real rate-limit message still records the model.
{
  const h = await makeHarness();
  await h.fail('model-b', 'rate limit exceeded');
  assert.equal((await h.context()).length, 1, 'a provider rate limit still records the model');
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-dead-models.sh`
Expected: FAIL on case 12 with a non-empty `MODEL SKIP` line.

- [ ] **Step 3: Narrow `MODEL_ERROR_PATTERNS`**

Keep these patterns:
`subscription_sharing_usage_limit_exceeded`, `usage limit`, `rate limit`, `quota`,
`model not found`, `no such model`, `invalid model`, `unsupported model`, `overloaded`.

Remove these patterns:
`capacity`, `authentication`, `api key`, `unauthorized`, `forbidden`,
`context length`, `too many tokens`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-dead-models.sh`
Expected: PASS. Both new cases pass, and the old cases 1-11 still pass.

- [ ] **Step 5: Commit**

```bash
git add .opencode/plugins/superb.js tests/opencode/test-dead-models.mjs
git commit -m "fix: keep task failures out of the dead-model list"
```

### Task 2: Use `wss://` on an HTTPS page

**Files:**
- Modify: `skills/brainstorming/scripts/helper.js:7-11,32-35`
- Create: `tests/opencode/test-brainstorm-helper.mjs`
- Create: `tests/opencode/test-brainstorm-helper.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: `window.location`, `sessionKey()`.
- Produces: `websocketUrl(location, key) -> string`. `location` has `protocol` and `host`. `key` is a string or `null`.

- [ ] **Step 1: Write the failing test**

Create `tests/opencode/test-brainstorm-helper.mjs`:

```js
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { websocketUrl } = require('../../skills/brainstorming/scripts/helper.js');

assert.equal(
  websocketUrl({ protocol: 'https:', host: 'example.test' }, 'abc'),
  'wss://example.test/?key=abc',
  'HTTPS pages use wss',
);
assert.equal(
  websocketUrl({ protocol: 'http:', host: 'localhost:45999' }, 'abc'),
  'ws://localhost:45999/?key=abc',
  'HTTP pages use ws',
);
assert.equal(
  websocketUrl({ protocol: 'https:', host: 'example.test' }, null),
  'wss://example.test',
  'a missing key leaves the bare origin',
);

console.log('helper WebSocket URL passed');
```

Create `tests/opencode/test-brainstorm-helper.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
node "$(cd "$(dirname "$0")" && pwd)/test-brainstorm-helper.mjs"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/opencode/test-brainstorm-helper.mjs`
Expected: FAIL with `websocketUrl is not a function`.

- [ ] **Step 3: Add the pure function and use it**

In `helper.js`, before the `module.exports` line, add:

```js
function websocketUrl(location, key) {
  const scheme = location.protocol === 'https:' ? 'wss://' : 'ws://';
  return scheme + location.host + (key ? '/?key=' + encodeURIComponent(key) : '');
}
```

Add `websocketUrl` to `module.exports`.

Inside the browser block, replace the current `websocketUrl()` with `currentWebSocketUrl()`, and have it return `websocketUrl(window.location, sessionKey())`. Update `connect()` to call `currentWebSocketUrl()`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tests/opencode/test-brainstorm-helper.mjs`
Expected: PASS.

- [ ] **Step 5: Register the test and commit**

Add `test-brainstorm-helper.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add skills/brainstorming/scripts/helper.js tests/opencode/test-brainstorm-helper.mjs tests/opencode/test-brainstorm-helper.sh tests/opencode/run-tests.sh
git commit -m "fix: use wss on HTTPS pages"
```

### Task 3: Test the companion server

**Files:**
- Create: `tests/opencode/test-brainstorm-server.mjs`
- Create: `tests/opencode/test-brainstorm-server.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: `server.cjs` startup JSON, `BRAINSTORM_DIR`, `BRAINSTORM_PORT`, `BRAINSTORM_TOKEN`, `BRAINSTORM_LIFECYCLE_CHECK_MS`.
- Produces: no production names. This task adds tests only.

- [ ] **Step 1: Write the test**

Create `tests/opencode/test-brainstorm-server.mjs` with this behavior:

1. Make a temp dir. Create `content/screen.html` with `<h2>Hello</h2>`.
2. Pick a free port. Start `server.cjs` with `BRAINSTORM_DIR`, `BRAINSTORM_PORT`, a 32-character token, and `BRAINSTORM_LIFECYCLE_CHECK_MS=60000`.
3. Wait up to 5 seconds for a `server-started` line on stdout.
4. Assert `GET /` returns 403.
5. Assert `GET /?key=<token>` returns 200 and a `Set-Cookie` header with `HttpOnly` and `SameSite=Strict`.
6. Assert `GET /` with the cookie `brainstorm-key-<port>=<token>` returns 200 and contains `Hello`.
7. Assert `GET /files/..%2f..%2fserver.cjs` with the cookie returns 404.
8. Open a raw `net` connection. Send an HTTP upgrade with `GET /?key=<token>`, `Host: 127.0.0.1:<port>`, `Origin: http://127.0.0.1:<port>`, a valid `Sec-WebSocket-Key`, and `Sec-WebSocket-Version: 13`. Assert the response starts with `HTTP/1.1 101`.
9. Send one masked text frame for `{"type":"click","choice":"a","text":"A"}`. Close the socket.
10. Wait up to 2 seconds. Assert `state/events` contains `"choice":"a"`.
11. In a `finally` block, kill the child and remove the temp dir.

Use `node:assert/strict`, `node:child_process`, `node:fs`, `node:net`, `node:os`, and `node:path`.

Create `tests/opencode/test-brainstorm-server.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
node "$(cd "$(dirname "$0")" && pwd)/test-brainstorm-server.mjs"
```

- [ ] **Step 2: Run the test**

Run: `node tests/opencode/test-brainstorm-server.mjs`
Expected: PASS. If a test fails, fix `server.cjs` in this task and say which finding it belongs to.

- [ ] **Step 3: Register the test and commit**

Add `test-brainstorm-server.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add tests/opencode/test-brainstorm-server.mjs tests/opencode/test-brainstorm-server.sh tests/opencode/run-tests.sh
git commit -m "test: guard the companion server auth and WebSocket path"
```

### Task 4: Stop `find-polluter` from reporting a false clean

**Files:**
- Modify: `skills/systematic-debugging/find-polluter.sh:27-46`
- Create: `tests/opencode/test-find-polluter.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: `POLLUTION_CHECK`, `TEST_PATTERN`.
- Produces: exit code 2 and the message `Pollution already exists` when the path exists before the first test.

- [ ] **Step 1: Write the failing test**

Create `tests/opencode/test-find-polluter.sh`:

```bash
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-find-polluter.sh`
Expected: FAIL with exit 0 and `No polluter found - all tests clean!`.

- [ ] **Step 3: Add the pre-check and remove the dead in-loop check**

After the `TOTAL` calculation, add:

```bash
if [ -e "$POLLUTION_CHECK" ]; then
  echo "❌ Pollution already exists: $POLLUTION_CHECK"
  echo "   Remove it, then run this script again."
  exit 2
fi
```

Delete the `# Skip if pollution already exists` block inside the loop (lines 41-46). The post-test check at lines 54-67 remains.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-find-polluter.sh`
Expected: PASS.

- [ ] **Step 5: Register the test and commit**

Add `test-find-polluter.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add skills/systematic-debugging/find-polluter.sh tests/opencode/test-find-polluter.sh tests/opencode/run-tests.sh
git commit -m "fix: stop find-polluter from reporting a false clean"
```

### Task 5: Keep trailing sections out of the task brief

**Files:**
- Modify: `skills/subagent-driven-development/scripts/task-brief:30-36`
- Create: `tests/opencode/test-task-brief.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: `PLAN_FILE`, `TASK_NUMBER`, `OUTFILE`.
- Produces: the same output line, `wrote <path>: <N> lines`.

- [ ] **Step 1: Write the failing test**

Create `tests/opencode/test-task-brief.sh`:

```bash
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-task-brief.sh`
Expected: FAIL with `the brief includes the trailing Notes section`.

- [ ] **Step 3: Replace the awk body**

Use a level-aware extraction. The matching task sets `level` to its heading depth. A later heading at that depth or higher, that is not a matching Task heading, ends the extract. Deeper headings stay in.

```awk
awk -v n="$n" '
  /^```/ { infence = !infence }
  !infence && /^#+[ \t]+Task[ \t]+[0-9]+/ {
    if ($0 ~ ("^#+[ \t]+Task[ \t]+" n "([^0-9]|$)")) {
      intask = 1
      level = index($0, " ") - 1
    } else if (intask) {
      intask = 0
    }
  }
  !infence && intask && /^#+[ \t]/ && !/^#+[ \t]+Task[ \t]+[0-9]+/ {
    if (index($0, " ") - 1 <= level) intask = 0
  }
  intask { print }
' "$plan" > "$out"
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-task-brief.sh`
Expected: PASS. The `#### Detail` line stays in the brief. The `## Notes` section is gone.

- [ ] **Step 5: Register the test and commit**

Add `test-task-brief.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add skills/subagent-driven-development/scripts/task-brief tests/opencode/test-task-brief.sh tests/opencode/run-tests.sh
git commit -m "fix: stop task briefs at the next plan section"
```

### Task 6: Test the SDD workspace, ledger, and review scripts

**Files:**
- Create: `tests/opencode/test-sdd-scripts.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)
- Fix only if a test exposes a bug: `skills/subagent-driven-development/scripts/sdd-workspace`, `skills/subagent-driven-development/scripts/review-package`, `skills/executing-plans/scripts/task-done`

**Interfaces:**
- Consumes: `sdd-workspace PLAN_FILE`, `task-done PLAN TASK BASE -- COMMAND`, `review-package PLAN BASE HEAD`.
- Produces: no production names. This task adds guards.

- [ ] **Step 1: Write the tests**

Create `tests/opencode/test-sdd-scripts.sh`. Use a temp git repo, `git config user.email`, and `git config user.name`.

Test 1, workspace collision:
- Create `docs/alpha/plan.md` and `docs/beta/plan.md`.
- Run `sdd-workspace docs/alpha/plan.md` and `sdd-workspace docs/beta/plan.md`.
- Assert the two paths differ.
- Assert each workspace's `plan-path` equals its plan.
- Assert `.superb/sdd/.gitignore` contains `*`.

Test 2, ledger on pass and fail:
- Create `docs/plan.md` with `## Task 1` and `## Task 2`.
- Commit. Set `base=$(git rev-parse HEAD)`.
- Run `task-done docs/plan.md 1 "$base" -- bash -c 'echo ok'`.
- Assert exit 0 and `progress.md` contains `Task 1: complete`.
- Run `task-done docs/plan.md 2 "$base" -- bash -c 'exit 1'` with `set +e`.
- Assert exit 1 and `progress.md` does not contain `Task 2`.

Test 3, review package:
- Make a commit. Set `base=$(git rev-parse HEAD)`.
- Make a second commit with message `second change`.
- Run `review-package docs/plan.md "$base" HEAD`.
- Assert exit 0 and the printed file contains `## Commits` and `second change`.
- Run `review-package docs/plan.md HEAD HEAD` with `set +e`.
- Assert exit 3.

- [ ] **Step 2: Run the tests**

Run: `bash tests/opencode/test-sdd-scripts.sh`
Expected: PASS. If a test fails, fix the script it covers in this task and say which finding it belongs to.

- [ ] **Step 3: Register the test and commit**

Add `test-sdd-scripts.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add tests/opencode/test-sdd-scripts.sh tests/opencode/run-tests.sh skills/subagent-driven-development/scripts skills/executing-plans/scripts
git commit -m "test: guard the SDD workspace, ledger, and review scripts"
```

### Task 7: Fix the finish menu contradictions

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md:42-43,199`
- Modify: `tests/opencode/test-pr-gate.mjs`

**Interfaces:**
- Consumes: the finish skill prose.
- Produces: the same four-option menu and the same Quick Reference rows.

- [ ] **Step 1: Write the failing checks**

Add these checks to `tests/opencode/test-pr-gate.mjs` inside the `if (finish)` block:

```js
check('setup table says four options', prose.includes('Standard 4 options'));
check('Step 6 cleans up after Option 2',
  prose.includes('Runs for Option 1, Option 2, and confirmed discards'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/opencode/test-pr-gate.mjs`
Expected: FAIL on both new checks.

- [ ] **Step 3: Edit the skill**

Change both table cells at lines 42-43 from `Standard 3 options` to `Standard 4 options`.

Change the Step 6 sentence at line 199 from:

`**Runs for Option 1 and confirmed discards.** Options 2 and 3 always preserve the worktree.`

to:

`**Runs for Option 1, Option 2, and confirmed discards.** Option 3 always preserves the worktree.`

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tests/opencode/test-pr-gate.mjs`
Expected: PASS. The existing menu and Quick Reference checks still pass.

- [ ] **Step 5: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md tests/opencode/test-pr-gate.mjs
git commit -m "docs: align the finish menu and worktree cleanup"
```

### Task 8: Delete the orphaned hook files

**Files:**
- Delete: `hooks/hooks.json`, `hooks/session-start`
- Modify: `.gitattributes`
- Create: `tests/opencode/test-no-orphan-hooks.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: the tracked tree.
- Produces: no `hooks/` directory.

- [ ] **Step 1: Write the failing test**

Create `tests/opencode/test-no-orphan-hooks.sh`:

```bash
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-no-orphan-hooks.sh`
Expected: FAIL with `orphaned hook files still exist`.

- [ ] **Step 3: Delete the files and the stale rules**

```bash
git rm -r hooks
```

In `.gitattributes`, remove the `hooks/session-start` line, the `*.cmd` line, and the comment above the `*.cmd` line.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-no-orphan-hooks.sh`
Expected: PASS.

- [ ] **Step 5: Register the test and commit**

Add `test-no-orphan-hooks.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add .gitattributes tests/opencode/test-no-orphan-hooks.sh tests/opencode/run-tests.sh
git commit -m "chore: remove orphaned hook files"
```

### Task 9: Repair the integration tests

**Files:**
- Modify: `tests/opencode/test-tools.sh:34,92`
- Modify: `tests/opencode/test-priority.sh:110`
- Modify: `tests/opencode/run-tests.sh:63`

**Interfaces:**
- Consumes: `opencode run`, `timeout` or `gtimeout`.
- Produces: no new names. Both scripts keep their `run_opencode` helper.

- [ ] **Step 1: Run the failing integration test**

Run: `bash tests/opencode/run-tests.sh --integration --test test-tools.sh`
Expected: FAIL at Test 3. The skill loads, but the asserted title `Brainstorming Ideas Into Designs` is not in it.

- [ ] **Step 2: Fix the title assertion**

In `tests/opencode/test-tools.sh`, change line 92 to:

```bash
assert_contains "$output" "# Brainstorming" "brainstorming skill content was returned"
```

- [ ] **Step 3: Resolve the timeout command**

In both `test-tools.sh` and `test-priority.sh`, before `run_opencode`, add:

```bash
TIMEOUT_BIN="$(command -v timeout || command -v gtimeout || true)"
```

In `run_opencode`, replace the `timeout "${OPENCODE_TEST_TIMEOUT_SECONDS}s" opencode ...` call with:

```bash
if [ -n "$TIMEOUT_BIN" ]; then
  command_output=$(cd "$dir" && "$TIMEOUT_BIN" "${OPENCODE_TEST_TIMEOUT_SECONDS}s" opencode run --print-logs --format json "$prompt" 2>&1)
else
  command_output=$(cd "$dir" && opencode run --print-logs --format json "$prompt" 2>&1)
fi
```

- [ ] **Step 4: Update the stale help line**

In `tests/opencode/run-tests.sh`, change line 63 to:

`echo "  test-tools.sh           Test the native skill tool (integration)"`

- [ ] **Step 5: Run the test to verify it passes**

Run: `bash tests/opencode/run-tests.sh --integration --test test-tools.sh`
Expected: PASS. If OpenCode is not installed, skip this step and say so in the task report.

- [ ] **Step 6: Commit**

```bash
git add tests/opencode/test-tools.sh tests/opencode/test-priority.sh tests/opencode/run-tests.sh
git commit -m "test: repair the integration suite"
```

### Task 10: Remove all other-CLI references and add the guard

**Files:**
- Create: `tests/opencode/test-opencode-only.sh`
- Delete: `skills/using-superb/references/` (7 files)
- Delete: `skills/writing-skills/references/anthropic-best-practices.md`
- Delete: `skills/writing-skills/references/CLAUDE_MD_TESTING.md`
- Modify: `skills/using-superb/SKILL.md:80-93`
- Modify: `skills/writing-skills/SKILL.md:12,20`
- Modify: `skills/writing-skills/references/testing-skills-with-subagents.md:15`
- Modify: `skills/executing-plans/SKILL.md:49`
- Modify: `skills/using-git-worktrees/SKILL.md:53,164`
- Modify: `skills/brainstorming/visual-companion.md:62-90`
- Modify: `skills/brainstorming/scripts/start-server.sh:18,97-100`
- Modify: `skills/brainstorming/scripts/server.cjs:200-217`
- Modify: `skills/subagent-driven-development/scripts/sdd-workspace:21-25`
- Modify: `README.md:30`
- Modify: `.opencode/INSTALL.md:26-27`
- Modify: `skills/diagnosing-superb/SKILL.md:3`
- Modify: `skills/diagnosing-superb/prompts/request-conflicts.md:13`
- Modify: `skills/diagnosing-superb/templates/issue.md:24-25`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: the shipped file tree.
- Produces: `tests/opencode/test-opencode-only.sh`. It exits 0 when no other-CLI name or path exists.

- [ ] **Step 1: Write the failing guard**

Create `tests/opencode/test-opencode-only.sh`:

```bash
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
matches=$(git grep -I -n -E "$names|$paths" -- README.md .opencode skills index.js package.json)
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
```

- [ ] **Step 2: Run the guard to verify it fails**

Run: `bash tests/opencode/test-opencode-only.sh`
Expected: FAIL. The reference directory exists, and several shipped files name other CLIs.

- [ ] **Step 3: Delete the per-CLI pack and the vendor writing references**

```bash
git rm -r skills/using-superb/references
git rm skills/writing-skills/references/anthropic-best-practices.md
git rm skills/writing-skills/references/CLAUDE_MD_TESTING.md
```

- [ ] **Step 4: Edit `skills/using-superb/SKILL.md`**

Delete the whole `## Platform Adaptation` section, including its six bullets.

Change the User Instructions line to:

`User instructions (AGENTS.md, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.`

- [ ] **Step 5: Edit `skills/writing-skills/SKILL.md`**

Replace the personal-skills paragraph with:

> **Personal skills live in OpenCode's skills directory** (`~/.config/opencode/skills/`). Each skill is a subdirectory with a `SKILL.md` file.

Delete the `**Official guidance:**` paragraph. It points at the deleted file.

- [ ] **Step 6: Remove the two stale pointers**

In `skills/writing-skills/references/testing-skills-with-subagents.md`, delete the `**Complete worked example:**` line.

In `skills/executing-plans/SKILL.md`, replace the no-subagent bullet with:

```
- Your OpenCode build has no subagent tool. Never fabricate a dispatch;
  run the plan here.
```

- [ ] **Step 7: Edit `skills/using-git-worktrees/SKILL.md`**

At line 53, remove the named tool examples. The sentence ends: `Do you already have a native way to create a worktree? If you do, use it and skip to Step 2.`

At line 164, replace the phrase "A native tool (e.g. EnterWorktree)" with "A native worktree tool".

- [ ] **Step 8: Edit `skills/brainstorming/visual-companion.md`**

Replace the whole per-platform launch block with one OpenCode section:

- Heading: `**OpenCode:**`
- One command line: `bash scripts/start-server.sh --project-dir /path/to/project --open`
- One line: start the shell call in the background.
- One Windows note: the script runs in the foreground, so start the shell call in the background.
- One line: keep the server running across turns. Use `--foreground` when the environment reaps detached processes.

- [ ] **Step 9: Edit the companion scripts**

In `skills/brainstorming/scripts/start-server.sh`:
- Change the `--background` help to `Force background mode.`
- Delete the `CODEX_CI` auto-foreground block. Keep the Windows/Git Bash block.

In `skills/brainstorming/scripts/server.cjs`:
- Remove `.codex-plugin/plugin.json` from `manifests`.
- Replace the `Packaged Codex plugins...` comment with `// No readable manifest.`

- [ ] **Step 10: Edit `skills/subagent-driven-development/scripts/sdd-workspace`**

Replace the first three lines of the workspace comment with:

```
# The workspace lives in the working tree (not under .git/) because a host can
# protect .git/ and deny agent writes there — which blocks an implementer
# subagent from writing its report file.
```

- [ ] **Step 11: Edit the install docs**

In `README.md`, change `The UI skills use the browser tool from your harness.` to `The UI skills use OpenCode's browser tool.`

In `.opencode/INSTALL.md`, replace the multi-harness paragraph with:

`OpenCode uses its own plugin install. Superb targets OpenCode 2 only.`

- [ ] **Step 12: Edit `skills/diagnosing-superb`**

- `SKILL.md`: change `on any harness` to `on OpenCode`.
- `prompts/request-conflicts.md`: change `(CLAUDE.md, AGENTS.md, GEMINI.md, or the harness's equivalent; paths are in the case file)` to `(AGENTS.md; paths are in the case file)`.
- `templates/issue.md`: delete the `Harness (Claude Code, Cursor, etc.)` row. Change the `Harness version` row label to `OpenCode version`.

- [ ] **Step 13: Run the guard to verify it passes**

Run: `bash tests/opencode/test-opencode-only.sh`
Expected: PASS.

- [ ] **Step 14: Run the default suite**

Run: `bash tests/opencode/run-tests.sh`
Expected: PASS.

- [ ] **Step 15: Register the guard and commit**

Add `test-opencode-only.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add -A README.md .opencode skills tests/opencode/run-tests.sh tests/opencode/test-opencode-only.sh
git commit -m "chore: remove other-CLI references"
```

### Task 11: Remove the dead start-server kill block

**Files:**
- Modify: `skills/brainstorming/scripts/start-server.sh:144-149`
- Create: `tests/opencode/test-brainstorm-start.sh`
- Modify: `tests/opencode/run-tests.sh` (test list and help text)

**Interfaces:**
- Consumes: `start-server.sh` arguments.
- Produces: no new names. The script keeps its current options.

- [ ] **Step 1: Write the failing test**

Create `tests/opencode/test-brainstorm-start.sh`:

```bash
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-brainstorm-start.sh`
Expected: FAIL with `the dead kill block comment is still present`.

- [ ] **Step 3: Delete the block**

Remove the comment `# Kill any existing server` and the `if [[ -f "$PID_FILE" ]]` block that reads `old_pid`. Keep the `PID_FILE` and `STATE_DIR` definitions.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-brainstorm-start.sh`
Expected: PASS. `bash -n` also passes.

- [ ] **Step 5: Register the test and commit**

Add `test-brainstorm-start.sh` to the `tests` array in `tests/opencode/run-tests.sh`. Add its help line.

```bash
git add skills/brainstorming/scripts/start-server.sh tests/opencode/test-brainstorm-start.sh tests/opencode/run-tests.sh
git commit -m "chore: remove the dead start-server kill block"
```
