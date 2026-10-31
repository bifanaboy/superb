import http from 'http';
import fs from 'fs';
import path from 'path';

const portArg = process.argv.indexOf('--port');
const port = portArg !== -1 ? Number(process.argv[portArg + 1]) : 4173;
const root = path.resolve(import.meta.dirname, 'fixtures');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (req.method === 'POST' && url.pathname === '/login') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const user = params.get('user') || '';
      const pass = params.get('pass') || '';
      if (!user.trim() || !pass.trim()) {
        send(res, 401, 'Missing credentials');
        return;
      }
      res.writeHead(302, {
        Location: '/protected.html',
        'Set-Cookie': 'session=ok; HttpOnly; Path=/',
      });
      res.end();
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/delete') {
    console.log('WRITE /delete');
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/protected.html') {
    const cookie = req.headers.cookie || '';
    if (!cookie.includes('session=ok')) {
      send(res, 401, 'Unauthorized');
      return;
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }

  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(root, safePath === '/' ? 'broken.html' : safePath);
  if (!file.startsWith(root)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? '' : data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LISTENING http://127.0.0.1:${port}`);
});
