import mysql from 'mysql2/promise';
import { config } from './env.js';
export const pool = mysql.createPool(config.db);
export async function databaseReady() {
  try {
    await pool.query('SELECT 1 FROM users LIMIT 1');
    return true;
  } catch {
    return false;
  }
}
export async function query(sql, args = []) {
  try {
    const [rows] = await pool.execute(sql, args);
    return rows;
  } catch (error) {
    if (
      [
        'ECONNREFUSED',
        'ER_NO_SUCH_TABLE',
        'ER_ACCESS_DENIED_ERROR',
        'ETIMEDOUT',
        'ENOTFOUND',
      ].includes(error.code)
    ) {
      const e = new Error('Database unavailable. Configure MySQL and run npm run db:setup.');
      e.status = 503;
      throw e;
    }
    throw error;
  }
}
