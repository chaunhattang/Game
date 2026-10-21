import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';
export const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 12,
};
const revoked = new Map();
export function issueSession(res, user) {
  const identity = { sid: randomUUID(), userId: user?.id || null, name: user?.username || 'Guest' };
  res.cookie(
    'arena_session',
    jwt.sign(identity, config.secret, { expiresIn: '12h' }),
    cookieOptions
  );
  return identity;
}
export function verifySession(token) {
  try {
    const s = jwt.verify(token, config.secret);
    if (revoked.has(s.sid)) return null;
    return s;
  } catch {
    return null;
  }
}
export function session(req, res, next) {
  req.identity = verifySession(req.cookies.arena_session);
  next();
}
export function requireAuth(req, res, next) {
  if (!req.identity?.userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}
export function revokeSession(identity) {
  if (identity) revoked.set(identity.sid, identity.exp * 1000);
  for (const [key, expiry] of revoked) if (expiry < Date.now()) revoked.delete(key);
}
