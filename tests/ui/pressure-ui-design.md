# ui-design pressure test — 2026-10-31

## Options run: PASS

Prompt:

```
Make http://127.0.0.1:4173/bland.html look better.
Load the superb ui-design skill first. Use the skill tool if it is listed;
otherwise read skills/ui-design/SKILL.md and follow it. Read its three references
too. Show me two or three options. Do not change code. Build the comparison page
and the desktop and mobile captures under .superb/ui-design/pressure/.
Stop after you show the options and wait for my pick. Say what each direction
sacrifices.
```

The agent read the surface as **Operate**. It wrote the intent: make the shape
of the day visible, and make the checkbox the easiest object on the page.

It produced three product-derived directions:

- **01 — Day sheet:** a typed planner sheet. Serif day masthead, tasks on ruled
  lines, times in the margin, pencil-red only for the due-soon time,
  preferences at the foot.
- **02 — Time rail:** the day as a schedule. Untimed work in an Anytime tray,
  the 14:00 task at its hour on a rail, preferences in a side drawer.
- **03 — Desk lamp:** one task lit at a time on a near-black desk. A brass due
  time, a short "Then" queue, completion promotes the next task, display
  settings in a popover.

Each direction states what it sacrifices. The agent built a comparison page and
desktop and mobile captures under `.superb/ui-design/pressure/`. It used
the real content, fixed the false "Inbox current" state, labeled the checkboxes,
added focus and hover states, and moved settings out of the working list. It did
not touch `tests/ui/fixtures/bland.html`.

This is the product-derived method working. The baseline produced three generic
styles; the skill produced three concepts from the task's own world.

## Pick and verify: PASS

The parent picked 01 — Day sheet. The agent:

- wrote `DESIGN.md` with the foundation and the Today surface entry;
- built `day-sheet.html` and updated the comparison page;
- loaded `ui-breaker` and audited the built page.

The breaker found:

- **Craft:** the preference field boundary is 2.39:1, below 3:1.
- **Craft:** the skip link moves the viewport, not focus.
- **Craft:** the untimed rows' em dash is read as "dash".
- **Flow:** Inbox/Upcoming are `href="#"` placeholders.
- **Nice to have:** preference controls are 30px tall at 375px.

Verdict: healthy, with two accessibility fixes first. The app fixture is
untouched. Checked and not checked are in
`.superb/ui-breaker/day-sheet/report.md`.

The full cycle works: product-derived options, the pick, `DESIGN.md`, the build,
and the breaker check.
