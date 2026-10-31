# Autonomous progression after design approval for superb

## Intent
Once the user approves a finalized design, the agent autonomously progresses through the rest of the workflow without further intervention. It decides open choices itself and records each as a ruling. It still stops for destructive or security-sensitive actions. No subagents, model routing, or orchestration machinery is added.

## Trigger
The user says "yes" to the design-approval question in brainstorming. That approval engages autonomous mode for the remainder of the workflow. No separate toggle is needed; the approval is the trigger.

## Goals
- A skill that defines autonomous behavior and the ruling format, and is invoked right after design approval.
- The brainstorming skill's approval step hands off to this skill instead of stopping.
- The agent records rulings (`Ruling: [tag] <decision> - <why> - <cost if wrong>`) for every open choice it makes.
- Works in OpenCode (no subagent tools required).

## Non-goals
- Subagent dispatch, model routing, task graphs, checkpoints.
- Human-orchestrator review plans or a separate mode toggle.
- Changing existing superb skills beyond the brainstorming handoff.

## Approaches considered
1. Separate toggle command. Rejected: user wants approval itself to trigger autonomy.
2. Skill invoked on approval (chosen): brainstorming's approval step invokes the autonomous skill, which then drives the chain below.

## Design

### Skill: `skills/autonomous/SKILL.md`
Invoked after design approval. Drives this exact chain, in order, without asking the human:
1. `using-git-worktrees` — create isolated workspace on a new branch, run project setup, verify clean test baseline.
2. `writing-plans` — break work into bite-sized tasks (2-5 minutes each), with exact file paths, complete code, verification steps.
3. `subagent-driven-development` or `executing-plans` — dispatch a fresh subagent per task with review after each, or implement inline with one review of the whole branch.
4. `test-driven-development` — enforce RED-GREEN-REFACTOR during implementation.
5. `requesting-code-review` — review between tasks, block on critical issues.
6. `receiving-code-review` — handle review feedback before implementing suggestions.
7. `finishing-a-development-branch` — verify tests, then merge/PR/keep/discard and clean up worktree.

For every open choice, decide it, record a `Ruling: [tag] ...` line, and continue. Never ask the human unless the action is destructive or security-sensitive (force-push, delete, secrets).

### Brainstorming handoff
In brainstorming, when the user approves the design doc, invoke `superb:autonomous` instead of stopping. The autonomous skill takes over.

### Ruling log
Rulings are recorded in the plan doc or a short `.superb/rulings.md` so the user can review later.

## What's left to the builder
- Exact wording of the autonomous skill.
- Where rulings are recorded (plan doc vs separate file).