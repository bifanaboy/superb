import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const file = path.join(repo, 'skills/using-superb/SKILL.md');
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

check('using-superb exists', text.length > 0);
check('has the Writing to Your Human Partner section',
  text.includes('## Writing to Your Human Partner'));
check('names ASD-STE100', text.includes('ASD-STE100'));
check('caps an instruction at 20 words', /20 words/.test(text));
check('caps a description at 25 words', /25 words/.test(text));
check('requires active voice', /active voice/i.test(text));
check('exempts code', /code/.test(text));
check('exempts commands', /commands/.test(text));
check('exempts quoted text', /quoted text/.test(text));
check('exempts the human\'s own words', /human's own words/.test(text));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll STE100 contract checks passed');
