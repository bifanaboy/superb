# UI Skills Design: `ui-breaker` and `ui-design`

**Date:** 2026-10-31
**Status:** Approved design, ready for planning
**Issue:** bifanaboy/superpowers#19

## Intent

The plugin has strong process skills but no UI-specific skill. Three problems
motivate this work:

1. Agents design ugly, tacky, or over-designed interfaces that do not fit the
   app's function.
2. Agents use browser tools badly. They take a screenshot or assume, instead of
   clicking through screens and states to see what breaks.
3. A user can see that a UI is wrong but cannot name the problem or find the
   cause.

This design adds two skills:

- `ui-breaker`: a read-only critic and playtester. It finds and proves UI
  problems.
- `ui-design`: an implementation skill. It chooses a product-derived direction
  and builds it.

They form a cycle: break, report, fix, verify.

## Goals

- Find UI problems the user cannot name, with evidence from the rendered app.
- Judge both craft and fit, so a polished but inappropriate design is still a
  finding.
- Click through real flows and states, not just look at a screenshot.
- Produce a fix that fits the app's function, not a house style.
- Fit the existing Superpowers workflow without replacing it.
- Keep the browser interaction protocol in one place.

## Non-goals

- Native iOS or Android UI. The harness browser tool cannot inspect it.
- Backend or API testing beyond what the UI needs.
- Automated visual regression as a mandatory gate.
- A component library or a design system generator.
- A fixed style menu or a house look.
- Replacing `audit`, `brainstorming`, `writing-plans`, TDD, or code review.

## Anti-goals

- A "beautiful" result that ignores the app's job.
- A clone of JJJJound, Nous, or any reference.
- An agent that declares its own UI work good.
- An audit that edits code.
- An audit that clicks delete, send, pay, or submit.
- A skill that claims a page was checked when the browser tool was missing.

## Constraints

- **Harness browser tool.** The browser backend is the tool the harness
  provides. On the OpenCode desktop app it is the built-in `browser` namespace.
  On the TUI or CLI it is a configured browser MCP, such as the Playwright MCP.
  The plugin ships no browser. It does not use a bundled Playwright script or an
  HTTP fetch as a substitute. The skill discovers the tool names and
  capabilities first. If no browser tool is available, the breaker stops.
- **`ui-breaker` is read-only in effect.** It never clicks a write action.
- **`ui-design` edits code but does not self-certify.** It asks `ui-breaker`
  to check the result.
- **OpenCode-first.** The repo is a personal OpenCode 2 build. The browser
  protocol names both the built-in namespace and the Playwright MCP tools, and
  discovers the actual names in the session.
- **The repo's writing-skills Iron Law applies.** No new skill without a
  failing pressure test first.
- **Flat namespace.** Both skills live under `skills/`, with `name` and
  `description` frontmatter.

## Definitions

- **Flow:** an action breaks, a state is broken, a control does not work,
  content is clipped, or a console error breaks the page.
- **Craft:** spacing, type, color, contrast, alignment, focus, states,
  responsive overflow, inconsistent tokens.
- **Fit:** the design does not serve the job. A dense tool uses a marketing
  hero. A landing page hides the product. A settings page uses oversized type.
  The visual language contradicts the audience.
- **Register:** the kind of surface, which sets the ambition level. Operate,
  Persuade, Read, Experience.
- **Direction:** a visual concept with a name, a one-line idea, type, palette,
  layout logic, motion, and what it sacrifices.
- **Product-derived:** the direction grows from the product's own content,
  data, language, imagery, and job. It is not chosen from a style menu.

## Approaches considered

### How many skills

**A. Two skills: `ui-breaker` + `ui-design` (chosen).**

- Different permissions: read-only versus edits code.
- Different triggers: "find what is wrong" versus "add a look".
- The cycle is visible: the report becomes the brief; the design asks the
  breaker to check the result.
- Matches the plugin: `audit` is read-only; `ui-breaker` is its rendered-UI
  peer. `ui-design` is a domain implementation skill, like TDD.

**B. One skill with two modes.**

Rejected. It weakens the read-only gate and invites the model to skip the
report and start editing. It also makes discovery ambiguous.

**C. Three skills with a separate browser skill.**

Rejected. The browser protocol is a shared reference file, not a skill. It has
no independent trigger. The audit and design skills are the only entry points
the user needs.

### How directions are generated

**A. Product-derived (chosen).**

Read the product facts: users, tasks, content, constraints, existing assets.
Choose the register. Find a concept in the product's own world. A scheduling
tool gives time and intervals. A ledger gives precision and rows. A music tool
gives album art and rhythm. Generate distinct directions from different
concepts, not different colors. Check each direction against the main task.

This gives variety and fit. The risk is a weak concept. The one-line intent and
the task check catch some of it; the user picks the direction.

