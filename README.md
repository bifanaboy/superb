# Superpowers (personal opencode build)

Personal, opencode-only fork of Superpowers. Skills + bootstrap for OpenCode.

## Installation (OpenCode)

```
Fetch and follow instructions from https://raw.githubusercontent.com/bifanaboy/superpowers/refs/heads/main/.opencode/INSTALL.md
```

## What's inside

Skills live in `skills/`. Bootstrap is `.opencode/plugins/superpowers.js`.

## Model roles

Superpowers gives every subagent a role: **fast** for transcription, or a
**smart** role for judgment work. Each role has a paid, a cheap, and a free
model. Set them once with `@choosing-superpowers-models`, or by asking in
plain words. The config lives at
`~/.config/opencode/superpowers/models.json`. If a model fails, the next
slot is tried without a message. Config problems and total failure appear
in the summary at the end of the task.

See `docs/superpowers/specs/2026-10-31-superpowers-model-tiers-design.md`.

## Autonomous mode

After you approve a finalized design in brainstorming, the agent runs the full workflow on its own: git worktree setup, planning, implementation (TDD), code review, and finishing. It decides open choices itself and records each as a `Ruling: [tag] ...` line. It stops only for destructive or security-sensitive actions.

See `docs/superpowers/specs/2026-10-30-autonomous-mode-design.md` and issue #5.

License: MIT.