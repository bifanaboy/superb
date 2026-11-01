import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const banned = ['models.json', 'costly', 'MODEL SKIP', 'smart chain', '@choosing-superb-models', 'fast.costly', 'smart.costly', 'Model roles:', 'Model selection:'];
const offenders = [];

for (const rel of ['skills', 'src']) {
  const base = path.join(root, rel);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js') && !entry.name.endsWith('.md')) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const term of banned) {
        if (text.includes(term)) offenders.push(`${path.relative(root, full)}: ${term}`);
      }
    }
  };
  walk(base);
}

assert.ok(!fs.existsSync(path.join(root, 'skills', 'choosing-superb-models')), 'choosing skill must be gone');
assert.deepEqual(offenders, [], `model policy remains:\n${offenders.join('\n')}`);
console.log('  [PASS] no model policy in skills or src');
