# Observability Evidence in Systematic Debugging — Design

- Date: 2026-10-31
- Issue: #15
- Status: Approved

## Intent

Issue #15 asks a recon of [wshobson's `smart-debug.md`](https://github.com/wshobson/agents/blob/7e2fb559cf4b824b27f1fec49fe88f7511066d26/plugins/debugging-toolkit/commands/smart-debug.md) against `skills/systematic-debugging/`.

`systematic-debugging` assumes the agent can reproduce the bug locally. Its only escape hatch is the "No Root Cause" section, which says 95% of such cases are incomplete investigation. A production bug breaks that assumption. The agent cannot reproduce it, and the skill gives it no next step other than "investigate more".

This design adds one supporting technique for that case: when the bug does not reproduce, gather evidence from logs, traces, metrics, and error tracking. It also takes two small, portable items from `smart-debug`: where to place instrumentation, and what to do after the fix.

## Goals

- Give the agent a concrete path for bugs it cannot reproduce.
- Keep the file tool-agnostic, so it fits any repo.
- Guard the new contract with the existing test pattern.

## Non-goals

- Rewriting `SKILL.md` around `smart-debug`'s ten steps.
- A single "debugger" subagent that does the analysis.
- Numeric probability scores, chaos engineering, or time-travel tooling.
- Vendor lists.
- A rollback plan. That belongs to the deploy process, not to debugging.

## Anti-goals

- Adding length to `SKILL.md` without adding a decision.
- Repeating `competing-hypotheses.md`. The new file links to it and does not restate it.
- Any content that names a vendor. The test forbids it.

## Constraints

- The change is Markdown skill prose plus one test pair. No plugin or hook changes.
- The `SKILL.md` cross-references "Phase 4.5" at lines 213 and 234. Do not renumber the Phase 4 steps.
- `tests/opencode/test-competing-hypotheses.mjs:43-44` already bans vendor names. The new test carries the same rule.
- The file cap is about 80 lines, to match the other supporting techniques.

## Approaches considered

**A. Take the whole `smart-debug` workflow.** Maximum coverage, and the steps already exist. Cost: one subagent hides evidence from the agent that must fix the bug. Numeric probabilities are false precision. Chaos engineering adds variables and breaks the one-variable rule. The file would double the skill's size.

**B. Take nothing; close as not planned.** Cheapest. Cost: the empty-file-drift gap for production bugs stays. The skill has no advice for the most expensive class of bug.

**C. Take the portable parts — chosen.** One new supporting file for evidence gathering, one instrumentation list, one prevention step. Follows the issue #13 precedent, where `competing-hypotheses.md` came in as a separate file with one line added to Supporting Techniques. Cost: three files change.

C wins because it adds the missing path without importing the parts that fight the skill's own rules.

## The decided how

### New file: `skills/systematic-debugging/observability-evidence.md`

Six sections:

1. **When to use** — a bug that does not reproduce locally: production or staging, intermittent failures, data you cannot recreate.
2. **Find the signal source** — error tracking, application metrics, traces, log aggregation, user reports. Describe the kind of source, never a vendor.
3. **Queries that separate causes** — frequency over time, affected cohort, environment, deploy correlation, related errors.
4. **Gather one run of evidence** — show *where* it breaks before forming a hypothesis.
5. **Gather evidence in production safely** — scoped logs, sampling, read-only endpoints, removal after the fix.
6. **Return to the process** — go to Phase 3 with the evidence. One line points at `competing-hypotheses.md` for parallel investigation.

The file names evidence as `source:citation`, in the same form `competing-hypotheses.md:41` requires.

### Edit 1: `skills/systematic-debugging/SKILL.md`

- At Phase 1 step 2 (`SKILL.md:62`), replace "If not reproducible → gather more data, don't guess" with a pointer to `observability-evidence.md` and keep the "don't guess" rule.
- Add the file to Supporting Techniques (`SKILL.md:280-287`).
- Leave the "No Root Cause" section unchanged. One hook per idea.

### Edit 2: `skills/systematic-debugging/root-cause-tracing.md`

Add a section, "Where to Instrument", after "Adding Stack Traces". Five sites:

- Entry points to the affected behavior.
- Decision nodes where behavior diverges.
- State mutation points.
- External call boundaries.
- Error handling paths.

### Edit 3: `skills/systematic-debugging/SKILL.md`, new section after Phase 4

"Prevent Recurrence":

- Search the codebase for the same bug pattern.
- Keep the regression test from Phase 4.
- When the bug ran in production, add an alert or a log line for the next time.

No numbering change, so the Phase 4.5 references stay valid.

### Test

`tests/opencode/test-observability-evidence.mjs` and a `.sh` wrapper, registered in `run-tests.sh` at the help list and the `tests` array. Checks:

- The file exists.
- Phase 1 links it.
- Supporting Techniques lists it.
- All six section names exist.
- The file names the evidence kinds and the production-safe practices.
- The file has no vendor names.
- The file points to `superpowers:dispatching-parallel-agents`.

## Calls made in the design

- The section title is "Prevent Recurrence".
- No back-link from `competing-hypotheses.md`. The pointer runs one way, from Phase 1.
- The file says "signal source", not "observability platform".
- The file stays under about 80 lines.

## What is left to the builder

- Final wording of each section, within the headings above.
- The exact replacement text at `SKILL.md:62`.
- The exact checks in the test, beyond the list above.
- Run `tests/opencode/run-tests.sh` and confirm all tests pass.

## Acceptance

- [ ] `observability-evidence.md` exists and has the six sections.
- [ ] Phase 1 step 2 points at the file.
- [ ] Supporting Techniques lists the file.
- [ ] `root-cause-tracing.md` lists the five instrumentation sites.
- [ ] `SKILL.md` has a "Prevent Recurrence" section after Phase 4.
- [ ] The Phase 4.5 cross-references still resolve.
- [ ] The new test passes, and `run-tests.sh` lists it.
