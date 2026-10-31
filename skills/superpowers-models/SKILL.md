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
