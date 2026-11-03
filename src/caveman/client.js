import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export function resolveCliBin() {
  try {
    const req = createRequire(import.meta.url);
    const pkgPath = req.resolve('@caveman-ai/cli/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const binRel = (pkg && pkg.bin && (pkg.bin.caveman || pkg.bin.cave)) || 'dist/index.js';
    return path.resolve(path.dirname(pkgPath), binRel);
  } catch (err) {
    return null;
  }
}

function defaultExec(bin, args, payload) {
  return execFileSync(process.execPath, [bin, ...args], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 2000,
    maxBuffer: 2 * 1024 * 1024,
  });
}

export function createClient({ bin, exec } = {}) {
  const run = exec || ((args, payload) => defaultExec(bin, args, payload));

  const parse = (raw) => {
    try {
      const json = JSON.parse(raw);
      if (!json || typeof json !== 'object') return undefined;
      return json;
    } catch (err) {
      return undefined;
    }
  };

  const call = (args, payload) => {
    try {
      return parse(run(args, payload));
    } catch (err) {
      return undefined;
    }
  };

  return {
    sessionStart(sessionID) {
      const json = call(['native-hook', 'opencode', 'SessionStart'], {
        event_name: 'SessionStart',
        session_id: sessionID,
      });
      const value = json && json.hookSpecificOutput && json.hookSpecificOutput.additionalContext;
      return typeof value === 'string' ? value : undefined;
    },
    preTool(sessionID, toolName, toolInput) {
      const json = call(['native-hook', 'opencode', 'PreToolUse'], {
        event_name: 'PreToolUse',
        session_id: sessionID,
        tool_name: toolName,
        tool_input: toolInput,
      });
      const value = json && json.hookSpecificOutput && json.hookSpecificOutput.additionalContext;
      return typeof value === 'string' ? value : undefined;
    },
    postTool(sessionID, toolName, toolInput, toolOutput) {
      const json = call(['native-hook', 'opencode', 'PostToolUse'], {
        event_name: 'PostToolUse',
        session_id: sessionID,
        tool_name: toolName,
        tool_input: toolInput,
        tool_output: toolOutput,
      });
      const out = json && json.hookSpecificOutput;
      if (out && typeof out.updatedToolOutput === 'string') return out.updatedToolOutput;
      if (out && typeof out.output_replacement === 'string') return out.output_replacement;
      return undefined;
    },
    shrink(command) {
      const json = call(['shrink-hook'], {
        tool_name: 'Bash',
        tool_input: { command },
      });
      const value = json && json.hookSpecificOutput && json.hookSpecificOutput.updatedInput && json.hookSpecificOutput.updatedInput.command;
      return typeof value === 'string' ? value : undefined;
    },
    getVersion() {
      try {
        const raw = execFileSync(process.execPath, [bin, '--version'], {
          encoding: 'utf8',
          timeout: 2000,
          maxBuffer: 1024 * 1024,
        });
        try {
          const json = JSON.parse(raw);
          if (json && typeof json.version === 'string') return json.version;
        } catch (err) {
          // fall through to regex
        }
        const match = String(raw).match(/"version"\s*:\s*"([^"]+)"/);
        return match ? match[1] : null;
      } catch (err) {
        return null;
      }
    },
  };
}
