// Fixed-step simulation shared by local games and the authoritative server.
// No client timestamps or winner declarations enter this simulation.
import { createGravity, stepGravity } from './gravity.js';
export const WIDTH = 800,
  HEIGHT = 500,
  TICK = 1 / 60;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hit = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const tankWalls = [
  { x: 190, y: 100, w: 36, h: 120 },
  { x: 574, y: 280, w: 36, h: 120 },
  { x: 345, y: 215, w: 110, h: 70 },
];
export function createArcade(gameId, seed = 1) {
  const s = {
    gameId,
    time: 0,
    countdown: 3,
    finished: false,
    winner: null,
    scores: [0, 0],
    players: [],
    seed,
  };
  if (gameId === 'pong')
    Object.assign(s, {
      players: [
        { x: 28, y: 250 },
        { x: 772, y: 250 },
      ],
      ball: { x: 400, y: 250, vx: 300, vy: 120 },
      serve: 0,
    });
  if (gameId === 'tank')
    Object.assign(s, {
      players: [
        { x: 80, y: 250, a: 0, hp: 3, cooldown: 0 },
        { x: 720, y: 250, a: Math.PI, hp: 3, cooldown: 0 },
      ],
      bullets: [],
      walls: tankWalls,
    });
  if (gameId === 'bomber') {
    const tiles = [];
    for (let y = 0; y < 11; y++)
      for (let x = 0; x < 15; x++) {
        const safe = (x <= 2 && y <= 2) || (x >= 12 && y >= 8);
        tiles.push(
          x === 0 || y === 0 || x === 14 || y === 10 || (x % 2 === 0 && y % 2 === 0)
            ? 1
            : !safe && (x * 17 + y * 31 + seed) % 5 < 3
              ? 2
              : 0
        );
      }
    Object.assign(s, {
      tiles,
      players: [
        { x: 1, y: 1, alive: true, cooldown: 0, bombCooldown: 0 },
        { x: 13, y: 9, alive: true, cooldown: 0, bombCooldown: 0 },
      ],
      bombs: [],
      blasts: [],
    });
  }
  if (gameId === 'racing')
    s.players = [
      { x: 360, y: 67, a: 0, speed: 0, checkpoint: 0, laps: 0 },
      { x: 360, y: 100, a: 0, speed: 0, checkpoint: 0, laps: 0 },
    ];
  if (gameId === 'gravity') Object.assign(s, createGravity());
  return s;
}
function finish(s, winner) {
  s.finished = true;
  s.winner = winner;
  if (winner !== null)
    s.scores[winner] = s.gameId === 'pong' ? s.scores[winner] : s.gameId === 'racing' ? 3 : 1;
}
function solidTank(x, y, r = 14) {
  return (
    x < r ||
    x > 800 - r ||
    y < r ||
    y > 500 - r ||
    tankWalls.some((w) => hit(x, y, { x: w.x - r, y: w.y - r, w: w.w + 2 * r, h: w.h + 2 * r }))
  );
}
function stepPong(s, inputs, dt) {
  s.players.forEach((p, i) => {
    p.y = clamp(p.y + ((inputs[i]?.down ? 1 : 0) - (inputs[i]?.up ? 1 : 0)) * 360 * dt, 50, 450);
  });
  if (s.serve > 0) {
    s.serve -= dt;
    return;
  }
  const b = s.ball;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.y < 8 || b.y > 492) {
    b.y = clamp(b.y, 8, 492);
    b.vy *= -1;
  }
  s.players.forEach((p, i) => {
    if (Math.abs(b.x - p.x) < 17 && Math.abs(b.y - p.y) < 55 && (i === 0 ? b.vx < 0 : b.vx > 0)) {
      const speed = Math.min(720, Math.hypot(b.vx, b.vy) + 28),
        angle = ((b.y - p.y) / 55) * 1.05;
      b.vx = Math.cos(angle) * speed * (i === 0 ? 1 : -1);
      b.vy = Math.sin(angle) * speed;
      b.x = p.x + (i === 0 ? 18 : -18);
    }
  });
  if (b.x < 0 || b.x > 800) {
    const winner = b.x < 0 ? 1 : 0;
    s.scores[winner]++;
    if (s.scores[winner] >= 7) finish(s, winner);
    else {
      Object.assign(b, { x: 400, y: 250, vx: winner === 0 ? -300 : 300, vy: 120 });
      s.serve = 1;
    }
  }
}
function stepTank(s, inputs, dt) {
  s.players.forEach((p, i) => {
    const k = inputs[i] || {};
    p.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 2.8 * dt;
    const speed = ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 145,
      x = p.x + Math.cos(p.a) * speed * dt,
      y = p.y + Math.sin(p.a) * speed * dt;
    if (!solidTank(x, p.y) && distance({ x, y: p.y }, s.players[1 - i]) > 32) p.x = x;
    if (!solidTank(p.x, y) && distance({ x: p.x, y }, s.players[1 - i]) > 32) p.y = y;
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (k.action && p.cooldown <= 0) {
      s.bullets.push({
        x: p.x + Math.cos(p.a) * 25,
        y: p.y + Math.sin(p.a) * 25,
        vx: Math.cos(p.a) * 400,
        vy: Math.sin(p.a) * 400,
        owner: i,
        ttl: 2,
      });
      p.cooldown = 0.45;
    }
  });
  for (const b of s.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;
    if (solidTank(b.x, b.y, 2)) b.ttl = 0;
    const target = s.players[1 - b.owner];
    if (b.ttl > 0 && distance(b, target) < 20) {
      target.hp--;
      b.ttl = 0;
      if (target.hp <= 0) finish(s, b.owner);
    }
  }
  s.bullets = s.bullets.filter((b) => b.ttl > 0);
}
function explode(s, b) {
  const cells = [{ x: b.x, y: b.y }];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    for (let r = 1; r <= 3; r++) {
      const x = b.x + dx * r,
        y = b.y + dy * r;
      if (x < 0 || x >= 15 || y < 0 || y >= 11) break;
      const idx = y * 15 + x,
        t = s.tiles[idx];
      if (t === 1) break;
      cells.push({ x, y });
      if (t === 2) {
        s.tiles[idx] = 0;
        break;
      }
    }
  s.blasts.push(...cells.map((c) => ({ ...c, ttl: 0.45 })));
}
function stepBomber(s, inputs, dt) {
  s.blasts = s.blasts.filter((b) => (b.ttl -= dt) > 0);
  s.players.forEach((p, i) => {
    const k = inputs[i] || {};
    p.cooldown -= dt;
    p.bombCooldown -= dt;
    if (p.cooldown <= 0) {
      const dx = k.left ? -1 : k.right ? 1 : 0,
        dy = dx ? 0 : k.up ? -1 : k.down ? 1 : 0,
        x = p.x + dx,
        y = p.y + dy;
      if (
        (dx || dy) &&
        x >= 0 &&
        x < 15 &&
        y >= 0 &&
        y < 11 &&
        s.tiles[y * 15 + x] === 0 &&
        !s.bombs.some((b) => b.x === x && b.y === y) &&
        !s.players.some((o, j) => j !== i && o.x === x && o.y === y)
      ) {
        p.x = x;
        p.y = y;
        p.cooldown = 0.14;
      }
    }
    if (
      k.action &&
      p.bombCooldown <= 0 &&
      !s.bombs.some((b) => b.x === p.x && b.y === p.y) &&
      s.bombs.filter((b) => b.owner === i).length < 2
    ) {
      s.bombs.push({ x: p.x, y: p.y, ttl: 2, owner: i });
      p.bombCooldown = 0.35;
    }
  });
  s.bombs.forEach((b) => (b.ttl -= dt));
  let again = true;
  while (again) {
    again = false;
    for (const b of [...s.bombs])
      if (b.ttl <= 0 || s.blasts.some((c) => c.x === b.x && c.y === b.y)) {
        s.bombs.splice(s.bombs.indexOf(b), 1);
        explode(s, b);
        again = true;
      }
  }
  s.players.forEach((p) => {
    if (s.blasts.some((b) => b.x === p.x && b.y === p.y)) p.alive = false;
  });
  if (s.players.some((p) => !p.alive))
    finish(s, s.players[0].alive ? 0 : s.players[1].alive ? 1 : null);
}
const onRoad = (x, y) =>
  x >= 45 && x <= 755 && y >= 35 && y <= 465 && !(x > 175 && x < 625 && y > 155 && y < 345);
