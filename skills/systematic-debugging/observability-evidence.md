# Observability Evidence

## Overview

Some bugs do not reproduce on your machine. They fail in production, in one cohort, or only under load. You cannot run the failing code, but the system already recorded what happened.

**Core principle:** When you cannot reproduce the bug, rebuild the failing path from recorded data before you form a hypothesis.

"No repro" is not permission to guess. The Iron Law still holds: no fix without a root cause. This file changes where the evidence comes from, not the standard for accepting a cause.

## When to Use

- The bug appears only in production or staging.
- The bug is intermittent.
- The bug needs data or a state you cannot recreate.
- Users report it, and your local suite is clean.
- A reproduction is expensive, and record data may answer the question first.

## Find the Signal Source

Ask which system already records what happened. Then collect from the source that answers your question, not from every source.

| Source | Answers |
|---|---|
| Error tracking | What failed, how often, in which release |
| Traces | The full path of one slow or failed request |
| Metrics | Rates, latencies, saturation, error ratios |
| Logs | The detailed record around one failure |
| User reports | The exact steps and the time of failure |

Describe the kind of source. Do not depend on one product.

## Queries That Separate Causes

- **Frequency over time.** Did it start at a deploy? Is it growing?
- **Cohort.** One user, one tenant, one region, one client version?
- **Environment.** Production only? One node? One configuration?
- **Deploy correlation.** Which commit or flag landed before the first error?
- **Related errors.** Does another error always come first?
- **Saturation.** What were CPU, memory, connections, or queue depth at the failure time?

A query that cannot separate two hypotheses is not worth running.

Start from the cheapest query that can split the likely causes. Read `competing-hypotheses.md` when more than one cause is plausible.

## Gather One Run of Evidence

Find one failing request, job, or session, and read it end to end.

For each step, write what entered and what left. Stop at the first step where the data is wrong. That step holds the cause.

Cite every claim as `source:citation`: an error ID, a trace ID, a log line, or `file:line`. A claim without a citation is a guess.

Record the evidence before you theorize. A hypothesis written first will bend the reading of the data.

## Gather Evidence in Production Safely

- Scope new logging to one user, one request, or one feature flag.
- Sample. Do not log every request.
- Prefer read-only inspection endpoints.
- Never change production state to test a hypothesis.
- Remove temporary instrumentation after the fix, or promote it to a real alert.

## Return to the Process

The evidence points at one component → return to Phase 1 step 5 and trace the data flow with `root-cause-tracing.md`.

More than one cause is plausible → arbitrate with `competing-hypotheses.md`.

Several independent signals need checking → dispatch parallel investigators with `superpowers:dispatching-parallel-agents`.

Do not fix anything until the evidence shows where the failure starts.
