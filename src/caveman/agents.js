import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR_REPO = path.resolve(__dirname, '../../agents');

const AGENT_NAMES = ['cavecrew-builder', 'cavecrew-investigator', 'cavecrew-reviewer', 'review'];

function loadAgentFiles() {
  const out = {};
  for (const name of AGENT_NAMES) {
    const filePath = path.join(AGENTS_DIR_REPO, `${name}.md`);
    try {
      out[`${name}.md`] = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      // Missing file: skip; installer writes nothing for it.
    }
  }
  return out;
}

export const AGENT_FILES = loadAgentFiles();

export function installAgents(agentsDir, reload) {
  const installed = [];
  for (const [fileName, content] of Object.entries(AGENT_FILES)) {
    const target = path.join(agentsDir, fileName);
    if (fs.existsSync(target)) continue;
    try {
      fs.writeFileSync(target, content, 'utf8');
      installed.push(fileName.replace(/\.md$/, ''));
    } catch (err) {
      // Fail soft: skip this file.
    }
  }
  if (installed.length > 0 && typeof reload === 'function') {
    try { reload(); } catch (err) {}
  }
  return { installed };
}

export function uninstallAgents(agentsDir, reload) {
  const removed = [];
  for (const fileName of Object.keys(AGENT_FILES)) {
    const target = path.join(agentsDir, fileName);
    try {
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        removed.push(fileName.replace(/\.md$/, ''));
      }
    } catch (err) {
      // Fail soft.
    }
  }
  if (removed.length > 0 && typeof reload === 'function') {
    try { reload(); } catch (err) {}
  }
  return { removed };
}
