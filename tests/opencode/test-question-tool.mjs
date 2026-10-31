import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

const read = (rel) => {
  const file = path.join(repo, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const USING = 'skills/using-superpowers/SKILL.md';
const PLANS = 'skills/writing-plans/SKILL.md';

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : `: ${detail}`}`);
  if (!ok) failures.push(name);
};
const flat = (text) => text.replace(/\s+/g, ' ');

const using = read(USING);
check('using-superpowers exists', using !== null);
if (using) {
  const prose = flat(using);
  check('using-superpowers has an Asking Questions section',
    using.includes('## Asking Questions'));
  check('using-superpowers names the question tool',
    prose.includes('question tool'));
  check('using-superpowers names the OpenCode tool',
    prose.includes('on OpenCode that is `question`'));
  check('using-superpowers covers every multiple-choice question',
    prose.includes('every multiple-choice question anywhere in the flow'));
  check('using-superpowers keeps free-form questions in prose',
    prose.includes('Free-form questions stay in prose'));
}

const plans = read(PLANS);
check('writing-plans exists', plans !== null);
if (plans) {
  const prose = flat(plans);
  check('writing-plans handoff names the question tool',
    prose.includes("harness's question tool"));
  check('writing-plans handoff names the OpenCode call',
    prose.includes('`question` with two entries'));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll question tool contract checks passed');
