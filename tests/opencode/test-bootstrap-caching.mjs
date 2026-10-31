import fs from 'fs';
import { pathToFileURL } from 'url';

const [, , pluginPath, scenario] = process.argv;

if (!pluginPath || !['present', 'missing'].includes(scenario)) {
  console.error('Usage: node test-bootstrap-caching.mjs PLUGIN_PATH present|missing');
  process.exit(2);
}

let existsCount = 0;
let readCount = 0;

const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;

fs.existsSync = function (...args) {
  if (isBootstrapSkillPath(args[0])) {
    existsCount += 1;
  }
  return originalExistsSync.apply(this, args);
};

fs.readFileSync = function (...args) {
  if (isBootstrapSkillPath(args[0])) {
    readCount += 1;
  }
  return originalReadFileSync.apply(this, args);
};

const mod = await import(pathToFileURL(pluginPath).href);

// The plugin targets OpenCode 2 only: one default export, one mapping.
const moduleShape = {
  hasServerExport: typeof mod.default?.server !== 'undefined',
  hasToolMapping: typeof mod.TOOL_MAPPING === 'string',
  serverHidden: !('server' in (mod.default || {})),
};

const mappingFailures = assertMappingConstants(mod);

// Drive setup() once and fire the captured "context" hook on two top-level
// (parentID-less) sessions. Counting starts after setup(): skill registration
// also reads using-superpowers/SKILL.md.
const invoke = await makeContextHarness(mod);
const baseline = { existsCount, readCount };

const firstEvent = makeEvent(`${scenario} bootstrap first step`);
await invoke(firstEvent);
const afterFirst = { existsCount, readCount };

const secondEvent = makeEvent(`${scenario} bootstrap second step`);
await invoke(secondEvent);
const afterSecond = { existsCount, readCount };

const bootstrap = bootstrapText(firstEvent);

const result = {
  scenario,
  moduleShape,
  firstBootstrapParts: countBootstrapParts(firstEvent),
  secondBootstrapParts: countBootstrapParts(secondEvent),
  firstReads: afterFirst.readCount - baseline.readCount,
  secondReads: afterSecond.readCount - afterFirst.readCount,
  firstExists: afterFirst.existsCount - baseline.existsCount,
  secondExists: afterSecond.existsCount - afterFirst.existsCount,
  mapsTodo: bootstrap.includes('`todowrite`'),
  mapsSubagent: bootstrap.includes('`subagent` with `agent: "general"`'),
  mapsSessionID: bootstrap.includes('`sessionID` to continue a previous subagent'),
  mapsPatch: bootstrap.includes('`patch` with `patchText`'),
  mapsShell: bootstrap.includes('`shell`'),
};

const failures = [
  ...assertModuleShape(result.moduleShape),
  ...(scenario === 'present' ? assertPresentBootstrap(result) : assertMissingBootstrap(result)),
  ...mappingFailures,
];

if (failures.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));

function isBootstrapSkillPath(filePath) {
  return String(filePath).replaceAll('\\', '/').includes('using-superpowers/SKILL.md');
}

async function makeContextHarness(mod) {
  let contextHook = null;
  await mod.default.setup({
    skill: {
      transform: async (fn) => {
        fn({ add: () => {} });
      },
    },
    session: {
      hook: async (name, cb) => {
        if (name === 'context') contextHook = cb;
      },
      get: async ({ sessionID }) => ({ id: sessionID }), // top-level: no parentID
    },
  });
  if (typeof contextHook !== 'function') {
    throw new Error('setup() did not register a context hook');
  }
  return (event) => contextHook(event);
}

function makeEvent(text) {
  return {
    sessionID: 'sess-bootstrap-caching',
    messages: [{ role: 'user', content: [{ type: 'text', text }] }],
  };
}

function countBootstrapParts(event) {
  return event.messages
    .flatMap((message) => message.content ?? message.parts ?? [])
    .filter((part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'))
    .length;
}

function bootstrapText(event) {
  return event.messages
    .flatMap((message) => message.content ?? message.parts ?? [])
    .find((part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'))?.text || '';
}

function assertModuleShape(shape) {
  const failures = [];
  if (shape.hasServerExport) {
    failures.push('expected no server field on the default export');
  }
  if (!shape.serverHidden) {
    failures.push('expected the default export to hide server');
  }
  if (!shape.hasToolMapping) {
    failures.push('expected a TOOL_MAPPING string export');
  }
  return failures;
}

function assertPresentBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 1) {
    failures.push(`expected first hook call to inject one bootstrap part, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 1) {
    failures.push(`expected second hook call to inject one bootstrap part, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReads !== 1) {
    failures.push(`expected first hook call to read SKILL.md once, got ${result.firstReads}`);
  }
  if (result.secondReads !== 0) {
    failures.push(`expected cached second hook call to do no additional reads, got ${result.secondReads}`);
  }
  if (result.secondExists !== 0) {
    failures.push(`expected cached second hook call to do no additional exists checks, got ${result.secondExists}`);
  }
  if (!result.mapsTodo) {
    failures.push('expected OpenCode bootstrap to map todos to todowrite');
  }
  if (!result.mapsSubagent) {
    failures.push('expected OpenCode bootstrap to map subagents to the subagent tool');
  }
  if (!result.mapsSessionID) {
    failures.push('expected OpenCode bootstrap to teach sessionID continuation for subagents');
  }
  if (!result.mapsPatch) {
    failures.push('expected OpenCode bootstrap to map file mutation to patch with patchText');
  }
  if (!result.mapsShell) {
    failures.push('expected OpenCode bootstrap to map shell commands to the shell tool');
  }
  return failures;
}

function assertMissingBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 0) {
    failures.push(`expected no bootstrap when SKILL.md is missing, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 0) {
    failures.push(`expected no bootstrap on second missing-file hook call, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReads !== 0 || result.secondReads !== 0) {
    failures.push(`expected missing file path to avoid reads, got ${result.secondReads}`);
  }
  if (result.firstExists < 1) {
    failures.push('expected first hook call to check whether SKILL.md exists');
  }
  if (result.secondExists !== 0) {
    failures.push(`expected missing-file result to be cached, got ${result.secondExists} extra exists checks`);
  }
  return failures;
}

function assertMappingConstants(mod) {
  const failures = [];
  if (typeof mod.TOOL_MAPPING !== 'string') {
    failures.push('expected plugin to export a TOOL_MAPPING string constant');
    return failures;
  }
  for (const needle of [
    '`todowrite`',
    '`subagent` with `agent: "general"`',
    '`sessionID` to continue a previous subagent',
    '`write`',
    '`edit`',
    '`patch` with `patchText`',
    '`shell`',
    '`read`',
    '`grep`, `glob`',
    '`webfetch`',
    '`websearch`',
  ]) {
    if (!mod.TOOL_MAPPING.includes(needle)) {
      failures.push(`expected TOOL_MAPPING to teach the tool ${needle}`);
    }
  }
  for (const stale of ['`task` with', '`apply_patch`', '`bash`', 'no todo tool']) {
    if (mod.TOOL_MAPPING.includes(stale)) {
      failures.push(`expected TOOL_MAPPING not to teach the stale name ${stale}`);
    }
  }
  return failures;
}
