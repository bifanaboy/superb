# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

OpenCode 2.0.4 or later is required.

```json
{
  "plugins": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

For a local installation, configure the repository directory containing
`index.js`. OpenCode 2.0.4 and 2.0.7 reject a configured direct JavaScript-file
path. Discovered plugin symlinks remain supported.

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install Superpowers separately for each one.

## Migrating from the old symlink-based install

If you previously installed superpowers using `git clone` and symlinks, remove the old setup:

```bash
# Remove old symlinks
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# Optionally remove the cloned repo
rm -rf ~/.config/opencode/superpowers

# Remove skills.paths from opencode.json if you added one for superpowers
```

Then follow the installation steps above.

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load brainstorming
```

## Updating

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, add a tag or commit to the spec (use the `plugins` key):

```json
{
  "plugins": ["superpowers@git+https://github.com/obra/superpowers.git#v8.0.0"]
}
```

## Troubleshooting

### Plugin not loading

1. Check logs. OpenCode loads plugins in the background server, so add
   `--standalone`: `opencode run --standalone --print-logs "hello" 2>&1 | grep -i superpowers`,
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
npm install superpowers@git+https://github.com/obra/superpowers.git --prefix "$HOME\.config\opencode"
```

Then use the absolute path of the installed package in `opencode.json`. OpenCode
does not expand `~`; a `~/...` entry is treated as a package name, not a local
directory.

**Example:**

```json
{
  "plugins": ["C:\\Users\\<you>\\.config\\opencode\\node_modules\\superpowers"]
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

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
