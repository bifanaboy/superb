import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pluginURL = pathToFileURL(fs.realpathSync(path.join(root, 'src/superb.js')));

const makeCtx = (configDir) => {
  const contextHooks = [];
  const beforeHooks = [];
  const afterHooks = [];
  const ctx = {
    skill: { transform: async (fn) => fn({ add: () => {} }) },
    command: { transform: async (fn) => fn({ add: () => {} }) },
    plugin: { list: async () => [] },
    tool: {
      hook: async (name, cb) => {
        if (name === 'execute.before') beforeHooks.push(cb);
        if (name === 'execute.after') afterHooks.push(cb);
      },
    },
    session: {
      get: async ({ sessionID }) => ({ id: sessionID }),
      hook: async (name, cb) => {
        if (name === 'context') contextHooks.push(cb);
      },
    },
    permission: { hook: async () => {} },
    agent: { reload: async () => {} },
    options: { cavemanConfigDir: configDir },
  };
  return { ctx, contextHooks, beforeHooks, afterHooks };
};

const client = {
  shrink: (cmd) => (cmd === 'grep foo .' ? 'shrunk cmd' : undefined),
  postTool: () => 'compressed out',
  sessionStart: () => undefined,
  preTool: () => undefined,
  getVersion: () => '4.0.1',
};

{
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caveman-hooks-'));
  fs.writeFileSync(path.join(configDir, '.caveman-active'), 'caveman', 'utf8');
  const { ctx, contextHooks, beforeHooks, afterHooks } = makeCtx(configDir);
  const mod = await import(`${pluginURL.href}?hooks=${Math.random()}`);
  await mod.default.setup(ctx, { cavemanClient: client });

  assert.ok(contextHooks.length >= 1, 'context hook registered');
  const event = { messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }], system: [] };
  await contextHooks[0](event);
  assert.ok(event.system.some((p) => p.type === 'text' && /CAVEMAN MODE ACTIVE \(caveman\)/.test(p.text)), 'voice pushed when flag present');

  assert.equal(beforeHooks.length, 1, 'before hook registered');
  const beforeEvent = { tool: 'shell', input: { command: 'grep foo .' } };
  await beforeHooks[0](beforeEvent);
  assert.equal(beforeEvent.input.command, 'shrunk cmd', 'shrink rewrites command');
  const readEvent = { tool: 'read', input: { path: 'a' } };
  await beforeHooks[0](readEvent);
  assert.deepEqual(readEvent.input, { path: 'a' }, 'non-shell untouched');

  assert.ok(afterHooks.length >= 1, 'after hook registered');
  const afterEvent = { tool: 'bash', status: 'completed', sessionID: 's1', input: {}, result: { content: 'big' } };
  await afterHooks[0](afterEvent);
  assert.equal(afterEvent.result.content, 'compressed out', 'compression replaces content');
}

{
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caveman-hooks-'));
  const { ctx, contextHooks } = makeCtx(configDir);
  const mod = await import(`${pluginURL.href}?hooks=${Math.random()}`);
  await mod.default.setup(ctx, { cavemanClient: client });
  const event = { messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }], system: [] };
  await contextHooks[0](event);
  assert.equal(event.system.length, 0, 'no voice when flag absent');
}

{
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caveman-hooks-'));
  const { ctx, beforeHooks, afterHooks } = makeCtx(configDir);
  const mod = await import(`${pluginURL.href}?hooks=${Math.random()}`);
  await mod.default.setup(ctx, { cavemanClient: null });
  assert.equal(beforeHooks.length, 0, 'no before hook when client null');
  // after hooks still include the todo tracker; compression hook is guarded.
}

console.log('  [PASS] caveman hooks');
