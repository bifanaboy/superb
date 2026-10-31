/**
 * Superpowers plugin for OpenCode.ai
 *
 * Targets OpenCode 2.0.4 or later.
 *
 * Loaded via the default export { id, setup } by PluginSupervisor.
 * setup() registers skills natively via ctx.skill.transform(), and injects
 * bootstrap context via ctx.session.hook("context").
 *
 * No external dependencies — pure JavaScript needs no @opencode-ai/plugin or
 * effect install.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Skills directory registered by setup() via ctx.skill.transform
const superpowersSkillsDir = path.resolve(__dirname, '../../skills');

// Simple frontmatter extraction (avoid dependency on skills-core for
// bootstrap). Handles plain `key: value` lines, quoted values (including
// quotes that close on an indented continuation line), YAML block scalar
// markers (`>`, `|`) with indented continuation lines, and CRLF line
// endings. Not a full YAML parser — nested maps flatten into their parent
// key's value, which is fine for the name/description fields consumed here.
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};
  let lastKey = null;

  for (const rawLine of frontmatterStr.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !/^\s/.test(line)) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      // Block scalar markers (>, |, optionally with +/- chomping) carry no
      // value themselves; the indented lines that follow do.
      frontmatter[key] = /^(>[+-]?|\|[+-]?)$/.test(value) ? '' : value;
      lastKey = key;
    } else if (lastKey !== null && line.trim() !== '') {
      // Continuation of a multi-line value: append rather than drop so long
      // descriptions survive parsing. Newlines collapse to spaces — good
      // enough for the single-line name/description fields consumed here.
      frontmatter[lastKey] = `${frontmatter[lastKey]} ${line.trim()}`.trim();
    }
  }

  // A quoted value may close on a continuation line, so unquote only once
  // the value is fully assembled: strip exactly one matching surrounding
  // pair and leave unbalanced quotes alone.
  for (const key of Object.keys(frontmatter)) {
    frontmatter[key] = frontmatter[key].replace(/^(["'])([\s\S]*)\1$/, '$2');
  }

  return { frontmatter, content: body };
};

// Tool mapping injected into the bootstrap. It targets the built-ins of
// OpenCode 2.0.4 or later: todowrite (when experimental.todo is on), subagent
// (agent name in 'agent', continuation via sessionID), patch (patchText), and
// shell. read, write, edit, grep, glob, webfetch, websearch, and skill exist
// under those names (verified against the 2.0.4, 2.0.7, and 2.2.5 host
// contracts). Exported for tests (tests/opencode/test-bootstrap-caching.mjs).
export const TOOL_MAPPING = `**Tool Mapping for OpenCode:**
When skills request actions, substitute OpenCode equivalents:
- Create or update todos → \`todowrite\` (when \`experimental.todo\` is enabled; otherwise track the plan in the ledger)
- \`Subagent (general-purpose):\` → \`subagent\` with \`agent: "general"\` (give it \`description\` and \`prompt\`, optionally \`background\`; pass \`sessionID\` to continue a previous subagent)
- Invoke a skill → OpenCode's native \`skill\` tool
- Read files → \`read\`
- Create, edit, or delete files → use \`patch\` with \`patchText\` when available; otherwise use \`write\` to create or overwrite files, \`edit\` for targeted changes, and \`shell\` for deletion
- Run shell commands → \`shell\` (\`command\`, \`workdir\`, \`timeout\`, \`background\`)
- Search files → \`grep\`, \`glob\`
- Fetch a URL → \`webfetch\`
- Search the web → \`websearch\`

Use OpenCode's native \`skill\` tool to list and load skills.`;

// Module-level cache for the bootstrap content. The SKILL.md file does not
// change during a session, so reading + parsing it once eliminates redundant
// fs.existsSync + fs.readFileSync + regex work on every agent step. See #1202
// for the full analysis. undefined = not read yet, null = file missing.
let _bootstrapCache;

// Helper to generate bootstrap content (cached after the first call)
const getBootstrapContent = () => {
  if (_bootstrapCache !== undefined) return _bootstrapCache;

  // Try to load using-superpowers skill
  const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    _bootstrapCache = null;
    return null;
  }

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  _bootstrapCache = `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${TOOL_MAPPING}
</EXTREMELY_IMPORTANT>`;

  return _bootstrapCache;
};

// --- Task-subagent (child session) detection --------------------------------
//
// #2160: the bootstrap drives controller workflows (brainstorming, planning,
// approval cycles). Injecting it into task subagent sessions makes workers
// restart design/approval cycles for work the parent already authorised; the
// <SUBAGENT-STOP> note inside the bootstrap relies on model compliance, which
// is not reliable. Detect child sessions structurally instead: a parentID on
// the session is the child signal (task sessions are created with one;
// top-level sessions simply lack the field), so when the session carrying the
// message has a parentID we skip bootstrap injection. Skills stay registered
// for every session — workers keep explicit access to execution skills.

// sessionID -> is-child decision. parentID never changes for a session, so
// the result is cached until eviction and the injection hook (which fires on
// every agent step) pays only one client roundtrip per session. The V2
// service process is long-lived and sessions accumulate over weeks, so the
// cache is bounded: when full, drop the oldest quarter (Map iterates keys in
// insertion order). An evicted session merely pays one extra lookup if seen
// again.
const CHILD_SESSION_CACHE_MAX = 512;
const _childSessionCache = new Map();

const _cacheChildSession = (sessionID, isChild) => {
  if (_childSessionCache.size >= CHILD_SESSION_CACHE_MAX) {
    let toDrop = Math.ceil(CHILD_SESSION_CACHE_MAX / 4);
    for (const key of _childSessionCache.keys()) {
      if (toDrop-- <= 0) break;
      _childSessionCache.delete(key);
    }
  }
  _childSessionCache.set(sessionID, isChild);
};

// --- Todo staleness tracking ------------------------------------------------
//
// The todo tool is easy to create and easy to forget. After the first
// todowrite in a session, count tool calls since the last one. A soft system
// line appears at the nudge threshold; a permission deny at the block
// threshold stops file mutations and shell commands until the model updates
// the list. The soft line exists only for the model call that carries it, so
// it never grows the persisted history.
const TODO_NUDGE_AFTER = 5;
const TODO_BLOCK_AFTER = 8;
// write and patch usually report the `edit` action, but some host versions
// report the tool name. Cover both so the gate cannot be skipped.
const TODO_BLOCK_ACTIONS = new Set(['edit', 'write', 'patch', 'shell']);
const _todoState = new Map(); // sessionID -> { seen, callsSince, items }

const _todoStateFor = (sessionID) => {
  const cached = _todoState.get(sessionID);
  if (cached) return cached;
  if (_todoState.size >= CHILD_SESSION_CACHE_MAX) {
    let toDrop = Math.ceil(CHILD_SESSION_CACHE_MAX / 4);
    for (const key of _todoState.keys()) {
      if (toDrop-- <= 0) break;
      _todoState.delete(key);
    }
  }
  const state = { seen: false, callsSince: 0, items: [] };
  _todoState.set(sessionID, state);
  return state;
};

const _todoProgress = (state) => {
  const active = state.items.find((item) => item && item.status === 'in_progress');
  return active ? `"${active.content}" is still in_progress` : 'no item is in_progress';
};

const _todoNudge = (state) =>
  `TODO CHECK: ${state.callsSince} tool calls since the last \`todowrite\`; ${_todoProgress(state)}. Mark finished items complete and set the next item to in_progress.`;

const _todoBlock = (state) =>
  `TODO BLOCK: ${state.callsSince} tool calls since the last \`todowrite\`; ${_todoProgress(state)}. Run \`todowrite\` now: mark finished items complete, set the next item to in_progress, then retry this action.`;

const _positiveInt = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

const isChildSession = async (fetchSession, sessionID) => {
  if (!sessionID) return false; // unknown session: keep current behavior
  if (_childSessionCache.has(sessionID)) return _childSessionCache.get(sessionID);

  let isChild = false;
  try {
    const session = await fetchSession(sessionID);
    // Validate the record before classifying or caching it; a bad record must
    // follow the same fail-open path as a rejection.
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      throw new Error('Session lookup returned no usable record');
    }
    if (session.id !== sessionID) {
      throw new Error('Session lookup returned an invalid session identity');
    }
    if (session.parentID !== undefined &&
        (typeof session.parentID !== 'string' || session.parentID.length === 0)) {
      throw new Error('Session lookup returned an invalid parent identity');
    }
    isChild = session.parentID !== undefined;
  } catch (err) {
    // Fail open: on lookup errors keep injecting (previous behavior) and do
    // not cache, so a transient failure can recover on the next step.
    console.error('[superpowers] session lookup failed, treating session as top-level:', err);
    return false;
  }
  _cacheChildSession(sessionID, isChild);
  return isChild;
};

/**
 * Setup Function (default.setup)
 *
 * Called by the OpenCode 2 PluginSupervisor (packages/core/src/plugin/supervisor.ts).
 * Performs two things:
 *
 * 1. Registers every skills/<name>/SKILL.md as a native Skill.Info object
 *    via ctx.skill.transform((draft) => draft.add(info)).
 *    The draft API is { list, add, update, remove } where add() decodes plain
 *    objects against the host's Skill.Info schema (OpenCode 2.0.4 contract):
 *    { id, name, description?, autoinvoke?, path, content }. The file field
 *    is `path` — renamed from `location` in upstream commit 199aabe9e2,
 *    first released in v2.0.4.
 *    See packages/core/src/plugin/skill.ts and packages/schema/src/skill.ts.
 * 2. Injects bootstrap context via ctx.session.hook("context").
 */
