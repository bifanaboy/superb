# Grilling Phase in Brainstorming — Design

- Date: 2026-10-31
- Issue: #11
- Status: Approved for planning

## Intent

Brainstorming is good at finding out what the human wants, but it stops asking once an approach is chosen. The gap between "we picked a direction" and "the spec is complete" is where the expensive surprises live: constraints, edge cases, failure modes, and decisions the human has not thought about yet.

This design adds a grilling phase. After the human confirms an approach, the agent maps the remaining design as a tree and interviews them in rounds until the frontier is empty. Each question carries a recommended answer, so "yes" is a complete answer. The agent finds facts itself instead of asking. The phase ends with a playback of the settled decisions, and brainstorming continues to sizing and the design doc.

The switch point is deliberate. Grilling earlier would steer the human before they have described what they want, which is the failure the current opening exists to prevent. Grilling later, after the doc is written, reopens a design the human has already approved.

## Goals

- One automatic, reliable switch from the opening conversation to grilling.
- The grill never fires before the human has confirmed an approach.
- Grill decisions flow into the design doc.
- A human can decline the grill and go straight to sizing.
- The opening conversation, approach comparison, builder check, and approval gate stay intact.

## Non-goals

- Replacing the opening conversation or the approaches step.
- A standalone, independently invocable grilling skill. Promoting the reference file later is a small change.
- Changing writing-plans, implementation, review, or the model-role rules.
- Grilling code or debugging; this is for design decisions.

## Anti-goals

- Grilling a quick, clear task. The existing "everything that matters is in the request" path already skips brainstorming.
- Re-asking what the human already answered in the describing phase.
- Asking the human for facts the repo, the web, or the tools can answer.
- Rounds that do not change what gets built, or that keep the doc waiting.
- A second, separate approval step; the existing design-doc gate stays the gate.

## Constraints

- The change is Markdown skill prose only. No runtime code, hooks, or plugin changes.
- The plugin auto-registers each `skills/<name>/SKILL.md` directory. `grilling.md` is a reference file inside `skills/brainstorming/`, not a skill, so it is not registered separately and cannot auto-trigger.
- The "one question per message" rule lives in "The Conversation". The grill must explicitly override it, or the model will keep asking one question at a time.
- The grill phase must not weaken the HARD-GATE: nothing is built until the design doc is approved.

## Approaches considered

**A. Separate `grilling` skill.** A new `skills/grilling/SKILL.md`, invoked by brainstorming at the checkpoint and resumed afterwards. Reusable outside brainstorming and independently evolvable. Cost: a handoff in both directions, plus a broad skill description could make the agent grill the human during the opening — exactly the failure the switch point exists to prevent.

**B. Inline section in brainstorming.** Add the whole protocol to `SKILL.md` after the approaches. Guaranteed continuity, no loading step, no early-trigger risk. Cost: the skill grows by the whole protocol, and one file then holds two conversation modes with contradictory question rules.

**C. Reference file in brainstorming — chosen.** Add `skills/brainstorming/grilling.md` and read it at the checkpoint, following the existing `visual-companion.md` pattern. The main skill stays lean, the protocol loads only when needed, and it cannot fire early. Cost: not independently invocable.

C wins because the switch has to be reliable and must not fire before the approach is chosen. It needs no registration, and promotion to a standalone skill later is a small change if the human wants to grill things outside a brainstorm.

## The decided how

### Switch point

- **Trigger:** the human confirms an approach in "Lay out the approaches" — including confirming the single sensible option when there is only one.
- **Start:** read `grilling.md` and follow it.
- **Scope:** the decisions the chosen approach leaves open. Settled ground is not re-opened.
- **Exit:** the frontier is empty; play the settled decisions back in one chunk; the human confirms; return to brainstorming at "Size the Work".
- **Opt-out:** "just write it" or any clear decline skips the grill and continues at "Size the Work".

