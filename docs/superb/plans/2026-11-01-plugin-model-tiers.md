# Plugin-Owned Model Tiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superb:subagent-driven-development (recommended) or superb:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move model selection from Superb's skill text into the Superb plugin. Four allowance tiers run in spend order. A failed dispatch advances the tier.

**Architecture:** A new `src/models.js` holds the config, alias resolver, role marker parser, and command parser as pure functions. `src/superb.js` registers `execute.before`, `execute.after`, the context line, and `/superb-models`. Skills carry `[superb:light|medium|heavy]` markers and no model IDs.

**Tech Stack:** Node 22, ESM, no dependencies. OpenCode 2 plugin hooks. Node `assert` tests.

**Spec:** `docs/superb/specs/2026-11-01-plugin-model-tiers-design.md`

## Global Constraints

- Model references are `provider/model`. Never write a `#variant` suffix.
- Config path is `~/.config/opencode/superb/models.json`.
- Tiers reset per session. No state file.
- Any error on a `subagent` dispatch advances the tier, bounded at the last tier.
- Role markers are `[superb:light]`, `[superb:medium]`, `[superb:heavy]`. No marker means `medium`.
- Feature-detect `ctx.model`, `ctx.command`, and `ctx.session.synthetic`. Their absence must not break plugin activation.
- A resume dispatch (`input.sessionID` present) keeps its model; the marker is still stripped.
- Skills must contain no model ID, no `models.json`, no `costly`, and no `MODEL SKIP`.
- Existing comments in edited files stay unless the task removes the code they describe.

## Review Focus

- **Missing or malformed config.** The plugin must load, route nothing, and leave `input.model` untouched.
- **Alias with no match.** The tier is skipped, one log line appears, and the dispatch still runs on the host default.
- **Host without `ctx.model` or `ctx.command`.** Exact IDs still route. The command is absent. The plugin registers its other hooks.
- **Child session.** The tier line must not appear in a subagent's context.
- **Prompt with no marker.** Role is `medium`, and the prompt is unchanged.
- **Resume dispatch.** The model must not change mid-child-session.
- **Last tier error.** The index stays at the last tier and does not overflow.

## File Structure

- `src/models.js` — pure config, alias, marker, command, and table logic.
- `src/superb.js` — hooks and command registration. Dead-model code removed.
- `tests/opencode/test-model-routing.mjs` — pure unit tests for `src/models.js`.
- `tests/opencode/test-tier-hooks.mjs` — plugin harness tests.
- `tests/opencode/test-model-policy-guard.mjs` — skill guard.
- Shell wrappers and `tests/opencode/run-tests.sh` entries for each.

---

### Task 1: Pure model logic in `src/models.js`

**Files:**
- Create: `src/models.js`
- Create: `tests/opencode/test-model-routing.mjs`
- Create: `tests/opencode/test-model-routing.sh`

**Interfaces:**
- Produces:
  - `DEFAULT_CONFIG_PATH: string`
  - `ROLES: readonly ['light','medium','heavy']`
  - `loadModelConfig(filePath?: string): { startTier: number, tiers: Tier[] } | null`
  - `roleModel(tier: Tier, role: string): string | null`
  - `parseRoleMarker(prompt: string): { role: 'light'|'medium'|'heavy', prompt: string }`
  - `catalogIndex(models: ModelInfo[]): Map<string, ModelInfo[]>`
  - `findMatches(ref: string, index: Map<string, ModelInfo[]>): string[]`
  - `resolveModel(ref: string, index: Map<string, ModelInfo[]>): string | null`
  - `parseModelsCommand(text: string): Command`
  - `tierTable(config, activeIndex: number): string`
  - `saveModelConfig(config, filePath?: string): void`
