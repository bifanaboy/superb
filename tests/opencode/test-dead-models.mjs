import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'superb-neutral-'));
process.env.HOME = home;

const [, , inputPath] = process.argv;
const pluginURL = pathToFileURL(fs.realpathSync(inputPath));

async function makeHarness({ parentID } = {}) {
  const mod = await import(`${pluginURL.href}?neutral-test=${Math.random()}`);
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
  return {
    fail: async (model, sessionID = 's1') => afterHook({
      tool: 'subagent', sessionID, status: 'error',
      input: { model }, error: { message: 'subscription_sharing_usage_limit_exceeded' },
    }),
    context: async (sessionID = 's1') => {
      const event = {
        sessionID,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'work' }] }],
        system: [],
      };
      await contextHook(event);
      return (event.system ?? []).filter((p) => p.type === 'text' && p.text.startsWith('MODEL SKIP'));
    },
  };
}

{
  const h = await makeHarness();
  await h.fail('openai/gpt-6.1-sol');
  assert.deepEqual(await h.context(), [], 'a failed dispatch must not inject MODEL SKIP');
  console.log('  [PASS] no dead-model tracking');
}
