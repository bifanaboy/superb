# Fast and Smart Model Tiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the root agent two model roles (fast, smart), each with a paid, cheap, and free model, so every subagent dispatch falls back silently until all three fail.

**Architecture:** One global JSON config holds six model IDs. A new `superpowers-models` skill asks six questions and writes it. Four skills that dispatch subagents gain an identical `**Model roles:**` block that reads the config once per session, picks a role, and tries paid, then cheap, then free. No plugin code changes. A Node contract test pins the block and the skill in place.

**Tech Stack:** Markdown skills, Node 20 ESM test scripts, Bash wrappers.

**Spec:** `docs/superpowers/specs/2026-10-31-superpowers-model-tiers-design.md`

## Global Constraints

- Config path is exactly `~/.config/opencode/superpowers/models.json`.
- Slot names are exactly `paid`, `cheap`, `free`, under roles `fast` and `smart`.
- Slot keys written in skill text are exactly `fast.paid`, `fast.cheap`, `fast.free`, `smart.paid`, `smart.cheap`, `smart.free`.
- Model IDs only in the config. No names, costs, or timestamps.
- Any slot may be empty or absent. An empty slot is skipped.
- Chain order is `paid`, then `cheap`, then `free`. Three attempts maximum.
- The model list comes only from `tools.opencode.models({})`.
- No plugin change. No slash command. No `@` mention.
- The dispatch block in every skill begins with the literal `**Model roles:**`.
- Prose follows ASD-STE100 Simplified Technical English: short sentences, active voice, simple present.

## Review Focus

- **Empty config directory.** A fresh machine has no `~/.config/opencode/superpowers/`. The setup skill must create it. Task 2 covers this in its verification step.
- **All three slots hold the same model.** The chain then fails three times on the same error. Task 2's verification step requires the skill to warn when two slots share a model.
- **A saved model disappears.** The skill must skip it and report it at the end, not stop. Task 3 pins the skip rule; Task 7 checks the summary block exists.
- **Malformed JSON.** The dispatch skills must treat it as no config and still dispatch. Task 3 pins this.
- **Variant suffixes.** A model ID may carry a `#variant`. The setup skill must not strip it. Task 2 covers this in its verification step.

---

### Task 1: Contract test for the tier rule and the setup skill

**Files:**
- Create: `tests/opencode/test-model-tiers.mjs`
- Create: `tests/opencode/test-model-tiers.sh`
- Modify: `tests/opencode/run-tests.sh` (tests array, around line 66, and the `--help` list around line 50)

**Interfaces:**
- Consumes: nothing.
- Produces: `node tests/opencode/test-model-tiers.mjs` exits 0 when all contracts hold, 1 otherwise. Every check prints one line: `PASS <check>` or `FAIL <check>`.

- [ ] **Step 1: Write the contract test**

Create `tests/opencode/test-model-tiers.mjs`:

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const skills = path.join(repo, 'skills');

const CONFIG_PATH = '~/.config/opencode/superpowers/models.json';
const SETUP_SKILL = 'superpowers-models';
const DISPATCH_SKILLS = [
  'subagent-driven-development',
  'executing-plans',
  'requesting-code-review',
  'brainstorming',
];
const SLOT_KEYS = [
  'fast.paid', 'fast.cheap', 'fast.free',
  'smart.paid', 'smart.cheap', 'smart.free',
];
const BLOCK_ANCHOR = '**Model roles:**';

const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

