import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { games, getGame } from '../../../shared/catalog.js';
import { query, databaseReady } from '../config/db.js';
import { issueSession, requireAuth, revokeSession, cookieOptions } from '../middleware/auth.js';
export const api = Router();
const parse = (schema, data) => schema.parse(data);
const publicUser = 'id, username, email, avatar_url, created_at';
const passwordSchema = z
  .string()
  .max(72)
  .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.');
const registration = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: passwordSchema.refine(
      (s) => s.length >= 8,
      'Password must be at least 8 characters.'
    ),
    confirmPassword: z.string().max(72),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });
const login = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: passwordSchema.refine((s) => s.length > 0),
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
api.get('/health', async (req, res) => {
  const database = await databaseReady();
  res.json({
    data: {
      status: database ? 'ok' : 'degraded',
      database: database ? 'connected' : 'unavailable',
      realtime: 'ready',
    },
  });
});
api.post('/session', (req, res) => {
  if (!req.identity) req.identity = issueSession(res, null);
  res.json({ data: { name: req.identity.name, authenticated: !!req.identity.userId } });
});
api.post('/auth/register', authLimiter, async (req, res) => {
  const input = parse(registration, req.body);
  const hash = await bcrypt.hash(input.password, 12);
  try {
    const r = await query('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)', [
      input.username,
      input.email,
      hash,
    ]);
    const user = (await query(`SELECT ${publicUser} FROM users WHERE id=?`, [r.insertId]))[0];
    revokeSession(req.identity);
    issueSession(res, user);
    res.status(201).json({ data: user });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      e.status = 409;
      e.message = 'Username or email already in use.';
    }
    throw e;
  }
});
const dummyHash = await bcrypt.hash('constant-time-comparison-only', 12);
api.post('/auth/login', authLimiter, async (req, res) => {
  const v = parse(login, req.body),
    users = await query('SELECT * FROM users WHERE email=? OR username=?', [
      v.identifier,
      v.identifier,
    ]);
  const user = users[0];
  const valid = await bcrypt.compare(v.password, user?.password_hash || dummyHash);
  if (!user || !valid) return res.status(401).json({ error: 'Invalid credentials.' });
  revokeSession(req.identity);
  issueSession(res, user);
  delete user.password_hash;
  res.json({ data: user });
});
api.post('/auth/logout', (req, res) => {
  revokeSession(req.identity);
  res.clearCookie('arena_session', cookieOptions);
  res.json({ data: { loggedOut: true } });
});
api.get(['/auth/me', '/users/me'], requireAuth, async (req, res) => {
  const user = (
    await query(`SELECT ${publicUser} FROM users WHERE id=?`, [req.identity.userId])
  )[0];
  if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json({ data: user });
});
api.patch('/users/me', requireAuth, async (req, res) => {
  const v = parse(
    z.object({
      username: z
        .string()
        .trim()
        .min(3)
        .max(24)
        .regex(/^[a-zA-Z0-9_]+$/),
    }),
    req.body
  );
  try {
    await query('UPDATE users SET username=? WHERE id=?', [v.username, req.identity.userId]);
    res.json({
      data: (await query(`SELECT ${publicUser} FROM users WHERE id=?`, [req.identity.userId]))[0],
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      e.status = 409;
      e.message = 'Username is already in use.';
    }
    throw e;
  }
});
api.get('/games', (req, res) => res.json({ data: games }));
api.get('/games/:slug', (req, res) => {
  const game = getGame(req.params.slug);
  res.status(game ? 200 : 404).json(game ? { data: game } : { error: 'Game not found.' });
});
const numericId = z.coerce.number().int().positive();
api.get('/users/:id/stats', async (req, res) => {
  const id = parse(numericId, req.params.id);
  res.json({ data: await query('SELECT * FROM player_stats WHERE user_id=?', [id]) });
});
api.get('/users/me/matches', requireAuth, async (req, res) =>
  res.json({
    data: await query(
      'SELECT m.*,mp.result,mp.score FROM matches m JOIN match_players mp ON mp.match_id=m.id WHERE mp.user_id=? ORDER BY m.finished_at DESC LIMIT 50',
      [req.identity.userId]
    ),
  })
);
api.get('/matches', async (req, res) =>
  res.json({
    data: await query(
      'SELECT id,game_id,status,started_at,finished_at,winner_id FROM matches ORDER BY finished_at DESC LIMIT 50'
    ),
  })
);
api.get('/matches/:id', async (req, res) => {
  const id = parse(z.uuid(), req.params.id),
    rows = await query(
      'SELECT id,game_id,status,started_at,finished_at,winner_id FROM matches WHERE id=?',
      [id]
    );
  if (!rows.length) return res.status(404).json({ error: 'Match not found.' });
  const players = await query(
    'SELECT u.username,mp.player_slot,mp.score,mp.result FROM match_players mp JOIN users u ON u.id=mp.user_id WHERE mp.match_id=?',
    [id]
  );
  res.json({ data: { ...rows[0], players } });
});
async function leaderboard(req, res) {
  const id = req.params.gameId;
  if (id && !getGame(id)) return res.status(404).json({ error: 'Game not found.' });
  const rows = await query(
    `SELECT u.id,u.username,u.avatar_url,SUM(s.wins) wins,SUM(s.matches_played) total_games,ROUND(SUM(s.wins)*100/NULLIF(SUM(s.matches_played),0),1) win_rate,SUM(s.rating-1000)+1000 rating FROM player_stats s JOIN users u ON u.id=s.user_id ${id ? 'WHERE s.game_id=?' : ''} GROUP BY u.id ORDER BY wins DESC,win_rate DESC,u.id LIMIT 100`,
    id ? [id] : []
  );
  res.json({ data: rows });
}
api.get('/leaderboard', leaderboard);
api.get('/leaderboard/:gameId', leaderboard);
