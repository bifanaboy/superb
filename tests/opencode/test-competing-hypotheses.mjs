import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const read = (rel) => {
  const file = path.join(repo, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failures.push(name);
};

const ref = read('skills/systematic-debugging/competing-hypotheses.md');
const skill = read('skills/systematic-debugging/SKILL.md');
const flat = ref ? ref.replace(/\s+/g, ' ') : '';

check('systematic-debugging skill exists', skill !== null);
check('reference exists', ref !== null);
check('Phase 1 links the reference', (skill ?? '').includes('competing-hypotheses.md'));

const supporting = (skill ?? '').split('## Supporting Techniques')[1] ?? '';
check('Supporting Techniques lists the reference', supporting.includes('competing-hypotheses.md'));

for (const topic of ['logic', 'data', 'state', 'integration', 'resource', 'environment']) {
  check(`reference names ${topic}`, flat.toLowerCase().includes(topic));
}
for (const strength of ['Direct', 'Correlational', 'Testimonial', 'Absence']) {
  check(`reference names ${strength} evidence`, flat.includes(strength));
}
for (const level of ['High', 'Medium', 'Low']) {
  check(`reference names ${level} confidence`, flat.includes(level));
}
for (const outcome of ['confirmed', 'plausible', 'falsified', 'inconclusive']) {
  check(`reference names ${outcome}`, flat.toLowerCase().includes(outcome));
}
check('reference points to dispatching-parallel-agents',
  flat.includes('superpowers:dispatching-parallel-agents'));
check('reference does not name platform tools',
  !/Sentry|DataDog|Jaeger/.test(flat));
check('reference blocks fixes before confirmation',
  flat.includes('Do not fix anything until'));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll competing-hypotheses checks passed');