**B. Style library.**

A menu of named visual languages: Swiss, editorial, brutalist, warm minimal,
technical. The agent picks two or three that fit the surface. Rejected as the
primary method. It becomes a trend menu and gives every app a known look. It may
be a fallback only when the product gives no usable concept.

**C. Reference-driven.**

The user supplies a reference for each project, and the agent adapts it.
Rejected as the primary method. The user does not want to describe the look or
supply references every time. References remain calibration.

### Taste references

The user named two sites they are happy with:

- `https://www.jjjjound.com`: product first. Black and white, large photographs,
  small uppercase labels, wide space, almost no chrome. The brand is present,
  but it never competes with the product.
- `https://nousresearch.com`: technical and editorial. Strong type, a serif and
  mono mix, dark and cream surfaces, a real voice. It has personality, but the
  structure is plain and readable.

The user named two sites as tacky:

- `https://ponytail.dev` and `https://kilo.ai`: the AI-tool landing-page
  pattern. Oversized italic serif, giant metrics, logo walls, identical feature
  cards, badges, gradients, motion on everything, and claims like "built
  differently".
- `https://impeccable.style/slop/`: the same tells, catalogued. Purple gradients,
  glass and glow, cardocalypse, Inter everywhere, icon tiles, a badge above the
  headline, pulsing dots, auto-scrolling logos.

The references are calibration, not templates. A clone of JJJJound would be as
wrong as a clone of Kilo. The skill must not have a house style.

## The skills

### `ui-breaker`

**Description (draft):** Use when the user sees a UI problem they cannot name,
asks to test or review a web UI, or wants to know why a page looks or behaves
wrong. Read-only. Finds flow, craft and fit problems with browser evidence.

**Persona:** a critic with a playtester's hands.

**Process:**

1. Resolve the target: the page or flow the user names. If none, map the routes
   and choose the main user flows. State the target and what will not be
   checked.
2. Find the URL. Use the running app or the project's documented URL. If no
   server is running, start the project in the background. If the URL is still
   unknown, ask the user. The skill is web-only; a native app needs a different
   tool.
3. If login is required, use the credential file flow below. Do not ask the
   user to sign in in a headless browser. Do not ask for credentials in the
   chat.
4. Check the branch. The server must serve the branch under test, not main. If
   it serves the wrong tree, restart it.
5. Plan three rounds:
   - **Functional:** what should work? Write each test as action → expected
     result.
   - **Adversarial:** empty, huge, special characters, rapid clicks, Escape,
     back, refresh, error and empty states.
   - **Coverage:** mobile width, keyboard only, console errors, broken images,
     overflow, contrast, focus.
6. Merge and dedupe into a numbered test list. Assign groups if using subagents.
7. Run each test: snapshot → act → snapshot → assert. Record
   `PASS|test|evidence` or `FAIL|test|expected → actual|screenshot`.
8. Never click a write action. No create, update, delete, send, or pay. Login
   submission is allowed. Sign-up, password reset and account changes are write
   actions; do not do them. It may type into fields only when the field does not
   autosave or submit on input. A read-only search is allowed. If the skill
   cannot tell whether an action writes, it does not act and marks the control
   `not tested: possible write`. Report write flows as not checked. A one-run
   exception needs explicit permission.
9. Write the report: Flow/Craft/Fit, the `audit` format, three groups.
10. Save to `.superpowers/ui-breaker/<run>/report.md`; show the findings in the
    conversation.
11. Ask: make issues, or fix now.

**Credentials:**

The browser may be headless, so the user cannot log in by hand. Use the
project's `.env` file instead.

1. Read the app's auth: the login form fields, the project's env conventions,
   the README, and any test fixtures. Do not guess a secret.
2. Verify with `git check-ignore -q .env`. If `.env` is not ignored, stop and
   ask the user to add it to `.gitignore` or choose another path. Do not write
   credentials to a tracked file.
3. Read only the keys you need. Do not print the file or the values.
4. If the file has test credentials already, use them. Otherwise append the
   missing names with blank values. Do not overwrite an existing line. Use
   `APP_USER` and `APP_PASS` by default. Add `APP_SESSION_COOKIE` when the app
   uses a cookie session.
5. Set the file mode to `600` when the platform allows it.
6. Tell the user the exact path and the names to fill. Do not print the values.
7. Wait for the user to confirm.
8. Read the values, fill the login form, and submit. Login submission is
   allowed.
9. Redact the values from logs, reports and screenshots. Do not screenshot the
   login form.
10. If the app uses SSO, MFA or an OAuth provider that the form cannot complete,
    stop and report that authenticated pages were not checked. Ask for a test
    account or a session cookie only if the user offers one.

