# Remove Model Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superb:subagent-driven-development (recommended) or superb:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every model-routing and model-mapping feature from Superb. Subagents inherit the host model.

**Architecture:** Delete the dead-model machinery from the plugin, strip model policy from the skills, and add a guard test.

**Tech Stack:** Node 22, ESM, no dependencies.

**Spec:** `docs/superb/specs/2026-11-01-remove-model-routing-design.md`

## Global Constraints

- No model IDs, model roles, tiers, aliases, or fallback chains in `skills/` or `src/`.
- No `models.json`, no `/superb-models`, no `choosing-superb-models` skill.
- The plugin keeps its todo, bootstrap, and permission features.
- Existing comments stay unless the code they describe is deleted.

## Review Focus

- **Plugin still loads.** Removing the dead-model code must not break `setup()`.
- **Skills still dispatch.** The new one-line policy must be present in every dispatch skill.
- **Guard test catches regressions.** A stray `models.json` or `costly` fails the suite.
- **No orphan references.** `run-tests.sh`, README, and docs must not name deleted files.

---

### Task 1: Remove dead-model tracking from the plugin

**Files:**
- Modify: `src/superb.js`
- Modify: `tests/opencode/test-dead-models.mjs`

**Interfaces:**
- Consumes: the existing plugin setup.
- Produces: a context hook that never emits `MODEL SKIP`.

- [ ] **Step 1: Rewrite the test to assert absence**

Replace `tests/opencode/test-dead-models.mjs` with:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'superb-neutral-'));
process.env.HOME = home;

const [, , inputPath] = process.argv;
const pluginURL = pathToFileURL(fs.realpathSync(inputPath));

async function makeHarness({ parentID } = {}) {
  const mod = await import(`${pluginURL.href}?neutral-test=${Math.random()}`);
  let contextHook;
  let afterHook;
  await mod.default.setup({
    skill: { transform: async (fn) => fn({ add: () => {} }) },
    session: {
      hook: async (name, cb) => { if (name === 'context') contextHook = cb; },
      get: async ({ sessionID }) => ({ id: sessionID, ...(parentID ? { parentID } : {}) }),
    },
    tool: { hook: async (name, cb) => { if (name === 'execute.after') afterHook = cb; } },
    permission: { hook: async () => {} },
  });
  return {
    fail: async (model, sessionID = 's1') => afterHook({
      tool: 'subagent', sessionID, status: 'error',
      input: { model }, error: { message: 'subscription_sharing_usage_limit_exceeded' },
    }),
    context: async (sessionID = 's1') => {
      const event = {
        sessionID,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }],
        system: [],
      };
      await contextHook(event);
      return (event.system ?? []).filter((p) => p.type === 'text' && p.text.startsWith('MODEL SKIP'));
    },
  };
}

{
  const h = await makeHarness();
  await h.fail('openai/gpt-6.1-sol');
  assert.deepEqual(await h.context(), [], 'a failed dispatch must not inject MODEL SKIP');
  console.log('  [PASS] no dead-model tracking');
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bash tests/opencode/test-dead-models.sh`
Expected: FAIL, because the plugin still emits `MODEL SKIP`.

- [ ] **Step 3: Remove the dead-model code**

In `src/superb.js`:

- Delete `DEAD_MODELS_MAX`, `MODEL_ERROR_PATTERNS`, `_deadModels`, `_deadModelsFor`, `_isModelError`, `_deadModelText`, and the subagent branch in `execute.after`.
- Delete the `MODEL SKIP` injection from the `context` hook.
- Keep the todo state, the context hook, the bootstrap, and the permission gate.
- Remove the `TODO BLOCK` path's use of `_deadModels` only; leave todo tracking untouched.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `bash tests/opencode/test-dead-models.sh`
Expected: `[PASS] no dead-model tracking`.

- [ ] **Step 5: Commit**

```bash
git add src/superb.js tests/opencode/test-dead-models.mjs
git commit -m "feat: remove dead-model tracking from the plugin"
```

---

### Task 2: Remove model policy from skills and naming

**Files:**
- Delete: `skills/choosing-superb-models/`
- Modify: all files under `skills/` that contain model policy
- Modify: `tests/opencode/test-subagent-naming.mjs`

- [ ] **Step 1: Write the policy guard test**

Create `tests/opencode/test-no-model-policy.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const banned = ['models.json', 'costly', 'MODEL SKIP', 'smart chain', '@choosing-superb-models', 'fast.costly', 'smart.costly', 'Model roles:', 'Model selection:'];
const offenders = [];

for (const rel of ['skills', 'src']) {
  const base = path.join(root, rel);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js') && !entry.name.endsWith('.md')) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const term of banned) {
        if (text.includes(term)) offenders.push(`${path.relative(root, full)}: ${term}`);
      }
    }
  };
  walk(base);
}

