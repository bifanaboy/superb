# Reviewer Agent and Caveman Ingest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superb:subagent-driven-development (recommended) or superb:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dedicated `review` agent with three lenses, and port the Caveman plugin into Superb (voice mode, commands, compression) so the Caveman plugin can be uninstalled.

**Architecture:** A model-free agent file installed into the OpenCode agent directory, dispatched by the review skills. A small `src/caveman/` layer: mode flag helpers, a thin client over `@caveman-ai/cli`, guarded hooks for shrink and compression, a conflict guard, and an agent installer.

**Tech Stack:** OpenCode 2 plugin API (`ctx.skill/command/agent/tool/session/plugin`), Node `child_process`, `@caveman-ai/cli@4.0.1`, assert harnesses under `tests/opencode/`.

**Spec:** `docs/superb/specs/2026-11-03-reviewer-agent-and-caveman-ingest-design.md`

## Global Constraints

- OpenCode 2.0.4 or later.
- `@caveman-ai/cli` pinned to exactly `4.0.1`. Node 22.13 or later.
- No model IDs, roles, tiers, or routing in `skills/` or `src/`. Guard test `test-no-model-policy`.
- No other host names in shipped files. Guard test `test-opencode-only`.
- Every new `ctx` surface is guarded. Missing surfaces must not break setup.
- The agent installer never overwrites an existing file.
- Version `11.0.0`.

## Review Focus

1. CLI absent: setup still registers skills, the bootstrap, and commands; all Caveman hooks are skipped. Test: `test-caveman-client` missing-bin case, `test-caveman-hooks` no-client case.
2. Caveman plugin active: Superb registers no Caveman commands and no Caveman hooks. Test: `test-caveman-registration` guard case.
3. Partial `ctx` (older hosts and existing test harnesses): no new call throws. Test: existing suite plus `test-caveman-registration` minimal-ctx case.
4. Installer re-run: existing agent files keep their contents, including a user-added `model:` line. Test: `test-caveman-installer` idempotence case.
5. Reviewer without a lens: the agent refuses to guess and asks for `spec`, `plan`, or `implementation`. Test: `test-reviewer-agent` lens case.

---

### Task 1: Agent files

**Files:**
- Create: `agents/review.md`
- Create: `agents/cavecrew-builder.md`
- Create: `agents/cavecrew-investigator.md`
- Create: `agents/cavecrew-reviewer.md`
- Test: `tests/opencode/test-reviewer-agent.mjs`
- Test: `tests/opencode/test-reviewer-agent.sh`

**Interfaces:**
- Produces: four markdown files under `agents/`. Task 7 reads them.

- [ ] **Step 1: Write the failing test**

`test-reviewer-agent.mjs` reads `agents/review.md` and asserts:
- frontmatter has `mode: all` and no line matching `^model:`.
- body contains `Lens: spec`, `Lens: plan`, `Lens: implementation`.
- body contains `reduce`, `cohere`, and `elegant`.
- body contains `Do not edit code` and `You fix spec and plan files in place`.
- body contains `Ask which lens` for the missing-lens case.

It also asserts each of `agents/cavecrew-builder.md`, `cavecrew-investigator.md`, and `cavecrew-reviewer.md` has `mode: subagent` and no `^model:` line.

