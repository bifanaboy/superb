# PR gate in finishing-a-development-branch

## Intent

Approving the plan is permission to build, not permission to ship. Shipping
gets its own gate: after the final review is clean and tests pass, the agent
presents the four-item menu. Picking "Ship it" is the wave-through and runs
the whole tail without another prompt: commit, push, create PR, merge with a
merge commit, remove the worktree and branch, sync the base branch.

## Goals

- The four-item menu is always presented after review, before any PR exists.
- Choosing "Ship it" runs through to a merged, cleaned-up branch.
- No push, PR, or merge happens before the menu is presented and answered.
- The Quick Reference table describes the same four options the menu offers.
- The implementation flows (executing-plans, subagent-driven-development)
  cannot open a PR without going through finishing-a-development-branch.

## Non-goals

- No CI polling or CI gate. Red CI does not block merging and is not waited on.
- No change to the behaviour of options 2-4.
- No new prompt between PR creation and merge.
- No autonomous-mode changes.
- No hooks or mechanical blocking of `gh pr create`.

## Approaches

1. **Correct the skill in place.** Edit only finishing-a-development-branch:
   drop `(default)` from option 1, add the gate rule, rebuild the Quick
   Reference table. Smallest change, but only helps when the skill is invoked.
2. **Correct the skill and the handoffs (chosen).** Same edits, plus one line
   each in executing-plans and subagent-driven-development's final-review so
   the implementation flow ends by invoking finishing's menu and never opens a
   PR directly. This reaches the observed failure: an agent that never invokes
   the skill never sees the menu.

Approach 2 was chosen because the missing behaviour is not only a bad default;
opening a PR can happen without the skill running at all.

## Changes

- `skills/finishing-a-development-branch/SKILL.md`
  - Remove `(default)` from option 1.
  - Add a hard rule before Step 4: nothing is pushed, opened, or merged before
    this menu, and its answer is the gate. Option 1 runs to completion with no
    further prompt.
  - Rebuild the Quick Reference table from the four options, with Ship It
    first and correct Merge/Push/Keep Worktree/Cleanup Branch values.
- `skills/executing-plans/SKILL.md`
  - In Finish, state that the flow ends by invoking finishing's menu and never
    opens a PR directly.
- `skills/subagent-driven-development/references/final-review.md`
  - The same statement at its Finish step.

## What's left to the builder

- Exact wording of the gate rule and the handoff lines.
- Confirming option 1's commit sits after the menu answer, not before it.
