# Browser protocol

## Setup

The skill ships no browser. Use the tool the harness provides.

- **OpenCode desktop app:** the built-in `browser` namespace.
- **TUI or CLI:** a browser MCP, such as the Playwright MCP.

Merge this into the existing `mcp.servers` object in
`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "type": "local",
        "command": ["npx", "-y", "@playwright/mcp@latest", "--headless"],
        "codemode": false
      }
    }
  }
}
```

Check it with `opencode mcp list`. If the browser cannot launch, run
`npx playwright install chrome`, or set `--executable-path <path>` to an
installed Chromium.

If no browser tool is available, stop. Do not substitute HTTP fetches or a
separate browser.

## The namespace

Use the browser tool the harness provides. Two common backends:

- **Built-in `browser` namespace** through `execute`: `tools.browser.*`. Open a
  tab, keep the `tabID`, and pass it to every later call.
- **Playwright MCP**: `browser_navigate`, `browser_snapshot`, `browser_click`,
  `browser_type`, `browser_press_key`, `browser_resize`,
  `browser_take_screenshot`, `browser_console_messages`,
  `browser_network_requests`, `browser_evaluate`, `browser_tabs`,
  `browser_close`. Your tool list may prefix them with the server name, for
  example `playwright_browser_navigate`.

Discover the exact names and schemas first. Do not assume a name.

The built-in namespace exposes `open`, `tabs`, `navigate`, `snapshot`, `search`,
`click`, `fill`, `press`, `hover`, `select`, `resize`, `setViewport`,
`viewport`, `screenshot`, `console`, `network`, `eval`, `lighthouse`,
`accessibility`, `trace`, `heap`, `performance`, `wait`, `close` and
`list_tabs`.

A snapshot gives you element references. Act on a reference, then snapshot
again.

## The loop

1. Open the URL and keep the `tabID`.
2. Snapshot the page. Read the accessible tree, not just the pixels.
3. Act on one reference: click, fill, press, hover or select.
4. Snapshot again.
5. Assert. Compare the before and after states.
6. Record one marker:
   - `PASS|<test>|<evidence>`
   - `FAIL|<test>|<expected> → <actual>|<screenshot path>`

A PASS needs evidence: an element reference, a value, a URL, or a screenshot.
Never write PASS because the page "looks fine".

## Three planning rounds

Before you act, write the plan in your own response.

- **Functional:** what should work? Each test is action → expected result.
- **Adversarial:** empty, huge, special characters, rapid double-click, Escape,
  back, refresh, error states, empty states.
- **Coverage:** 375px, 1440px, keyboard only, console errors, broken images,
  horizontal overflow, contrast, focus.

Merge and dedupe the three rounds. Do not stop at the first failure. Find as
many problems as the budget allows.

## Step budget

Give each run a budget in browser steps. A rough guide:

- 25 steps: a few targeted checks.
- 40 steps: one page with functional, adversarial and accessibility checks.
- 75 steps: several pages or a broad category.

When the budget is reached, stop and report what you did not test. Do not
retry a test you already ran.

## Evidence

- `screenshot` on every failure. Save it under
  `.superb/ui-breaker/<run>/`.
- `console` for uncaught errors and failed requests.
- `network` for failed requests and unexpected writes.
- `lighthouse` for accessibility and performance. If it is unavailable, use
  `accessibility` or a manual checklist, and say which one you used.
- `resize` or `setViewport` at 375px and 1440px. Check horizontal overflow.
- A clean Lighthouse run does not prove the page is good. It is evidence, not a
  verdict.

## Credentials

The browser may be headless. The user cannot log in by hand.

1. Read the app's auth: the login form fields, the project's env conventions,
   the README, and any test fixtures. Do not guess a secret.
2. Check the project's `.env` is git-ignored:
   `git check-ignore -q .env`. If it is not ignored, stop and ask the user to
   add it to `.gitignore` or choose another path. Never write credentials to a
   tracked file.
3. Read only the keys you need. Do not print the file or the values.
4. If the file already has test credentials, use them. Otherwise append the
   missing names with blank values. Do not overwrite an existing line. Use
   `APP_USER` and `APP_PASS` by default. Add `APP_SESSION_COOKIE` when the app
   uses a cookie session.
5. Set the file mode to `600`.
6. Tell the user the exact path and the names to fill. Do not print the values.
7. Wait for the user to confirm.
8. Read the values, fill the login form, and submit. Login submission is
   allowed.
9. Redact the values from logs, reports and screenshots. Do not screenshot the
   login form.
10. If the app uses SSO, MFA or an OAuth provider that the form cannot complete,
    stop and report that authenticated pages were not checked.

Use a dedicated test account with the least access needed. Do not use a personal
or admin account. The agent must read the values to fill the form, so they appear
in the session. Keep them out of prose, reports and screenshots.

## The write boundary

A write action is any action that creates, updates, deletes, sends or pays. Do
not click it. Do not send it with `curl`, `fetch` or any other tool.

Login submission is allowed. Sign-up, password reset and account changes are
write actions.

Typing into a field is allowed only when the field does not autosave or submit
on input. A read-only search is allowed. If you cannot tell whether an action
writes, do not act. Mark it `not tested: possible write`.

## The branch check

Before you judge, prove the server serves the branch under test:

```bash
git branch --show-current
git rev-parse HEAD
```

The browser must show the content of that commit. If the dev server serves
main or a stale build, restart it and check again.

## Missing tool

The browser tool may be root-only, or it may be available to subagents, depending
on the backend. Check the session you are in. If a subagent lacks it, the root
agent can drive the browser and pass the snapshots and console output to the
subagent.

If no browser tool is available, stop. Say which interface lacks it. Do not
substitute HTTP fetches, `curl`, a separate headless browser, or a screenshot
service.
