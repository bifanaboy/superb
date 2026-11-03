import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const agentsDir = path.join(root, 'agents');

const read = (name) => fs.readFileSync(path.join(agentsDir, name), 'utf8');
const frontmatter = (text) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'agent file has frontmatter');
  return match[1];
};

const review = read('review.md');
const reviewFront = frontmatter(review);

assert.match(reviewFront, /^mode: all$/m, 'review agent is primary-capable');
assert.doesNotMatch(reviewFront, /^model:/m, 'review agent names no model');
assert.match(review, /`Lens: spec`/, 'spec lens documented');
assert.match(review, /`Lens: plan`/, 'plan lens documented');
assert.match(review, /`Lens: implementation`/, 'implementation lens documented');
assert.match(review, /\*\*Reduce:\*\*/, 'spec lens reduce check');
assert.match(review, /\*\*Cohere:\*\*/, 'spec lens cohere check');
assert.match(review, /\*\*Elegant:\*\*/, 'spec lens elegance check');
assert.match(review, /Never edit code/, 'reviewer never edits code');
assert.match(review, /fix in place/, 'reviewer fixes spec and plan files');
assert.match(review, /Ask which lens/, 'missing lens case handled');

for (const name of ['cavecrew-builder.md', 'cavecrew-investigator.md', 'cavecrew-reviewer.md']) {
  const text = read(name);
  assert.match(frontmatter(text), /^mode: subagent$/m, `${name} is a subagent`);
  assert.doesNotMatch(frontmatter(text), /^model:/m, `${name} names no model`);
}

console.log('  [PASS] review and cavecrew agent files');
