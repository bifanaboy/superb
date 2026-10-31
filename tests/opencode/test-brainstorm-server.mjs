import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const serverPath = path.resolve(
  import.meta.dirname,
  '../../skills/brainstorming/scripts/server.cjs',
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(fn, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await fn();
    if (value) return value;
    await sleep(25);
  }
  throw new Error(`timeout waiting for ${label}`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function upgrade(port, token) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    let response = '';
    const timer = setTimeout(
      () => reject(new Error(`WebSocket upgrade timed out: ${response}`)),
      2000,
    );
    socket.setEncoding('utf8');
    socket.on('error', reject);
    socket.on('data', (chunk) => {
      response += chunk;
      if (response.includes('\r\n\r\n')) {
        clearTimeout(timer);
        resolve({ socket, response });
      }
    });
    socket.on('connect', () => {
      const key = Buffer.from('0123456789abcdef').toString('base64');
      socket.write(
        `GET /?key=${token} HTTP/1.1\r\n` +
        `Host: 127.0.0.1:${port}\r\n` +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\n` +
        'Sec-WebSocket-Version: 13\r\n' +
        `Origin: http://127.0.0.1:${port}\r\n` +
        '\r\n',
      );
    });
  });
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-server-'));
const token = 'a'.repeat(32);
let child;
let socket;

try {
  fs.mkdirSync(path.join(dir, 'content'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'content', 'screen.html'), '<h2>Hello</h2>');

  const port = await freePort();
  child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      BRAINSTORM_DIR: dir,
      BRAINSTORM_PORT: String(port),
      BRAINSTORM_TOKEN: token,
      BRAINSTORM_LIFECYCLE_CHECK_MS: '60000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('exit', (code) => {
    if (code !== null) stderr += `\nexit ${code}`;
  });

  const started = await waitFor(
    () => stdout.split('\n').find((line) => line.includes('"type":"server-started"')),
    5000,
    'server-started',
  );
  const info = JSON.parse(started);
  const base = `http://127.0.0.1:${info.port}`;
  const cookieName = `brainstorm-key-${info.port}`;

  const denied = await fetch(`${base}/`);
  assert.equal(denied.status, 403, 'a request without the key is denied');

  const keyed = await fetch(`${base}/?key=${token}`);
  assert.equal(keyed.status, 200, 'the key bootstraps the page');
  const cookie = keyed.headers.getSetCookie?.().join('; ') ??
    keyed.headers.get('set-cookie') ?? '';
  assert.match(cookie, new RegExp(`${cookieName}=${token}`), 'the key is mirrored to a cookie');
  assert.match(cookie, /HttpOnly/, 'the cookie is HttpOnly');
  assert.match(cookie, /SameSite=Strict/, 'the cookie is SameSite=Strict');

  const cookieHeader = `${cookieName}=${token}`;
  const screen = await fetch(`${base}/`, { headers: { cookie: cookieHeader } });
  assert.equal(screen.status, 200, 'the cookie authorizes the screen');
  assert.match(await screen.text(), /Hello/, 'the newest screen is served');

  const traversal = await fetch(`${base}/files/..%2f..%2fserver.cjs`, {
    headers: { cookie: cookieHeader },
  });
  assert.equal(traversal.status, 404, 'encoded traversal is rejected');

  const ws = await upgrade(info.port, token);
  socket = ws.socket;
  assert.ok(ws.response.startsWith('HTTP/1.1 101'), 'the WebSocket upgrade succeeds');

  const payload = Buffer.from(JSON.stringify({ type: 'click', choice: 'a', text: 'A' }));
  assert.ok(payload.length < 126, 'the test frame uses the short length form');
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
  socket.write(Buffer.concat([
    Buffer.from([0x81, 0x80 | payload.length]),
    mask,
    masked,
  ]));

  const eventsPath = path.join(dir, 'state', 'events');
  const events = await waitFor(() => {
    if (!fs.existsSync(eventsPath)) return null;
    const text = fs.readFileSync(eventsPath, 'utf8');
    return text.includes('"choice":"a"') ? text : null;
  }, 2000, 'state/events');
  assert.match(events, /"choice":"a"/, 'the choice reaches state/events');

  console.log('companion server auth and WebSocket passed');
} finally {
  if (socket) socket.destroy();
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await waitFor(() => child.exitCode !== null, 2000, 'server exit').catch(() => {
      child.kill('SIGKILL');
    });
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
