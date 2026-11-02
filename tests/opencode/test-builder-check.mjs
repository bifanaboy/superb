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
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

const PROMPT = 'skills/brainstorming/builder-check-prompt.md';
const SKILL = 'skills/brainstorming/SKILL.md';

const prompt = read(PROMPT);
const skill = read(SKILL);
const flat = prompt ? prompt.replace(/\s+/g, ' ') : '';
const flatSkill = skill ? skill.replace(/\s+/g, ' ') : '';

check('builder-check prompt exists', prompt !== null);
check('brainstorming skill exists', skill !== null);

// The critique lives inside the dispatched prompt, not around it.
const fenced = prompt ? prompt.match(/```([\s\S]*?)```/) : null;
const body = fenced ? fenced[1] : '';
const flatBody = body.replace(/\s+/g, ' ');

check('the prompt has one fenced block', (prompt?.match(/```/g) ?? []).length === 2);
check('the shape critique sits inside the prompt block',
  flatBody.includes("Also critique the design's shape"));
check('the critique is not a second dispatch',
  !/critique the design's shape[\s\S]*dispatch/i.test(flatBody));

// Each lens is present, with the examples that make it actionable.
for (const lens of ['Reduce:', 'Cohere:', 'Elegant:']) {
  check(`the critique names the ${lens.replace(':', '')} lens`, flatBody.includes(lens));
}
for (const example of [
  'duplicated machinery',
  'features the goal does not need',
  'non-goals the design accidentally serves',
  'speculative extensions',
  'more than one owner for a concern',
  'conflicting layers',
  'inconsistent naming',
  'a fork where thin composition would do',
  'an abstraction with one implementation',
  'config for fixed values',
]) {
  check(`the critique names "${example}"`, flatBody.includes(example));
}

// Findings stay questions that change the plan, and duplicates are skipped.
check('the critique asks for questions whose answer changes the plan',
  flatBody.includes('question whose answer changes the plan'));
check('the critique skips what the design already handles',
  flatBody.includes('Skip a critique the design already handles'));

// The existing ambiguity ask survives.
check('the ambiguity ask survives',
  flatBody.includes("questions you'd still need answered"));
check('the empty result survives',
  flatBody.includes('nothing important left'));

// No new step, skill, or seat: one builder check, one dispatch instruction.
check('the skill still names the builder-check prompt',
  flatSkill.includes('builder-check-prompt.md'));
check('the skill dispatches the builder check once',
  (flatSkill.match(/dispatch a fresh subagent/gi) ?? []).length === 1);
check('the prompt keeps a single dispatch instruction',
  (flat.match(/dispatch a fresh general-purpose subagent/gi) ?? []).length === 1);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll builder check contract checks passed');
