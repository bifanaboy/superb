# Direction method

## 1. Product facts

Write these down before any visual choice:

- Who uses this? What do they need to do?
- What content does the product hold? What is the main object on the page?
- What are the constraints: device, speed, data, brand, existing components?
- What assets exist: logo, photography, type, color, tone of voice?

## 2. Register

Choose Operate, Persuade, Read or Experience. See `registers.md`. The register
comes from the surface, not the product. A tool's landing page is Persuade; a
tool's settings page is Operate.

## 3. Concept

Find a concept in the product's own world:

- A scheduler: time, intervals, the week grid, the hand of a clock.
- A ledger: precision, rows, the column, the receipt, the balance.
- A music tool: album art, the waveform, the queue, the rhythm.
- A research lab: papers, the terminal, the archive, the lab notebook.
- A shop: the product photograph, the rack, the label, the hanger.

Write one line of intent: who uses this, what they must do, and what the design
should make them notice. Every direction must pass that line.

## 4. Three directions

Make three distinct directions. Each has:

- a name
- the idea in one line
- type: family, scale, weight
- palette: a narrow set with one accent
- layout logic: the grid, the measure, the density
- motion: one moment that explains a change
- what it sacrifices

Three directions means three concepts. A color swap is not a direction.

## 5. Fallbacks

- **Greenfield:** use the domain, the audience and the job. A finance app still
  has a world: numbers, ledgers, trust, calm. Do not reach for a style menu.
- **Local element:** use the surrounding design system. The element must fit
  the page, not start a new world.
- **Last resort:** a named style library. State that you used it, and why the
  product gave no concept.

## 6. Mockups

Build realistic mockups with the real content:

- static HTML and CSS
- one comparison page with three panels
- desktop and mobile captures
- the real copy, data and images, not lorem ipsum

If the content is missing, write realistic placeholder content and mark it in
the delivery note. Do not put "sample" or "placeholder" in the interface.

## 7. Pick

Show the comparison page. Say what each direction sacrifices. Wait for the
user's pick. Do not build before the pick.

## 8. Record

Write `DESIGN.md`:

```markdown
# Design

## Product
Who uses this, what they do, what they need.

## Foundation
Brand, palette, type, spacing, motion, component rules, what not to do.

## Surfaces
### <surface>
- Register: Operate | Persuade | Read | Experience
- Intent: one line
- Direction: name and idea
```

One app-wide direction. A second surface can have its own register and intent,
but it shares the foundation.

## 9. Build and verify

Build the chosen direction. Keep the brand and assets. Use existing tokens and
components. TDD for logic; before-and-after captures for the look. Ask
`ui-breaker` to check the result.
