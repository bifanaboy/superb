import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pluginURL = pathToFileURL(fs.realpathSync(path.join(root, 'src/superb.js')));

const makeCtx = (opts = {}) => {
  const skills = [];
  const commands = [];
  const hooks = [];
  const pluginList = opts.pluginList || (() => Promise.resolve([]));
  const ctx = {
    skill: { transform: async (fn) => fn({ add: (s) => skills.push(s) }) },
    command: opts.command === false ? undefined : {
      transform: async (fn) => fn({ add: (c) => commands.push(c) }),
    },
    plugin: opts.plugin === false ? undefined : { list: pluginList },
    tool: opts.tool === false ? undefined : { hook: async (name, cb) => { hooks.push(name); } },
    permission: opts.permission === false ? undefined : { hook: async (name, cb) => {} },
    session: {
      get: async ({ sessionID }) => ({ id: sessionID }),
      hook: async (name, cb) => {},
    },
    agent: opts.agent === false ? undefined : { reload: async () => {} },
    options: {},
  };
  return { ctx, skills, commands, hooks };
};

async function runSetup(ctx) {
  const mod = await import(`${pluginURL.href}?reg=${Math.random()}`);
  await mod.default.setup(ctx);
}

{
  const { ctx, skills, commands } = makeCtx();
  await runSetup(ctx);
  assert.ok(skills.some((s) => s.id === 'caveman'), 'caveman skill registered');
  const names = commands.map((c) => c.name);
  for (const name of ['caveman', 'ultracave', 'megacave', 'caveman-commit', 'caveman-review']) {
    assert.ok(names.includes(name), `command ${name} registered`);
  }
  assert.equal(typeof commands[0].execute, 'function', 'execute is a function');
}

{
  const logs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => logs.push(a.join(' '));
  const { ctx, commands } = makeCtx({ pluginList: async () => [{ id: 'caveman-native' }] });
  await runSetup(ctx);
  console.log = origLog;
  console.error = origErr;
  assert.equal(commands.length, 0, 'no commands when caveman active');
  assert.ok(logs.some((l) => /Caveman detected/i.test(l)), 'logs Caveman detected');
}

{
  const { ctx } = makeCtx({ command: false, plugin: false, tool: false, agent: false });
  await runSetup(ctx);
}

console.log('  [PASS] caveman registration');
