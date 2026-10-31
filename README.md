# Superpowers

Your coding agent should ask before it builds, plan before it codes, and review before it ships.

Superpowers is a personal OpenCode 2 build of the Superpowers workflow: a set of skills plus a small bootstrap plugin. It turns a vague request into a design, a plan, tested code, a review, and a finished branch.

## What you get

- **Brainstorming** that asks what you want, then grills the chosen design until the spec is complete.
- **Plans** with exact files, steps, and tests.
- **Subagent execution** with fast and smart model roles, or native execution in one session.
- **Test-driven development** on every task.
- **Code review** before the work is merged.
- **A finish menu** that asks before it pushes, opens a pull request, or merges.
- **Autonomous mode** that runs the workflow after you approve the design.

## Install

OpenCode 2.0.4 or later is required.

```
Fetch and follow instructions from https://raw.githubusercontent.com/bifanaboy/superpowers/refs/heads/main/.opencode/INSTALL.md
```

Restart OpenCode. Then ask "Tell me about your superpowers" to verify.

## Quick start

Load the brainstorming skill and describe what you want:

```
use skill tool to load brainstorming
```

The agent asks what you want, offers approaches, and writes a design. You approve the design before any code is written.

## The workflow

1. **Brainstorm and grill.** Describe the goal. Pick an approach. Answer numbered grill rounds until the frontier is empty.
2. **Plan.** The agent writes a task-by-task plan with tests and commits.
3. **Execute.** Use subagent-driven development for a fresh implementer and reviewer per task, or native execution in this session.
4. **Review.** A fresh reviewer checks the whole branch.
5. **Finish.** The finish menu asks before it pushes, opens a pull request, or merges.

## Model roles

Every subagent gets a role. **Fast** is for transcription or one or two files with a clear spec. **Smart** is for reviews, architecture, and debugging. Each role has a costly, a cheap, and a free model.

Set the models once with `@choosing-superpowers-models`, or by asking in plain words. The config lives at:

```
~/.config/opencode/superpowers/models.json
```

A model that fails a subagent dispatch is skipped for the rest of the session.

## Autonomous mode

After you approve the design, autonomous mode runs the workflow on its own. It records each open choice as a ruling and stops only for destructive or security-sensitive actions.

See [the design](docs/superpowers/specs/2026-10-30-autonomous-mode-design.md).

## Learn more

- [Grilling phase design](docs/superpowers/specs/2026-10-31-grilling-phase-design.md)
- [Model roles design](docs/superpowers/specs/2026-10-31-superpowers-model-tiers-design.md)
- [Install instructions](.opencode/INSTALL.md)

## License

MIT.
