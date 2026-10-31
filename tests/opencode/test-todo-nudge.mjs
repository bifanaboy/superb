import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [, , inputPath] = process.argv;
assert.ok(inputPath, 'pass the plugin module path');
const pluginURL = pathToFileURL(fs.realpathSync(inputPath));
let generation = 0;

async function makeHarness({ parentID } = {}) {
  const mod = await import(`${pluginURL.href}?todo-test=${++generation}`);
  let contextHook;
  let afterHook;
  let evaluateHook;
  await mod.default.setup({
    skill: { transform: async (fn) => fn({ add: () => {} }) },
    session: {
      hook: async (name, cb) => { if (name === 'context') contextHook = cb; },
      get: async ({ sessionID }) => ({ id: sessionID, ...(parentID ? { parentID } : {}) }),
    },
    tool: {
      hook: async (name, cb) => { if (name === 'execute.after') afterHook = cb; },
    },
    permission: {
      hook: async (name, cb) => { if (name === 'evaluate') evaluateHook = cb; },
    },
  });
  assert.equal(typeof contextHook, 'function', 'setup registered a context hook');
  assert.equal(typeof afterHook, 'function', 'setup registered an execute.after hook');
  assert.equal(typeof evaluateHook, 'function', 'setup registered a permission evaluate hook');
  return {
    after: (tool, input, sessionID = 's1') =>
      afterHook({ tool, sessionID, status: 'completed', input }),
    afterDone: (sessionID = 's1') => afterHook({
      tool: 'todowrite',
      sessionID,
      status: 'completed',
      input: { todos: [{ content: 'task', status: 'in_progress' }] },
    }),
    afterClear: (sessionID = 's1') => afterHook({
      tool: 'todowrite',
      sessionID,
      status: 'completed',
      input: { todos: [] },
    }),
    afterError: (tool, sessionID = 's1') => afterHook({
      tool,
      sessionID,
      status: 'error',
      error: { message: 'denied' },
    }),
    context: async (sessionID = 's1') => {
      const event = {
        sessionID,
        system: [],
        messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }],
      };
      await contextHook(event);
      return event.system.filter((part) => part.type === 'text' && part.text.includes('TODO'));
    },
    evaluate: async (action, sessionID = 's1') => {
      const event = { action, resources: ['*'], sessionID, effect: 'allow' };
      await evaluateHook(event);
      return event;
    },
  };
}

// No todo list yet: silence.
{
  const h = await makeHarness();
  for (let i = 0; i < 8; i++) await h.after('edit');
  assert.equal((await h.context()).length, 0, 'no nudge before the first todowrite');
  assert.equal((await h.evaluate('edit')).effect, 'allow', 'no gate before the first todowrite');
}

// A created list goes stale after five calls, and the nudge names the item.
{
  const h = await makeHarness();
  await h.afterDone();
  for (let i = 0; i < 4; i++) await h.after('edit');
  assert.equal((await h.context()).length, 0, 'four calls are not stale');
  await h.after('edit');
  const nudges = await h.context();
  assert.equal(nudges.length, 1, 'five calls produce one nudge');
  assert.match(nudges[0].text, /5 tool calls since the last `todowrite`/);
  assert.match(nudges[0].text, /"task" is still in_progress/);
}

// The gate opens at eight calls and blocks edit and shell, not reads.
{
  const h = await makeHarness();
  await h.afterDone();
  for (let i = 0; i < 7; i++) await h.after('edit');
  assert.equal((await h.evaluate('edit')).effect, 'allow', 'seven calls stay open');
  await h.after('edit');
  const edit = await h.evaluate('edit');
  assert.equal(edit.effect, 'deny', 'eight calls deny edit');
  assert.match(edit.message, /TODO BLOCK: 8 tool calls/);
  assert.match(edit.message, /"task" is still in_progress/);
  assert.match(edit.message, /Run `todowrite` now/);
  assert.equal((await h.evaluate('shell')).effect, 'deny', 'eight calls deny shell');
  assert.equal((await h.evaluate('read')).effect, 'allow', 'reads stay open');
  assert.equal((await h.evaluate('grep')).effect, 'allow', 'grep stays open');
  assert.equal((await h.evaluate('todowrite')).effect, 'allow', 'todowrite stays open');
}

// A fresh todowrite clears both the nudge and the gate.
{
  const h = await makeHarness();
  await h.afterDone();
  for (let i = 0; i < 8; i++) await h.after('edit');
  assert.equal((await h.evaluate('edit')).effect, 'deny', 'stale list blocks edit');
  await h.afterDone();
  assert.equal((await h.evaluate('edit')).effect, 'allow', 'a fresh update opens the gate');
  assert.equal((await h.context()).length, 0, 'a fresh update clears the nudge');
}

// A failed todowrite does not clear the gate.
{
  const h = await makeHarness();
  await h.afterDone();
  for (let i = 0; i < 8; i++) await h.after('edit');
  await h.afterError('todowrite');
  assert.equal((await h.evaluate('edit')).effect, 'deny', 'a failed todowrite does not clear the gate');
}

// A cleared list stops both the nudge and the gate.
{
  const h = await makeHarness();
  await h.afterDone();
  await h.afterClear();
  for (let i = 0; i < 8; i++) await h.after('edit');
  assert.equal((await h.context()).length, 0, 'an empty list gets no nudge');
  assert.equal((await h.evaluate('edit')).effect, 'allow', 'an empty list gets no gate');
}

// Child sessions stay silent and open.
{
  const h = await makeHarness({ parentID: 'parent' });
  await h.afterDone();
  for (let i = 0; i < 8; i++) await h.after('edit');
  assert.equal((await h.context()).length, 0, 'child sessions get no nudge');
  assert.equal((await h.evaluate('edit')).effect, 'allow', 'child sessions get no gate');
}

console.log('Todo nudge and gate passed');
