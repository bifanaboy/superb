import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const requesting = read('skills/requesting-code-review/SKILL.md');
const codeReviewer = read('skills/requesting-code-review/code-reviewer.md');
const taskReviewer = read('skills/subagent-driven-development/task-reviewer-prompt.md');
const reReview = read('skills/subagent-driven-development/re-review-prompt.md');
const executing = read('skills/executing-plans/SKILL.md');

assert.match(codeReviewer, /Subagent \(review\):/, 'code reviewer template dispatches review');
assert.match(taskReviewer, /Subagent \(review\):/, 'task reviewer template dispatches review');
assert.match(reReview, /Subagent \(review\):/, 're-review template dispatches review');
assert.match(requesting, /Dispatch the `review` agent/, 'requesting skill names the review agent');
assert.match(requesting, /Lens: spec/, 'spec lens documented');
assert.match(requesting, /Lens: plan/, 'plan lens documented');
assert.match(requesting, /Lens: implementation/, 'implementation lens documented');
assert.doesNotMatch(taskReviewer, /^  model:/m, 'task reviewer has no model line');
assert.doesNotMatch(reReview, /^  model:/m, 're-review has no model line');
assert.doesNotMatch(executing, /Specify the model/, 'executing-plans stale sentence gone');

console.log('  [PASS] review dispatch and stale model lines');
