import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mod = await import(pathToFileURL(path.join(root, 'src/caveman/agents.js')).href);
const { AGENT_FILES, installAgents, uninstallAgents } = mod;

assert.ok(Object.keys(AGENT_FILES).length >= 4, 'agent files loaded');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caveman-agents-'));
let reloadCount = 0;
const reload = () => { reloadCount += 1; };

const first = installAgents(dir, reload);
assert.equal(first.installed.length, 4, 'installs four agents');
assert.equal(reloadCount, 1, 'reload called once');
for (const name of ['cavecrew-builder', 'cavecrew-investigator', 'cavecrew-reviewer', 'review']) {
  assert.ok(fs.existsSync(path.join(dir, `${name}.md`)), `${name} written`);
}

const reviewPath = path.join(dir, 'review.md');
const withModel = `${fs.readFileSync(reviewPath, 'utf8')}\nmodel: test/model\n`;
fs.writeFileSync(reviewPath, withModel, 'utf8');

const second = installAgents(dir, reload);
assert.equal(second.installed.length, 0, 'second install writes nothing');
assert.equal(reloadCount, 1, 'no reload on no-op');

const removedModel = fs.readFileSync(reviewPath, 'utf8');
assert.match(removedModel, /^model: test\/model$/m, 'model line preserved');

const removed = uninstallAgents(dir, reload);
assert.equal(removed.removed.length, 4, 'uninstalls four agents');
assert.equal(reloadCount, 2, 'reload called on uninstall');
for (const name of ['cavecrew-builder', 'cavecrew-investigator', 'cavecrew-reviewer', 'review']) {
  assert.ok(!fs.existsSync(path.join(dir, `${name}.md`)), `${name} removed`);
}

console.log('  [PASS] caveman installer');
