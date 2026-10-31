import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [, , inputPath] = process.argv;
assert.ok(inputPath, 'pass the plugin module path');
const pluginURL = pathToFileURL(fs.realpathSync(inputPath));
let generation = 0;

async function makeHarness({ parentID } = {}) {
  const mod = await import(`${pluginURL.href}?dead-test=${++generation}`);
  let contextHook;
  let afterHook;
  await mod.default.setup({
    skill: { transform: async (fn) => fn({ add: () => {} }) },
    session: {
      hook: async (name, cb) => { if (name === 'context') contextHook = cb; },
      get: async ({ sessionID }) => ({ id: sessionID, ...(parentID ? { parentID } : {}) }),
    },
    tool: { hook: async (name, cb) => { if (name === 'execute.after') afterHook = cb; } },
    permission: { hook: async () => {} },
  });
  assert.equal(typeof contextHook, 'function', 'setup registered a context hook');
  assert.equal(typeof afterHook, 'function', 'setup registered an execute.after hook');
  return {
    fail: (model, message = 'subscription_sharing_usage_limit_exceeded', sessionID = 's1') =>
      afterHook({ tool: 'subagent', sessionID, status: 'error', input: model ? { model } : {}, error: { message } }),
    ok: (model, sessionID = 's1') =>
      afterHook({ tool: 'subagent', sessionID, status: 'completed', input: { model } }),
    context: async (sessionID = 's1', withSystem = true) => {
      const event = {
        sessionID,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }],
      };
      if (withSystem) event.system = [];
      await contextHook(event);
      return (event.system ?? []).filter(
        (part) => part.type === 'text' && part.text.startsWith('MODEL SKIP')
      );
    },
  };
}

// 1. No failure: no line.
{
  const h = await makeHarness();
  assert.deepEqual(await h.context(), [], 'no failure means no skip line');
}

// 2. A failed subagent records its model.
{
  const h = await makeHarness();
  await h.fail('openai/gpt-6.1-sol');
  const lines = await h.context();
  assert.equal(lines.length, 1, 'one skip line');
  assert.match(lines[0].text, /MODEL SKIP/);
  assert.match(lines[0].text, /openai\/gpt-6\.1-sol/);
}

// 3. The line still appears on a later call.
{
  const h = await makeHarness();
  await h.fail('model-a');
  assert.equal((await h.context()).length, 1, 'first call sees the line');
  assert.equal((await h.context()).length, 1, 'later call still sees the line');
}

// 4. A different session is unaffected.
{
  const h = await makeHarness();
  await h.fail('model-a', undefined, 's1');
  assert.deepEqual(await h.context('s2'), [], 'other sessions stay clean');
}

// 5. A successful dispatch does not mark the model.
{
  const h = await makeHarness();
  await h.ok('model-a');
  assert.deepEqual(await h.context(), [], 'success does not mark a model');
}

// 6. A non-model child failure does not mark the model.
{
  const h = await makeHarness();
  await h.fail('model-a', 'tests failed');
  assert.deepEqual(await h.context(), [], 'a task failure is not a model failure');
}

// 7. A failure without a model input does not mark anything.
{
  const h = await makeHarness();
  await h.fail(null);
  assert.deepEqual(await h.context(), [], 'no model input means nothing to record');
}

// 8. The same model failed twice appears once.
{
  const h = await makeHarness();
  await h.fail('provider/dead-model-xyz');
  await h.fail('provider/dead-model-xyz');
  const lines = await h.context();
  assert.equal(lines.length, 1);
  assert.equal((lines[0].text.match(/provider\/dead-model-xyz/g) || []).length, 1,
    'the model appears once');
}

// 9. Two failed models both appear.
{
  const h = await makeHarness();
  await h.fail('model-a');
  await h.fail('model-b');
  const lines = await h.context();
  assert.equal(lines.length, 1);
  assert.match(lines[0].text, /model-a/);
  assert.match(lines[0].text, /model-b/);
}

// 10. A child session gets no line.
{
  const h = await makeHarness({ parentID: 'parent' });
  await h.fail('model-a');
  assert.deepEqual(await h.context(), [], 'child sessions get no skip line');
}

// 11. A missing system array does not throw.
{
  const h = await makeHarness();
  await h.fail('model-a');
  await assert.doesNotReject(() => h.context('s1', false), 'missing system array is safe');
}

console.log('Dead model tracking passed');
