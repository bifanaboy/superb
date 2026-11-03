import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

export const MODE_FLAG_BASENAME = '.caveman-active';

export function readMode(configDir) {
  try {
    const value = readFileSync(path.join(configDir, MODE_FLAG_BASENAME), 'utf8').trim();
    return value === '' ? null : value;
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    return null;
  }
}

export function writeMode(configDir, mode) {
  writeFileSync(path.join(configDir, MODE_FLAG_BASENAME), String(mode), 'utf8');
}

export function clearMode(configDir) {
  try {
    unlinkSync(path.join(configDir, MODE_FLAG_BASENAME));
  } catch (err) {
    if (err && err.code !== 'ENOENT') throw err;
  }
}

export function modeFlagPath(configDir) {
  return path.join(configDir, MODE_FLAG_BASENAME);
}
