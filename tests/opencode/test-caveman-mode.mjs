import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mod = await import(pathToFileURL(path.join(root, 'src/caveman/mode.js')).href);
const { readMode, writeMode, clearMode } = mod;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caveman-mode-'));

assert.equal(readMode(dir), null, 'missing flag reads null');
writeMode(dir, 'ultracave');
assert.equal(readMode(dir), 'ultracave', 'write then read');
clearMode(dir);
assert.equal(readMode(dir), null, 'clear removes flag');
clearMode(dir); // no throw

console.log('  [PASS] caveman mode helpers');
