export const gravityLanes = [
  { top: 48, bottom: 222 },
  { top: 278, bottom: 452 },
];
export function createGravity() {
  return {
    players: gravityLanes.map(({ bottom }) => ({
      x: 170,
      y: bottom - 15,
      vy: 0,
      gravity: 1,
      held: false,
      alive: true,
    })),
    obstacles: [],
    wave: 0,
    spawnIn: 1.1,
    duration: 90,
  };
}

// Mirrored lanes share one seeded stream. Input edges, motion, collisions and
// scoring are computed here, never from browser coordinates or timestamps.
export function stepGravity(s, inputs, dt) {
  const elapsed = Math.max(0, s.time - 3),
    speed = Math.min(310, 205 + elapsed * 1.5);
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    const n = ((s.seed >>> 0) ^ Math.imul(s.wave + 1, 2654435761)) >>> 0;
    s.obstacles.push({
      id: s.wave,
      x: 835,
      w: 38 + (n % 3) * 8,
      h: 58 + (n % 4) * 12,
      side: s.wave % 2,
      passed: [false, false],
    });
    s.wave++;
    s.spawnIn += Math.max(1.25, 1.85 - elapsed * 0.004);
  }
  s.obstacles.forEach((o) => {
    o.x -= speed * dt;
  });
  s.players.forEach((p, i) => {
    if (!p.alive) return;
    const k = inputs[i] || {},
      pressed = !!(k.action || k.up),
      lane = gravityLanes[i];
    if (pressed && !p.held) {
      p.gravity *= -1;
      p.vy = p.gravity * 180;
    }
    p.held = pressed;
    p.x = Math.max(62, Math.min(710, p.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 180 * dt));
    p.vy = Math.max(-430, Math.min(430, p.vy + p.gravity * 980 * dt));
    p.y += p.vy * dt;
    if (p.y < lane.top + 15) {
      p.y = lane.top + 15;
      p.vy = 0;
    }
    if (p.y > lane.bottom - 15) {
      p.y = lane.bottom - 15;
      p.vy = 0;
    }
    for (const o of s.obstacles) {
      const y = o.side === 0 ? lane.bottom - o.h : lane.top;
      if (p.x + 12 > o.x && p.x - 12 < o.x + o.w && p.y + 14 > y && p.y - 14 < y + o.h)
        p.alive = false;
      if (p.alive && !o.passed[i] && o.x + o.w < p.x - 12) {
        o.passed[i] = true;
        s.scores[i]++;
      }
    }
  });
  s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);
  if (s.players.some((p) => !p.alive)) {
    s.finished = true;
    s.winner = s.players[0].alive ? 0 : s.players[1].alive ? 1 : null;
  } else if (elapsed >= s.duration) {
    s.finished = true;
    s.winner = s.scores[0] === s.scores[1] ? null : s.scores[0] > s.scores[1] ? 0 : 1;
  }
}
