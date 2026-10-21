import { describe, it, expect } from 'vitest';
import { createArcade, stepArcade } from '../../shared/arcade.js';
import { gravityLanes } from '../../shared/gravity.js';
const run = (s, n, keys = [{}, {}]) => {
  for (let i = 0; i < n; i++) stepArcade(s, keys);
};
const fresh = () => {
  const s = createArcade('gravity', 42);
  s.countdown = 0;
  return s;
};
describe('Gravity Duel authoritative simulation', () => {
  it('freezes inputs and spawning during countdown', () => {
    const s = createArcade('gravity');
    run(s, 100, [{ action: true }, {}]);
    expect(s.players[0].gravity).toBe(1);
    expect(s.obstacles).toHaveLength(0);
  });
  it('flips on a press edge, not on repeat or a held button', () => {
    const s = fresh();
    run(s, 30, [{ action: true }, {}]);
    expect(s.players[0].gravity).toBe(-1);
    expect(s.players[0].y).toBeLessThan(150);
    stepArcade(s, [{}, {}]);
    stepArcade(s, [{ action: true }, {}]);
    expect(s.players[0].gravity).toBe(1);
  });
  it('accepts the up alternative and keeps both players inside their lanes', () => {
    const s = fresh();
    s.spawnIn = 1000;
    run(s, 200, [
      { up: true, left: true },
      { action: true, right: true },
    ]);
    expect(s.players[0].x).toBe(62);
    expect(s.players[1].x).toBe(710);
    s.players.forEach((p, i) => {
      expect(p.y).toBe(gravityLanes[i].top + 15);
    });
  });
  it('shares deterministic mirrored obstacles for equal inputs', () => {
    const s = fresh();
    run(s, 150, [{ action: true }, { action: true }]);
    expect(s.obstacles.length).toBeGreaterThan(0);
    expect(s.players[1].y - s.players[0].y).toBeCloseTo(230);
    expect(s.players[1].gravity).toBe(s.players[0].gravity);
  });
  it('awards the survivor and treats simultaneous elimination as a draw', () => {
    const s = fresh();
    s.obstacles = [{ id: 0, x: 160, w: 44, h: 70, side: 0, passed: [false, false] }];
    s.players[0].y = gravityLanes[0].top + 15;
    s.players[0].gravity = -1;
    stepArcade(s);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    const d = fresh();
    d.obstacles = [{ id: 0, x: 160, w: 44, h: 70, side: 0, passed: [false, false] }];
    stepArcade(d);
    expect(d.finished).toBe(true);
    expect(d.winner).toBeNull();
  });
  it('counts passed barriers once and cleans up off-screen obstacles', () => {
    const s = fresh();
    s.obstacles = [{ id: 0, x: 100, w: 38, h: 70, side: 0, passed: [false, false] }];
    run(s, 10);
    expect(s.scores).toEqual([1, 1]);
    s.obstacles[0].x = -100;
    stepArcade(s);
    expect(s.obstacles).toHaveLength(0);
  });
  it('settles the 90-second limit by score or draw and cannot mutate a finished match', () => {
    const s = fresh();
    s.time = 92.999;
    s.scores = [4, 3];
    stepArcade(s);
    expect(s.winner).toBe(0);
    const frozen = structuredClone(s);
    run(s, 30, [{ action: true }, {}]);
    expect(s).toEqual(frozen);
    const d = fresh();
    d.time = 92.999;
    stepArcade(d);
    expect(d.finished).toBe(true);
    expect(d.winner).toBeNull();
  });
  it('is reproducible from the same seed and fixed-step input stream', () => {
    const a = fresh(),
      b = fresh();
    for (let i = 0; i < 600; i++) {
      const keys = [{ action: i % 120 < 5 }, { action: i % 130 < 5 }];
      stepArcade(a, keys);
      stepArcade(b, keys);
    }
    expect(a).toEqual(b);
  });
});