- `Tier` is `{ name?: string, model?: string, models?: { light?: string, medium?: string, heavy?: string } }`.
- `ModelInfo` is `{ id: string, providerID: string, status?: string, enabled?: boolean }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/opencode/test-model-routing.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadModelConfig, roleModel, parseRoleMarker, catalogIndex,
  findMatches, resolveModel, parseModelsCommand, tierTable, saveModelConfig,
} from '../../src/models.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'superb-models-'));
const file = path.join(dir, 'models.json');

// roleModel
assert.equal(roleModel({ model: 'p/one' }, 'heavy'), 'p/one');
assert.equal(roleModel({ models: { heavy: 'p/h' } }, 'heavy'), 'p/h');
assert.equal(roleModel({ models: { light: 'p/l' } }, 'heavy'), null);
assert.equal(roleModel({ model: 'p/one', models: { heavy: 'p/h' } }, 'heavy'), 'p/h');

// parseRoleMarker
assert.deepEqual(parseRoleMarker('[superb:heavy] review'), { role: 'heavy', prompt: 'review' });
assert.deepEqual(parseRoleMarker('  [SUPERB:Light]\nwork'), { role: 'light', prompt: 'work' });
assert.deepEqual(parseRoleMarker('plain work'), { role: 'medium', prompt: 'plain work' });
assert.deepEqual(parseRoleMarker(''), { role: 'medium', prompt: '' });

// catalogIndex + resolveModel
const index = catalogIndex([
  { id: 'gpt-6-luna', providerID: 'openai', status: 'active', enabled: true },
  { id: 'gpt-6.1-sol', providerID: 'openai', status: 'active', enabled: true },
  { id: 'gpt-6.1-terra', providerID: 'openai', status: 'active', enabled: true },
  { id: 'old-sol', providerID: 'openai', status: 'deprecated', enabled: true },
  { id: 'deepseek-v4.1-flash', providerID: 'opencode-go', status: 'active', enabled: true },
]);
assert.equal(resolveModel('openai/gpt-6.1-sol', index), 'openai/gpt-6.1-sol');
assert.equal(resolveModel('openai/sol-latest', index), 'openai/gpt-6.1-sol');
assert.equal(resolveModel('openai/terra', index), 'openai/gpt-6.1-terra');
assert.equal(resolveModel('openai/nope', index), null);
assert.equal(resolveModel('missing/model', index), null);
assert.equal(resolveModel('gpt-6.1-sol', index), null);
assert.deepEqual(findMatches('openai/sol', index), ['openai/gpt-6.1-sol']);

// loadModelConfig + saveModelConfig
const config = {
  startTier: 0,
  tiers: [
    { name: 'free', model: 'opencode/deepseek-v4.1-flash-free' },
    { name: 'plus', models: { light: 'openai/luna-latest', medium: 'openai/terra-latest', heavy: 'openai/sol-latest' } },
  ],
};
saveModelConfig(config, file);
assert.deepEqual(loadModelConfig(file), config);
assert.equal(loadModelConfig(path.join(dir, 'absent.json')), null);
fs.writeFileSync(file, '{ broken');
assert.equal(loadModelConfig(file), null);
fs.writeFileSync(file, JSON.stringify({ tiers: [] }));
assert.equal(loadModelConfig(file), null);
saveModelConfig(config, file);

// parseModelsCommand
assert.deepEqual(parseModelsCommand(''), { action: 'show' });
assert.deepEqual(parseModelsCommand('next'), { action: 'next' });
assert.deepEqual(parseModelsCommand('reset'), { action: 'reset' });
assert.deepEqual(parseModelsCommand('find openai/sol'), { action: 'find', ref: 'openai/sol' });
assert.deepEqual(parseModelsCommand('set 2 heavy openai/sol-latest'),
  { action: 'set', tier: '2', role: 'heavy', ref: 'openai/sol-latest' });
assert.deepEqual(parseModelsCommand('set plus all openai/sol'),
  { action: 'set', tier: 'plus', role: 'all', ref: 'openai/sol' });
assert.equal(parseModelsCommand('set 2').action, 'error');
assert.equal(parseModelsCommand('set 2 nope p/x').action, 'error');

// tierTable
const table = tierTable(config, 1);
assert.match(table, /\* 2\. plus/);
assert.match(table, /1\. free/);
assert.match(table, /light=openai\/luna-latest/);

console.log('  [PASS] model routing unit tests');
```

Create `tests/opencode/test-model-routing.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Test: Model Routing ==="
node "$SCRIPT_DIR/test-model-routing.mjs"
echo ""
echo "=== All model routing tests passed ==="
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bash tests/opencode/test-model-routing.sh`
Expected: FAIL with `Cannot find module .../src/models.js`.

- [ ] **Step 3: Implement `src/models.js`**

Export the nine values above. Validation rules:

