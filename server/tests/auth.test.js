import { beforeAll, afterAll, it, expect, describe } from 'vitest';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { saveResult } from '../src/repositories/results.js';
const enabled = process.env.ARENA_TEST_DB === '1';
describe.skipIf(!enabled)('real MySQL account and persistence integration', () => {
  let http, url, cookie, user;
  const suffix = Date.now().toString(36),
    password = 'Testing-only-1234';
  const request = async (path, body, method = 'POST', auth = cookie) => {
    const r = await fetch(url + path, {
      method,
      headers: { 'content-type': 'application/json', ...(auth ? { cookie: auth } : {}) },
      ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}),
    });
    return {
      status: r.status,
      json: await r.json(),
      cookie: r.headers.get('set-cookie')?.split(';')[0],
    };
  };
  beforeAll(async () => {
    http = createServer(createApp());
    await new Promise((r) => http.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${http.address().port}/api`;
  });
  afterAll(async () => {
    await new Promise((r) => http.close(r));
    await pool.end();
  });
  it('registers an account and issues an HttpOnly cookie', async () => {
    const r = await request('/auth/register', {
      username: `tester_${suffix}`,
      email: `${suffix}@arena.test`,
      password,
      confirmPassword: password,
    });
    expect(r.status).toBe(201);
    cookie = r.cookie;
    user = r.json.data;
    expect(user.password_hash).toBeUndefined();
    expect(cookie).toContain('arena_session=');
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id=?', [user.id]);
    expect(rows[0].password_hash).not.toBe(password);
  });
  it('rejects duplicate and invalid registration', async () => {
    expect(
      (
        await request('/auth/register', {
          username: `tester_${suffix}`,
          email: `${suffix}@arena.test`,
          password,
          confirmPassword: password,
        })
      ).status
    ).toBe(409);
    expect(
      (
        await request('/auth/register', {
          username: 'x',
          email: 'bad',
          password: 'short',
          confirmPassword: 'different',
        })
      ).status
    ).toBe(400);
  });
  it('rejects wrong credentials and supports email and username login', async () => {
    expect(
      (await request('/auth/login', { identifier: `${suffix}@arena.test`, password: 'incorrect' }))
        .status
    ).toBe(401);
    for (const identifier of [`${suffix}@arena.test`, `tester_${suffix}`]) {
      const r = await request('/auth/login', { identifier, password });
      expect(r.status).toBe(200);
      cookie = r.cookie;
    }
    expect((await request('/auth/me', null, 'GET')).json.data.id).toBe(user.id);
  });
  it('authorizes profile editing and hides sensitive fields', async () => {
    expect((await request('/users/me', null, 'GET', '')).status).toBe(401);
    const r = await request('/users/me', { username: `updated_${suffix}` }, 'PATCH');
    expect(r.status).toBe(200);
    expect(r.json.data.username).toBe(`updated_${suffix}`);
    expect(r.json.data.password_hash).toBeUndefined();
  });
  it('transactionally persists a match exactly once and serves history and rankings', async () => {
    const r = {
      matchId: randomUUID(),
      code: 'TEST23',
      gameId: 'tictactoe',
      startedAt: Date.now(),
      players: [{ userId: user.id }, { userId: null }],
      game: { winner: 0, scores: [1, 0] },
    };
    await Promise.all([saveResult(r), saveResult(r)]);
    const stats = (await request(`/users/${user.id}/stats`, null, 'GET')).json.data;
    expect(stats[0].wins).toBe(1);
    expect(stats[0].matches_played).toBe(1);
    const history = (await request('/users/me/matches', null, 'GET')).json.data;
    expect(history.filter((m) => m.id === r.matchId)).toHaveLength(1);
    expect(
      (await request('/leaderboard/tictactoe', null, 'GET')).json.data.some((p) => p.id === user.id)
    ).toBe(true);
    expect((await request(`/matches/${r.matchId}`, null, 'GET')).json.data.players).toHaveLength(1);
  });
  it('rejects CSRF origins and revokes logged-out sessions', async () => {
    const response = await fetch(url + '/users/me', {
      method: 'PATCH',
      headers: { cookie, origin: 'https://untrusted.test', 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'bad' }),
    });
    expect(response.status).toBe(403);
    await request('/auth/logout');
    expect((await request('/auth/me', null, 'GET')).status).toBe(401);
  });
});
