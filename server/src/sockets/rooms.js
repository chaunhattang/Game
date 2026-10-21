import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getGame, isBoard } from '../../../shared/catalog.js';
import { createBoard, moveBoard } from '../../../shared/board.js';
import { createArcade, stepArcade, TICK } from '../../../shared/arcade.js';
import { verifySession } from '../middleware/auth.js';
import { saveResult } from '../repositories/results.js';
import { query } from '../config/db.js';
const codeSchema = z.string().regex(/^[A-Z2-9]{6}$/);
const gameSchema = z.string().refine((id) => !!getGame(id)?.active, 'Unknown game.');
const inputSchema = z
  .object({
    up: z.boolean(),
    down: z.boolean(),
    left: z.boolean(),
    right: z.boolean(),
    action: z.boolean(),
  })
  .strict();
export function attachRooms(io, { persist = saveResult, graceMs = 30000 } = {}) {
  const rooms = new Map(),
    pendingResults = new Map();
  const persistenceTasks = new Set();
  let frame = 0;
  const safeRoom = (r) => ({
    code: r.code,
    gameId: r.gameId,
    host: 0,
    status: r.status,
    game: r.game,
    rematch: [...r.rematch],
    resultSaved: r.resultSaved,
    players: r.players.map((p, slot) => ({
      slot,
      name: p.name,
      connected: p.connected,
      ready: p.ready,
      registered: !!p.userId,
    })),
    matchId: r.matchId || null,
  });
  const broadcast = (r) => io.to(r.code).emit('room:state', safeRoom(r));
  const error = (message) => {
    throw new Error(message);
  };
  function occupied(identity) {
    return [...rooms.values()].find((r) =>
      r.players.some(
        (p) => p.sid === identity.sid || (identity.userId && p.userId === identity.userId)
      )
    );
  }
  function member(socket) {
    const r = rooms.get(socket.data.roomCode);
    if (!r) error('Join a room first.');
    const slot = r.players.findIndex((p) => p.sid === socket.data.identity.sid);
    if (slot < 0 || r.players[slot].socketId !== socket.id)
      error('You do not control this player.');
    return [r, slot];
  }
  function updatePersistence(matchId, value) {
    for (const r of rooms.values())
      if (r.matchId === matchId) {
        r.resultSaved = value;
        broadcast(r);
      }
  }
  async function record(entry) {
    try {
      await persist(entry.room, entry.reason);
      pendingResults.delete(entry.room.matchId);
      updatePersistence(entry.room.matchId, true);
    } catch (e) {
      entry.attempts++;
      entry.next = Date.now() + Math.min(60000, 1000 * 2 ** entry.attempts);
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'result_persistence_failed',
          matchId: entry.room.matchId,
          code: e.code || e.name,
        })
      );
      updatePersistence(entry.room.matchId, false);
    }
  }
  function queueRecord(entry) {
    const task = record(entry);
    persistenceTasks.add(task);
    void task.finally(() => persistenceTasks.delete(task));
    return task;
  }
  function finish(r, reason = 'completed') {
    if (r.status === 'finished') return;
    r.status = 'finished';
    r.rematch = [];
    r.inputs = [{}, {}];
    if (r.players.some((p) => p.userId)) {
      const entry = { room: structuredClone(r), reason, attempts: 0, next: Infinity };
      pendingResults.set(r.matchId, entry);
      void queueRecord(entry);
    } else r.resultSaved = null;
    io.to(r.code).emit('game:finished', r.game);
    broadcast(r);
  }
  function start(r) {
    if (r.players.length !== 2 || !r.players.every((p) => p.connected && p.ready))
      error('Both players must be connected and ready.');
    r.game = isBoard(r.gameId)
      ? createBoard(r.gameId)
      : createArcade(r.gameId, randomBytes(2).readUInt16BE());
    if (isBoard(r.gameId)) r.game.countdown = 3;
    r.status = 'playing';
    r.matchId = randomUUID();
    r.startedAt = Date.now();
    r.rematch = [];
    r.resultSaved = null;
    r.inputs = [{}, {}];
    r.inputAt = [0, 0];
    r.players.forEach((p) => (p.ready = false));
    io.to(r.code).emit('game:started', { matchId: r.matchId });
    broadcast(r);
  }
  function close(r) {
    io.to(r.code).emit('room:closed', { message: 'Room closed.' });
    io.in(r.code).socketsLeave(r.code);
    rooms.delete(r.code);
    void query('UPDATE room_history SET closed_at=NOW() WHERE room_code=? AND closed_at IS NULL', [
      r.code,
    ]).catch(() => {});
  }
  function leave(socket, explicit) {
    const r = rooms.get(socket.data.roomCode);
    if (!r) return;
    const slot = r.players.findIndex((p) => p.socketId === socket.id);
    if (slot < 0) return;
    const p = r.players[slot];
    p.connected = false;
    p.disconnectedAt = explicit ? Date.now() - graceMs : Date.now();
    p.ready = false;
    r.inputs = [{}, {}];
    socket.leave(r.code);
    socket.data.roomCode = null;
    if (explicit) {
      if (r.status === 'playing') {
        r.game.finished = true;
        r.game.winner = 1 - slot;
        finish(r, 'forfeit');
      }
      close(r);
    } else {
      io.to(r.code).emit('player:disconnected', { slot, graceMs });
      broadcast(r);
    }
  }
  io.use((socket, next) => {
    const token = socket.handshake.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('arena_session='))
      ?.slice(14);
    const identity = verifySession(token);
    if (!identity) return next(new Error('Session expired. Refresh the page.'));
    socket.data.identity = identity;
    socket.data.token = token;
    next();
  });
  io.on('connection', (socket) => {
    const register = (event, schema, fn, limit = 20) => {
      socket.on(event, (payload, ack) => {
        try {
          if (!verifySession(socket.data.token)) {
            socket.disconnect();
            return;
          }
          const now = Date.now();
          socket.data.rates ??= {};
          const rate = (socket.data.rates[event] ??= { at: now, count: 0 });
          if (now - rate.at > 1000) {
            rate.at = now;
            rate.count = 0;
          }
          if (++rate.count > limit) error('Please slow down.');
          const data = schema.parse(payload);
          const value = fn(data);
          if (typeof ack === 'function') ack({ ok: true, ...value });
        } catch (e) {
          const message = e.name === 'ZodError' ? 'Invalid event payload.' : e.message;
          if (typeof ack === 'function') ack({ ok: false, error: message });
          else socket.emit('server:error', { message });
        }
      });
    };
    const id = socket.data.identity,
      existing = occupied(id);
    if (existing) {
      const p = existing.players.find(
        (p) => p.sid === id.sid || (id.userId && p.userId === id.userId)
      );
      if (!p.connected && Date.now() - (p.disconnectedAt || 0) < graceMs) {
        p.sid = id.sid;
        p.socketId = socket.id;
        p.connected = true;
        p.disconnectedAt = null;
        socket.data.roomCode = existing.code;
        socket.join(existing.code);
        socket.emit('room:resumed', { code: existing.code });
        io.to(existing.code).emit('player:reconnected', {});
        broadcast(existing);
      }
    }
    register(
      'room:create',
      z.object({ gameId: gameSchema }),
      ({ gameId }) => {
        if (occupied(id)) error('You already occupy a room. Leave it before creating another.');
        if (rooms.size >= 500) error('Arena is busy. Try again soon.');
        let code;
        do {
          code = Array.from(randomBytes(6), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(
            ''
          );
        } while (rooms.has(code));
        const r = {
          code,
          gameId,
          players: [
            {
              sid: id.sid,
              userId: id.userId,
              name: id.name === 'Guest' ? `Guest ${code.slice(0, 2)}` : id.name,
              socketId: socket.id,
              connected: true,
              ready: false,
            },
          ],
          status: 'waiting',
          game: null,
          rematch: [],
          createdAt: Date.now(),
          inputs: [{}, {}],
          inputAt: [0, 0],
        };
        rooms.set(code, r);
        socket.data.roomCode = code;
        socket.join(code);
        broadcast(r);
        void query('INSERT INTO room_history (room_code,game_id,host_user_id) VALUES (?,?,?)', [
          code,
          gameId,
          id.userId,
        ]).catch(() => {});
        return { code, room: safeRoom(r) };
      },
      3
    );
    register(
      'room:join',
      z.object({ code: codeSchema }),
      ({ code }) => {
        const r = rooms.get(code);
        if (!r) error('Room not found or expired.');
        const current = occupied(id);
        if (current) {
          if (current === r && socket.data.roomCode === code) return { code, room: safeRoom(r) };
          error('You already occupy a room in another connection.');
        }
        if (r.players.length >= 2) error('This room is full.');
        if (r.status !== 'waiting') error('This match has already started.');
        r.players.push({
          sid: id.sid,
          userId: id.userId,
          name: id.name === 'Guest' ? `Guest ${code.slice(2, 4)}` : id.name,
          socketId: socket.id,
          connected: true,
          ready: false,
        });
        socket.data.roomCode = code;
        socket.join(code);
        broadcast(r);
        return { code, room: safeRoom(r) };
      },
      5
    );
    register('room:sync', z.object({}), () => {
      const [r, slot] = member(socket);
      return { room: safeRoom(r), slot };
    });
    register('room:leave', z.object({}), () => {
      leave(socket, true);
      return {};
    });
    register('room:ready', z.object({ ready: z.boolean() }), ({ ready }) => {
      const [r, slot] = member(socket);
      if (r.status !== 'waiting') error('Readiness is locked during a match.');
      r.players[slot].ready = ready;
      broadcast(r);
    });
    register('room:select', z.object({ gameId: gameSchema }), ({ gameId }) => {
      const [r, slot] = member(socket);
      if (slot !== 0 || r.status !== 'waiting')
        error('Only the host can select a game in the lobby.');
      r.gameId = gameId;
      r.players.forEach((p) => (p.ready = false));
      broadcast(r);
    });
    register('room:start', z.object({}), () => {
      const [r, slot] = member(socket);
      if (slot !== 0) error('Only the host can start.');
      if (r.status !== 'waiting') error('Match already started.');
      start(r);
    });
    register('game:move', z.object({ index: z.number().int().min(0).max(224) }), ({ index }) => {
      const [r, slot] = member(socket);
      if (r.status !== 'playing' || !isBoard(r.gameId)) error('No active board match.');
      if (!r.players.every((p) => p.connected)) error('Waiting for your opponent to reconnect.');
      if (r.game.countdown > 0) error('Wait for the countdown.');
      moveBoard(r.game, slot, index);
      if (r.game.finished) finish(r);
      else broadcast(r);
    });
    register(
      'game:input',
      inputSchema,
      (input) => {
        const [r, slot] = member(socket);
        if (r.status !== 'playing' || isBoard(r.gameId)) return;
        if (!r.players.every((p) => p.connected)) return;
        r.inputs[slot] = input;
        r.inputAt[slot] = Date.now();
      },
      60
    );
    register('game:rematch-vote', z.object({}), () => {
      const [r, slot] = member(socket);
      if (r.status !== 'finished') error('Finish the match first.');
      if (!r.rematch.includes(slot)) r.rematch.push(slot);
      if (r.rematch.length === 2) {
        r.players.forEach((p) => (p.ready = true));
        start(r);
      } else broadcast(r);
    });
    socket.on('disconnect', () => leave(socket, false));
  });
  let lastTick = performance.now(),
    accumulator = 0;
  const tick = setInterval(() => {
    const now = Date.now();
    const monotonicNow = performance.now();
    accumulator += Math.min((monotonicNow - lastTick) / 1000, 0.1);
    lastTick = monotonicNow;
    const steps = Math.floor(accumulator / TICK);
    accumulator -= steps * TICK;
    for (const r of rooms.values()) {
      const expired = r.players.findIndex((p) => !p.connected && now - p.disconnectedAt >= graceMs);
      if (expired >= 0) {
        if (r.status === 'playing') {
          r.game.finished = true;
          r.game.winner = r.players[1 - expired]?.connected ? 1 - expired : null;
          finish(r, 'forfeit');
        }
        close(r);
        continue;
      }
      if (now - r.createdAt > 2 * 60 * 60 * 1000) {
        close(r);
        continue;
      }
      if (
        r.status === 'playing' &&
        isBoard(r.gameId) &&
        r.game.countdown > 0 &&
        r.players.every((p) => p.connected)
      ) {
        const before = Math.ceil(r.game.countdown);
        r.game.countdown = Math.max(0, r.game.countdown - steps * TICK);
        if (Math.ceil(r.game.countdown) !== before) broadcast(r);
      }
      if (r.status === 'playing' && !isBoard(r.gameId) && r.players.every((p) => p.connected)) {
        const input = r.inputs.map((k, i) => (now - r.inputAt[i] > 300 ? {} : k));
        for (let step = 0; step < steps; step++) stepArcade(r.game, input, TICK);
        if (r.game.finished) finish(r);
        else if (Math.floor((frame + steps) / 3) > Math.floor(frame / 3))
          io.to(r.code).emit('game:state', { state: r.game, sequence: frame + steps });
      }
    }
    for (const entry of pendingResults.values())
      if (entry.next <= now) {
        entry.next = Infinity;
        void queueRecord(entry);
      }
    frame += steps;
  }, 1000 / 60);
  tick.unref();
  return {
    rooms,
    pendingResults,
    close: () => clearInterval(tick),
    async drain() {
      for (const entry of pendingResults.values()) {
        if (entry.next !== Infinity) {
          entry.next = Infinity;
          void queueRecord(entry);
        }
      }
      await Promise.allSettled([...persistenceTasks]);
    },
  };
}
