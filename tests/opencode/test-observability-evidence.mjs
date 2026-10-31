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

const ref = read('skills/systematic-debugging/observability-evidence.md');
const skill = read('skills/systematic-debugging/SKILL.md');
const tracing = read('skills/systematic-debugging/root-cause-tracing.md');
const flat = ref ? ref.replace(/\s+/g, ' ') : '';

check('systematic-debugging skill exists', skill !== null);
check('observability evidence reference exists', ref !== null);
check('Phase 1 links the reference', (skill ?? '').includes('observability-evidence.md'));

const supporting = (skill ?? '').split('## Supporting Techniques')[1] ?? '';
check('Supporting Techniques lists the reference', supporting.includes('observability-evidence.md'));

for (const section of [
  'When to Use',
  'Find the Signal Source',
  'Queries That Separate Causes',
  'Gather One Run of Evidence',
  'Gather Evidence in Production Safely',
  'Return to the Process',
]) {
  check(`reference has the "${section}" section`, (ref ?? '').includes(`## ${section}`));
}

for (const source of ['Error tracking', 'Traces', 'Metrics', 'Logs', 'User reports']) {
  check(`reference names ${source}`, flat.includes(source));
}

for (const practice of [
  'Scope new logging',
  'Sample. Do not log every request',
  'read-only inspection endpoints',
  'Never change production state',
  'Remove temporary instrumentation',
]) {
  check(`reference names the safe practice "${practice}"`, flat.includes(practice));
}

check('reference demands a citation',
  flat.includes('source:citation'));
check('reference blocks fixes before the evidence',
  flat.toLowerCase().includes('do not fix anything until the evidence'));
check('reference points to competing-hypotheses', flat.includes('competing-hypotheses.md'));
check('reference points to dispatching-parallel-agents',
  flat.includes('superpowers:dispatching-parallel-agents'));
check('reference does not name platform tools',
  !/Sentry|DataDog|Jaeger|Rollbar|Bugsnag|Honeycomb|Splunk|LogRocket|FullStory/i.test(flat));

check('root-cause-tracing has a Where to Instrument section',
  (tracing ?? '').includes('## Where to Instrument'));
check('Where to Instrument names the five sites',
  ['Entry points', 'Decision nodes', 'State mutations', 'External call boundaries', 'Error handling paths']
    .every((site) => (tracing ?? '').includes(site)));

check('skill has a Prevent Recurrence section', (skill ?? '').includes('## Prevent Recurrence'));
check('Phase 4.5 references still resolve', (skill ?? '').includes('Phase 4.5'));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll observability-evidence checks passed');
