import { beforeAll, afterAll, it, expect } from 'vitest';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { attachRooms } from '../src/sockets/rooms.js';
import { pool } from '../src/config/db.js';
let http, io, manager, url;
const clients = [];
const emit = (s, event, payload = {}) =>
  new Promise((resolve) =>
    s
      .timeout(2000)
      .emit(event, payload, (err, r) => resolve(err ? { ok: false, error: err.message } : r))
  );
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function client(cookie) {
  if (!cookie) {
    const r = await fetch(`${url}/api/session`, { method: 'POST' });
    cookie = r.headers.get('set-cookie').split(';')[0];
  }
  const s = connect(url, { extraHeaders: { cookie }, forceNew: true, reconnection: false });
  await new Promise((yes, no) => {
    s.once('connect', yes);
    s.once('connect_error', no);
  });
  s.cookie = cookie;
  clients.push(s);
  return s;
}
beforeAll(async () => {
  http = createServer(createApp());
  io = new Server(http);
  manager = attachRooms(io, { persist: async () => {}, graceMs: 300 });
  await new Promise((r) => http.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${http.address().port}`;
});
afterAll(async () => {
  clients.forEach((s) => s.disconnect());
  manager.close();
  await new Promise((r) => io.close(r));
  await pool.end();
});
async function room(gameId = 'tictactoe') {
  const a = await client(),
    b = await client();
  const r = await emit(a, 'room:create', { gameId });
  expect(r.ok).toBe(true);
  expect(r.code).toMatch(/^[A-Z2-9]{6}$/);
  expect((await emit(b, 'room:join', { code: r.code })).ok).toBe(true);
  await emit(a, 'room:ready', { ready: true });
  await emit(b, 'room:ready', { ready: true });
  return { a, b, code: r.code };
}
it('creates, joins, prevents duplicate identities and rejects a third player', async () => {
  const { a, code } = await room();
  const third = await client();
  expect((await emit(third, 'room:join', { code })).error).toContain('full');
  const duplicate = await client(a.cookie);
  expect((await emit(duplicate, 'room:join', { code })).ok).toBe(false);
  await emit(a, 'room:leave');
});
it('requires two ready players and restricts the host', async () => {
  const a = await client(),
    b = await client(),
    r = await emit(a, 'room:create', { gameId: 'tictactoe' });
  expect((await emit(a, 'room:start')).ok).toBe(false);
  await emit(b, 'room:join', { code: r.code });
  expect((await emit(b, 'room:start')).error).toContain('host');
  await emit(a, 'room:leave');
});
it('synchronizes authoritative turns, invalid moves, wins and mutual rematches', async () => {
  const { a, b } = await room();
  let latest;
  b.on('room:state', (r) => (latest = r));
  expect((await emit(a, 'room:start')).ok).toBe(true);
  expect((await emit(a, 'game:move', { index: 0 })).error).toContain('countdown');
  await delay(3100);
  expect((await emit(b, 'game:move', { index: 4 })).error).toContain('turn');
  for (const [s, i] of [
    [a, 0],
    [b, 3],
    [a, 1],
    [b, 4],
    [a, 2],
  ])
    expect((await emit(s, 'game:move', { index: i })).ok).toBe(true);
  await delay(50);
  expect(latest.game.winner).toBe(0);
  expect(latest.status).toBe('finished');
  const first = latest.matchId;
  await emit(a, 'game:rematch-vote');
  expect((await emit(a, 'room:sync')).room.status).toBe('finished');
  await emit(b, 'game:rematch-vote');
  const second = await emit(a, 'room:sync');
  expect(second.room.matchId).not.toBe(first);
  expect(second.room.game.board.every((x) => x === null)).toBe(true);
  await emit(a, 'room:leave');
});
it('reconnects the same session and pauses until it returns', async () => {
  const { a, b } = await room();
  await emit(a, 'room:start');
  await delay(3100);
  const cookie = b.cookie;
  b.disconnect();
  await delay(40);
  expect((await emit(a, 'game:move', { index: 0 })).error).toContain('reconnect');
  const restored = await client(cookie);
  const r = await emit(restored, 'room:sync');
  expect(r.slot).toBe(1);
  expect(r.room.players.every((p) => p.connected)).toBe(true);
  expect((await emit(a, 'game:move', { index: 0 })).ok).toBe(true);
  await emit(a, 'room:leave');
});
it('expires disconnected rooms without timer leaks', async () => {
  const { a, b, code } = await room();
  await emit(a, 'room:start');
  b.disconnect();
  await delay(450);
  expect(manager.rooms.has(code)).toBe(false);
});
it('rejects malformed payloads and forged winner or input declarations', async () => {
  const { a } = await room('pong');
  expect((await emit(a, 'room:start')).ok).toBe(true);
  expect((await emit(a, 'game:input', { up: true, winner: 0 })).ok).toBe(false);
  expect((await emit(a, 'game:move', { index: 0 })).ok).toBe(false);
  await emit(a, 'room:leave');
});
it.each(['connectfive', 'pong', 'tank', 'bomber', 'racing', 'gravity'])(
  'runs %s in a real two-client room',
  async (gameId) => {
    const { a, b } = await room(gameId);
    await emit(a, 'room:start');
    if (gameId === 'connectfive') {
      await delay(3100);
      for (let x = 0; x < 4; x++) {
        await emit(a, 'game:move', { index: x });
        await emit(b, 'game:move', { index: 15 + x });
      }
      await emit(a, 'game:move', { index: 4 });
      expect((await emit(b, 'room:sync')).room.game.winner).toBe(0);
    } else {
      let snapshot;
      const listener = (p) => (snapshot = p);
      b.on('game:state', listener);
      await emit(a, 'game:input', {
        up: true,
        down: false,
        left: false,
        right: false,
        action: true,
      });
      await delay(120);
      expect(snapshot.state.gameId).toBe(gameId);
      expect(snapshot.state.time).toBeGreaterThan(0);
      const sync = await emit(a, 'room:sync');
      expect(sync.room.game.time).toBeGreaterThanOrEqual(snapshot.state.time);
      b.off('game:state', listener);
    }
    await emit(a, 'room:leave');
  }
);

// Arrange authoritative near-finish states, then let the actual server tick and
// socket events finish the match. Clients never submit score/winner data.
it.each(['pong', 'tank', 'bomber', 'racing', 'gravity'])(
  'broadcasts a server-owned %s finish and starts a clean rematch',
  async (gameId) => {
    const { a, b, code } = await room(gameId);
    await emit(a, 'room:start');
    const s = manager.rooms.get(code).game;
    s.countdown = 0;
    if (gameId === 'pong') {
      s.scores[0] = 6;
      s.ball.x = 810;
    }
    if (gameId === 'tank') {
      s.players[1].hp = 1;
      s.bullets = [{ x: s.players[1].x, y: s.players[1].y, vx: 0, vy: 0, owner: 0, ttl: 1 }];
    }
    if (gameId === 'bomber') s.bombs = [{ x: 13, y: 9, ttl: 0, owner: 0 }];
    if (gameId === 'racing')
      Object.assign(s.players[0], { x: 400, y: 90, checkpoint: 3, laps: 2, speed: 0 });
    if (gameId === 'gravity') {
      s.players[0].y = 63;
      s.players[0].gravity = -1;
      s.obstacles = [{ id: 0, x: 160, w: 44, h: 70, side: 0, passed: [false, false] }];
    }
    await delay(100);
    const x = await emit(a, 'room:sync'),
      y = await emit(b, 'room:sync');
    expect(x.room.status).toBe('finished');
    expect(x.room.game.winner).toBe(0);
    expect(y.room.game).toEqual(x.room.game);
    await emit(a, 'game:rematch-vote');
    await emit(b, 'game:rematch-vote');
    const next = await emit(a, 'room:sync');
    expect(next.room.status).toBe('playing');
    expect(next.room.matchId).not.toBe(x.room.matchId);
    expect(next.room.game.finished).toBe(false);
    expect(next.room.game.scores).toEqual([0, 0]);
    await emit(a, 'room:leave');
  }
);