async function setup(ctx) {
  // 1. Register skills (one transform; one draft.add per skill)
  try {
    const skills = [];
    if (fs.existsSync(superpowersSkillsDir)) {
      for (const entry of fs.readdirSync(superpowersSkillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const skillPath = path.join(superpowersSkillsDir, entry.name, 'SKILL.md');
        if (!fs.existsSync(skillPath)) continue;
        const { frontmatter, content } = extractAndStripFrontmatter(fs.readFileSync(skillPath, 'utf8'));
        skills.push({
          id: entry.name,
          name: frontmatter.name || entry.name,
          ...(frontmatter.description ? { description: frontmatter.description } : {}),
          // Skill.Info renamed its required file field `location` -> `path`
          // in OpenCode v2.0.4 (upstream commit 199aabe9e2).
          path: skillPath,
          content,
        });
      }
    }
    await ctx.skill.transform((draft) => {
      // draft.add() decodes against the host's Skill.Info schema and throws
      // synchronously on a mismatch. A throw escaping this callback is what
      // the host escalates into an asynchronous hard-disable of the entire
      // plugin ("Plugin disabled after skill.transform failed") — the
      // try/catch around ctx.skill.transform never sees it, and the
      // bootstrap hook is torn down as collateral. Contain failures per
      // skill so one rejected payload skips that skill instead of killing
      // skills AND bootstrap.
      for (const skill of skills) {
        try {
          draft.add(skill);
        } catch (err) {
          console.error(`[superpowers] skill "${skill.id}" rejected by host, skipping:`, err);
        }
      }
    });
  } catch (err) {
    // Never break plugin activation: one failing plugin takes down the whole
    // V2 generation (including provider/catalog plugins => no models in TUI).
    console.error('[superpowers] skill registration failed:', err);
  }

  const nudgeAfter = _positiveInt(ctx?.options?.todoNudgeAfter, TODO_NUDGE_AFTER);
  const blockAfter = Math.max(
    _positiveInt(ctx?.options?.todoBlockAfter, TODO_BLOCK_AFTER),
    nudgeAfter,
  );

  // 2. Track tool calls so the nudge and the gate can see a stale todo list
  try {
    await ctx.tool.hook('execute.after', (event) => {
      try {
        if (!event || !event.sessionID) return;
        const state = _todoStateFor(event.sessionID);
        if (event.tool === 'todowrite') {
          if (event.status !== 'completed') return;
          const todos = event.input && event.input.todos;
          if (Array.isArray(todos)) state.items = todos;
          state.seen = Array.isArray(todos) ? todos.length > 0 : false;
          state.callsSince = 0;
          return;
        }
        state.callsSince += 1;
      } catch (err) {
        console.error('[superpowers] todo tracking failed:', err);
      }
    });
  } catch (err) {
    console.error('[superpowers] todo tracking hook registration failed:', err);
  }

  // 3. Deny work actions while the todo list is stale. Reading stays open.
  try {
    await ctx.permission.hook('evaluate', async (event) => {
      try {
        if (!event || !TODO_BLOCK_ACTIONS.has(event.action)) return;
        const state = event.sessionID ? _todoState.get(event.sessionID) : undefined;
        if (!state || !state.seen || state.callsSince < blockAfter) return;
        if (typeof ctx.session.get === 'function' && await isChildSession(
          (id) => ctx.session.get({ sessionID: id }),
          event.sessionID,
        )) return;
        event.effect = 'deny';
        event.message = _todoBlock(state);
      } catch (err) {
        console.error('[superpowers] todo gate failed:', err);
      }
    });
  } catch (err) {
    console.error('[superpowers] todo gate hook registration failed:', err);
  }

  // 4. Inject the bootstrap into the first user message, and the todo nudge
  //    into every model call whose list is stale.
  try {
    await ctx.session.hook('context', async (event) => {
      try {
        if (!event.messages || !event.messages.length) return;

        // #2160: the context event carries the sessionID directly. A task
        // subagent (child) session gets neither the bootstrap nor the nudge;
        // skills registered above stay available to workers.
        const isChild = typeof ctx.session.get === 'function' && await isChildSession(
          (id) => ctx.session.get({ sessionID: id }),
          event.sessionID,
        );

        const state = event.sessionID ? _todoState.get(event.sessionID) : undefined;
        if (!isChild && state && state.seen && state.callsSince >= nudgeAfter) {
          const text = _todoNudge(state);
          if (Array.isArray(event.system) &&
              !event.system.some((part) => part.type === 'text' && part.text === text)) {
            event.system.push({ type: 'text', text });
          }
        }

        const bootstrap = getBootstrapContent();
        if (!bootstrap || isChild) return;
        const firstUser = event.messages.find(m => m.role === 'user');
        if (firstUser && (!firstUser.content || !firstUser.content.length)) return;
        if (firstUser?.content.some(p => p.type === 'text' && p.text && p.text.includes('EXTREMELY_IMPORTANT'))) return;

        // Native compaction can leave only an opaque checkpoint. Keep it
        // intact and append the transient bootstrap as a user message.
        if (firstUser) {
          firstUser.content.unshift({ type: 'text', text: bootstrap });
        } else {
          event.messages.push({ role: 'user', content: [{ type: 'text', text: bootstrap }] });
        }
      } catch (err) {
        // Never let hook callback errors break the request pipeline.
        console.error('[superpowers] context hook failed:', err);
      }
    });
  } catch (err) {
    console.error('[superpowers] session hook registration failed:', err);
  }
}

/**
 * Default Export: { id, setup }
 *
 * PluginSupervisor reads { id, setup }.
 */
export default {
  id: 'superpowers',
  setup,
};
