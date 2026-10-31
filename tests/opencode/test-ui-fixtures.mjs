import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..', 'ui', 'fixtures');
const read = (name) => {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) throw new Error(`missing fixture: ${file}`);
  return fs.readFileSync(file, 'utf8');
};

const broken = read('broken.html');
const bland = read('bland.html');
const empty = read('empty.html');
const login = read('login.html');
const protectedPage = read('protected.html');

for (const marker of ['data-defect="flow"', 'data-defect="craft"', 'data-defect="fit"', 'data-write-action']) {
  if (!broken.includes(marker)) throw new Error(`broken.html missing ${marker}`);
}
if (!bland.includes('Inbox') || !bland.includes('Today')) throw new Error('bland.html missing task content');
if (!empty.includes('Ledger')) throw new Error('empty.html missing the product name');
if (!login.includes('name="user"') || !login.includes('name="pass"')) throw new Error('login.html missing form fields');
if (!protectedPage.includes('Protected dashboard')) throw new Error('protected.html missing marker');

console.log(JSON.stringify({ fixtures: ['broken', 'bland', 'empty', 'login', 'protected'] }));
