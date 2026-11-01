import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// helper.js is a classic browser script. The repo's package.json sets
// "type": "module", so require() loads it as ESM and the CJS export block
// never runs. Evaluate it as a classic script in a sandbox instead.
const source = fs.readFileSync(
  new URL('../../skills/brainstorming/scripts/helper.js', import.meta.url),
  'utf8',
);
const sandbox = { module: { exports: {} } };
vm.runInNewContext(source, sandbox);
const { websocketUrl } = sandbox.module.exports;

assert.equal(
  websocketUrl({ protocol: 'https:', host: 'example.test' }, 'abc'),
  'wss://example.test/?key=abc',
  'HTTPS pages use wss',
);
assert.equal(
  websocketUrl({ protocol: 'http:', host: 'localhost:45999' }, 'abc'),
  'ws://localhost:45999/?key=abc',
  'HTTP pages use ws',
);
assert.equal(
  websocketUrl({ protocol: 'https:', host: 'example.test' }, null),
  'wss://example.test',
  'a missing key leaves the bare origin',
);

console.log('helper WebSocket URL passed');