Use a dedicated test account with the least access needed. Do not use a personal
or admin account. The agent must read the values to fill the form, so they
appear in the session. Keep them out of prose, reports and screenshots.

The `.env` changes are additive and blank. `ui-breaker` writes no code.

**Report format:**

Start with the surface register and the design intent (from `DESIGN.md` if
present). These are the same three groups and the same four-part finding format
as the `audit` skill. The only addition is the Type line. Then the findings,
most important first, skipping empty groups:

- **Must fix:** a flow breaks, data is lost, the page is unusable.
- **Should fix:** a craft or fit problem that hurts the task.
- **Nice to have:** small polish.

Each finding: number, title, location, type (Flow/Craft/Fit), what it is,
problem, fix, if we skip it. End with: verdict, what was checked, what was not
checked.

**Evidence:**

- Screenshots for failures.
- Snapshots for element existence and state.
- Console errors, network failures, broken images.
- A Lighthouse accessibility audit if the backend exposes it. If not, the
  accessibility snapshot and computed styles, stated as such.
- Viewport checks for overflow.
- If the harness browser tool lacks a capability, say so. Do not substitute.

**Limits:**

- Write flows are not tested.
- SSO, MFA and OAuth logins may not be testable. The report says so.
- Native apps are out of scope.
- If the browser tool is missing, stop and report the blocker.

### `ui-design`

**Description (draft):** Use when the user asks for a new look, a new design
element, a remodel, or a fix for a UI problem that needs design judgment. Builds
a product-derived direction and verifies it with `ui-breaker`.

**Process:**

1. Read the request and `DESIGN.md` if present. Resolve the target and scope.
2. Gather product facts: users, tasks, content, constraints, existing brand and
   assets, routes.
3. Choose the register: Operate, Persuade, Read, Experience.
4. If the request is a local fix within a sound direction, fix it without
   mockups. If the report has a Fit problem or the user asks for a new look,
   layout or theme, continue.
5. Find a concept in the product's own world. Write one line of intent.
   - **Greenfield:** when the product has no existing content, derive the
     concept from the domain, the audience and the job.
   - **Local element:** derive the concept from the surrounding design system.
   - **Last resort:** use the style library only when the domain gives no
     concept. State that you did.
6. Generate three distinct directions. Two for a small element; one for a local
   fix. Each direction has: name, one-line idea, type, palette, layout logic,
   motion, what it sacrifices.
7. Build realistic mockups: static HTML and CSS, real content and tokens, one
   comparison page with three panels, plus mobile captures.
8. Show the mockups. Ask the user to pick. Do not build before the pick.
9. Write `DESIGN.md` after the pick (optional but recommended).
10. Build the chosen direction. Keep existing brand and assets. Use existing
    tokens and components. No new framework without approval.
11. TDD for logic. Before-and-after captures for the look.
12. Ask `ui-breaker` to check the result.
13. Hand off to code review and finish.

**Taste bar:**

- Content first. Space and type do the work.
- One narrow palette. One accent at most.
- Real imagery or none. No decorative illustration.
- Motion only when it explains a change.
- A voice that fits the product, not a borrowed trend.
- No category template: no logo wall, no giant metrics, no identical card grid,
  unless the content truly needs them.
- No house style. The references are calibration, not templates.

**Registers:**

- **Operate:** tools, dashboards, settings, admin. Restraint, density, familiar
  patterns.
- **Persuade:** landing, marketing, campaigns. Expression, story, real imagery.
- **Read:** docs, articles, guides. Structure, reading comfort.
- **Experience:** portfolio, gallery, showcase. The work leads.

**`DESIGN.md`:**

Optional. At the root of the project. It records the shared foundation: product,
audience, brand, palette, type, spacing, motion, component rules, and what not
to do. It also has a `surfaces` section: one entry per surface, each with its
own register, intent and direction. A product can have a Persuade marketing
page, an Operate app and a Read docs section. `ui-design` writes or updates the
entry for the surface it changes. Both skills read it if present. `ui-breaker`
judges the surface it is auditing against that surface's entry, or against the
shared foundation when no entry exists. `ui-breaker` works without the file.

## The cycles

### Repair

1. `ui-breaker` reports.
2. The user chooses issues or fix now.
3. If fix now, `ui-design` uses the report as the brief.
4. `ui-design` fixes within the current direction, or shows directions if Fit is
   the problem.
5. `ui-breaker` re-checks.
6. Code review, evidence, finish.

### New look

1. `brainstorming` with `ui-design`.
2. Product facts, register, concepts, mockups.
3. The user picks.
4. `brainstorming` writes the design doc.
5. `writing-plans` writes the plan.
6. Execute with `ui-design` and TDD.
7. `ui-breaker` verifies.
8. Code review, evidence, finish.

### Issue

