# Fast and smart model tiers for superb

## Intent

The root agent picks a role for each subagent and tries three models in order for that role. The user sees nothing unless all three fail. The user sets the six model IDs once. This removes guesswork about which model suits which task.

## Goals

- One global config file holds six model IDs: paid, cheap, and free for each of two roles.
- A setup skill asks six questions and writes the file.
- Every skill that dispatches a subagent reads the file and uses the paid, cheap, free chain.
- Failures fall back silently. Only total failure reaches the user.
- Works with no plugin change and no new slash command. The setup skill is reachable by plain language or by the `@choosing-superb-models` mention.

## Non-goals

- No `/superb` command.
- No `@` mention.
- No plugin change.
- No models outside the six configured slots.
- No automatic model discovery when a configured model disappears.

## Approaches considered

1. **Plugin owns the chain.** A plugin rewrites `input.model` on the `subagent` tool and retries inside one dispatch. Seamless, but it needs `tool.hook("execute.before")` plus a retry path, and it can fight OpenCode's own dispatch behaviour. Rejected.
2. **Skill owns the chain (chosen).** The root agent reads the config and tries each slot in turn. Cheap to build, no new hooks, nothing can clash with OpenCode.
3. **Discovery plus inference.** The agent inspects model names and costs to pick a fit. Rejected: the agent cannot know model X beats model Y for task Z.

## Design

### Config file

Path: `~/.config/opencode/superb/models.json`

```json
{
  "fast": {
    "paid": "provider/model",
    "cheap": "provider/model",
    "free": "provider/model"
  },
  "smart": {
    "paid": "provider/model",
    "cheap": "provider/model",
    "free": "provider/model"
  }
}
```

- Model IDs only. No names, costs, or timestamps.
- Any slot may be empty or absent. An empty slot is skipped.
- A missing, unreadable, or malformed file counts as no config.
- The file applies to every project on the machine.

### Setup skill: `skills/choosing-superb-models/SKILL.md`

Reachable by plain language, for example "set up my superb models", or by the `@choosing-superb-models` mention. No slash command. The mention key is the directory name.

1. Read the current file if it exists.
2. Get the model list from `tools.opencode.models({})` with no provider filter. This is the only source.
3. Ask six questions, one at a time: `fast.paid`, `fast.cheap`, `fast.free`, `smart.paid`, `smart.cheap`, `smart.free`. Each choice shows name, provider, and ID. The current value comes first and is kept on a plain yes.
4. Write the file and create the directory if needed.
5. Warn that a mid-session change applies next session, because the dispatch skills read the config once per session.

### Dispatch rule

Added to every skill that dispatches a subagent: `subagent-driven-development`, `executing-plans`, `brainstorming` (builder check), `requesting-code-review`, `dispatching-parallel-agents`, and `diagnosing-superb`.

- Read the config once per session.
- Pick the role. **Fast** = transcription, or 1-2 files with a clear spec. **Smart** = everything else, including every review, architecture, and debugging.
- Try `paid`, then `cheap`, then `free` for that role. Three attempts at most.
- Always start the role at `paid`. Task guidance selects the role only.
- Skip a slot that is empty or absent, or whose model is absent from `tools.opencode.models({})`.
- If no usable slot remains, or all three attempts fail, stop and ask the human partner.
- If the config is missing or broken, dispatch with the root agent's own model ID, passed explicitly.
- Ledger: one line per dispatch with the model, role, and slot. A ruling line for each fallback.
- End of task: one summary block that lists every config problem found and names `@choosing-superb-models`.
- Fix-loop rounds 4-5 use the smart chain. There is no tier above smart, so escalation is a fresh smart-chain dispatch, never a higher tier.

### Nesting note

This rule governs the root agent only. A subagent that dispatches its own subagent does not apply it; existing skills already forbid workers from dispatching subagents.

## What's left to the builder

- Exact wording of the six questions and the end-of-task summary block.
- Whether the setup skill should also print the model list on request.
- The wording change in each of the four skills.
