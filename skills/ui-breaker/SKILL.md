---
name: ui-breaker
description: Use when the user sees a UI problem they cannot name, asks to test or review a web UI, or wants to know why a page looks or behaves wrong. Also use when a UI change needs browser evidence before it ships.
---

# UI Breaker

A critic with a playtester's hands. It judges the rendered page and tries to
break it. Read-only.

It writes only the report and blank `.env` keys.

## When to use

Use when the UI looks wrong, ugly or broken, when the user asks to test or
review a web UI, or when a page behaves wrong.

Do not use for a native app, a backend change, or a code review. Use `audit` for
code and `requesting-code-review` for a diff.

## Process

1. **Target.** Use the named page or flow. If none, map the routes and choose
   the main flows. Say what you will not check.
2. **URL and branch.** Find the URL. If no server runs, start the project in the
   background. If it is unknown, ask. The server must serve the branch
   under test.
3. **Login.** For a login, use the `.env` flow in
   [references/browser-protocol.md](references/browser-protocol.md). Never ask
   for credentials in the chat.
4. **Plan three rounds.**
   - **Functional:** action → expected result.
   - **Adversarial:** empty, huge, special characters, rapid clicks, Escape,
     back, refresh, error and empty states.
   - **Coverage:** 375px, 1440px, keyboard only, console, images, overflow,
     contrast.
5. **Run the loop.** Use the browser tool in the session that has it.
   Snapshot → act → snapshot → assert. Record `PASS|test|evidence` or
   `FAIL|test|expected → actual|screenshot`.
6. **Report.** Use [references/report-format.md](references/report-format.md).
   Type each finding `Flow`, `Craft` or `Fit`. Judge Fit and Craft with
   [the taste bar](../ui-design/references/taste-bar.md).
7. **Follow-up.** Ask: make issues, or fix now. Fix now invokes `ui-design`
   with the report.

## Safety

- Never click a **write action**: create, update, delete, send or pay.
- Login is allowed. Sign-up, password reset and account changes are not.
- Type only when the field does not autosave or submit.
- A read-only search is allowed.
- If unsure, do not act. Mark it `not tested: possible write`.
- Report write flows as not checked.

## Limits

- Write flows are not tested.
- SSO, MFA and OAuth may block login. Say so.
- Native apps are out of scope.
- The browser tool may be root-only or open to subagents. Check before you
  stop.
- If no browser tool exists, stop. Do not substitute HTTP fetches or another
  browser.

## Common rationalizations

| Excuse | Reality |
|---|---|
| "One screenshot is enough." | A screenshot cannot click. Test the flow. |
| "I'll POST delete to check it." | That is a write action. Do not do it. |
| "The page loaded, so it works." | A load is not a test. Check the states. |
| "I can read the HTML instead." | Read the rendered page. The HTML misses layout and console errors. |
