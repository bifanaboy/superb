# Plugin-owned model tiers for Superb

Supersedes [Fast and smart model tiers](2026-10-31-superb-model-tiers-design.md).

## Intent

Superb stops putting model policy in skill text. The plugin owns it. Four allowance tiers are consumed in order, and a failed dispatch moves to the next tier. The user edits four slots, not ten skill files. All models run at default effort.

## Goals

- One config file holds four tiers, in spend order.
- The plugin sets the model on every `subagent` dispatch from the active tier and the task role.
- Any subagent dispatch error advances the session's active tier.
- Tiers reset at the start of each session.
- Model names resolve as family aliases against the host catalog. A model bump needs no config edit.
- `/superb-models` shows and edits the config inside a session.
- Superb skills carry a role marker only. No model IDs, no `models.json` reads, no fallback chains in prose.

## Non-goals

- Controlling the root session model. The host cannot repoint it mid-session.
- Usage metering or remaining-allowance estimates.
- Persisting the active tier across sessions.
- A dependency on `opencode-model-router` or any other routing plugin.
- Changing review, planning, or execution behaviour.

## Constraints

- Host floor stays OpenCode 2.0.4. Command and catalog APIs are feature-detected. When absent, the plugin still routes exact IDs and skips the command.
- A model reference is `provider/model`. A `#variant` suffix is never written, so effort stays default.
- Config path is `~/.config/opencode/superb/models.json`.
- A missing, unreadable, or malformed config disables routing. The host default applies.
- One model per tier (`model`) or one per role (`models.light|medium|heavy`).
- Alias resolution: exact `provider/model` wins. Otherwise the model part is a case-insensitive substring, `-latest` is stripped, and the newest active enabled match wins. No match skips the tier.
- Any error on a `subagent` dispatch advances the tier, at most to the last tier.

## Approaches considered

1. **Skill-owned ladder (previous design).** The root reads the config and retries. Rejected: it duplicates policy across ten files, and compliance fails after compaction.
2. **`opencode-model-router` presets.** Rejected: its fallback is prompt text only. The renderer emits `Err→retry-alt-tier→fail→direct` with provider and preset names, no model IDs. No hook retries a dispatch, and no tool switches presets. It cannot walk allowance tiers.
3. **Plugin-owned routing (chosen).** The host exposes `ctx.tool.hook("execute.before")` with mutable `input`, and `ctx.command.transform`. `opencode-model-router` uses both. The plugin can set the model and advance the tier without agent compliance.

## Design

### Config file

Path: `~/.config/opencode/superb/models.json`

```json
{
  "startTier": 0,
  "tiers": [
    { "name": "opencode-free", "model": "opencode/deepseek-v4.1-flash-free" },
    {
      "name": "chatgpt-plus",
      "models": {
        "light":  "openai/luna-latest",
        "medium": "openai/terra-latest",
        "heavy":  "openai/sol-latest"
      }
    },
    {
      "name": "opencode-go",
      "models": {
        "light":  "opencode-go/deepseek-4.1-flash",
        "medium": "opencode-go/deepseek-4.1-flash",
        "heavy":  "opencode-go/deepseek-4.0-heavy"
      }
    },
    { "name": "go-free", "model": "opencode-go/iceman-contributor-free" }
  ]
}
```

Rules:

- `startTier` is a zero-based index. Default `0`.
- A tier with `model` uses that model for every role.
- A tier with `models` reads the role key. A missing role falls back to `model`, then to the next tier.
- Model IDs carry no `#variant`.

### Alias resolution

Input: a reference and the host catalog (`ctx.model.list({ location })`).

1. If `provider/model` matches an enabled model exactly, use it.
2. Remove a trailing `-latest` from the model part.
3. Keep models in the same provider whose id contains the model part, case-insensitive, with `status === "active"` and `enabled !== false`.
4. Take the first match in catalog order. The host lists newest first.
5. Return `provider/id`, or `null` when nothing matches.

The plugin caches the catalog once per session. A resolution failure logs one line and skips the tier.

### Runtime

Plugin state: `sessionID -> tier index`. No entry means `startTier`.

1. Every dispatch prompt starts with `[superb:light]`, `[superb:medium]`, or `[superb:heavy]`. No marker means `medium`.
2. `execute.before` on tool `subagent`: parse and strip the marker from `input.prompt`, resolve the active tier's model for the role, and set `input.model`. A resume (`input.sessionID` present) keeps its session model; the marker is still stripped.
3. `execute.after` on tool `subagent` with `status === "error"`: advance the session's tier index, bounded at the last tier.
4. `session.hook("context")` injects `SUPERB TIER: <n>/<total> (<name>)` for root sessions. It also says to retry a failed dispatch once. The plugin swaps the model; it cannot re-issue the call.
5. Tiers reset when a session has no state yet.

### Command

`ctx.command.transform` registers `/superb-models`.

- `/superb-models` — print the tier table, the active tier, and the start tier.
- `/superb-models set <tier> <role|all> <ref>` — write the config and reload it. `<tier>` is a 1-based index or a tier name. `<role>` is `light`, `medium`, or `heavy`. `all` writes `model`.
- `/superb-models next` — advance the current session's tier.
- `/superb-models reset` — set the current session's tier to `startTier`.
- `/superb-models find <ref>` — list catalog matches.

Output goes through `ctx.session.synthetic` when present. Without it, the command writes the file but prints nothing.

### Skill changes

A single routing paragraph replaces every model-role block:

> **Model routing:** The Superb plugin assigns the model. Do not pass `model` to a subagent. Prefix every subagent prompt with `[superb:light]`, `[superb:medium]`, or `[superb:heavy]`. The plugin strips the marker and uses the active tier's model. Light is transcription or one or two files with a clear spec. Medium is implementation, tests, and refactor. Heavy is every review, architecture, and debugging. If a dispatch fails, retry it once; the plugin advances the tier.

The ledger records `Route: <role>`. It no longer records a model ID.

`TOOL_MAPPING` says to pass `agent` only when a routing policy names one, and never to pass `model`.

### Removal

- `skills/choosing-superb-models/`
- `tests/opencode/test-model-tiers.{mjs,sh}`
- `tests/opencode/test-dead-models.{mjs,sh}`
- `MODEL SKIP`, `MODEL_ERROR_PATTERNS`, `_isModelError`, `_deadModelText`, `_deadModelsFor`, `_deadModels` in `src/superb.js`
- The model-roles section in `README.md`
- `@choosing-superb-models` references

### New files

- `src/models.js` — config load and validation, role lookup, marker parse and strip, alias resolution, command parsing, tier table text.
- `tests/opencode/test-model-routing.mjs` — unit tests for `src/models.js`.
- `tests/opencode/test-tier-hooks.mjs` — plugin harness tests for both hooks, the context line, and the command.
- `tests/opencode/test-model-policy-guard.mjs` — fails if model policy returns to the skills.
- Shell wrappers for each test.

## Risks

- `ctx.model.list` shape may differ on a future host. Resolution fails closed: exact IDs still work and aliases skip the tier.
- A wrong alias silently advances the tier. Each resolution is logged once per session.
- A dead monthly tier costs one failed dispatch per session, because tiers reset.
- The root must retry once after a dispatch error. Skills and the context line both state it.

## What is left to the builder

- Exact command output formatting.
- Log line wording.
- Whether `find` prints the full catalog or only matches (design: matches).
- The wording that replaces each model block in the ten skill files.
