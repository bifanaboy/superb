import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const skills = path.join(repo, 'skills');

const CONFIG_PATH = '~/.config/opencode/superpowers/models.json';
const MENTION = '@choosing-superpowers-models';
const SETUP_SKILL = 'choosing-superpowers-models';
const DISPATCH_SKILLS = [
  'subagent-driven-development',
  'executing-plans',
  'requesting-code-review',
  'brainstorming',
  'dispatching-parallel-agents',
  'diagnosing-superpowers',
];
const SLOT_KEYS = [
  'fast.costly', 'fast.cheap', 'fast.free',
  'smart.costly', 'smart.cheap', 'smart.free',
];
const BLOCK_ANCHOR = '**Model roles:**';

// Files that must route the final review through the smart chain, never
// through an unconfigured "most capable" model.
const FINAL_REVIEW_FILES = [
  'skills/executing-plans/SKILL.md',
  'skills/writing-plans/SKILL.md',
  'skills/subagent-driven-development/references/final-review.md',
];

// Files that must not promise a capability increase above the smart role.
const ESCALATION_FILES = [
  'skills/subagent-driven-development/references/fix-loop.md',
  'skills/subagent-driven-development/references/handling-reports.md',
  'skills/subagent-driven-development/implementer-prompt.md',
];

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

const readRepoFile = (rel) => {
  const file = path.join(repo, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const modelBlock = (text) =>
  text.split('\n').find((line) => line.startsWith(BLOCK_ANCHOR)) ?? null;

// --- Setup skill -----------------------------------------------------------
const setup = readSkill(SETUP_SKILL);
check(`setup skill ${SETUP_SKILL}/SKILL.md exists`, setup !== null);
if (setup) {
  check(`setup skill frontmatter name is ${SETUP_SKILL}`,
    new RegExp(`^---[\\s\\S]*?\\nname:\\s*${SETUP_SKILL}\\s*\\n[\\s\\S]*?\\n---`).test(setup));
  check('setup skill names the config path', setup.includes(CONFIG_PATH));
  check('setup skill names the six slot keys', SLOT_KEYS.every((k) => setup.includes(k)));
  check('setup skill warns the change applies next session', /next session/i.test(setup));
  check('setup skill documents the mention', setup.includes(MENTION));
  check('setup skill creates the config directory when missing',
    /create[^.\n]*`?~\/\.config\/opencode\/superpowers\/`?[^.\n]*missing/i.test(setup));
  check('setup skill preserves a variant suffix', setup.includes('#variant'));
  check('setup skill warns about duplicate models',
    /two slots hold the same model/i.test(setup));
  check('setup skill gives each warning once',
    /say each finding once/i.test(setup));
  check('setup skill keeps duplicates out of the task summary',
    /do not repeat it in the task summary/i.test(setup));
  check('setup skill asks for the full model catalog',
    setup.includes('tools.opencode.models({ all: true })'));
  check('setup skill treats the default listing as incomplete',
    /default listing/i.test(setup));
  check('setup skill says a failed model is skipped for the session',
    /fails a subagent dispatch.*skipped/i.test(setup));
}

// --- Dispatch skills -------------------------------------------------------
const blocks = [];
for (const id of DISPATCH_SKILLS) {
  const text = readSkill(id);
  check(`dispatch skill ${id} exists`, text !== null);
  if (!text) continue;
  const block = modelBlock(text);
  check(`${id} carries the model roles block`, block !== null);
  check(`${id} names the config path`, text.includes(CONFIG_PATH));
  check(`${id} names the chain order`, /`costly`, then `cheap`, then `free`/.test(text));
  check(`${id} names the setup mention`, text.includes(MENTION));
  check(`${id} skips empty or absent slots`, /empty or absent slot/.test(text));
  check(`${id} defines exhaustion when no slot remains`, /no usable slot remains/.test(text));
  check(`${id} reports config problems once per session`, /report config problems once per session/i.test(text));
  check(`${id} names the MODEL SKIP rule`, /MODEL SKIP/.test(text));
  check(`${id} calls a listed model a dead slot`, /dead slot/.test(text));
  check(`${id} checks the full model catalog`, /models\(\{ all: true \}\)/.test(block ?? text));
  if (block) blocks.push({ id, block });
}

if (blocks.length === DISPATCH_SKILLS.length) {
  const first = blocks[0];
  const divergent = blocks.filter((b) => b.block !== first.block);
  check('every dispatch skill carries the identical block', divergent.length === 0,
    divergent.map((b) => b.id).join(', '));
}

// --- Final review and escalation must follow the same chain ----------------
for (const rel of FINAL_REVIEW_FILES) {
  const text = readRepoFile(rel);
  check(`${rel} exists`, text !== null);
  if (!text) continue;
  check(`${rel} routes the final review through the smart chain`,
    /smart chain/.test(text));
  check(`${rel} does not request an unconfigured most-capable model`,
    !/most capable available model/.test(text));
}

for (const rel of ESCALATION_FILES) {
  const text = readRepoFile(rel);
  check(`${rel} exists`, text !== null);
  if (!text) continue;
  check(`${rel} does not promise a capability increase`,
    !/more capable model/.test(text));
  check(`${rel} keeps escalation inside the smart chain`,
    /smart chain/.test(text));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll model tier contract checks passed');
