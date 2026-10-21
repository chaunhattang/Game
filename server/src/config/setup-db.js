import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from './env.js';
const db = await mysql.createConnection({ ...config.db, multipleStatements: true });
try {
  for (const f of ['schema', 'seed'])
    await db.query(await readFile(new URL(`../../../database/${f}.sql`, import.meta.url), 'utf8'));
  console.log('Schema and catalog installed.');
} finally {
  await db.end();
}
