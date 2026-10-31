---
name: ui-design
description: Use when the user asks for a new look, a new design element, a remodel, or a fix that needs design judgment. Also use when a ui-breaker report shows a Fit problem, or when an existing page needs a direction that fits its job.
---

# UI Design

Build a product-derived direction. There is no house style. Verify the result
with `ui-breaker`.

## When to use

Use when the user asks for a new look, a new element, a remodel, or a fix that
needs design judgment. Use it for a Fit problem in a `ui-breaker` report.

Do not use for a small copy change, a pure layout bug, or a backend change. Fix
those directly or use `systematic-debugging`.

## Process

1. **Read.** Read the request and `DESIGN.md` if it exists. Resolve the target
   and scope.
2. **Facts.** Gather the product facts: users, tasks, content, constraints,
   brand and existing assets.
3. **Register.** Choose Operate, Persuade, Read or Experience. See
   [references/registers.md](references/registers.md).
4. **Route.** If the current direction is sound and the findings are Craft or
   Flow, fix inside it. If the findings include Fit, or the user asks for a new
   look, layout or theme, continue.
5. **Concept.** Find a concept in the product's own world. Write one line of
   intent. See [references/direction-method.md](references/direction-method.md).
6. **Directions.** Make three distinct directions. Two for a small element; one
   for a local fix. Each has a name, an idea, type, palette, layout logic,
   motion, and what it sacrifices.
7. **Mockups.** Build realistic mockups with the real content: static HTML and
   CSS, one comparison page with three panels, plus mobile captures.
8. **Pick.** Show the mockups and wait. Do not build before the user picks.
9. **Record.** Write `DESIGN.md`: a shared foundation plus a `surfaces` entry
   for the changed surface. Use one app-wide direction, not one look per page.
10. **Build.** Keep the brand and assets. Use the existing tokens and
    components. Add no framework without approval.
11. **Verify.** TDD for logic. Before-and-after captures for the look. Ask
    `ui-breaker` to check the result with
    [its browser protocol](../ui-breaker/references/browser-protocol.md).
12. **Hand off.** Code review, evidence, finish.

## Taste

Read [references/taste-bar.md](references/taste-bar.md). The short version:
content first; one narrow palette; real imagery or none; motion only to explain;
no category template; no house style.

## Handoff

`brainstorming` owns the intent and the approval. `writing-plans` owns the task
plan. `ui-breaker` owns the check. Do not skip approval for a new look or a
remodel.

## Common rationalizations

| Excuse | Reality |
|---|---|
| "Three color swaps are three directions." | A direction changes the concept, not only the hue. |
| "I'll copy the reference." | A clone is as wrong as the slop. Take the principle. |
| "The user cannot describe it, so I choose." | Show options. They can react to a picture. |
| "The SaaS cards are safe." | Safe is the template the taste bar rejects. |
