import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const file = path.join(repo, 'skills/brainstorming/SKILL.md');
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const flat = text.replace(/\s+/g, ' ');

const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failures.push(name);
};

check('brainstorming skill exists', text.length > 0);
check('has a Handoff section', text.includes('## Handoff'));
check('uses the question tool', flat.includes('question tool'));
check('offers implement now', flat.includes('Implement now'));
check('offers file the spec as an issue', flat.includes('File the spec as an issue'));
check('implement invokes writing-plans', flat.includes('superpowers:writing-plans'));
check('file path writes the origin issue', flat.includes('origin issue'));
check('file path creates a new issue', flat.includes('create a new issue'));
check('file path replaces the issue body', flat.includes('Replace the issue body'));
check('file path stops', flat.includes('then stop'));
check('unknown origin asks for a number', flat.includes('ask for its number'));
check('no tracker keeps the local design doc', flat.includes('keep the local design doc'));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll brainstorming handoff checks passed');
