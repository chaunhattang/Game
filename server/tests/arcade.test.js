import { describe, it, expect } from 'vitest';
import { createArcade, stepArcade, TICK } from '../../shared/arcade.js';
const run = (s, n, inputs = [{}, {}]) => {
  for (let i = 0; i < n; i++) stepArcade(s, inputs);
};
describe('fixed-step arcade simulations', () => {
  it('counts down before movement', () => {
    const s = createArcade('pong');
    const y = s.players[0].y;
    run(s, 120, [{ up: true }, {}]);
    expect(s.players[0].y).toBe(y);
    expect(s.countdown).toBeGreaterThan(0);
  });
  it('Pong clamps paddles, bounces on walls and accelerates paddle hits', () => {
    const s = createArcade('pong');
    s.countdown = 0;
    run(s, 60, [{ up: true }, {}]);
    expect(s.players[0].y).toBe(50);
    s.ball = { x: 400, y: 7, vx: 100, vy: -100 };
    stepArcade(s);
    expect(s.ball.vy).toBeGreaterThan(0);
    s.ball = { x: 42, y: 50, vx: -300, vy: 0 };
    stepArcade(s);
    expect(s.ball.vx).toBeGreaterThan(300);
  });
  it('Pong ends at seven, with server-owned score', () => {
    const s = createArcade('pong');
    s.countdown = 0;
    s.scores[0] = 6;
    s.ball.x = 810;
    stepArcade(s);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    expect(s.scores[0]).toBe(7);
  });
  it('Tank walls block movement and bullets; three hits win', () => {
    const s = createArcade('tank');
    s.countdown = 0;
    s.players[0].x = 170;
    s.players[0].y = 120;
    run(s, 30, [{ up: true }, {}]);
    expect(s.players[0].x).toBeLessThan(176);
    s.bullets = [{ x: 187, y: 120, vx: 400, vy: 0, owner: 0, ttl: 1 }];
    stepArcade(s);
    expect(s.bullets.length).toBe(0);
    for (let i = 0; i < 3; i++) {
      s.bullets = [{ ...s.players[1], vx: 0, vy: 0, owner: 0, ttl: 1 }];
      stepArcade(s);
    }
    expect(s.winner).toBe(0);
    expect(s.players[1].hp).toBe(0);
  });
  it('Tank limits fire rate and arena bounds', () => {
    const s = createArcade('tank');
    s.countdown = 0;
    s.players[0].x = 20;
    s.players[0].a = Math.PI;
    run(s, 30, [{ up: true, action: true }, {}]);
    expect(s.players[0].x).toBeGreaterThanOrEqual(14);
    expect(s.bullets.length).toBeLessThanOrEqual(2);
  });
  it('Bomber blocks movement through walls and detonates after the fuse', () => {
    const s = createArcade('bomber');
    s.countdown = 0;
    run(s, 10, [{ up: true }, {}]);
    expect(s.players[0].y).toBe(1);
    stepArcade(s, [{ action: true }, {}]);
    expect(s.bombs).toHaveLength(1);
    run(s, 100);
    expect(s.finished).toBe(false);
    run(s, 21);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(1);
  });
  it('Bomber blast destroys one crate and stops at the wall', () => {
    const s = createArcade('bomber');
    s.countdown = 0;
    s.tiles[1 * 15 + 2] = 2;
    s.tiles[1 * 15 + 3] = 2;
    s.bombs = [{ x: 1, y: 1, ttl: 0, owner: 0 }];
    stepArcade(s);
    expect(s.tiles[17]).toBe(0);
    expect(s.tiles[18]).toBe(2);
    expect(s.blasts.some((b) => b.x === 0)).toBe(false);
  });
  it('Bomber simultaneous eliminations draw', () => {
    const s = createArcade('bomber');
    s.countdown = 0;
    s.bombs = [
      { x: 1, y: 1, ttl: 0, owner: 0 },
      { x: 13, y: 9, ttl: 0, owner: 1 },
    ];
    stepArcade(s);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(null);
  });
  it('Racing requires ordered checkpoints and three complete laps', () => {
    const s = createArcade('racing');
    s.countdown = 0;
    const p = s.players[0];
    p.x = 400;
    p.y = 80;
    stepArcade(s);
    expect(p.laps).toBe(0);
    for (let lap = 0; lap < 3; lap++)
      for (const [x, y] of [
        [700, 250],
        [400, 400],
        [100, 250],
        [400, 90],
      ]) {
        p.x = x;
        p.y = y;
        p.speed = 0;
        stepArcade(s);
      }
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    expect(p.laps).toBe(3);
  });
  it('Racing off-road drag slows cars and bounds hold', () => {
    const s = createArcade('racing');
    s.countdown = 0;
    Object.assign(s.players[0], { x: 300, y: 250, speed: 200, a: 0 });
    stepArcade(s, [{ up: true }, {}]);
    expect(s.players[0].speed).toBeLessThanOrEqual(95);
    Object.assign(s.players[0], { x: 799, y: 490, speed: 290 });
    stepArcade(s);
    expect(s.players[0].x).toBeLessThanOrEqual(780);
    expect(s.players[0].y).toBeLessThanOrEqual(480);
  });
  it.each(['pong', 'tank', 'bomber', 'racing'])('%s is deterministic for the same inputs', (id) => {
    const a = createArcade(id, 17),
      b = createArcade(id, 17);
    run(a, 500, [
      { up: true, right: true, action: true },
      { down: true, left: true, action: true },
    ]);
    run(b, 500, [
      { up: true, right: true, action: true },
      { down: true, left: true, action: true },
    ]);
    expect(a).toEqual(b);
    expect(a.time).toBeCloseTo(Math.min(500 * TICK, a.time));
  });
});
