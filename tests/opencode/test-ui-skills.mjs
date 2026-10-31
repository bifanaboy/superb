import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const skill = (name) => read(`skills/${name}/SKILL.md`);

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

for (const name of ['ui-breaker', 'ui-design']) {
  const file = path.join(root, 'skills', name, 'SKILL.md');
  check(fs.existsSync(file), `missing ${file}`);
  if (!fs.existsSync(file)) continue;
  const text = skill(name);
  const match = text.match(/^---\nname:\s*(\S+)\ndescription:\s*(.+)\n---/);
  check(!!match, `${name}: invalid frontmatter`);
  if (match) {
    check(match[1] === name, `${name}: frontmatter name must be ${name}`);
    check(match[2].startsWith('Use when'), `${name}: description must start with "Use when"`);
    check(match[2].length <= 500, `${name}: description must be under 500 characters`);
  }
}

const breakerPath = path.join(root, 'skills/ui-breaker/SKILL.md');
if (fs.existsSync(breakerPath)) {
  const breaker = skill('ui-breaker');
  for (const phrase of ['write action', '.env', 'browser', 'Flow', 'Craft', 'Fit']) {
    check(breaker.includes(phrase), `ui-breaker: missing "${phrase}"`);
  }
}
for (const ref of ['browser-protocol.md', 'report-format.md']) {
  check(fs.existsSync(path.join(root, 'skills/ui-breaker/references', ref)), `missing ui-breaker reference ${ref}`);
}
const protocolPath = path.join(root, 'skills/ui-breaker/references/browser-protocol.md');
if (fs.existsSync(protocolPath)) {
  const protocol = fs.readFileSync(protocolPath, 'utf8');
  for (const phrase of ['tabID', 'git check-ignore', '600', 'resize', 'lighthouse']) {
    check(protocol.includes(phrase), `browser-protocol: missing "${phrase}"`);
  }
}

const designPath = path.join(root, 'skills/ui-design/SKILL.md');
if (fs.existsSync(designPath)) {
  const design = skill('ui-design');
  for (const phrase of ['product-derived', 'no house style', 'DESIGN.md', 'ui-breaker']) {
    check(design.includes(phrase), `ui-design: missing "${phrase}"`);
  }
}
for (const ref of ['taste-bar.md', 'direction-method.md', 'registers.md']) {
  check(fs.existsSync(path.join(root, 'skills/ui-design/references', ref)), `missing ui-design reference ${ref}`);
}

const readme = read('README.md');
check(readme.includes('ui-breaker') && readme.includes('ui-design'), 'README must name ui-breaker and ui-design');
const using = read('skills/using-superb/SKILL.md');
check(using.includes('ui-design'), 'using-superb must name ui-design');
check(skill('ui-breaker').includes('../ui-design/references/taste-bar.md'), 'ui-breaker must link to the taste bar');
check(skill('ui-design').includes('../ui-breaker/references/browser-protocol.md'), 'ui-design must link to the browser protocol');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({ skills: ['ui-breaker', 'ui-design'] }));