function stepRacing(s, inputs, dt) {
  s.players.forEach((p, i) => {
    const k = inputs[i] || {},
      road = onRoad(p.x, p.y);
    p.speed = clamp(
      p.speed + ((k.up ? 230 : 0) - (k.down ? 290 : 0) - p.speed * (road ? 0.65 : 3)) * dt,
      -85,
      road ? 290 : 95
    );
    p.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 2.4 * dt * (p.speed / 180);
    p.x = clamp(p.x + Math.cos(p.a) * p.speed * dt, 20, 780);
    p.y = clamp(p.y + Math.sin(p.a) * p.speed * dt, 20, 480);
    const gates = [
      p.x > 625 && p.y > 210 && p.y < 290,
      p.y > 345 && p.x > 360 && p.x < 440,
      p.x < 175 && p.y > 210 && p.y < 290,
      p.y < 155 && p.x > 360 && p.x < 440,
    ];
    if (gates[p.checkpoint]) {
      p.checkpoint++;
      if (p.checkpoint === 4) {
        p.checkpoint = 0;
        p.laps++;
        s.scores[i] = p.laps;
        if (p.laps >= 3) finish(s, i);
      }
    }
  });
  const [a, b] = s.players;
  if (distance(a, b) < 24) {
    const dx = a.x - b.x,
      dy = a.y - b.y,
      d = Math.hypot(dx, dy) || 1;
    a.x += (dx / d) * 2;
    a.y += (dy / d) * 2;
    b.x -= (dx / d) * 2;
    b.y -= (dy / d) * 2;
    a.speed *= 0.9;
    b.speed *= 0.9;
  }
}
export function stepArcade(s, inputs = [{}, {}], dt = TICK) {
  if (s.finished) return s;
  s.time += dt;
  if (s.countdown > 0) {
    s.countdown = Math.max(0, s.countdown - dt);
    return s;
  }
  ({
    pong: stepPong,
    tank: stepTank,
    bomber: stepBomber,
    racing: stepRacing,
    gravity: stepGravity,
  })[s.gameId](s, inputs, dt);
  // A bounded match duration also makes abandoned duels deterministic draws.
  if (s.time >= 603 && !s.finished) finish(s, null);
  return s;
}
