# Report format

The report uses the same three groups and the same four-part finding format as
the `audit` skill. The only addition is the `Type` line.

## Start

State the surface and its register: Operate, Persuade, Read or Experience. If
`DESIGN.md` exists, state the design intent for that surface.

## Groups

Most important first. Skip empty groups.

- **Must fix:** a flow breaks, data is lost, or the page is unusable.
- **Should fix:** a craft or fit problem that hurts the task.
- **Nice to have:** small polish.

## Each finding

Number findings across all groups, so the user can say "fix 2 and 5".

```markdown
2. **The save button is a 20px square** (`src/components/Save.tsx:44`)
   - **Type:** Craft
   - **What this is:** The primary action on the settings page.
   - **Problem:** Its label is clipped, and the target is below 24px.
   - **Fix:** Use `padding: 8px 12px; min-width: 44px; min-height: 44px`.
   - **If we skip it:** People cannot read or hit the main action.
```

The four parts are one or two short sentences each.

- **What this is:** the element and its job.
- **Problem:** the concrete cause, with the file or element when known.
- **Fix:** the smallest change that works.
- **If we skip it:** the cost to a person using the page.

## Type

Use exactly one:

- **Flow:** an action fails, a state is broken, a control does nothing, content
  is clipped, or a console error breaks the page.
- **Craft:** spacing, type, color, contrast, alignment, focus, states,
  responsive overflow, or inconsistent tokens.
- **Fit:** the design does not serve the job. A tool that reads like a marketing
  page, a landing page that hides the product, or a visual language that
  contradicts the audience.

Fit is not a taste opinion. Name the job and show how the design fights it.

## End

```markdown
Verdict: one line: healthy, or what to fix first.
Checked: pages, viewports, states and flows you tested.
Not checked: write flows, SSO/MFA pages, native apps, or anything the budget
cut.
```

If nothing is found, say so, then state what you checked and what you did not.

## The report is the brief

`ui-design` reads this report as its brief. It must be concrete enough to act
on: the element, the value, the file, the expected result. "Improve the
spacing" is not a finding.
