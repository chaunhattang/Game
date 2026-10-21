import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// Launch from the server workspace, exactly as npm start does.
const port = process.env.SMOKE_PORT || '3102';
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['src/index.js'], {
  cwd: resolve('server'),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    CLIENT_ORIGIN: base,
    JWT_SECRET: randomBytes(48).toString('hex'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (data) => (logs += data));
child.stderr.on('data', (data) => (logs += data));
try {
  let response;
  for (let i = 0; i < 40; i++) {
    try {
      response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert(response, `Production server did not start: ${logs}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('2 PLAYER ARENA'));
  assert(response.headers.get('content-security-policy').includes("default-src 'self'"));
  for (const path of ['/games/pong', '/room/ABC234', '/profile']) {
    const r = await fetch(base + path);
    assert.equal(r.status, 200);
    assert((await r.text()).includes('<div id="root"></div>'));
  }
  for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
    assert.equal((await fetch(base + asset[1])).status, 200);
  }
  const session = await fetch(base + '/api/session', { method: 'POST' });
  assert.equal(session.status, 200);
  const cookie = session.headers.get('set-cookie');
  assert(
    cookie.includes('HttpOnly') && cookie.includes('Secure') && cookie.includes('SameSite=Lax')
  );
  assert.equal((await fetch(base + '/api/no-such-route')).status, 404);
  console.log(
    'Production smoke passed: workspace startup, SPA routes, assets, CSP, secure session cookie, API 404.'
  );
} finally {
  child.kill();
}
