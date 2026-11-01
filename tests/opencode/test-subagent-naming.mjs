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

const TEMPLATES = [
  'skills/subagent-driven-development/implementer-prompt.md',
  'skills/subagent-driven-development/task-reviewer-prompt.md',
  'skills/subagent-driven-development/re-review-prompt.md',
  'skills/requesting-code-review/code-reviewer.md',
];

for (const rel of TEMPLATES) {
  const text = read(rel);
  check(`${rel} exists`, text !== null);
  if (!text) continue;
  const lines = text.split('\n').filter((line) => /^\s*description:/.test(line));
  check(`${rel} has a description line`, lines.length > 0);
  for (const line of lines) {
    check(`${rel} description has no model ID: ${line.trim()}`,
      !/^\s*description:\s*"[^"]*\//.test(line));
  }
}

const using = read('skills/using-superb/SKILL.md');
check('using-superb exists', using !== null);
if (using) {
  check('using-superb has the Naming Subagents section',
    using.includes('## Naming Subagents'));
  check('using-superb names the task-only format',
    using.includes('Name every subagent for its task'));
  check('using-superb forbids a model ID in the description',
    /Do not put a model ID in the description/.test(using));
}

const parallel = read('skills/dispatching-parallel-agents/SKILL.md');
check('dispatching-parallel-agents names the format',
  parallel !== null && parallel.includes('Name each subagent for its task'));

const builder = read('skills/brainstorming/builder-check-prompt.md');
check('builder-check exists',
  builder !== null);

const diagnosing = read('skills/diagnosing-superb/SKILL.md');
check('diagnosing exists',
  diagnosing !== null);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll subagent naming contract checks passed');
