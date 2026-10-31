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

const skill = read('skills/dispatching-parallel-agents/SKILL.md');
const flat = skill ? skill.replace(/\s+/g, ' ') : '';

check('dispatching-parallel-agents skill exists', skill !== null);
check('skill has a write-surface section', (skill ?? '').includes('Check the Write Surface'));
check('write-surface rule names the no-shared-file condition', flat.includes('share no file'));
check('write-surface rule allows read-only agents to share files',
  flat.includes('Read-only agents can share files'));
check('write-surface rule serializes agents on a shared file',
  flat.includes('one after the other'));
check('write-surface rule covers unknown write surfaces',
  flat.includes('cannot name the surfaces'));
check('skill has a mid-flight replan rule', flat.includes('stop the dependent agent'));
check('skill requires skipped checks in agent reports', flat.includes('skipped check'));
check('skill still requires one response for parallel dispatch',
  flat.includes('Multiple dispatch calls in one response = parallel execution'));

const lineCount = skill ? skill.split('\n').length : 0;
check('skill stays within the line budget', lineCount <= 190);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll dispatch-write-surface checks passed');