const readSkill = (id) => {
  const file = path.join(skills, id, 'SKILL.md');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const setup = readSkill(SETUP_SKILL);
check(`setup skill ${SETUP_SKILL}/SKILL.md exists`, setup !== null);
if (setup) {
  check(`setup skill frontmatter name is ${SETUP_SKILL}`,
    new RegExp(`^---[\\s\\S]*?\\nname:\\s*${SETUP_SKILL}\\s*\\n[\\s\\S]*?\\n---`).test(setup));
  check('setup skill names the config path', setup.includes(CONFIG_PATH));
  check('setup skill names the six slot keys', SLOT_KEYS.every((k) => setup.includes(k)));
  check('setup skill warns the change applies next session', /next session/i.test(setup));
}

for (const id of DISPATCH_SKILLS) {
  const text = readSkill(id);
  check(`dispatch skill ${id} exists`, text !== null);
  if (!text) continue;
  check(`${id} carries the model roles block`, text.includes(BLOCK_ANCHOR));
  check(`${id} names the config path`, text.includes(CONFIG_PATH));
  check(`${id} names the chain order`, /`paid`, then `cheap`, then `free`/.test(text));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll model tier contract checks passed');
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: FAIL lines for the setup skill and for all four dispatch skills. Exit code 1.

- [ ] **Step 3: Write the shell wrapper**

Create `tests/opencode/test-model-tiers.sh`:

```bash
#!/usr/bin/env bash
# Test: model role contract (fast/smart, paid/cheap/free)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Model Role Contract ==="

node "$SCRIPT_DIR/test-model-tiers.mjs"

echo "  [PASS] Model role contract holds across the setup skill and dispatch skills"
echo ""
echo "=== All model role tests passed ==="
```

Then run: `chmod +x tests/opencode/test-model-tiers.sh`

- [ ] **Step 4: Register the test in the runner**

In `tests/opencode/run-tests.sh`, add `"test-model-tiers.sh"` to the end of the `tests=(...)` array, and add this line to the `--help` test list, next to the other entries:

```
  test-model-tiers.sh      Verify the fast/smart model role contract
```

- [ ] **Step 5: Run the wrapper and confirm the same failure**

Run: `bash tests/opencode/test-model-tiers.sh`
Expected: the same FAIL lines, non-zero exit.

- [ ] **Step 6: Commit**

```bash
git add tests/opencode/test-model-tiers.mjs tests/opencode/test-model-tiers.sh tests/opencode/run-tests.sh
git commit -m "test: add model role contract test"
```

---

### Task 2: Create the setup skill

**Files:**
- Create: `skills/superpowers-models/SKILL.md`
- Test: `tests/opencode/test-model-tiers.mjs`

**Interfaces:**
- Consumes: the contract test from Task 1.
- Produces: the config file contract every dispatch skill in Tasks 3-4 relies on — path, six slot keys, ID-only values.

- [ ] **Step 1: Run the test and note the setup-skill failures**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: FAIL lines that start with `setup skill`.

- [ ] **Step 2: Write the skill**

Create `skills/superpowers-models/SKILL.md` with this content:

````markdown
---
name: superpowers-models
description: Use when the user wants to set up, change, or review the Superpowers model roles (fast and smart), for example "let's set up my superpowers models".
---

# Superpowers Model Roles

Set the six models that Superpowers uses for subagents.

## What this sets

Two roles. Each role has three slots.

| Slot key | Use |
|---|---|
| `fast.paid` | First try for fast work |
| `fast.cheap` | Second try for fast work |
| `fast.free` | Third try for fast work |
| `smart.paid` | First try for smart work |
| `smart.cheap` | Second try for smart work |
| `smart.free` | Third try for smart work |

Fast work is transcription, or 1-2 files with a clear spec. Smart work is
everything else, including every review, architecture, and debugging.

## Config file

Path: `~/.config/opencode/superpowers/models.json`

```json
{
  "fast": { "paid": "provider/model", "cheap": "provider/model", "free": "provider/model" },
  "smart": { "paid": "provider/model", "cheap": "provider/model", "free": "provider/model" }
}
```

Rules:
- Store model IDs only. Do not store names, costs, or timestamps.
- Keep any `#variant` suffix on the ID.
- Any slot may stay empty. An empty slot is skipped.
- A missing or broken file counts as no config.

## Steps

1. Read the config file if it exists. If it is broken, say so and start fresh.
2. Call `tools.opencode.models({})` with no provider filter. This is the only source of selectable models.
3. Ask the six questions below, one at a time, in order.
4. Write the file. Create `~/.config/opencode/superpowers/` when it is missing.
5. Tell the user the change applies next session, because the dispatch skills read the config once per session.

## The six questions

Ask in this order: `fast.paid`, `fast.cheap`, `fast.free`, `smart.paid`,
`smart.cheap`, `smart.free`.

For each question:
- Show the current value first, marked as current. A plain yes keeps it.
- Show each choice as name, provider, and ID.
- Let the user leave the slot empty.

## Re-running

When a value already exists, show it first and keep it on a plain yes. Ask
only for the six slots, in the same order every time.

## Warnings

- If two slots hold the same model, say so. The chain then repeats one
  failure three times.
- If a saved model is absent from `tools.opencode.models({})`, say so and
  offer a replacement.
````

- [ ] **Step 3: Run the test and confirm the setup checks pass**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: every `setup skill` line now prints PASS. The four dispatch-skill checks still FAIL.

- [ ] **Step 4: Commit**

```bash
git add skills/superpowers-models/SKILL.md
git commit -m "feat: add superpowers-models setup skill"
```

---

### Task 3: Replace the model section in subagent-driven-development

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (Model Selection section, lines 139-187)
- Test: `tests/opencode/test-model-tiers.mjs`

**Interfaces:**
- Consumes: the config contract from Task 2.
- Produces: the canonical `**Model roles:**` block, reused verbatim by Tasks 4-6.

- [ ] **Step 1: Confirm the current failure**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: FAIL for `subagent-driven-development`.

- [ ] **Step 2: Replace the discovery and rotation paragraphs**

In `skills/subagent-driven-development/SKILL.md`, delete everything from
`**Always specify the model explicitly when dispatching a subagent.**` down
to the end of the `**Model errors and rotation...**` list (the block that
ends `Record the initial model choice and all rotations in the ledger.`).

Put this block in its place:

```markdown
**Model roles:** Read `~/.config/opencode/superpowers/models.json` once per session. Pick a role: **fast** for transcription, or 1-2 files with a clear spec; **smart** for everything else, including every review, architecture, and debugging. For that role, try `paid`, then `cheap`, then `free` — three attempts at most. Skip an empty slot, or a model absent from `tools.opencode.models({})`. If all three fail, stop and ask your human partner. If the config is missing or broken, dispatch with your own model ID, passed explicitly. Always pass a model ID; an omitted model inherits your session's model. Record `Model: <id> (role: fast|smart, slot: paid|cheap|free)` in the ledger, and one ruling line per fallback. At the end of the task, list config problems in one summary block and name "let's set up my superpowers models". Fix-loop rounds 4-5 use the smart chain; there is no role above smart. This rule is for you, the root agent: workers never dispatch subagents.
```

- [ ] **Step 3: Fix the two stale sentences above that block**

Change `The final whole-branch review is one of these — dispatch it on the most
capable available model, not the session default.` to
`The final whole-branch review is one of these — dispatch it on the smart chain.`

Change `**Fix-loop escalation (rounds 4-5)**: use a model at least one tier above
the implementer that got stuck.` to
`**Fix-loop escalation (rounds 4-5)**: use the smart chain. There is no role above smart.`

- [ ] **Step 4: Run the test and confirm this skill passes**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: the three `subagent-driven-development` lines print PASS. The other three dispatch skills still FAIL.

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: use fast and smart model roles in subagent-driven-development"
```

---

### Task 4: Add the rule to the other three dispatch skills

**Files:**
- Modify: `skills/executing-plans/SKILL.md` (around lines 236-250)
- Modify: `skills/requesting-code-review/SKILL.md` (around line 32)
- Modify: `skills/brainstorming/SKILL.md` (around line 228)
- Test: `tests/opencode/test-model-tiers.mjs`

**Interfaces:**
- Consumes: the canonical block from Task 3, verbatim.
- Produces: nothing new.

- [ ] **Step 1: Confirm the current failures**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: FAIL for `executing-plans`, `requesting-code-review`, and `brainstorming`.

- [ ] **Step 2: Add the block to executing-plans**

Insert the Task 3 block verbatim into `skills/executing-plans/SKILL.md`,
directly above the line that starts
`**With a subagent tool:** dispatch the reviewer on the most capable`.

Then change that line to start
`**With a subagent tool:** dispatch the reviewer on the smart chain — the`.

- [ ] **Step 3: Add the block to requesting-code-review**

Insert the Task 3 block verbatim into `skills/requesting-code-review/SKILL.md`,
directly above the line `**2. Dispatch code reviewer subagent:**`.

- [ ] **Step 4: Add the block to brainstorming**

Insert the Task 3 block verbatim into `skills/brainstorming/SKILL.md`,
directly above the line `**Builder check** (for a project): dispatch a fresh subagent with`.

The builder check is a judgment task, so it takes the smart chain.

- [ ] **Step 5: Run the test and confirm all four skills pass**

Run: `node tests/opencode/test-model-tiers.mjs`
Expected: every line prints PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/executing-plans/SKILL.md skills/requesting-code-review/SKILL.md skills/brainstorming/SKILL.md
git commit -m "feat: use fast and smart model roles in the remaining dispatch skills"
```

---

### Task 5: Full verification and documentation

**Files:**
- Modify: `README.md` (a short section on model roles)
- Test: `tests/opencode/`

**Interfaces:**
- Consumes: every earlier task.
- Produces: nothing new.

- [ ] **Step 1: Run the whole test suite**

Run: `bash tests/opencode/run-tests.sh`
Expected: `Passed: 5`, `Failed: 0`, `STATUS: PASSED`.

- [ ] **Step 2: Check the five Review Focus items by hand**

Read the new skill and the four dispatch skills. Confirm each item:
- The setup skill creates `~/.config/opencode/superpowers/` when missing.
- The setup skill warns when two slots hold the same model.
- The dispatch block skips a model that is absent from the model list.
- The dispatch block treats malformed JSON as no config and still dispatches.
- The setup skill keeps a `#variant` suffix.

- [ ] **Step 3: Document the feature**

Add this section to `README.md`, above `## Autonomous mode`:

```markdown
## Model roles

Superpowers gives every subagent a role: **fast** for transcription, or a
**smart** role for judgment work. Each role has a paid, a cheap, and a free
model. Set them once by saying "let's set up my superpowers models". The
config lives at `~/.config/opencode/superpowers/models.json`. If a model
fails, the next slot is tried. You only hear about it when all three fail.

See `docs/superpowers/specs/2026-10-31-superpowers-model-tiers-design.md`.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe fast and smart model roles"
```
