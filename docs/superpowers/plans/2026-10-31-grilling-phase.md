# Grilling Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatic grilling phase to brainstorming that starts after the human confirms an approach, ends at an empty frontier, and feeds the design doc.

**Architecture:** A reference file `skills/brainstorming/grilling.md` holds the interview protocol. `skills/brainstorming/SKILL.md` gains one ordered-list step and one paragraph that reads the reference file at the checkpoint and returns to Size the Work. Prose only; no runtime code.

**Tech Stack:** Markdown skill prose. The OpenCode plugin auto-registers `skills/<name>/SKILL.md`; `grilling.md` is a reference file, not a registered skill.

**Spec:** `docs/superpowers/specs/2026-10-31-grilling-phase-design.md`

## Global Constraints

- Prose only. Do not modify `.opencode/plugins/superpowers.js`, `hooks/`, `tests/`, `index.js`, or `package.json`.
- The grill starts only after the human confirms an approach. Nothing in the opening conversation may read `grilling.md`.
- During the grill, numbered rounds replace the one-question-per-message rule. Nothing else changes.
- Reference file: `skills/brainstorming/grilling.md`. Section title: "Grill the design".
- Leave "Builder check" and the `<HARD-GATE>` block unchanged.
- The grill's closing playback is the final playback; do not add a second.

## Review Focus

- **Switch fires early.** The agent reads `grilling.md` during the opening conversation. Expected: the opening behaves exactly as today.
- **One-question rule leaks into the grill.** The agent asks one question at a time. Expected: a round of numbered questions, each with a recommended answer.
- **Grill never exits.** The agent keeps asking. Expected: empty frontier → one playback → human confirmation → Size the Work.
- **Grill asks the human for facts or re-asks settled ground.** Expected: look it up; scope to the chosen approach's open decisions.
- **Opt-out missing.** Expected: "just write it" skips the grill and continues at Size the Work.

---

### Task 1: Write the grilling reference file

**Files:**
- Create: `skills/brainstorming/grilling.md`

**Interfaces:**
- Consumes: the ten-section list in the design doc's "Contents of `skills/brainstorming/grilling.md`".
- Produces: `skills/brainstorming/grilling.md`, titled `# Grilling the Design`, with ten `##` sections. Task 2 names this path.

- [ ] **Step 1: Verify the file is absent**

Run: `test -f skills/brainstorming/grilling.md; echo $?`
Expected: `1`

- [ ] **Step 2: Create `skills/brainstorming/grilling.md`**

Write the file with the title `# Grilling the Design` and these ten `##` sections, in this order. Keep each section operational and short.

1. `## When this applies` — read after the human confirms an approach; replaces the one-question rule for the rest of the conversation; returns control to brainstorming at "Size the Work".
2. `## Design tree and frontier` — decisions branch; the frontier is every decision whose prerequisites are settled.
3. `## Rounds` — ask the whole frontier in one round; number each question; wait for answers; recompute before the next round; a question that depends on an open question waits.
4. `## Recommended answers` — every question carries a recommendation; word it so "yes" accepts it.
5. `## Finding facts` — read, run, or dispatch an `explore` subagent (fast role, per the existing model-roles rule); never ask the human for what the project or tools can answer; a running lookup blocks only its dependents.
6. `## Scope` — the chosen approach's open decisions only; do not re-ask the describing phase or relitigate the approach.
7. `## Exit` — empty frontier → one playback of settled decisions → ask what is wrong or missing → do not act until the human confirms.
8. `## Opting out` — "just write it" or an equivalent decline ends the grill immediately.
9. `## Visual questions` — layouts, flows, and mockups may use the visual companion; requirements, scope, and tradeoffs stay in text.
10. `## Proportionality` — a small change may need one round of one or two questions; scale to the decision surface, not a fixed count.

- [ ] **Step 3: Verify the structure**

Run: `grep -c '^## ' skills/brainstorming/grilling.md`
Expected: `10`

Run: `grep -n '^## ' skills/brainstorming/grilling.md`
Expected: the ten headings above, in order.

- [ ] **Step 4: Verify the protocol is not wired yet**

Run: `grep -n 'grilling.md' skills/brainstorming/SKILL.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/grilling.md
git commit -m "docs: add grilling protocol for brainstorming"
```

---

### Task 2: Wire the grill into brainstorming

**Files:**
- Modify: `skills/brainstorming/SKILL.md:26-32` (ordered list)
- Modify: `skills/brainstorming/SKILL.md:139-148` (after "Lay out the approaches")
- Modify: `skills/brainstorming/SKILL.md:188-191` ("Size the Work" opening)
- Modify: `skills/brainstorming/SKILL.md:208-219` ("The Written Design" bullets)

**Interfaces:**
- Consumes: `skills/brainstorming/grilling.md` from Task 1.
- Produces: a `SKILL.md` that reads that file at one checkpoint only.

- [ ] **Step 1: Verify the switch is absent**

Run: `grep -n 'grilling.md\|Grill the design' skills/brainstorming/SKILL.md`
Expected: no output.

- [ ] **Step 2: Add the grill to the ordered list**

In the "Before you start implementing, you must, in order:" list, insert as item 2 and renumber the rest:

`2. Grill the chosen design until the frontier is empty and they confirm the playback.`

- [ ] **Step 3: Add the "Grill the design" paragraph**

After the "Lay out the approaches" paragraph, add:

**Grill the design.** Once they confirm an approach, read `grilling.md` in this directory and follow it. The grill replaces the one-question rule for the rest of the conversation: ask numbered rounds, each question with your recommended answer. When the frontier is empty, play the settled decisions back in one chunk and ask what is wrong or missing. Once they confirm, continue at Size the Work. If they decline the grill, continue at Size the Work.

- [ ] **Step 4: Update "Size the Work"**

Change the opening to:

`Once you understand what they want, they have picked an approach, and the grill is done, say how big the work is in plain words. They can override it.`

- [ ] **Step 5: Update "The Written Design"**

Change the decided-how bullet to:

`- the parts of the how they decided, as they decided them, including the decisions the grill settled`

- [ ] **Step 6: Verify the wiring**

Run: `grep -n 'grilling.md\|Grill the design' skills/brainstorming/SKILL.md`
Expected: the new paragraph appears once; no earlier match.

Run: `grep -n 'Lay out the approaches\|Grill the design\|Size the Work' skills/brainstorming/SKILL.md`
Expected: matches in the order approaches, grill, size.

- [ ] **Step 7: Verify the untouched gates**

Run: `git diff -- skills/brainstorming/SKILL.md`
Expected: no hunk touches "Builder check" or the `<HARD-GATE>` block. Only the four edits above.

- [ ] **Step 8: Acceptance walkthrough**

Read both files end to end and confirm:

- [ ] The opening conversation, playback, and approach comparison are unchanged.
- [ ] `grilling.md` is read only after the approach is confirmed.
- [ ] The grill overrides the one-question rule.
- [ ] The exit is frontier empty → one playback → confirmation → Size the Work.
- [ ] "Just write it" skips to Size the Work.
- [ ] The Written Design includes the grill's decisions.
- [ ] Builder check and HARD-GATE are unchanged.

- [ ] **Step 9: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: switch brainstorming to grilling after approach selection"
```