### Changes to `skills/brainstorming/SKILL.md`

1. Add the grill to the ordered list of steps before implementation, between the approaches and the design doc. Renumber the list.
2. Add a **Grill the design** paragraph after **Lay out the approaches**. Draft wording, to be polished during implementation:

   > Once they confirm an approach, read `grilling.md` in this directory and follow it. The grill replaces the one-question rule for the rest of the conversation: ask numbered rounds, each question with your recommended answer. When the frontier is empty, play the settled decisions back in one chunk and ask what is wrong or missing. Once they confirm, continue at Size the Work. If they decline the grill, continue at Size the Work.

3. Update the "Size the Work" opening so it expects the grill to be done.
4. Update "The Written Design" so the decided-how bullet names the decisions the grill settled.
5. Leave "Builder check" unchanged. The grill reduces its question load but does not replace it.

### Contents of `skills/brainstorming/grilling.md`

1. **Purpose and contract.** When the file is read, what it replaces, and where it returns control.
2. **Design tree and frontier.** Every decision branches into the decisions that depend on it. The frontier is every decision whose prerequisites are settled.
3. **Round format.** Ask the whole frontier in one round. Number each question and give the recommended answer. Wait for the answers before the next round. Recompute the frontier after each round.
4. **Recommended answers.** Word each question so "yes" accepts the recommendation.
5. **Facts.** Finding facts is the agent's job: read files, run commands, or dispatch an `explore` subagent. Never ask the human for something the project or tools can answer. A running lookup does not block questions that do not depend on it.
6. **Scope discipline.** Work the branches the chosen approach leaves open. Do not re-ask what the describing phase settled, and do not use the grill to relitigate the approach.
7. **Exit playback.** At an empty frontier, play the settled decisions back in one message and ask what is wrong or missing. Do not act until the human confirms.
8. **Opt-out.** "Just write it" or an equivalent decline ends the grill immediately.
9. **Visual companion.** The existing rules still apply: layouts, flows, and mockups go to the browser; requirements, scope, and tradeoffs stay in text.
10. **Proportionality.** A small change may need one round of one or two questions. The grill scales to the decision surface, not to a fixed number of rounds.

### Interaction with existing behavior

- **Play It Back:** the grill's closing playback is the final playback chunk. Do not add a second playback after it.
- **Visual companion:** the offer stays just-in-time, including during the grill.
- **Builder check:** unchanged, and still after the doc is written.
- **Model roles:** if the grill dispatches an `explore` subagent for facts, the root agent follows the existing model-role rule. Fact lookup is a **fast** role job.
- **HARD-GATE:** unchanged.

## Calls made in the design

- Every design gets a grill, but a small change may need only one round of one or two questions. The grill is not size-gated off.
- The reference file is named `grilling.md`; the section is titled "Grill the design".
- The grill's playback is the final playback chunk, not an extra one.
- Facts may be found by reading, running commands, or dispatching an `explore` subagent.
- No README change is needed.

## What is left to the builder

- Final wording and placement of the new paragraph and the ordered-list item.
- The exact contents of `grilling.md`, within the ten sections above.
- Whether the "Size the Work" and "The Written Design" edits need more than a sentence each.
- No runtime tests exist for skill prose. Verify by reading both files end to end and checking that the switch cannot fire before the checkpoint.
- A follow-up issue can promote `grilling.md` to a standalone skill if the human wants it outside brainstorming.

## Acceptance

- [ ] The opening conversation, playback, and approach comparison behave as they do today.
- [ ] The agent reads `grilling.md` only after the human confirms an approach.
- [ ] During the grill, questions come in numbered rounds with recommended answers.
- [ ] The grill's exit is an empty frontier, one playback, and human confirmation.
- [ ] "Just write it" skips the grill and continues at "Size the Work".
- [ ] The design doc records the decisions the grill settled.
- [ ] The builder check and the HARD-GATE are unchanged.