- `loadModelConfig` returns `null` unless the root is an object, `tiers` is a non-empty array, and each tier has a non-empty `model` or a `models` object whose keys are roles and whose values are non-empty strings.
- `startTier` defaults to `0` and clamps into `[0, tiers.length - 1]`.
- `parseRoleMarker` matches `/^\s*\[superb:(light|medium|heavy)\]\s*/i` at the start only. Strip the match. Return `medium` when there is no match.
- `resolveModel` splits on the first `/`. Strip a trailing `#...` from the model part. Exact enabled match wins. Otherwise strip `-latest`, keep enabled models with `status === 'active'` whose id contains the wanted text case-insensitively, and take the first in input order.
- `findMatches` returns every exact or alias match in input order, deduplicated.
- `parseModelsCommand` splits on whitespace. Accept `show`, `next`, `reset`, `find <ref>`, `set <tier> <light|medium|heavy|all> <ref>`. Anything else returns `{ action: 'error', error: '<usage>' }`.
- `tierTable` prints `  <n>. <name>  light=<ref> medium=<ref> heavy=<ref>` per tier. Prefix the active tier with `* ` instead of two spaces.
- `saveModelConfig` creates parent directories and writes `JSON.stringify(config, null, 2) + '\n'`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `bash tests/opencode/test-model-routing.sh`
Expected: `[PASS] model routing unit tests`.

- [ ] **Step 5: Add the test to the runner**

In `tests/opencode/run-tests.sh`, add `"test-model-routing.sh"` to `tests` and to the `--help` list.

- [ ] **Step 6: Commit**

```bash
git add src/models.js tests/opencode/test-model-routing.mjs tests/opencode/test-model-routing.sh tests/opencode/run-tests.sh
git commit -m "feat: add pure model tier logic"
```

---

### Task 2: Route dispatches in the plugin

**Files:**
- Modify: `src/superb.js`
- Create: `tests/opencode/test-tier-hooks.mjs`
- Create: `tests/opencode/test-tier-hooks.sh`
- Delete: `tests/opencode/test-dead-models.mjs`, `tests/opencode/test-dead-models.sh`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `execute.before` sets `input.model`; `execute.after` advances the session tier; the context hook injects `SUPERB TIER: <n>/<total> (<name>)`.

- [ ] **Step 1: Write the failing harness test**

Create `tests/opencode/test-tier-hooks.mjs`. Set `process.env.HOME` to a temp directory **before** importing the plugin, then write the config under `$HOME/.config/opencode/superb/models.json`.

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'superb-home-'));
process.env.HOME = home;
const cfgDir = path.join(home, '.config', 'opencode', 'superb');
fs.mkdirSync(cfgDir, { recursive: true });
fs.writeFileSync(path.join(cfgDir, 'models.json'), JSON.stringify({
  startTier: 0,
  tiers: [
    { name: 'free', model: 'opencode/one' },
    { name: 'plus', models: { light: 'openai/luna', medium: 'openai/terra', heavy: 'openai/sol' } },
    { name: 'go', model: 'opencode-go/two' },
  ],
}));

let before, after, context, synthetic;
const pluginPath = process.argv[2];
const mod = await import(pathToFileURL(fs.realpathSync(pluginPath)).href + '?t=' + Date.now());

await mod.default.setup({
  skill: { transform: async (fn) => fn({ add: () => {} }) },
  session: {
    hook: async (name, cb) => { if (name === 'context') context = cb; },
    get: async ({ sessionID }) => ({ id: sessionID }),
    synthetic: async (msg) => { synthetic = msg; },
  },
  tool: { hook: async (name, cb) => { if (name === 'execute.before') before = cb; if (name === 'execute.after') after = cb; } },
  permission: { hook: async () => {} },
  command: { transform: async (fn) => fn({ add: () => {} }) },
  model: { list: async () => ({ data: [
    { id: 'one', providerID: 'opencode', status: 'active', enabled: true },
    { id: 'two', providerID: 'opencode-go', status: 'active', enabled: true },
    { id: 'gpt-6-luna', providerID: 'openai', status: 'active', enabled: true },
    { id: 'gpt-6.1-terra', providerID: 'openai', status: 'active', enabled: true },
    { id: 'gpt-6.1-sol', providerID: 'openai', status: 'active', enabled: true },
  ] }) },
  location: { directory: home },
});

