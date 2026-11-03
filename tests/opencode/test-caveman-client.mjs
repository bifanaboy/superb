import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mod = await import(pathToFileURL(path.join(root, 'src/caveman/client.js')).href);
const { resolveCliBin, createClient, resolveNodeBin } = mod;

const bin = resolveCliBin();
assert.ok(bin === null || /dist\/index\.js$/.test(bin), 'resolveCliBin returns null or a dist path');

const savedNode = process.env.CAVEMAN_NODE;
delete process.env.CAVEMAN_NODE;
assert.equal(resolveNodeBin('/usr/local/bin/opencode'), 'node', 'non-node execPath resolves to node');
assert.equal(resolveNodeBin('/usr/local/bin/node'), '/usr/local/bin/node', 'node execPath stays');
assert.equal(resolveNodeBin('/usr/local/bin/bun'), '/usr/local/bin/bun', 'bun execPath stays');
process.env.CAVEMAN_NODE = '/custom/node';
assert.equal(resolveNodeBin('/usr/local/bin/opencode'), '/custom/node', 'CAVEMAN_NODE wins');
if (savedNode === undefined) delete process.env.CAVEMAN_NODE;
else process.env.CAVEMAN_NODE = savedNode;

const calls = [];
const client = createClient({
  bin: '/fake/bin',
  exec: (args, input) => {
    calls.push({ args, input });
    if (args[0] === 'native-hook' && args[2] === 'SessionStart') {
      return JSON.stringify({ hookSpecificOutput: { additionalContext: 'voice on' } });
    }
    if (args[0] === 'native-hook' && args[2] === 'PostToolUse') {
      return JSON.stringify({ hookSpecificOutput: { updatedToolOutput: 'compressed' } });
    }
    if (args[0] === 'shrink-hook') {
      return JSON.stringify({ hookSpecificOutput: { updatedInput: { command: 'shrunk' } } });
    }
    return JSON.stringify({});
  },
});

assert.equal(client.sessionStart('s1'), 'voice on', 'sessionStart parses additionalContext');
assert.equal(client.postTool('s1', 'bash', { command: 'x' }, 'big output'), 'compressed', 'postTool parses updatedToolOutput');
assert.equal(client.shrink('grep foo .'), 'shrunk', 'shrink parses updatedInput.command');
assert.equal(client.preTool('s1', 'read', { path: 'a' }), undefined, 'missing field yields undefined');

const throwing = createClient({
  bin: '/fake/bin',
  exec: () => { throw new Error('boom'); },
});
assert.equal(throwing.sessionStart('s1'), undefined, 'throwing exec yields undefined');

const recorded = calls.find((c) => c.args[0] === 'native-hook' && c.args[2] === 'SessionStart');
assert.deepEqual(recorded.args, ['native-hook', 'opencode', 'SessionStart'], 'args recorded');
assert.equal(recorded.input.event_name, 'SessionStart', 'payload recorded');

if (bin) {
  const live = createClient({ bin });
  const liveVersion = live.getVersion();
  assert.equal(typeof liveVersion, 'string', 'getVersion spawns the CLI under Node');
}

console.log('  [PASS] caveman client');
