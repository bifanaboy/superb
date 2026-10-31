# Grilling the Design

## When this applies

Read this file after the human confirms an approach in "Lay out the approaches". The grill replaces the one-question rule for the rest of the conversation. When the frontier is empty and the human confirms the playback, return to brainstorming at "Size the Work".

If the human declines the grill, return to brainstorming at "Size the Work" immediately.

## Design tree and frontier

Treat the design as a tree. Every decision branches into the decisions that depend on it. The frontier is every decision whose prerequisites are already settled.

Ask the whole frontier in one round. A question whose answer depends on another open question belongs to a later round.

## Rounds

Ask the whole frontier in one round. Number each question. Give your recommended answer. Wait for the human's answers before the next round. Recompute the frontier after every round. Stop when the frontier is empty.

## Recommended answers

Every question carries a recommendation. Word the question so "yes" accepts the recommendation. If the human says no, ask what they want instead or propose another answer.

## Finding facts

Finding facts is your job, not the human's. Read files, run commands, or dispatch an `explore` subagent. Use the fast role for fact lookup. Never ask the human for something the project or the tools can answer. A running lookup blocks only the questions that depend on it; ask the rest of the frontier now.

## Scope

Work the branches the chosen approach leaves open. Do not re-ask what the describing phase settled. Do not use the grill to relitigate the approach. If an answer changes the approach, say so and return to "Lay out the approaches" rather than hiding the change in the grill.

## Exit

When the frontier is empty, play the settled decisions back in one message. Ask what is wrong or missing. Do not act on the design until the human confirms. Then return to brainstorming at "Size the Work".

## Opting out

"Just write it" or any clear decline ends the grill immediately. Return to brainstorming at "Size the Work".

## Visual questions

The visual companion rules still apply. Layouts, flows, and mockups may go to the browser. Requirements, scope, and tradeoffs stay in text.

## Proportionality

Scale to the decision surface, not to a fixed number of rounds. A small change may need one round of one or two questions. A project may need several rounds.
