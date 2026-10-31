# OpenCode 2 Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superb:subagent-driven-development (recommended) or superb:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the OpenCode 1.x code path and make the remaining tool mapping correct, including `todowrite`.

**Architecture:** The plugin keeps only the V2 default export `{ id, setup }`. One exported `TOOL_MAPPING` constant replaces `V1_MAPPING` and `V2_MAPPING`. Both Node test scripts drive `setup()` and its `context` hook only. The install doc and README describe OpenCode 2.0.4 or later. The package version becomes `8.0.0`.

**Tech Stack:** Node 20 ESM, Bash test wrappers, Markdown skills.

**Spec:** `docs/superb/specs/2026-10-31-opencode2-only-design.md`

## Global Constraints

- Target host is OpenCode 2.0.4 or later. The reference host is 2.2.5.
- `todowrite` exists only when `experimental.todo` is true. The mapping must say what to do when it is absent.
- Exactly one exported mapping constant, named `TOOL_MAPPING`.
- The default export is exactly `{ id: 'superb', setup }`.
- No named export `SuperbPlugin`. No `V1_MAPPING`. No `server` field.
- `package.json` version is exactly `8.0.0`.
- Prose follows ASD-STE100 Simplified Technical English: short sentences, active voice, simple present.

## Review Focus

- **Todo tool disabled.** `experimental.todo` is absent, so `todowrite` does not exist. The mapping must tell the agent to fall back to the ledger. Task 1 pins the fallback words.
- **Plugin loaded on OpenCode 1.x.** `setup()` gets a V1-shaped context. The `try` / `catch` blocks must catch the errors, log them, and not crash the host. Task 2 keeps both blocks and verifies the failure path.
- **`using-superb/SKILL.md` missing.** No bootstrap is injected, nothing crashes, and the missing result is cached. Task 2 keeps the missing-file scenario.
- **Child session lookup throws or returns a bad record.** The hook fails open (injects the bootstrap) and does not cache the failure. Task 2 keeps the recovery cases.
- **Default export contract.** `index.js` re-exports the default. The default has only `id` and `setup`. Task 2 asserts the shape, and the skill-registration test loads the module.

---

### Task 1: Map todos to `todowrite`

**Files:**
- Modify: `tests/opencode/test-bootstrap-caching.mjs` (mapping assertions)
- Modify: `.opencode/plugins/superb.js:97`
- Modify: `.opencode/INSTALL.md:153`

**Interfaces:**
- Consumes: nothing.
- Produces: `V2_MAPPING` teaches `` `todowrite` ``. Task 2 renames this constant to `TOOL_MAPPING` and keeps the line.

- [ ] **Step 1: Write the failing test**

In `tests/opencode/test-bootstrap-caching.mjs`, make these four edits.

Change the `result` field (around line 67) from:

```js
  mapsV2NoTodoTool: v2Result.text.includes('no todo tool'),
```

to:

```js
  mapsV2TodoTool: v2Result.text.includes('`todowrite`'),
```

Change the stale check (around line 70) from:

```js
  staleV1ToolsInV2: v2Result.text.includes('`apply_patch`') || v2Result.text.includes('`todowrite`') || v2Result.text.includes('`subagent_type`'),
```

to:

```js
  staleV1ToolsInV2: v2Result.text.includes('`apply_patch`') || v2Result.text.includes('`subagent_type`'),
```

In `assertMappingConstants`, replace the `'no todo tool',` entry with:

```js
    '`todowrite`',
```

and change the stale loop from:

```js
  for (const stale of ['`todowrite`', '`task` with', '`apply_patch`', '`bash`']) {
```

to:

```js
  for (const stale of ['`task` with', '`apply_patch`', '`bash`']) {
```

In `assertV2Bootstrap`, replace:

```js
  if (!result.mapsV2NoTodoTool) {
    failures.push('expected V2 bootstrap to state that V2 has no todo tool');
  }
```

with:

```js
  if (!result.mapsV2TodoTool) {
    failures.push('expected V2 bootstrap to map todos to todowrite');
  }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/opencode/test-bootstrap-caching.sh`

Expected: FAIL with `expected V2 bootstrap to map todos to todowrite`.

- [ ] **Step 3: Fix the mapping**

In `.opencode/plugins/superb.js`, replace the todo line of `V2_MAPPING`:

```
- Create or update todos → OpenCode v2 has no todo tool; track the plan in a markdown file (or the harness's plan facility) instead
```

with:

```
- Create or update todos → \`todowrite\` (when \`experimental.todo\` is enabled; otherwise track the plan in the ledger)
```

Keep the JavaScript template-literal escaping (`\``) around the tool names.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/opencode/test-bootstrap-caching.sh`

Expected: PASS for both the `present` and `missing` scenarios.

- [ ] **Step 5: Update the install doc**

In `.opencode/INSTALL.md`, replace:

```
- "Create a todo" → V2 has no todo tool; track the plan in a markdown file instead
```

with:

```
- "Create a todo" → `todowrite` (when `experimental.todo` is enabled; otherwise track the plan in the ledger)
```

- [ ] **Step 6: Commit**

```bash
git add .opencode/plugins/superb.js .opencode/INSTALL.md tests/opencode/test-bootstrap-caching.mjs
git commit -m "fix: map todos to todowrite on OpenCode 2"
```

---

### Task 2: Remove the OpenCode V1 path

**Files:**
- Modify: `tests/opencode/test-bootstrap-caching.mjs`
- Modify: `tests/opencode/test-session-bootstrap.mjs`
- Modify: `.opencode/plugins/superb.js`

**Interfaces:**
- Consumes: the mapping line from Task 1.
- Produces: `TOOL_MAPPING` (exported string), `default` export `{ id: 'superb', setup }`. No `SuperbPlugin`, no `V1_MAPPING`, no `server`.

- [ ] **Step 1: Rewrite the bootstrap-caching harness to use `setup()` only**

In `tests/opencode/test-bootstrap-caching.mjs`, replace the block from `const mod = await import(...)` through the two `transform` snapshots with:

```js
const mod = await import(pathToFileURL(pluginPath).href);

const moduleShape = {
  hasV1Plugin: typeof mod.SuperbPlugin !== 'undefined',
  hasV1Mapping: typeof mod.V1_MAPPING !== 'undefined',
  hasServerExport: typeof mod.default?.server !== 'undefined',
  hasToolMapping: typeof mod.TOOL_MAPPING === 'string',
  serverHidden: !('server' in (mod.default || {})),
};

const mappingFailures = assertMappingConstants(mod);

const invoke = await makeContextHarness(mod);
const baseline = { existsCount, readCount };

const firstEvent = makeEvent(`${scenario} bootstrap first step`);
await invoke(firstEvent);
const afterFirst = { existsCount, readCount };

const secondEvent = makeEvent(`${scenario} bootstrap second step`);
await invoke(secondEvent);
const afterSecond = { existsCount, readCount };
```

Add these helpers next to `makeOutput`:

```js
async function makeContextHarness(mod) {
  let contextHook = null;
  await mod.default.setup({
    skill: {
      transform: async (fn) => {
        fn({ add: () => {} });
      },
    },
    session: {
      hook: async (name, cb) => {
        if (name === 'context') contextHook = cb;
      },
      get: async ({ sessionID }) => ({ id: sessionID }), // top-level: no parentID
    },
  });
  if (typeof contextHook !== 'function') {
    throw new Error('setup() did not register a context hook');
  }
  return (event) => contextHook(event);
}

function makeEvent(text) {
  return {
    sessionID: 'sess-bootstrap-caching',
    messages: [{ role: 'user', content: [{ type: 'text', text }] }],
  };
}