const dispatch = async (sessionID, prompt, extra = {}) => {
  const input = { prompt, ...extra };
  await before({ tool: 'subagent', sessionID, input });
  return input;
};

// 1. A marker selects the role and the model, and is stripped.
let input = await dispatch('s1', '[superb:heavy] review this');
assert.equal(input.prompt, 'review this');
assert.equal(input.model, 'opencode/one');

// 2. No marker means medium; the prompt is unchanged.
input = await dispatch('s2', 'plain work');
assert.equal(input.prompt, 'plain work');
assert.equal(input.model, 'opencode/one');

// 3. An error advances the tier, so the next dispatch uses the next model.
await after({ tool: 'subagent', sessionID: 's1', status: 'error', input: {}, error: { message: 'quota' } });
input = await dispatch('s1', '[superb:heavy] review again');
assert.equal(input.model, 'openai/gpt-6.1-sol');

// 4. Another session starts at the start tier.
input = await dispatch('s3', '[superb:light] x');
assert.equal(input.model, 'opencode/one');

// 5. The context line names the active tier and replaces the previous one.
let event = { sessionID: 's1', messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }], system: [] };
await context(event);
assert.match(event.system.map((p) => p.text).join('\n'), /SUPERB TIER: 2\/3 \(plus\)/);
event = { sessionID: 's3', messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }], system: [
  { type: 'text', text: 'SUPERB TIER: 1/3 (free)' },
] };
await context(event);
const lines = event.system.filter((p) => p.text.startsWith('SUPERB TIER:'));
assert.equal(lines.length, 1);
assert.match(lines[0].text, /1\/3 \(free\)/);

// 6. A resume keeps its model but loses the marker.
input = await dispatch('s4', '[superb:heavy] continue', { sessionID: 'child-1' });
assert.equal(input.prompt, 'continue');
assert.equal(input.model, undefined);

// 7. The last tier does not overflow.
await after({ tool: 'subagent', sessionID: 's5', status: 'error', input: {}, error: {} });
await after({ tool: 'subagent', sessionID: 's5', status: 'error', input: {}, error: {} });
await after({ tool: 'subagent', sessionID: 's5', status: 'error', input: {}, error: {} });
input = await dispatch('s5', '[superb:heavy] x');
assert.equal(input.model, 'opencode-go/two');

console.log('  [PASS] tier hooks');
```

Create the wrapper `tests/opencode/test-tier-hooks.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Test: Tier Hooks ==="
node "$SCRIPT_DIR/test-tier-hooks.mjs" "$SCRIPT_DIR/../../src/superb.js"
echo ""
echo "=== All tier hook tests passed ==="
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bash tests/opencode/test-tier-hooks.sh`
Expected: FAIL on the first `input.model` assertion.

- [ ] **Step 3: Implement the hooks in `src/superb.js`**

Import Task 1 exports. Add:

- `_modelConfig` and `getModelConfig()`: lazy `loadModelConfig()`.
- `_tierIndex: Map<string, number>`, bounded like `_todoState`. `tierIndexFor(sessionID, config)` returns the stored index or `config.startTier`. `advanceTier(sessionID, count)` sets `Math.min(current + 1, count - 1)`.
- `_catalog` promise cache. `getCatalog(ctx)` returns `null` when `ctx.model?.list` is absent, otherwise `catalogIndex(res?.data ?? res)`. Cache the promise, reset on failure.
- `modelForRole(ctx, role, sessionID)`: walk tiers from the active index to the end. Return the first `resolveModel(roleModel(tier, role), index)`. Log one line per unresolved reference. Return `null` when nothing resolves.
- `ctx.tool.hook('execute.before', ...)`: skip non-`subagent`. Parse and strip the marker. Skip model assignment when `input.sessionID` is set. Otherwise set `input.model` when a model resolves.
- Extend the existing `execute.after` handler: on `subagent` and `status === 'error'`, call `advanceTier`.
- Extend the context hook: for non-child sessions, remove every `SUPERB TIER:` part, then push `SUPERB TIER: <n>/<total> (<name>). If the last subagent dispatch failed, retry it once; the next tier will be used.`
- Delete `_deadModels`, `DEAD_MODELS_MAX`, `MODEL_ERROR_PATTERNS`, `_isModelError`, `_deadModelText`, `_deadModelsFor`, and the dead-model branch and `MODEL SKIP` injection in the context hook.
- Update `TOOL_MAPPING`'s subagent line: `subagent` takes `agent` only when a routing policy names one, never `model`.

Wrap the new hook registrations in `try/catch` with `console.error('[superb] ...', err)`, like the existing ones.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `bash tests/opencode/test-tier-hooks.sh`
Expected: `[PASS] tier hooks`.

- [ ] **Step 5: Delete the dead-model test and add the new one to the runner**

```bash
git rm tests/opencode/test-dead-models.mjs tests/opencode/test-dead-models.sh
```

Replace `"test-dead-models.sh"` with `"test-tier-hooks.sh"` in `tests/opencode/run-tests.sh` and its `--help` list.

- [ ] **Step 6: Commit**

```bash
git add src/superb.js tests/opencode/test-tier-hooks.mjs tests/opencode/test-tier-hooks.sh tests/opencode/run-tests.sh
git commit -m "feat: route subagent models from the active tier"
```

---

### Task 3: `/superb-models` command

**Files:**
- Modify: `src/superb.js`
- Modify: `tests/opencode/test-tier-hooks.mjs`

**Interfaces:**
- Consumes: Task 1 `parseModelsCommand`, `tierTable`, `saveModelConfig`, `loadModelConfig`.
- Produces: a command named `superb-models` with `execute({ prompt: { text }, sessionID })`.

- [ ] **Step 1: Extend the harness test**

Capture the command in the mock:

```js
let command;
command: { transform: async (fn) => fn({ add: (def) => { command = def; } }) },
```

Add assertions after the hook tests:

```js
assert.equal(command.name, 'superb-models');

