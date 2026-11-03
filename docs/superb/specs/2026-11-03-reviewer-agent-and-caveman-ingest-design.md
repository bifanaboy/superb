# Reviewer Agent and Caveman Ingest — Design

**Status:** approved in session, 2026-11-03.

## Intent

Two goals.

1. A review step that runs on a strong model and reads three artifacts: a
   design spec, an implementation plan, and a code change.
2. Superb replaces the separate Caveman plugin, so the user can uninstall it.
   Compression, voice mode, and commands live in Superb.

The reviewer must not inherit the build session's model. The build agent runs
on a cheap model, so an inherited model reviews on a cheap model.

## Why not the model mirror

An earlier design made the plugin read the newest plan session's model and
inject it into every `superb-reviewer` dispatch. It was dropped because:

- The model comes from a heuristic (newest plan session), not a link to the
  build session.
- It adds four host surfaces for one property: `session.list`,
  `agent.transform`, a rewrite in `execute.before`, and a new option.
- OpenCode applies a subagent agent's configured `model` on dispatch. A
  dedicated agent file gives the same result with no plugin code.

## Reviewer agent

File: `agents/review.md`. Installed into `~/.config/opencode/agents/`.

- `mode: all`: appears in the shift+tab cycle next to `build` and `plan`, and
  can be dispatched as a subagent.
- No `model:` line. The package names no model, so `test-no-model-policy`
  stays green. The user adds `model:` to the installed copy.
- Three lenses: `spec`, `plan`, `implementation`. The dispatch prompt names
  the lens. The agent does not guess.
- Spec lens carries reduce / cohere / elegant checks. This replaces the
  builder-check elegance lens, so issue #49 closes as covered.
- The reviewer fixes spec and plan files in place. It does not edit code.
  Code findings return to the build agent, then one re-review.
- Output contract: findings only, numbered, severity grouped, file:line,
  each with problem and fix. No praise section, no recommendations section.

Dispatch: review skills name `review` and pass the lens. Fallback agent is
`general` when `review` is not installed.

## Caveman ingest

Parity with the Caveman plugin for voice mode, plus compression.

### Modules

- `src/caveman/mode.js`: flag file helpers. Same basename as Caveman
  (`.caveman-active`) so an existing flag keeps working. Default mode
  `caveman` unless `CAVEMAN_DEFAULT_MODE` or a `.caveman.json` says otherwise.
- `src/caveman/client.js`: thin CLI client. Resolves
  `@caveman-ai/cli/package.json`, runs `dist/index.js` under the current Node
  binary. Methods: `sessionStart`, `preTool`, `postTool`, `shrink`,
  `getVersion`. Every method returns `undefined` on any error.
- `src/caveman/commands.js`: five command prompts (`caveman`, `ultracave`,
  `megacave`, `caveman-commit`, `caveman-review`). Natural-language toggles
  are not ported; only slash commands.
- `src/caveman/guard.js`: `isCavemanPluginActive` skips the layer when the
  Caveman plugin is loaded.
- `src/caveman/agents.js`: writes `cavecrew-{builder,investigator,reviewer}.md`
  and `review.md` into the OpenCode agent directory. Never overwrites.

### Hooks

- `session.hook("context")`: when a mode flag exists, push
  `CAVEMAN MODE ACTIVE (<mode>) — session ruleset applies.` into `event.system`.
  Register before the bootstrap hook.
- `tool.hook("execute.before")`: for `shell`/`bash`, call `shrink` and
  rewrite `input.command` when a string comes back.
- `tool.hook("execute.after")`: on `completed`, call `postTool` and replace
  `event.result` content when a string comes back.

All hooks are guarded and fail open. A missing CLI or missing `ctx` surface
must not break setup.

### Commands

`caveman`, `ultracave`, `megacave` set the mode and steer the session.
`caveman-commit` and `caveman-review` are one-shot instructions; they do not
change the mode.

### Dependency

`@caveman-ai/cli@4.0.1`, Node 22.13 or later. The global `caveman` binary
stays installed, because `shrink-hook` rewrites commands to call it.

### Recovery

Compressed output is recoverable only through the Caveman recovery tool.
Install it with `caveman mcp install opencode`. Without it, compression is
lossy. This is documented, not enforced.

### Conflict guard

When the Caveman plugin is active, Superb skips its Caveman layer. It never
injects voice twice or compresses twice.

## Install

1. Remove `./plugins/caveman` from `opencode.json`.
2. Keep the `caveman` binary.
3. `caveman mcp install opencode`.
4. `superb-install-agents` writes the three cavecrew agents and `review`.
5. Add `model:` to the installed `review.md`.

## Non-goals

- No model IDs, roles, tiers, or routing in the package.
- No port of Caveman's natural-language mode parsing.
- No reimplementation of compression.
- No automatic change to the user's `AGENTS.md`.

## Risks

- Hook ordering: the voice hook must register before the bootstrap hook.
- Compression can hide bytes a later step needs. Recovery is a documented
  install step.
- CLI version drift. The client fails open and logs one warning on a major
  version mismatch.
- Reviewer independence is weaker when it fixes docs. Accepted by design.
