# OpenCode 2 only, with a correct todo mapping

## Intent

The plugin has two hosts to serve: OpenCode 1.x and OpenCode 2.x. The user runs only OpenCode 2.2.5 or later. The V1 code path is dead weight, and it holds a stale tool mapping that says V2 has no todo tool. OpenCode 2 has the `todowrite` tool when `experimental.todo` is true. This change deletes the V1 path and makes the remaining mapping correct.

## Goals

- One tool mapping, for OpenCode 2 only.
- `todowrite` replaces the "no todo tool" line.
- The plugin exports `{ id, setup }` only.
- The test suite drives the V2 path only.
- The install doc describes OpenCode 2 only.
- The package version is `8.0.0`, because a supported host is dropped.

## Non-goals

- No rewrite of skill text to name tools directly. The mapping stays as the single place that binds actions to tools.
- No plugin-wide rename to "superb" (issue #10).
- No change to the model-role rules.
- No new features in the plugin.

## Approaches considered

1. **Fix the todo line only.** Three files, low risk. It leaves the V1 path in place, and the next change to the mapping pays the same test-editing cost again. Rejected: the user confirmed V1 is not needed.
2. **Fix the todo line and remove V1 (chosen).** One mapping constant, one host, one test path. It deletes about 250 lines.
3. **Remove V1 and rewrite every skill to name native tools.** Removes the mapping, but spreads host detail across 17 skills and makes each skill harder to move to another harness later. Rejected.

## Design

### Tool mapping

One exported constant, `TOOL_MAPPING`, replaces `V1_MAPPING` and `V2_MAPPING`. Its todo line is:

```
- Create or update todos → `todowrite` (when `experimental.todo` is enabled; otherwise track the plan in the ledger)
```

All other lines keep the V2 values from the current `V2_MAPPING`.

### Plugin surface

`.opencode/plugins/superpowers.js` keeps only the V2 code:

- Delete the named export `SuperpowersPlugin`.
- Delete the `config` hook that adds `config.skills.paths`.
- Delete the `experimental.chat.messages.transform` hook.
- Delete `server` from the default export. The default export is `{ id, setup }`.
- Delete the V1 branch in `isChildSession` that unwraps `result.data` and checks `result.error` / `result.response.ok`. Keep the record validation for `id` and `parentID`.
- Delete the V1 detection guard at the top of `setup`. The existing `try` / `catch` blocks stay and log a failure instead of crashing the host.
- Replace `_bootstrapCache`, a `Map` keyed by mapping, with a single cached value: `undefined` means not read yet, `null` means the file is missing.

### Tests

- `tests/opencode/test-bootstrap-caching.mjs`: drive `setup()` and the captured `context` hook for the read-count checks. Assert that `SuperpowersPlugin`, `V1_MAPPING`, and `default.server` are absent. Assert that `TOOL_MAPPING` has `todowrite` and no V1 tool names.
- `tests/opencode/test-session-bootstrap.mjs`: one V2 harness. Delete the `flavor` loop and every `v1` branch. Keep root, child, fork, lookup-failure, eviction, compaction, and retained-user cases.
- `tests/opencode/test-skill-registration.mjs` and `tests/opencode/test-plugin-loading.sh`: no change. They already use `setup()`.

### Docs and version

- `.opencode/INSTALL.md`: delete the V1 install block, the V1 mapping section, the V1 log hint, and the "loads only on V1" note. State that OpenCode 2.0.4 or later is required.
- `README.md`: change the install line to "OpenCode 2.0.4 or later".
- `package.json`: version `8.0.0`.

## Verification

1. `bash tests/opencode/run-tests.sh` passes before and after.
2. `node --check .opencode/plugins/superpowers.js` passes.
3. `grep -rn "V1\|1\.18\|no todo tool" .opencode tests skills README.md` returns nothing.
4. A fresh session shows `todowrite` in the injected bootstrap text.

## Risks

- A user on OpenCode 1.x installs the new version. `setup()` gets a V1-shaped context, the two `try` / `catch` blocks catch the resulting errors, and the plugin logs but does not crash the host. The install doc now states the 2.0.4 floor.
- The todo tool is off (`experimental.todo` absent). The mapping names `todowrite` and tells the agent to fall back to the ledger, so the workflow still works.