await command.execute({ prompt: { text: '' }, sessionID: 's1' });
assert.match(synthetic.text, /1\. free/);
assert.match(synthetic.text, /\* 2\. plus/);

await command.execute({ prompt: { text: 'set 2 heavy openai/terra-latest' }, sessionID: 's1' });
input = await dispatch('s1', '[superb:heavy] x');
assert.equal(input.model, 'openai/gpt-6.1-terra', 'the edited tier 2 model is used');

await command.execute({ prompt: { text: 'next' }, sessionID: 's1' });
await command.execute({ prompt: { text: 'reset' }, sessionID: 's1' });
input = await dispatch('s1', '[superb:heavy] x');
assert.equal(input.model, 'opencode/one');

await command.execute({ prompt: { text: 'find openai/sol' }, sessionID: 's1' });
assert.match(synthetic.text, /openai\/gpt-6\.1-sol/);
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bash tests/opencode/test-tier-hooks.sh`
Expected: FAIL with `command` undefined.

- [ ] **Step 3: Implement the command**

In `src/superb.js`, register inside a `try/catch`:

```js
await ctx.command.transform((editor) => editor.add({
  name: 'superb-models',
  description: 'Show or edit the Superb model tiers',
  execute: async (invocation) => {
    const text = String(invocation?.prompt?.text ?? invocation?.arguments ?? '');
    const reply = await handleModelsCommand(ctx, parseModelsCommand(text), invocation?.sessionID);
    if (reply && typeof ctx.session?.synthetic === 'function') {
      await ctx.session.synthetic({
        sessionID: invocation.sessionID,
        text: reply,
        description: 'Superb model tiers',
        resume: false,
      });
    }
  },
}));
```

`handleModelsCommand(ctx, parsed, sessionID)`:

- `show` → `tierTable(config, tierIndexFor(sessionID, config))`.
- `set` → resolve the tier by 1-based index or name. `all` writes `tier.model = ref`; a role writes `tier.models = { ...(tier.models ?? {}), [role]: ref }`. Call `saveModelConfig(config)` and reassign `_modelConfig = loadModelConfig()`. Reply with the new table.
- `next` → `advanceTier(sessionID, config.tiers.length)`, reply with the new tier line.
- `reset` → set the session index to `config.startTier`, reply with the new tier line.
- `find` → `findMatches(parsed.ref, await getCatalog(ctx))`, one line per match, or `No matches.`.
- `error` → `parsed.error`.
- Missing config → `No Superb model config at <path>.`

- [ ] **Step 4: Run the test and confirm it passes**

Run: `bash tests/opencode/test-tier-hooks.sh`
Expected: `[PASS] tier hooks`.

- [ ] **Step 5: Commit**

```bash
git add src/superb.js tests/opencode/test-tier-hooks.mjs
git commit -m "feat: add the /superb-models command"
```

---

### Task 4: Replace the model policy in the dispatch skills

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/diagnosing-superb/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md`

