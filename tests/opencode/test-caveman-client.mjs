import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mod = await import(pathToFileURL(path.join(root, 'src/caveman/client.js')).href);
const { resolveCliBin, createClient } = mod;

const bin = resolveCliBin();
assert.ok(bin === null || /dist\/index\.js$/.test(bin), 'resolveCliBin returns null or a dist path');

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

console.log('  [PASS] caveman client');