function countBootstrapParts(event) {
  return event.messages
    .flatMap((message) => message.content ?? message.parts ?? [])
    .filter((part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'))
    .length;
}

function bootstrapText(event) {
  return event.messages
    .flatMap((message) => message.content ?? message.parts ?? [])
    .find((part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'))?.text || '';
}
```

Delete `makeOutput` and the old `countBootstrapParts(output)` / `bootstrapText(output)` bodies. Delete `runV2ContextHook` and its `v2BootstrapParts` wiring.

Build the `result` object from the new numbers. The read and exists counts are deltas:

```js
const result = {
  scenario,
  moduleShape,
  firstBootstrapParts: countBootstrapParts(firstEvent),
  secondBootstrapParts: countBootstrapParts(secondEvent),
  firstReads: afterFirst.readCount - baseline.readCount,
  secondReads: afterSecond.readCount - afterFirst.readCount,
  firstExists: afterFirst.existsCount - baseline.existsCount,
  secondExists: afterSecond.existsCount - afterFirst.existsCount,
  bootstrap: bootstrapText(firstEvent),
  mapsTodo: bootstrapText(firstEvent).includes('`todowrite`'),
  mapsSubagent: bootstrapText(firstEvent).includes('`subagent` with `agent: "general"`'),
  mapsSessionID: bootstrapText(firstEvent).includes('`sessionID` to continue a previous subagent'),
  mapsPatch: bootstrapText(firstEvent).includes('`patch` with `patchText`'),
  mapsShell: bootstrapText(firstEvent).includes('`shell`'),
  staleMentionMapping: bootstrapText(firstEvent).includes('@mention'),
  staleTaskMapping: bootstrapText(firstEvent).includes('`Task` tool with subagents'),
  staleV1Tools: ['`apply_patch`', '`subagent_type`', '`task` with'].some(
    (needle) => bootstrapText(firstEvent).includes(needle)
  ),
};
```

Replace `assertPresentBootstrap`, `assertMissingBootstrap`, `assertV2Bootstrap`, and `assertMappingConstants` with these rules. Keep one `failures` array and one exit path.

`assertModuleShape(result.moduleShape)` fails when any of these is true:

```js
[
  ['hasV1Plugin', 'expected no SuperbPlugin named export'],
  ['hasV1Mapping', 'expected no V1_MAPPING export'],
  ['hasServerExport', 'expected no server field on the default export'],
]
```

and fails when `hasToolMapping` is false or `serverHidden` is false.

`assertPresentBootstrap(result)` fails when:

- `firstBootstrapParts !== 1`
- `secondBootstrapParts !== 1`
- `firstReads !== 1`
- `secondReads !== 0`
- `secondExists !== 0`
- `staleMentionMapping` or `staleTaskMapping` is true
- `!mapsTodo`, `!mapsSubagent`, `!mapsSessionID`, `!mapsPatch`, or `!mapsShell`
- `staleV1Tools` is true

`assertMissingBootstrap(result)` fails when:

- `firstBootstrapParts !== 0`
- `secondBootstrapParts !== 0`
- `firstReads !== 0` or `secondReads !== 0`
- `firstExists < 1`
- `secondExists !== 0`

`assertMappingConstants(mod)` checks `mod.TOOL_MAPPING` for these needles:

```js
['`todowrite`', '`subagent` with `agent: "general"`', '`sessionID` to continue a previous subagent', '`write`', '`edit`', '`patch` with `patchText`', '`shell`', '`read`', '`grep`, `glob`', '`webfetch`', '`websearch`']
```

and fails when it contains any of:

```js
['`task` with', '`apply_patch`', '`bash`', 'no todo tool']
```

- [ ] **Step 2: Rewrite the session test to one V2 harness**

In `tests/opencode/test-session-bootstrap.mjs`:

1. Change `reply(flavor, session)` to `reply(session)` and return `session`.
2. Change `makeEvent(flavor, sessionID)` to `makeEvent(sessionID)` and always use `{ role: 'user', content: [text] }`.
3. Change `makeHarness(flavor, fetchSession)` to `makeHarness(fetchSession)`. Delete the `if (flavor === 'v1')` branch. Keep the V2 `mod.default.setup(...)` branch.
4. Delete the outer `for (const flavor of ['v1', 'v2']) {` loop and its closing brace, and dedent the body by two spaces.
5. Replace `${flavor}-${kind}` with `${kind}`.
6. Replace `if (flavor === 'v2' && kind === 'child')` with `if (kind === 'child')`.
7. Delete the `if (flavor === 'v1') { failures.push(['resolved-http-error', ...]); }` block.
8. Replace every `makeHarness('v2', ...)` with `makeHarness(...)`.
9. Keep the compaction, retained-user, eviction, and lookup-failure cases unchanged in behaviour.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `bash tests/opencode/test-bootstrap-caching.sh` and `bash tests/opencode/test-session-bootstrap.sh`

Expected: FAIL. The bootstrap test reports the missing `SuperbPlugin` or `TOOL_MAPPING` shape, and the session test fails because `TOOL_MAPPING` is absent or the old module has no `setup`-only contract.

- [ ] **Step 4: Remove V1 from the plugin**

In `.opencode/plugins/superb.js`:

1. Delete `V1_MAPPING`. Rename `V2_MAPPING` to `TOOL_MAPPING` and export it.
2. Replace the header comment that says "Dual-compatible with OpenCode V1 and V2" with a comment that says the plugin targets OpenCode 2.0.4 or later.
3. Delete the entire `SuperbPlugin` export, including the `config` hook and the `experimental.chat.messages.transform` hook.
4. In `setup`, delete the guard:

```js
  if (!ctx || !ctx.skill || typeof ctx.skill.transform !== 'function' || !ctx.session || typeof ctx.session.hook !== 'function') {
    return;
  }
```

5. In `setup`, change `getBootstrapContent(V2_MAPPING)` to `getBootstrapContent(TOOL_MAPPING)`.
6. In `isChildSession`, delete the V1 envelope branch. The body becomes:

```js
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error('Session lookup returned no usable record');
    }
    if (result.id !== sessionID) {
      throw new Error('Session lookup returned an invalid session identity');
    }
    if (result.parentID !== undefined &&
        (typeof result.parentID !== 'string' || result.parentID.length === 0)) {
      throw new Error('Session lookup returned an invalid parent identity');
    }
    isChild = result.parentID !== undefined;
```

7. Replace `_bootstrapCache` (a `Map`) and its `has` / `set` calls with one variable:

```js
let _bootstrapCache;
```

Return it when it is not `undefined`; store `null` for a missing file and the string otherwise.

8. Change the default export to:

```js
export default {
  id: 'superb',
  setup,
};
```

9. Delete the doc comments that describe V1 loading, `server`, and `messages.transform`.

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
node --check .opencode/plugins/superb.js
bash tests/opencode/test-bootstrap-caching.sh
bash tests/opencode/test-session-bootstrap.sh
bash tests/opencode/test-skill-registration.sh
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add .opencode/plugins/superb.js tests/opencode/test-bootstrap-caching.mjs tests/opencode/test-session-bootstrap.mjs
git commit -m "refactor: drop the OpenCode V1 code path"
```

---

### Task 3: Update docs and version

**Files:**
- Modify: `.opencode/INSTALL.md`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: the single-host behaviour from Task 2.
- Produces: docs that describe OpenCode 2.0.4 or later, and version `8.0.0`.

- [ ] **Step 1: Rewrite the install doc**

In `.opencode/INSTALL.md`:

1. Replace "OpenCode V2 requires version 2.0.4 or later." with "OpenCode 2.0.4 or later is required."
2. Delete the `### OpenCode V1` section and its JSON block (lines 11–19). Delete the `### OpenCode V2 (2.0.4 or later)` heading (line 21). Keep the JSON block that follows.
3. Replace "For a local V2 installation" with "For a local installation".
4. Replace "Restart OpenCode. V2 uses the `opencode` command; `opencode2` may be available as an alias. The plugin installs through OpenCode's plugin manager and registers all skills." with "Restart OpenCode. The plugin installs through OpenCode's plugin manager and registers all skills."
5. In "Updating", replace "(same form for the V1 `plugin` key and the V2 `plugins` key)" with "(use the `plugins` key)".
6. Change the pin example key from `"plugin"` to `"plugins"`.
7. Delete the sentence "On V2, pin `v6.4.1` or later; `v6.3.0` and earlier releases load only on V1."
8. In "Plugin not loading", delete the V1 log sentence. Start with "Check logs. OpenCode loads plugins in the background server, so add `--standalone`:" and keep the rest.
9. In "Windows install issues", replace "for your OpenCode version" with nothing. Delete the `**V1:**` block and its JSON. Rename `**V2 (2.0.4 or later):**` to `**Example:**`.
10. In "Tool mapping", replace "The plugin injects a flavor-specific mapping — check your OpenCode version:" with "The plugin injects this mapping:". Delete the `**V1 (`opencode` 1.x):**` list and the `**V2 (...)**` label. Keep one list.

- [ ] **Step 2: Update the README**

In `README.md`, change "Personal, opencode-only fork of Superb. Skills + bootstrap for OpenCode." to "Personal fork of Superb for OpenCode 2.0.4 or later. Skills and bootstrap for OpenCode."

- [ ] **Step 3: Bump the version**

In `package.json`, change `"version": "7.0.1"` to `"version": "8.0.0"`.

- [ ] **Step 4: Run the full test suite**

Run: `bash tests/opencode/run-tests.sh`

Expected: all suites pass.

- [ ] **Step 5: Check for leftover V1 references**

Run:

```bash
grep -rn "V1\|1\.18\|no todo tool" .opencode tests skills README.md
```

Expected: no output. ("v6.4.1" and similar version strings are gone with the V1 text. "OpenCode 2.0.4" is a version floor, not a V1 reference.)

- [ ] **Step 6: Commit**

```bash
git add .opencode/INSTALL.md README.md package.json
git commit -m "docs: describe OpenCode 2 only and bump to 8.0.0"
```