**Interfaces:**
- Consumes: the marker format from Task 2.

- [ ] **Step 1: Replace the shared block**

In each file, delete the paragraph that starts `**Model roles:** Read` and ends `workers never dispatch subagents.` Replace it with:

```markdown
**Model routing:** The Superb plugin assigns the model. Do not pass `model` to a subagent. Prefix every subagent prompt with `[superb:light]`, `[superb:medium]`, or `[superb:heavy]`. The plugin strips the marker and uses the active tier's model. Light is transcription or one or two files with a clear spec. Medium is implementation, tests, and refactor. Heavy is every review, architecture, and debugging. If a dispatch fails, retry it once; the plugin advances the tier.
```

- [ ] **Step 2: Replace the remaining chain references**

- `skills/executing-plans/SKILL.md`: replace `smart chain` with `[superb:heavy]` at both places.
- `skills/writing-plans/SKILL.md`: replace `on the smart chain` with `with `[superb:heavy]``.
- Any `Model:` ledger line in these files becomes `Route: <light|medium|heavy>`.

- [ ] **Step 3: Check no old terms remain**

Run: `grep -rn "models.json\|costly\|smart chain\|MODEL SKIP" skills/brainstorming skills/diagnosing-superb skills/dispatching-parallel-agents skills/executing-plans skills/requesting-code-review skills/writing-plans`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming skills/diagnosing-superb skills/dispatching-parallel-agents skills/executing-plans skills/requesting-code-review skills/writing-plans
git commit -m "docs: route skill dispatches through role markers"
```

---

### Task 5: Replace the model policy in subagent-driven-development

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/re-review-prompt.md`
- Modify: `skills/subagent-driven-development/task-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/references/fix-loop.md`
- Modify: `skills/subagent-driven-development/references/final-review.md`
- Modify: `skills/subagent-driven-development/references/handling-reports.md`

- [ ] **Step 1: Rewrite the Model Selection section**

Replace the whole `## Model Selection` section in `SKILL.md` with:

```markdown
## Model Selection

The Superb plugin assigns the model. Do not pass `model`.

Prefix every subagent prompt with a role marker:

- `[superb:light]` — transcription, or one or two files with a clear spec.
- `[superb:medium]` — implementation, tests, refactor, and every per-task review.
- `[superb:heavy]` — architecture, debugging after two failures, and the final whole-branch review.

If a dispatch fails, retry it once. The plugin advances the tier.

The ledger records `Route: <role>`. It does not record a model ID.
```

- [ ] **Step 2: Replace the remaining chain references**

- `SKILL.md`: replace `smart chain` with `[superb:heavy]`. Remove `starts at `costly``.
- `references/fix-loop.md`: rounds 4-5 use `[superb:heavy]`.
- `references/final-review.md`: use `[superb:heavy]`.
- `references/handling-reports.md`: re-dispatch on `[superb:heavy]`.
- `implementer-prompt.md`: replace the `smart chain` sentence with `re-dispatch with `[superb:heavy]``.

- [ ] **Step 3: Remove the `[MODEL]` placeholders**

In `re-review-prompt.md` and `task-reviewer-prompt.md`, delete the `[MODEL]` placeholder line. Replace any `Model:` line in the templates with `Route: [light|medium|heavy assigned by the plugin]`. The dispatching controller passes the marker, not a model.

- [ ] **Step 4: Check no old terms remain**

