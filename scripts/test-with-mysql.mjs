// Starts a disposable, isolated test instance. Never connects to the user's MySQL service.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import mysql from 'mysql2/promise';
const binary =
  process.env.ARENA_MYSQL_BIN || 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe';
await mkdir('.local', { recursive: true });
const data = await mkdtemp(resolve('.local/mysql-test-'));
const run = (command, args, env = process.env) =>
  new Promise((yes, no) => {
    const p = spawn(command, args, { env, stdio: 'inherit' });
    p.on('error', no);
    p.on('exit', (code) => (code === 0 ? yes() : no(new Error(`${command} exited ${code}`))));
  });
await run(binary, [
  '--no-defaults',
  '--initialize-insecure',
  `--datadir=${data}`,
  `--basedir=${resolve(dirname(binary), '..')}`,
]);
const port = Number(process.env.ARENA_TEST_MYSQL_PORT || 3307);
const proc = spawn(
  binary,
  [
    '--no-defaults',
    `--datadir=${data}`,
    `--port=${port}`,
    '--bind-address=127.0.0.1',
    '--mysqlx=OFF',
    '--skip-log-bin',
    '--console',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);
let logs = '';
proc.stderr.on('data', (d) => (logs += d));
proc.on('error', (e) => console.error(e.message));
const env = {
  ...process.env,
  MYSQL_HOST: '127.0.0.1',
  MYSQL_PORT: String(port),
  MYSQL_USER: 'root',
  MYSQL_PASSWORD: '',
  MYSQL_DATABASE: 'arena_test',
  ARENA_TEST_DB: '1',
};
let db;
try {
  for (let i = 0; i < 100; i++) {
    try {
      db = await mysql.createConnection({
        host: '127.0.0.1',
        port,
        user: 'root',
        password: '',
        multipleStatements: true,
      });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (!db) throw new Error(`Isolated MySQL did not start: ${logs}`);
  await db.query('CREATE DATABASE arena_test');
  await run(process.execPath, ['server/src/config/setup-db.js'], env);
  console.log('Isolated MySQL ready. Running real persistence tests.');
  await run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], env);
  if (!process.argv.includes('--unit-only'))
    await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], env);
} finally {
  if (db) {
    try {
      await db.query('SHUTDOWN');
    } catch {}
    await db.end();
  }
  proc.kill();
  console.log('Isolated MySQL stopped. Test data is ignored under .local/.');
}