1. `ui-breaker` opens an issue.
2. Later, `ui-design` uses the issue as the brief.
3. `ui-breaker` verifies.
4. Finish.

## Integration with existing skills

| Skill | Relationship |
|---|---|
| `brainstorming` | Owns intent and approval. Calls `ui-design` for directions and mockups on new visual work. |
| `writing-plans` | Owns the task plan. `ui-design` supplies visual decisions; visual tasks name it as a required sub-skill. |
| `executing-plans` / `subagent-driven-development` | Own implementation. Load `ui-design` for visual tasks. |
| `test-driven-development` | Owns behavior and logic. The breaker owns the look. Both run when a change touches both. |
| `requesting-code-review` | Owns code quality. Does not replace the UI check. |
| `verification-before-completion` | Accepts fresh capture and interaction evidence as proof for visual claims. |
| `finishing-a-development-branch` | Runs after both the code gate and the UI gate. |
| `audit` | Peer. Code audit vs rendered-UI audit. Neither replaces the other. |
| `using-git-worktrees` | Provides isolation. The breaker proves the browser serves the branch. |
| `dispatching-parallel-agents` | Fans out independent breaker checks. |
| `systematic-debugging` | Handles functional bugs found during interaction. The breaker reports; it does not fix. |

## Evidence rule

- Behavior and logic: TDD, a failing test first.
- The look: before-and-after captures at desktop and mobile, plus deterministic
  checks for console, Lighthouse accessibility, overflow and contrast.
- A change that touches both needs both.
- `verification-before-completion` accepts the breaker's fresh evidence as the
  proof for visual claims.
- A Playwright test is required only when the change touches a behavior or a
  flow.

## File structure

```
skills/
  ui-breaker/
    SKILL.md
    references/
      browser-protocol.md
      report-format.md
  ui-design/
    SKILL.md
    references/
      taste-bar.md
      direction-method.md
      registers.md
```

Cross-links:

- `ui-breaker/SKILL.md` links to `../ui-design/references/taste-bar.md` for the
  Fit and Craft judgment.
- `ui-design/SKILL.md` links to `../ui-breaker/references/browser-protocol.md`
  for capture and verification.

No scripts. No new dependencies in the plugin. The browser backend is
configured in the harness: the built-in `browser` namespace on the desktop app,
or a browser MCP such as the Playwright MCP on the TUI/CLI.

## Testing

Pressure tests per `writing-skills`:

- A deliberately broken demo page with planted Flow, Craft and Fit defects. The
  breaker must find them, with evidence, and must not click write actions.
- A bland demo page. The design skill must produce three distinct
  product-derived directions, not three color swaps and not a house style.
- A missing browser tool. The breaker must stop and report the blocker, not
  claim it checked the UI.
- A write-action button. The breaker must not click it, and must report the flow
  as not checked.
- A login page. The breaker verifies `.env` is git-ignored, appends blank
  `APP_USER` and `APP_PASS` without overwriting existing keys, tells the user
  the path, waits, logs in, and never prints the values. If `.env` is tracked,
  it stops. If the keys are not filled, it stops and reports that authenticated
  pages were not checked.
- An SSO-only login. The breaker stops and reports the limitation.

Other tests:

- Registration: both skills appear in the plugin's skill list with the correct
  descriptions.
- Cross-links: the referenced files exist.
- No automated browser test in CI. The pressure tests are manual or
  subagent-based, as the repo's other skill tests are.

## Risks and limits

- The harness browser tool may be missing or limited. The breaker stops; it does
  not fake evidence. The Playwright MCP needs a browser binary: install Chrome
  for Testing or set `--executable-path`.
- No write actions means forms, checkout, delete and send flows are not tested.
  The report must say so.
- Headless login needs the credential file. SSO and MFA may block it. The report
  must say so.
- The breaker edits `.env`. It appends only missing blank keys, stops if the
  file is tracked, and sets mode 600. The agent sees the values when it fills
  the form; use a test account.
- Static mockups are not the real app. They show the direction, not the final
  behavior. The build and the breaker check the real thing.
- The design skill may pick a weak concept. The one-line intent and the task
  check catch some of it; the user picks the direction.
- The skills add maintenance and cross-links. Keep the shared references small.

## What is left to the builder

- Exact `SKILL.md` wording and token budgets.
- The browser protocol's setup note and tool mapping: the desktop app's
  `browser` namespace, or the Playwright MCP's `browser_*` tools.
- The pressure-test fixtures: the broken demo page, the login page, and the
  bland demo page.
- The credential file template and the variable-name discovery step.
- The `DESIGN.md` template.
- The mockup comparison page template.
- Updates to the README and the `using-superpowers` skill-priority example.
- Whether the breaker's report file should be tracked or git-ignored.
  Recommendation: git-ignored.
- The exact follow-up wording for "make issues or fix now."
