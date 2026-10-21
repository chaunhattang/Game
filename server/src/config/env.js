import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
dotenv.config({ quiet: true });
import { randomBytes } from 'node:crypto';
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error('Production requires JWT_SECRET with at least 32 characters.');
export const config = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '0.0.0.0',
  production: process.env.NODE_ENV === 'production',
  secret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
  origins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  db: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'arena',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'arena',
    connectionLimit: 10,
    connectTimeout: 3000,
    decimalNumbers: true,
  },
};
