import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

const read = (rel) => {
  const file = path.join(repo, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const FINISH = 'skills/finishing-a-development-branch/SKILL.md';
const EXECUTING = 'skills/executing-plans/SKILL.md';
const FINAL_REVIEW = 'skills/subagent-driven-development/references/final-review.md';
const HANDOFF = 'Do not push, open a pull request, or merge from this flow directly';

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failures.push(name);
};
// Prose wraps across lines; compare it as one line.
const flat = (text) => text.replace(/\s+/g, ' ');

const finish = read(FINISH);
check('finishing skill exists', finish !== null);
if (finish) {
  const prose = flat(finish);
  check('setup table says four options', prose.includes('Standard 4 options'));
  check('Step 6 cleans up after Option 2',
    prose.includes('Runs for Option 1, Option 2, and confirmed discards'));
  check('menu offers Ship it first',
    finish.includes('1. Ship it: commit, push, create PR, merge, and clean up'));
  check('menu has no default marker', !finish.includes('(default)'));
  check('gate rule sits before the menu',
    prose.includes('Do not push, open a pull request, or merge before this menu'));
  check('gate names its answer as the authorization',
    prose.includes('The answer is the gate'));
  check('Ship it runs without a second prompt',
    /no further prompt/i.test(prose));
  check('detached HEAD keeps its two options',
    finish.includes('1. Push as new branch and create a Pull Request') &&
    finish.includes("2. Keep as-is (I'll handle it later)"));
  for (const row of [
    '| 1. Ship it | yes | yes | - | yes |',
    '| 2. Merge locally | yes | - | - | yes |',
    '| 3. Create PR | - | yes | yes | - |',
    '| 4. Keep as-is | - | - | yes | - |',
  ]) {
    check(`quick reference row: ${row}`, finish.includes(row));
  }
}

for (const rel of [EXECUTING, FINAL_REVIEW]) {
  const text = read(rel);
  check(`${rel} exists`, text !== null);
  if (!text) continue;
  check(`${rel} forbids a direct PR`, flat(text).includes(HANDOFF));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll PR gate contract checks passed');
