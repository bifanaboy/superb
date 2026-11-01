# Superb

Superb is an opinionated OpenCode 2 workflow. It gives your agent a set of skills and a small bootstrap plugin. It builds on the Superpowers skills and adds a grilling phase, UI review and design skills, model roles, and a plain-English output rule. Choose it if you want those decisions made for you rather than assembling your own agent setup.

## Built on Superpowers

Most of the skills are adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent, under the MIT license. `LICENSE` keeps his copyright.

You also get:

- **A grilling phase.** After you pick an approach, the agent asks numbered rounds of questions, each with a recommended answer, until no open point is left.
- **UI review and design.** The `ui-breaker` and `ui-design` skills find what is wrong in your running web UI, then fix it with a product-derived direction.
- **Model roles.** Each subagent gets a fast or a smart role. Each role has a costly, a cheap, and a free model. A model that fails a dispatch is skipped for the rest of the session.
- **Plain-English output.** The agent writes all prose to you in ASD-STE100 Simplified Technical English.

## What you get

- **A grilling phase** with numbered rounds, each question with a recommended answer.
- **UI breaker and design.** The `ui-breaker` and `ui-design` skills find what is wrong in your running web UI, then fix it with a product-derived direction.
- **Model roles.** A fast and a smart role, each with a costly, a cheap, and a free model.
- **Plain-English output** in ASD-STE100 Simplified Technical English.
- **Brainstorming** that asks what you want before it proposes approaches.
- **Plans** with exact files, steps, and tests.
- **Subagent execution** with a fresh implementer and reviewer per task, or native execution in one session.
- **Test-driven development** on every task.
- **Code review** before the work is merged.
- **A finish menu** that asks before it pushes, opens a pull request, or merges.

## Install

OpenCode 2.0.4 or later is required.

```
Fetch and follow instructions from https://raw.githubusercontent.com/bifanaboy/superb/refs/heads/main/.opencode/INSTALL.md
```

Restart OpenCode. Then ask "Tell me about Superb" to verify.

### Browser setup for the UI skills

The UI skills use OpenCode's browser tool. On the OpenCode desktop
app, the built-in `browser` namespace is enough. On the TUI or CLI, add a
browser MCP such as the Playwright MCP.

Without a browser tool, `ui-breaker` stops and reports the blocker. It does not
guess. See [Install instructions](.opencode/INSTALL.md#browser-setup-for-the-ui-skills)
for the config.

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

Set the models once with `@choosing-superb-models`, or by asking in plain words. The config lives at:

```
~/.config/opencode/superb/models.json
```

A model that fails a subagent dispatch is skipped for the rest of the session.

## Learn more

- [Grilling phase design](docs/superb/specs/2026-10-31-grilling-phase-design.md)
- [Model roles design](docs/superb/specs/2026-10-31-superb-model-tiers-design.md)
- [Install instructions](.opencode/INSTALL.md)

## License

MIT.
