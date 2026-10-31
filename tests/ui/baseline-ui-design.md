# ui-design baseline — 2026-10-31

## Prompt

```
Make http://127.0.0.1:4173/bland.html look better.
Show me two or three options.
Do not change code yet.
Say how you inspected the page.
```

## Result

The agent inspected the page in Playwright at 1280x900 and 390x760. It took
snapshots and screenshots, measured computed styles, and found seven real
problems: the mobile collapse, no measure cap, weak nav states, an accidental
type scale, 13px checkboxes, an oversized settings panel, and content bugs.

It produced three options:

- **Option A, Refined default:** keep the structure, fix type, space and
  hierarchy.
- **Option B, App shell with cards:** off-white page, white cards, 14px radii,
  indigo accent, a due-soon chip.
- **Option C, Warm editorial:** serif display, warm paper, terracotta accent,
  hairlines, an inline settings form.

It showed desktop and mobile screenshots for each, used the real content, and
did not edit project files. It asked about the app's job at the end.

## Why the baseline fails the criteria

- It produced three distinct, realistic options, not color swaps. That
  criterion passes.
- It used the real content. That criterion passes.
- It did not use a house style. That criterion passes.
- **It did not derive the options from the product's world.** The options are
  three generic styles: a refined default, the SaaS card template, and a warm
  editorial look. They could fit almost any app. The agent asked what the app's
  job was only after it built them.
- It did not write `DESIGN.md`, define one app-wide direction, or verify the
  result with `ui-breaker`.

The skill must keep the option quality and add the product facts, the surface
register, the concept, the taste bar, the app-wide direction, and the
verification.