`test-reviewer-agent.sh` calls the `.mjs`, in the style of `test-no-model-policy.sh`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-reviewer-agent.sh`
Expected: FAIL, files missing.

- [ ] **Step 3: Write `agents/review.md`**

Frontmatter: `description`, `mode: all`, permissions deny `edit` on `*`, allow `edit` on `docs/superb/**`. Body: three lens sections, the reduce/cohere/elegant checks in the spec lens, the findings-only output contract, the `shortcut:` rule, the doc-fix rule, the code-read-only rule, and the missing-lens question.

- [ ] **Step 4: Write the three cavecrew agent files**

Port the role contracts from the installed Caveman agents at `~/.config/opencode/agents/`: builder (surgical 2-file scope), investigator (read-only locate), reviewer (severity-tagged one-line findings). Author original text. No model line.

- [ ] **Step 5: Run the test to verify it passes**

Run: `bash tests/opencode/test-reviewer-agent.sh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add agents tests/opencode/test-reviewer-agent.mjs tests/opencode/test-reviewer-agent.sh
git commit -m "feat: add review and cavecrew agent definitions"
```

### Task 2: Review dispatch and stale model lines

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `skills/subagent-driven-development/task-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/re-review-prompt.md`
- Modify: `skills/subagent-driven-development/references/final-review.md`
- Modify: `skills/executing-plans/SKILL.md`
- Test: `tests/opencode/test-review-dispatch.mjs`
- Test: `tests/opencode/test-review-dispatch.sh`

**Interfaces:**
- Consumes: `agents/review.md` (Task 1), by name only.

- [ ] **Step 1: Write the failing test**

`test-review-dispatch.mjs` asserts:
- The four dispatch files contain `agent: "review"` and no `general-purpose` in review dispatch lines.
- `task-reviewer-prompt.md` and `re-review-prompt.md` contain no `model:` line.
- `executing-plans/SKILL.md` contains no `Specify the model` text.
- `requesting-code-review/SKILL.md` contains `Lens: spec`, `Lens: plan`, and `Lens: implementation`.
- `requesting-code-review/SKILL.md` keeps one line: `Do not pass a model. Dispatch without `model`.`

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-review-dispatch.sh`
Expected: FAIL.

- [ ] **Step 3: Edit the dispatch files**

Replace `Subagent (general-purpose):` with `Subagent (review):` and add `lens: [spec|plan|implementation]` in each template. Delete the `model: [MODEL — REQUIRED: ...]` block from both SDD prompt templates. Delete the broken `Specify the model` sentence in `executing-plans/SKILL.md:244`. Add the lens section to `requesting-code-review/SKILL.md`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-review-dispatch.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills tests/opencode/test-review-dispatch.mjs tests/opencode/test-review-dispatch.sh
git commit -m "feat: dispatch reviews to the review agent with a lens"
```

### Task 3: Caveman mode helpers

**Files:**
- Create: `src/caveman/mode.js`
- Test: `tests/opencode/test-caveman-mode.mjs`
- Test: `tests/opencode/test-caveman-mode.sh`

**Interfaces:**
- Produces:
  - `MODE_FLAG_BASENAME = '.caveman-active'`
  - `readMode(configDir) -> string | null`
  - `writeMode(configDir, mode) -> void`
  - `clearMode(configDir) -> void`

- [ ] **Step 1: Write the failing test**

With a `mkdtemp` dir: `readMode` returns `null`; `writeMode(dir, 'ultracave')` then `readMode(dir) === 'ultracave'`; `clearMode(dir)` then `readMode(dir) === null`; `clearMode` on a missing file does not throw.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-caveman-mode.sh`
Expected: FAIL, module missing.

- [ ] **Step 3: Implement `src/caveman/mode.js`**

Use `node:fs` and `node:path`. `readMode` trims and returns `null` on `ENOENT`. `clearMode` ignores `ENOENT`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-caveman-mode.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/caveman/mode.js tests/opencode/test-caveman-mode.mjs tests/opencode/test-caveman-mode.sh
git commit -m "feat: add caveman mode flag helpers"
```

### Task 4: Caveman CLI client

**Files:**
- Create: `src/caveman/client.js`
- Test: `tests/opencode/test-caveman-client.mjs`
- Test: `tests/opencode/test-caveman-client.sh`

**Interfaces:**
- Produces:
  - `resolveCliBin() -> string | null`
  - `createClient({ bin, exec }) -> { sessionStart, preTool, postTool, shrink, getVersion }`
  - `sessionStart(sessionID) -> string | undefined`
  - `preTool(sessionID, toolName, toolInput) -> string | undefined`
  - `postTool(sessionID, toolName, toolInput, toolOutput) -> string | undefined`
  - `shrink(command) -> string | undefined`
  - `getVersion() -> string | null`

- [ ] **Step 1: Write the failing test**

Inject a fake `exec` that records args and returns scripted JSON. Assert:
- `sessionStart` returns `hookSpecificOutput.additionalContext`.
- `postTool` returns `hookSpecificOutput.updatedToolOutput`, else `output_replacement`.
- `shrink` returns `hookSpecificOutput.updatedInput.command`.
- A throwing `exec` yields `undefined`.
- `resolveCliBin()` returns a path ending in `dist/index.js` in this checkout, and `null` when resolution throws.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-caveman-client.sh`
Expected: FAIL.

- [ ] **Step 3: Implement `src/caveman/client.js`**

`execFileSync(process.execPath, [bin, ...args], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 2000, maxBuffer: 2 * 1024 * 1024 })`. Parse stdout JSON. Return `undefined` on any throw, non-object, or missing field.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-caveman-client.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/caveman/client.js tests/opencode/test-caveman-client.mjs tests/opencode/test-caveman-client.sh
git commit -m "feat: add caveman CLI client"
```

### Task 5: Commands and conflict guard

**Files:**
- Create: `src/caveman/commands.js`
- Create: `src/caveman/guard.js`
- Modify: `src/superb.js`
- Test: `tests/opencode/test-caveman-registration.mjs`
- Test: `tests/opencode/test-caveman-registration.sh`

**Interfaces:**
- Produces:
  - `CAVEMAN_COMMANDS` — five `{ name, description, prompt }` entries.
  - `isCavemanPluginActive(plugins) -> boolean` — true for ids `caveman`, `caveman-native`, `caveman-blocks`.

- [ ] **Step 1: Write the failing test**

Fake `ctx` with `skill.transform`, `command.transform`, `plugin.list`, `session.hook`, `session.get`. Assert setup registers a `caveman` command, `ultracave`, `megacave`, `caveman-commit`, `caveman-review`. With `plugin.list()` returning `[{ id: 'caveman-native' }]`, assert no Caveman command is registered. With `ctx` missing `command` and `plugin`, assert setup resolves without throwing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-caveman-registration.sh`
Expected: FAIL.

- [ ] **Step 3: Implement `commands.js`, `guard.js`, and register in `setup`**

Each command's `execute({ sessionID, prompt, delivery })` calls `ctx.session.prompt` with the prompt text. Mode-setting commands also call `writeMode`. Guard registration with `typeof ctx.command?.transform === 'function'`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-caveman-registration.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/caveman/commands.js src/caveman/guard.js src/superb.js tests/opencode/test-caveman-registration.mjs tests/opencode/test-caveman-registration.sh
git commit -m "feat: register caveman commands and skip when the plugin is active"
```

### Task 6: Caveman hooks

**Files:**
- Modify: `src/superb.js`
- Test: `tests/opencode/test-caveman-hooks.mjs`
- Test: `tests/opencode/test-caveman-hooks.sh`

**Interfaces:**
- Consumes: `createClient`, `readMode`, and `isCavemanPluginActive`.
- Produces: `setup(ctx, { cavemanClient })` test seam. Default client is created from `resolveCliBin()`.

- [ ] **Step 1: Write the failing test**

With a fake client and fake `ctx`, assert:
- The `context` hook pushes a system text containing `CAVEMAN MODE ACTIVE (caveman)` when a mode flag exists, and pushes nothing when the flag is absent.
- `execute.before` rewrites `input.command` for `shell` when `shrink` returns a string, and does nothing for `read`.
- `execute.after` replaces `event.result` when `postTool` returns a string, only on `status: 'completed'`.
- With `cavemanClient: null`, no tool hooks are registered.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-caveman-hooks.sh`
Expected: FAIL.

- [ ] **Step 3: Register the hooks in `setup`**

Register the voice hook before the existing bootstrap hook. Guard each `ctx.tool?.hook` and `ctx.session?.hook` call. Fail open on every error.

- [ ] **Step 4: Run the tests**

Run: `bash tests/opencode/test-caveman-hooks.sh && bash tests/opencode/test-bootstrap-caching.sh && bash tests/opencode/test-session-bootstrap.sh`
Expected: PASS, bootstrap hook remains last.

- [ ] **Step 5: Commit**

```bash
git add src/superb.js tests/opencode/test-caveman-hooks.mjs tests/opencode/test-caveman-hooks.sh
git commit -m "feat: wire caveman voice, shrink, and compression hooks"
```

### Task 7: Agent installer commands

**Files:**
- Create: `src/caveman/agents.js`
- Modify: `src/superb.js`
- Test: `tests/opencode/test-caveman-installer.mjs`
- Test: `tests/opencode/test-caveman-installer.sh`

**Interfaces:**
- Produces:
  - `AGENT_FILES` — map of file name to contents, including `review.md`.
  - `installAgents(agentsDir, reload) -> { installed: string[] }`
  - `uninstallAgents(agentsDir, reload) -> { removed: string[] }`

- [ ] **Step 1: Write the failing test**

With a temp dir and a stub `reload`: install creates four files and calls `reload` once. A second install writes nothing and does not call `reload`. A pre-existing `review.md` with an added `model:` line keeps that line. Uninstall removes the four files and calls `reload`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-caveman-installer.sh`
Expected: FAIL.

- [ ] **Step 3: Implement `agents.js` and register commands**

Load the `agents/` files at module load. Write only when the target is absent. Register `superb-install-agents` and `superb-uninstall-agents` through `ctx.command.transform`, guarded, each followed by `ctx.agent.reload?.()`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-caveman-installer.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/caveman/agents.js src/superb.js tests/opencode/test-caveman-installer.mjs tests/opencode/test-caveman-installer.sh
git commit -m "feat: add agent installer commands"
```

### Task 8: Dependency, docs, and version

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.opencode/INSTALL.md`
- Test: `tests/opencode/test-plugin-loading.sh`

- [ ] **Step 1: Extend the failing test**

Assert `package.json` has `@caveman-ai/cli` at `4.0.1`, `engines.node` at `>=22.13`, and `version` at `11.0.0`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-plugin-loading.sh`
Expected: FAIL.

- [ ] **Step 3: Edit `package.json`**

Add the dependency, the engines field, and version `11.0.0`.

- [ ] **Step 4: Update the docs**

README: replace the Models section with the review-agent statement. INSTALL: add "Replacing the Caveman plugin" with the uninstall steps, `caveman mcp install opencode`, and `superb-install-agents`. State the Node floor.

- [ ] **Step 5: Run the guard and loading tests**

Run: `bash tests/opencode/test-plugin-loading.sh && bash tests/opencode/test-no-model-policy.sh && bash tests/opencode/test-opencode-only.sh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json README.md .opencode/INSTALL.md tests/opencode/test-plugin-loading.sh
git commit -m "feat: depend on the caveman CLI and document the replacement"
```

### Task 9: Register tests and run the suite

**Files:**
- Modify: `tests/opencode/run-tests.sh`

- [ ] **Step 1: Add the new tests**

Append to `tests=( ... )`: `test-reviewer-agent.sh`, `test-review-dispatch.sh`, `test-caveman-mode.sh`, `test-caveman-client.sh`, `test-caveman-registration.sh`, `test-caveman-hooks.sh`, `test-caveman-installer.sh`. Add matching `--help` lines.

- [ ] **Step 2: Run the full suite**

Run: `bash tests/opencode/run-tests.sh`
Expected: PASS, no regressions.

- [ ] **Step 3: Syntax-check the plugin**

Run: `node --check src/superb.js && node --check src/caveman/mode.js && node --check src/caveman/client.js && node --check src/caveman/commands.js && node --check src/caveman/guard.js && node --check src/caveman/agents.js`
Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/opencode/run-tests.sh
git commit -m "test: register reviewer and caveman tests"
```
