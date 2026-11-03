export const CAVEMAN_COMMANDS = [
  {
    name: 'caveman',
    description: 'Turn caveman voice mode on',
    mode: 'caveman',
    prompt: 'CAVEMAN MODE ACTIVE (caveman) — session ruleset applies. Answer terse.',
  },
  {
    name: 'ultracave',
    description: 'Turn ultracave voice mode on',
    mode: 'ultra',
    prompt: 'CAVEMAN MODE ACTIVE (ultra) — session ruleset applies. Answer in fragments.',
  },
  {
    name: 'megacave',
    description: 'Turn megacave voice mode on',
    mode: 'wenyan',
    prompt: 'CAVEMAN MODE ACTIVE (wenyan) — session ruleset applies. Answer in classical Chinese.',
  },
  {
    name: 'caveman-commit',
    description: 'Write a terse Conventional Commits message',
    mode: null,
    prompt: 'Write a Conventional Commits message for the staged change. Compress to intent only. No body unless needed.',
  },
  {
    name: 'caveman-review',
    description: 'Review the diff in terse findings-only form',
    mode: null,
    prompt: 'Review the current diff. One line per finding: path:line, severity, problem, fix. No praise.',
  },
];