assert.ok(!fs.existsSync(path.join(root, 'skills', 'choosing-superb-models')), 'choosing skill must be gone');
assert.deepEqual(offenders, [], `model policy remains:\n${offenders.join('\n')}`);
console.log('  [PASS] no model policy in skills or src');
```

Create `tests/opencode/test-no-model-policy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Test: No Model Policy ==="
node "$SCRIPT_DIR/test-no-model-policy.mjs"
echo ""
echo "=== All no-model-policy tests passed ==="
```

- [ ] **Step 2: Run the guard and confirm it fails**

Run: `bash tests/opencode/test-no-model-policy.sh`
Expected: FAIL with a list of offenders.

- [ ] **Step 3: Delete the choosing skill**

```bash
git rm -r skills/choosing-superb-models
```

- [ ] **Step 4: Remove the policy from every skill**

For each file under `skills/` that contains `**Model roles:**`, delete the whole paragraph from `**Model roles:**` to the next blank line. Replace it with:

```markdown
**Model selection:** Do not choose or pass a model. Dispatch every subagent without `model`; the host or an installed routing plugin decides.
```

Remove any `## Model Selection` section whose body is only role guidance. Remove every sentence containing `smart chain`, `costly`, `cheap`, or `free model`. Remove `[MODEL]` placeholder lines. Remove `Model:` ledger lines.

The dispatch skills must still contain the sentence `Do not choose or pass a model.`

- [ ] **Step 5: Fix the naming rule**

In `skills/using-superb/SKILL.md`, replace:

```
Name every subagent `<Smart|Fast> agent — <task>`, using the model role you chose. The harness appends the model. Do not put a model ID in the description.
```

with:

```
Name every subagent for its task. Do not put a model ID in the description.
```

Update `tests/opencode/test-subagent-naming.mjs` to check for `Name every subagent for its task` and to drop the `Smart|Fast` prefix assertion.

- [ ] **Step 6: Run the guard and confirm it passes**

Run: `bash tests/opencode/test-no-model-policy.sh`
Expected: `[PASS] no model policy in skills or src`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: remove model policy from skills"
```

---

### Task 3: Docs, README, version, and cleanup

**Files:**
- Modify: `README.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/superb/specs/2026-10-31-superb-model-tiers-design.md`
- Delete: `docs/superb/specs/2026-11-01-plugin-model-tiers-design.md`
- Delete: `docs/superb/plans/2026-11-01-plugin-model-tiers.md`
- Modify: `package.json`
- Modify: `tests/opencode/run-tests.sh`

- [ ] **Step 1: Update README**

Delete the `**Model roles.**` bullet. Replace the `## Model roles` section with:

```markdown
## Models

Superb does not choose models. Subagents inherit the host model, or the model set by an installed routing plugin.
```

Remove the `Model roles design` link.

- [ ] **Step 2: Update INSTALL.md**

Remove the paragraph about moving `models.json` from the old config folder. Keep the rest.

- [ ] **Step 3: Clean up docs**

Delete `docs/superb/specs/2026-11-01-plugin-model-tiers-design.md` and `docs/superb/plans/2026-11-01-plugin-model-tiers.md`. Add a superseded line to `docs/superb/specs/2026-10-31-superb-model-tiers-design.md`:

```markdown
> Superseded. Superb no longer owns model selection.
```

- [ ] **Step 4: Bump the major version**

Change `package.json` `"version": "9.0.0"` to `"10.0.0"`.

- [ ] **Step 5: Update the runner**

Replace `"test-dead-models.sh"` with `"test-no-model-policy.sh"` in `tests/opencode/run-tests.sh` and its `--help` list.

- [ ] **Step 6: Run the full suite**

Run: `bash tests/opencode/run-tests.sh`
Expected: all tests pass. No `test-model-tiers`, `test-dead-models`, or `test-model-routing` entries remain.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat!: remove model routing from Superb"
```

---

## Self-Review

- Spec coverage: plugin code, skills, naming, docs, tests, and version all have tasks.
- Type consistency: no new exports; the plugin shrinks.
- Review Focus: plugin loading (Task 1 test), skill dispatch (guard test), guard (Task 2), orphan references (Task 3 grep).
