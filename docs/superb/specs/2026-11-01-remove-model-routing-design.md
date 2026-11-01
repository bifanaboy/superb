# Remove model routing from Superb

## Intent

Superb no longer selects, assigns, or maps models. It does not read a model config, carry tier state, or track dead models. Subagents inherit whatever model the host or an installed routing plugin assigns. Superb's skills dispatch without `model`.

## Goals

- No model IDs, roles, tiers, aliases, or fallback chains anywhere in Superb.
- No `models.json`, no `/superb-models` command, no setup skill for models.
- The plugin keeps its todo, bootstrap, and session behaviour.
- A guard test fails if model policy returns.

## Non-goals

- Choosing models for the user.
- Integrating with `opencode-model-router` or any other plugin.
- Changing review, planning, or execution behaviour.

## Constraints

- Keep the OpenCode 2.0.4 floor.
- No new dependencies.
- Existing comments stay unless the code they describe is deleted.

## Design

### Plugin

Delete from `src/superb.js`:

- `_deadModels`, `DEAD_MODELS_MAX`, `MODEL_ERROR_PATTERNS`, `_isModelError`, `_deadModelText`, `_deadModelsFor`
- the `subagent` branch in `execute.after`
- the `MODEL SKIP` injection in the context hook

`src/models.js` is not created. The `TODO` nudge, bootstrap, and permission gate stay.

### Skills

Delete `skills/choosing-superb-models/`.

Replace every model-role block with:

> **Model selection:** Do not choose or pass a model. Dispatch every subagent without `model`; the host or an installed routing plugin decides.

Delete `## Model Selection` sections that only contained role guidance. Remove `smart chain`, `costly`, and `MODEL SKIP` references.

### Naming

Subagents are named for the task, not a model role. `skills/using-superb/SKILL.md` no longer mentions `Smart|Fast`. `tests/opencode/test-subagent-naming.mjs` checks the new rule.

### Docs and README

Remove the model-roles bullet and section from `README.md`. Mark the previous model designs as superseded. Update `.opencode/INSTALL.md` if it mentions models.

### Tests

- Rewrite `tests/opencode/test-dead-models.mjs` to assert that a failed `subagent` dispatch does not inject a `MODEL SKIP` line.
- Delete `tests/opencode/test-model-tiers.mjs` and its shell wrapper.
- Add `tests/opencode/test-no-model-policy.mjs` that scans skills and `src` for banned terms.
- Update `run-tests.sh`.

## What is left to the builder

- The exact one-line replacement in each skill file.
- Whether to keep the `Model:` ledger field or drop it entirely (design: drop it; the plugin no longer knows the model).
