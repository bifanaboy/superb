# Installing Superb for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

OpenCode 2.0.4 or later is required.

```json
{
  "plugins": ["superb@git+https://github.com/bifanaboy/superb.git"]
}
```

For a local installation, configure the repository directory containing
`index.js`. OpenCode 2.0.4 and 2.0.7 reject a configured direct JavaScript-file
path. Discovered plugin symlinks remain supported.

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about Superb"

OpenCode uses its own plugin install. Superb targets OpenCode 2 only.

## Browser setup for the UI skills

The UI skills need a browser tool. The plugin does not ship one.

- **OpenCode desktop app:** the built-in `browser` namespace is available. No
  extra setup.
- **TUI or CLI:** add a browser MCP. The Playwright MCP is the tested backend.

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

Check the connection:

```bash
opencode mcp list
```

If the browser cannot launch, install Chrome for Testing with
`npx playwright install chrome`, or point the server at an installed Chromium
with `--executable-path <path>`.

Without a browser tool, `ui-breaker` stops and reports the blocker. `ui-design`
can still design, but it cannot capture or verify the result.

## Migrating from an earlier name

If you installed an earlier version under its previous name, do these steps:

1. Find the old config folder. It is the folder under `~/.config/opencode/`
   that holds your `models.json` and is not `superb`.
2. Remove the old plugin file from `~/.config/opencode/plugins/`. It is the
   file that is not `superb.js`.
3. Remove the old skill folder from `~/.config/opencode/skills/`. It is the
   folder that is not `superb`.
4. Optionally remove the old package folder under `~/.config/opencode/`. It is
   the folder that is not `superb`.
5. Move `models.json` from the old config folder to
   `~/.config/opencode/superb/models.json`.
6. Replace the old plugin entry in `opencode.json` with
   `superb@git+https://github.com/bifanaboy/superb.git`.
7. Remove any `skills.paths` entry for the old name from `opencode.json`.

Then follow the installation steps above.

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load brainstorming
```

## Updating

OpenCode installs Superb through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superb commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, add a tag or commit to the spec (use the `plugins` key):

```json
{
  "plugins": ["superb@git+https://github.com/bifanaboy/superb.git#v9.0.0"]
}
```

## Troubleshooting

### Plugin not loading

1. Check logs. OpenCode loads plugins in the background server, so add
   `--standalone`: `opencode run --standalone --print-logs "hello" 2>&1 | grep -i superb`,
   or inspect `~/.local/share/opencode/log/opencode.log` filtering for `role=server`.
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Windows install issues

Some Windows OpenCode builds have upstream installer issues with git-backed
plugin specs, including cache paths for `git+https` URLs and Bun not finding
`git.exe` even when it works in a normal terminal. If OpenCode cannot install
the plugin, try installing with system npm and pointing OpenCode at the local
package:

```powershell
npm install superb@git+https://github.com/bifanaboy/superb.git --prefix "$HOME\.config\opencode"
```

Then use the absolute path of the installed package in `opencode.json`. OpenCode
does not expand `~`; a `~/...` entry is treated as a package name, not a local
directory.

**Example:**

```json
{
  "plugins": ["C:\\Users\\<you>\\.config\\opencode\\node_modules\\superb"]
}
```

### Skills not found

1. Use `skill` tool to list what's discovered
2. Check that the plugin is loading (see above)

### Tool mapping

Skills speak in actions ("create a todo", "dispatch a subagent", "read a file"). The plugin injects this mapping:

- "Create a todo" → `todowrite` (when `experimental.todo` is enabled; otherwise track the plan in the ledger)
- `Subagent (general-purpose):` template → `subagent` tool with `agent: "general"` (or `"explore"`); pass `sessionID` to continue a previous subagent
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create, edit, or delete files" → use `patch` with `patchText` when available; otherwise use `write` to create or overwrite files, `edit` for targeted changes, and `shell` for deletion
- "Run a shell command" → `shell` (`command`, `workdir`, `timeout`, `background`)
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`
- "Search the web" → `websearch`

## Getting Help

- Report issues: https://github.com/bifanaboy/superb/issues
- Full documentation: https://github.com/bifanaboy/superb/blob/main/README.md