Run: `grep -rn "models.json\|costly\|smart chain\|MODEL SKIP\|\[MODEL\]" skills/subagent-driven-development`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development
git commit -m "docs: route subagent-driven development through role markers"
```

---

### Task 6: Remove the old policy and guard it

**Files:**
- Delete: `skills/choosing-superb-models/`
- Delete: `tests/opencode/test-model-tiers.mjs`, `tests/opencode/test-model-tiers.sh`
- Create: `tests/opencode/test-model-policy-guard.mjs`
- Create: `tests/opencode/test-model-policy-guard.sh`
- Modify: `tests/opencode/run-tests.sh`
- Modify: `README.md`
- Modify: `docs/superb/specs/2026-10-31-superb-model-tiers-design.md`
- Modify: `package.json`

- [ ] **Step 1: Delete the old skill and test**

```bash
git rm -r skills/choosing-superb-models
git rm tests/opencode/test-model-tiers.mjs tests/opencode/test-model-tiers.sh
```

- [ ] **Step 2: Write the guard test**

Create `tests/opencode/test-model-policy-guard.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const skillsDir = path.join(root, 'skills');
const banned = ['models.json', 'costly', 'MODEL SKIP', 'smart chain', '@choosing-superb-models', 'fast.costly', 'smart.costly'];
const offenders = [];

for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(skillsDir, entry.name);
  for (const file of fs.readdirSync(dir, { recursive: true })) {
    if (!String(file).endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(dir, String(file)), 'utf8');
    for (const term of banned) {
      if (text.includes(term)) offenders.push(`${entry.name}/${file}: ${term}`);
    }
  }
}

assert.ok(!fs.existsSync(path.join(skillsDir, 'choosing-superb-models')), 'old setup skill is gone');
assert.deepEqual(offenders, [], `model policy returned to skills:\n${offenders.join('\n')}`);

const dispatchSkills = ['brainstorming', 'diagnosing-superb', 'dispatching-parallel-agents', 'executing-plans', 'requesting-code-review', 'subagent-driven-development', 'writing-plans'];
for (const name of dispatchSkills) {
  const text = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8');
  assert.ok(text.includes('[superb:'), `${name} names a role marker`);
}

console.log('  [PASS] no model policy in skills');
```

- [ ] **Step 3: Run the guard and confirm it passes**

Create `tests/opencode/test-model-policy-guard.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Test: Model Policy Guard ==="
node "$SCRIPT_DIR/test-model-policy-guard.mjs"
echo ""
echo "=== All model policy guard tests passed ==="
```

Run: `bash tests/opencode/test-model-policy-guard.sh`
Expected: `[PASS] no model policy in skills`.

- [ ] **Step 4: Update the runner**

Replace `"test-model-tiers.sh"` with `"test-model-policy-guard.sh"` in `tests/opencode/run-tests.sh` and its `--help` list.

- [ ] **Step 5: Update README**

- Remove the `**Model roles.**` bullet from "What you get".
- Replace the `## Model roles` section with:

```markdown
## Model tiers

The plugin assigns every subagent model from four tiers in spend order. Each tier is one subscription bucket. A failed dispatch advances the tier. Tiers reset each session.

`/superb-models` shows the table and edits it. The config lives at:

```
~/.config/opencode/superb/models.json
```

Models run at default effort. Model names resolve as family aliases, so a model bump needs no edit.

See [Model tiers design](docs/superb/specs/2026-11-01-plugin-model-tiers-design.md).
```

- Remove the old model-roles design link.

- [ ] **Step 6: Mark the old spec superseded**

Add this line after the title in `docs/superb/specs/2026-10-31-superb-model-tiers-design.md`:

```markdown
> Superseded by [Plugin-owned model tiers](2026-11-01-plugin-model-tiers-design.md).
```

- [ ] **Step 7: Bump the major version**

Change `package.json` `"version": "9.0.0"` to `"10.0.0"`. The config shape and the removed skill are breaking.

- [ ] **Step 8: Run the full suite**

Run: `bash tests/opencode/run-tests.sh`
Expected: every test passes, including `test-model-routing.sh`, `test-tier-hooks.sh`, and `test-model-policy-guard.sh`. No `test-model-tiers.sh` or `test-dead-models.sh` entry remains.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat!: replace model policy with plugin-owned tiers"
```

---

## Self-Review

- Spec coverage: config, aliases, hooks, command, skills, removal, tests, docs all have tasks.
- Type consistency: `roleModel`, `resolveModel`, `tierTable`, and `parseModelsCommand` are introduced in Task 1 and used with the same signatures in Tasks 2 and 3.
- Review Focus: malformed config (Task 1 test), no alias match (Task 1 test), missing host APIs (Task 2 feature detection), child session (Task 2 test), no marker (Task 2 test), resume (Task 2 test), last-tier overflow (Task 2 test).
