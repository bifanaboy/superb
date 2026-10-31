import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const skills = path.join(repo, 'skills');

const CONFIG_PATH = '~/.config/opencode/superpowers/models.json';
const SETUP_SKILL = 'superpowers-models';
const DISPATCH_SKILLS = [
  'subagent-driven-development',
  'executing-plans',
  'requesting-code-review',
  'brainstorming',
];
const SLOT_KEYS = [
  'fast.paid', 'fast.cheap', 'fast.free',
  'smart.paid', 'smart.cheap', 'smart.free',
];
const BLOCK_ANCHOR = '**Model roles:**';

const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

const readSkill = (id) => {
  const file = path.join(skills, id, 'SKILL.md');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const setup = readSkill(SETUP_SKILL);
check(`setup skill ${SETUP_SKILL}/SKILL.md exists`, setup !== null);
if (setup) {
  check(`setup skill frontmatter name is ${SETUP_SKILL}`,
    new RegExp(`^---[\\s\\S]*?\\nname:\\s*${SETUP_SKILL}\\s*\\n[\\s\\S]*?\\n---`).test(setup));
  check('setup skill names the config path', setup.includes(CONFIG_PATH));
  check('setup skill names the six slot keys', SLOT_KEYS.every((k) => setup.includes(k)));
  check('setup skill warns the change applies next session', /next session/i.test(setup));
}

for (const id of DISPATCH_SKILLS) {
  const text = readSkill(id);
  check(`dispatch skill ${id} exists`, text !== null);
  if (!text) continue;
  check(`${id} carries the model roles block`, text.includes(BLOCK_ANCHOR));
  check(`${id} names the config path`, text.includes(CONFIG_PATH));
  check(`${id} names the chain order`, /`paid`, then `cheap`, then `free`/.test(text));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll model tier contract checks passed');
