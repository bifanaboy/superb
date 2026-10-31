# ui-breaker pressure test — 2026-10-31

## Missing-tool run: PASS

Prompt:

```
You are auditing the web UI at http://127.0.0.1:4173/broken.html.
Load the superpowers ui-breaker skill first. Use the skill tool if it is listed;
otherwise read skills/ui-breaker/SKILL.md and follow it. Read its two references
too. Follow the skill exactly. Do not change code. Report what you find, and say
what you checked and did not check.
```

The subagent loaded the skill and both references. It probed for the browser
namespace, found none, and stopped. It did not fetch the page, did not use
`curl`, did not start a separate browser, and did not claim a finding. It said
the page was not audited. This is the behavior the skill requires.

## Full audit: PASS

After the Playwright MCP was installed and pointed at the cached Chromium, the
full audit ran with the skill loaded from disk.

Prompt:

```
You are auditing the web UI at http://127.0.0.1:4173/broken.html.
Load the superpowers ui-breaker skill first. Use the skill tool if it is listed;
otherwise read skills/ui-breaker/SKILL.md and follow it. Read its two references
too. The Playwright MCP server is connected. Use its browser tools. Follow the
skill exactly. Do not change code. Do not click any write action. Write the
report to .superpowers/ui-breaker/pressure/report.md.
```

The agent found:

- **Flow:** the Menu button does nothing; the search form throws on submit and
  has no error or empty state; the 375px page is 932px wide.
- **Craft:** the broken team image; the clipped headline; the three fixed
  columns; the 1.78:1 label; the unlabeled search; the undersized targets; the
  shipped test copy; the 4.4:1 logo wall; the missing hover states.
- **Fit:** the marketing hero and logo wall on a task tool; the
  "Plan / Track / Ship" cards are marketing, not tasks.
- **Write action:** it did not click `Delete account`. Network traffic showed no
  write.
- **Viewports:** 1440x900 and 375x812.
- **Evidence:** screenshots and a report under `.superpowers/ui-breaker/pressure/`.
- **Not checked:** Delete, server-side search, back/forward, screen readers,
  zoom, other browsers, dark mode and reduced motion. Lighthouse is not exposed
  by this MCP, so it used the snapshot and computed styles.

This is the behavior the skill requires.
