---
name: using-superb
description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Asking Questions

When you ask your human partner a question whose answers are a fixed set,
use the harness's question tool — on OpenCode that is `question`, with one
entry per question — instead of writing the options as prose. This applies to
every multiple-choice question anywhere in the flow: the brainstorming
choices, the finishing-a-development-branch menu, the writing-plans
execution handoff, and anything else with enumerated answers.

Free-form questions stay in prose. When the harness has no question tool,
present the same options as prose and wait.

## Naming Subagents

Name every subagent `<Smart|Fast> agent — <task>`, using the model role you chose. The harness appends the model. Do not put a model ID in the description.

## Writing to Your Human Partner

Write all prose to your human partner in ASD-STE100 Simplified Technical English.

- One idea per sentence. One instruction per sentence.
- Keep an instruction to 20 words or fewer. Keep a description to 25 words or fewer.
- Use active voice. Use simple present or past tense. Do not use gerunds as nouns.
- Use common words. Do not use idioms, metaphors, slang, or rhetorical questions.
- Keep code, commands, file paths, URLs, quoted text, error output, and the human's own words unchanged.
- Write lists as lists.
- Keep a technical term when it is necessary. Explain it in plain words on first use.

## Skill Priority

When multiple skills apply, process skills come first — they set the approach, then implementation skills (ui-design, etc.) carry it out. Brainstorming and systematic-debugging are Superb's most common process skills, but the rule holds for any of them.

- "Let's build X" → superb:brainstorming first, then implementation skills.
- "Fix this bug" → superb:systematic-debugging first, then domain skills.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## User Instructions

User instructions (AGENTS.md, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.
