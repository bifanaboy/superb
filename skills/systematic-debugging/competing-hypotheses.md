# Competing Hypotheses

Use this method when a bug has more than one plausible cause, or when a fix
did not work and the cause is still unclear.

## Generate hypotheses

Cover these six categories. Skip a category only when the evidence rules it
out.

1. **Logic error** — a wrong operator, a missing case, an off-by-one, or a
   broken algorithm.
2. **Data issue** — bad input, a type mismatch, a null value, a bad
   encoding, or a truncated value.
3. **State problem** — a race, a stale cache, a bad default, an unintended
   mutation, or a wrong state transition.
4. **Integration failure** — an API contract change, a version mismatch, a
   config mismatch, a missing env var, or a timeout.
5. **Resource issue** — a memory leak, an exhausted pool, a leaked handle,
   a full disk, or CPU saturation.
6. **Environment** — a missing dependency, a wrong version, a platform
   difference, a permission problem, or a locale problem.

For each hypothesis, write:

- Statement: "I think X is the root cause because Y."
- Evidence for: direct evidence, with a citation.
- Evidence against: what contradicts it.
- Test: the smallest test that separates it from the other candidates.
- Expected result if true.

## Evidence strength

| Type | Strength | Example |
|---|---|---|
| Direct | Strong | `src/user.ts:87` does not check for an empty string. |
| Correlational | Medium | The error rate rose after commit `abc123`. |
| Testimonial | Weak | "It works on my machine." |
| Absence | Variable | No null check exists on this path. |

Cite every claim as `file:line`, or as a command with its output. A claim
without a citation is a guess.

## Confidence

- **High** — more than one piece of direct evidence, a clear causal chain,
  and no contradicting evidence.
- **Medium** — some direct evidence, a plausible chain, and minor gaps.
- **Low** — mostly correlational evidence, an incomplete chain, or
  contradicting evidence.

## Test and arbitrate

1. Test the hypothesis that is cheapest to test and best separates the
   candidates.
2. Change one variable at a time.
3. Mark each hypothesis **confirmed**, **plausible**, **falsified**, or
   **inconclusive**.
4. If one hypothesis dominates, use it as the root cause.
5. If several are confirmed, look for a compound cause.
6. If none are confirmed, return to Phase 1 with the new evidence.

Do not fix anything until one hypothesis is confirmed or the compound cause
is understood.

## Parallel investigation

If the harness has subagents, assign one hypothesis per investigator. Use
`superb:dispatching-parallel-agents`. Require each investigator to cite
evidence in the format above.
