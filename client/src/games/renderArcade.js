import { gravityLanes } from '../../../shared/gravity';

const teams = [0xb794ff, 0x55dce8];
const box = (g, x, y, w, h, c, r = 5) => {
  g.fillStyle(c);
  g.fillRoundedRect(x, y, w, h, r);
};
const glow = (g, x, y, r, c) => {
  for (let i = 3; i > 0; i--) {
    g.fillStyle(c, 0.035 * i);
    g.fillCircle(x, y, r + i * 5);
  }
  g.fillStyle(c);
  g.fillCircle(x, y, r);
};
function stars(g, time) {
  for (let i = 0; i < 65; i++) {
    const x = (i * 137.7 + 19) % 800,
      y = (i * 79.3 + 21) % 500;
    g.fillStyle(i % 5 ? 0x9ca6da : 0xffffff, 0.25 + Math.sin(time * 0.7 + i) * 0.12);
    g.fillCircle(x, y, i % 7 ? 1 : 2);
  }
}
function astronaut(g, x, y, c, flip = 1, alive = true) {
  if (!alive) {
    glow(g, x, y, 12, 0xff956f);
    return;
  }
  g.save();
  g.translateCanvas(x, y);
  g.scaleCanvas(1, flip);
  box(g, -18, -3, 9, 19, 0x394362, 3);
  box(g, -10, 0, 20, 17, c, 5);
  box(g, -10, 12, 7, 7, 0xd9dcf2, 2);
  box(g, 3, 12, 7, 7, 0xd9dcf2, 2);
  g.fillStyle(0xeff2ff);
  g.fillCircle(0, -5, 14);
  g.fillStyle(c);
  g.fillCircle(0, -5, 12);
  box(g, -9, -11, 18, 11, 0x202d4c, 5);
  box(g, -6, -9, 8, 2, 0xd6f6ff, 1);
  g.lineStyle(3, 0xeff2ff);
  g.lineBetween(-12, 3, -16, 9);
  g.lineBetween(12, 3, 15, 9);
  g.restore();
}
function drawPongBackground(g, s) {
  box(g, 0, 0, 800, 500, 0x12152d, 0);
  stars(g, 0);
  box(g, 16, 25, 768, 450, 0x0d2334, 22);
  g.lineStyle(2, 0x427b83);
  g.strokeRoundedRect(16, 25, 768, 450, 22);
  g.lineStyle(14, 0x1b3c4a, 0.4);
  g.strokeCircle(400, 250, 90);
  g.lineStyle(2, 0x49737b, 0.6);
  g.strokeCircle(400, 250, 83);
  for (let y = 42; y < 464; y += 24) {
    box(g, 398, y, 4, 11, 0x54858c, 2);
  }
  g.lineStyle(2, 0x2c5360);
  g.strokeRoundedRect(48, 60, 704, 380, 10);
}
function drawPong(g, s) {
  s.players.forEach((p, i) => {
    box(g, p.x - 10, p.y - 42, 20, 90, 0x050e20, 8);
    box(g, p.x - 8, p.y - 45, 16, 90, teams[i], 7);
    box(g, p.x - 5, p.y - 40, 3, 76, 0xf3edff, 1);
    box(g, p.x - 5, p.y - 7, 10, 14, 0x253658, 3);
    g.fillStyle(teams[i], 0.07);
    g.fillRoundedRect(p.x - 17, p.y - 52, 34, 104, 12);
  });
  for (let i = 6; i > 0; i--) {
    g.fillStyle(0x80edee, 0.1 - i * 0.011);
    g.fillCircle(
      s.ball.x - s.ball.vx * 0.009 * i,
      s.ball.y - s.ball.vy * 0.009 * i,
      Math.max(2, 8 - i)
    );
  }
  glow(g, s.ball.x, s.ball.y, 8, 0xeafff8);
  g.fillStyle(0xffffff);
  g.fillCircle(s.ball.x - 2, s.ball.y - 2, 3);
}
function drawTankBackground(g, s) {
  box(g, 0, 0, 800, 500, 0xc4ad7b, 0);
  for (let i = 0; i < 110; i++) {
    g.fillStyle(i % 2 ? 0xa58e60 : 0xd9c797, 0.5);
    g.fillEllipse((i * 89) % 800, (i * 137) % 500, 3 + (i % 5), 2);
  }
  for (const [x, y] of [
    [45, 80],
    [280, 420],
    [750, 90],
    [450, 70],
    [80, 445],
  ]) {
    g.lineStyle(3, 0x657556);
    g.lineBetween(x, y + 7, x, y - 7);
    g.lineBetween(x, y, x - 7, y - 4);
    g.lineBetween(x, y + 2, x + 6, y - 1);
  }
  g.lineStyle(8, 0x8b805f);
  g.strokeRect(4, 4, 792, 492);
  g.lineStyle(2, 0xe4d0a2);
  g.strokeRect(11, 11, 778, 478);
  s.walls.forEach((w) => {
    box(g, w.x + 5, w.y + 6, w.w, w.h, 0x8c795d, 4);
    box(g, w.x, w.y, w.w, w.h, 0x788278, 4);
    box(g, w.x + 3, w.y + 3, w.w - 6, 6, 0xabb4a0, 2);
    g.lineStyle(2, 0x535f5b);
    g.strokeRoundedRect(w.x, w.y, w.w, w.h, 4);
    for (let y = w.y + 24; y < w.y + w.h - 5; y += 24) g.lineBetween(w.x + 3, y, w.x + w.w - 3, y);
  });
}
function drawTank(g, s) {
  s.players.forEach((p, i) => {
    g.fillStyle(0x51472f, 0.22);
    g.fillEllipse(p.x + 3, p.y + 9, 49, 35);
    g.save();
    g.translateCanvas(p.x, p.y);
    g.rotateCanvas(p.a);
    box(g, -22, -19, 43, 12, 0x2d3741, 3);
    box(g, -22, 7, 43, 12, 0x2d3741, 3);
    for (let x = -18; x < 22; x += 7) {
      g.lineStyle(2, 0x66727c);
      g.lineBetween(x, -17, x, -9);
      g.lineBetween(x, 9, x, 17);
    }
    box(g, -19, -13, 37, 26, teams[i], 6);
    box(g, -16, -11, 29, 4, 0xffffff, 2);
    g.fillStyle(i ? 0x228a9c : 0x7655ae);
    g.fillCircle(-1, 0, 11);
    g.lineStyle(8, 0x293944);
    g.lineBetween(4, 0, 28, 0);
    g.lineStyle(4, 0xdee4dd);
    g.lineBetween(5, -1, 28, -1);
    box(g, -13, -5, 5, 10, 0x2d3741, 2);
    g.restore();
    box(g, p.x - 23, p.y - 36, 46, 8, 0x3d463c, 4);
    for (let h = 0; h < p.hp; h++) box(g, p.x - 20 + h * 14, p.y - 34, 12, 4, 0xe9fbad, 1);
  });
  s.bullets.forEach((b) => {
    g.lineStyle(3, 0xffedaa, 0.5);
    g.lineBetween(b.x - b.vx * 0.024, b.y - b.vy * 0.024, b.x, b.y);
    glow(g, b.x, b.y, 3, 0xfff5cf);
  });
}
function drawBomberBackground(g, s) {
  box(g, 0, 0, 800, 500, 0x273f42, 0);
  for (let i = 0; i < 80; i++) {
    g.fillStyle(i % 2 ? 0x42605a : 0x33504a);
    g.fillEllipse((i * 67) % 800, (i * 91) % 500, 6, 3);
  }
  box(g, 94, 28, 612, 450, 0x172e34, 10);
  s.tiles.forEach((t, i) => {
    const x = 100 + (i % 15) * 40,
      y = 30 + Math.floor(i / 15) * 40;
    box(g, x + 1, y + 1, 38, 38, (i + Math.floor(i / 15)) % 2 ? 0x84a477 : 0x8bac80, 3);
    if (t === 1) {
      box(g, x + 2, y + 5, 36, 34, 0x536e6b, 5);
      box(g, x + 2, y + 1, 36, 32, 0x9ab7ad, 5);
      box(g, x + 5, y + 3, 30, 5, 0xc4d6bd, 2);
      g.lineStyle(1, 0x6b8a80);
      g.lineBetween(x + 5, y + 25, x + 35, y + 25);
      g.lineBetween(x + 20, y + 9, x + 20, y + 25);
    } else if (t === 2) {
      box(g, x + 3, y + 5, 34, 33, 0x8a5b38, 3);
      box(g, x + 3, y + 1, 34, 33, 0xc9945d, 3);
      g.lineStyle(2, 0x9c683e);
      g.lineBetween(x + 6, y + 12, x + 34, y + 12);
      g.lineBetween(x + 6, y + 23, x + 34, y + 23);
      g.lineStyle(4, 0xf0c38a);
      g.lineBetween(x + 7, y + 5, x + 32, y + 29);
      g.lineBetween(x + 32, y + 5, x + 7, y + 29);
      g.fillStyle(0x765333);
      for (const [dx, dy] of [
        [7, 5],
        [32, 5],
        [7, 29],
        [32, 29],
      ])
        g.fillCircle(x + dx, y + dy, 1.5);
    }
  });
}
function drawBomber(g, s) {
  s.blasts.forEach((b) => {
    const x = 120 + b.x * 40,
      y = 50 + b.y * 40;
    g.fillStyle(0xff7d4a, 0.65);
    g.fillRoundedRect(x - 19, y - 19, 38, 38, 7);
    glow(g, x, y, 11, 0xffd35b);
    g.fillStyle(0xfff1b9);
    g.fillCircle(x, y, 5);
  });
  s.bombs.forEach((b) => {
    const x = 120 + b.x * 40,
      y = 51 + b.y * 40,
      pulse = 1 + Math.sin((2 - b.ttl) * 22) * 0.12;
    g.lineStyle(2, 0xffc76a, 0.6);
    g.strokeCircle(x, y, 16 * pulse);
    g.fillStyle(0x263347);
    g.fillCircle(x, y, 12);
    g.fillStyle(0x6d7987);
    g.fillCircle(x - 4, y - 4, 4);
    g.lineStyle(3, 0xc89455);
    g.lineBetween(x + 3, y - 11, x + 7, y - 18);
    glow(g, x + 7, y - 18, 2, 0xffe3a3);
  });
  s.players.forEach((p, i) => {
    if (!p.alive) return;
    const x = 120 + p.x * 40,
      y = 49 + p.y * 40;
    g.fillStyle(0x264d38, 0.25);
    g.fillEllipse(x, y + 13, 28, 11);
    box(g, x - 10, y + 5, 7, 10, 0x273d54, 3);
    box(g, x + 3, y + 5, 7, 10, 0x273d54, 3);
    box(g, x - 13, y - 13, 26, 27, teams[i], 8);
    box(g, x - 10, y - 7, 20, 13, 0xffeed7, 5);
    g.fillStyle(0x293b50);
    g.fillCircle(x - 4, y - 1, 2);
    g.fillCircle(x + 4, y - 1, 2);
    box(g, x - 5, y - 16, 10, 5, 0xf7eeeb, 2);
  });
}
function car(g, p, c) {
  g.fillStyle(0x102f2a, 0.25);
  g.fillEllipse(p.x + 2, p.y + 6, 45, 25);
  g.save();
  g.translateCanvas(p.x, p.y);
  g.rotateCanvas(p.a);
  for (const x of [-12, 10]) {
    box(g, x - 3, -13, 8, 6, 0x182132, 2);
    box(g, x - 3, 7, 8, 6, 0x182132, 2);
  }
  box(g, -20, -10, 40, 20, c, 6);
  box(g, -16, -8, 32, 3, 0xffffff, 1);
  box(g, -7, -8, 17, 16, 0x263d57, 4);
  box(g, 6, -6, 4, 12, 0xa6dce7, 1);
  box(g, -22, -12, 5, 24, 0x253349, 2);
  box(g, 15, -8, 3, 4, 0xfff3ba, 1);
  box(g, 15, 4, 3, 4, 0xfff3ba, 1);
  g.restore();
}
function drawRacingBackground(g, s) {
  box(g, 0, 0, 800, 500, 0x8fbd9c, 0);
  box(g, 37, 27, 726, 446, 0x596777, 8);
  box(g, 45, 35, 710, 430, 0x354252, 3);
  box(g, 175, 155, 450, 190, 0x83ad88, 2);
  for (let x = 50; x < 750; x += 20)
    for (const y of [31, 461]) {
      box(g, x, y, 10, 8, 0xf1e8d9, 0);
      box(g, x + 10, y, 10, 8, 0xe88680, 0);
    }
  for (let y = 40; y < 460; y += 20)
    for (const x of [41, 751]) {
      box(g, x, y, 8, 10, 0xf1e8d9, 0);
      box(g, x, y + 10, 8, 10, 0xe88680, 0);
    }
  g.lineStyle(2, 0xc5cbcc, 0.5);
  for (let x = 90; x < 720; x += 35) {
    g.lineBetween(x, 95, x + 15, 95);
    g.lineBetween(x, 405, x + 15, 405);
  }
  for (let y = 130; y < 380; y += 35) {
    g.lineBetween(110, y, 110, y + 15);
    g.lineBetween(690, y, 690, y + 15);
  }
  box(g, 318, 196, 161, 111, 0x6e9e92, 35);
  box(g, 325, 195, 148, 100, 0x8ed4d6, 30);
  g.lineStyle(2, 0xb4f1e6, 0.7);
  g.strokeEllipse(396, 244, 108, 57);
  for (const [x, y] of [
    [220, 202],
    [250, 300],
    [560, 205],
    [580, 297],
  ]) {
    g.fillStyle(0x3a725b, 0.25);
    g.fillEllipse(x + 5, y + 9, 40, 21);
    g.fillStyle(0x4b8968);
    g.fillCircle(x, y, 20);
    g.fillStyle(0x69a47a);
    g.fillCircle(x - 4, y - 5, 13);
  }
  for (let y = 35; y < 155; y += 10)
    for (let x = 400; x < 420; x += 10)
      box(g, x, y, 10, 10, (x + y) % 20 === 5 ? 0xf2f0e8 : 0x192434, 0);
}
function drawRacing(g, s) {
  const cp = [
    [690, 250],
    [400, 405],
    [110, 250],
    [400, 95],
  ];
  s.players.forEach((p, i) => {
    const [x, y] = cp[p.checkpoint];
    g.lineStyle(2, teams[i], 0.65);
    g.strokeCircle(x, y, 24 + i * 5);
  });
  s.players.forEach((p, i) => car(g, p, teams[i]));
}
function drawGravityBackground(g) {
  box(g, 0, 0, 800, 500, 0x15162f, 0);
  stars(g, 0);
  g.fillStyle(0x4d3270, 0.35);
  g.fillCircle(695, 250, 95);
  g.lineStyle(8, 0x8e68c3, 0.16);
  g.strokeEllipse(695, 250, 235, 50);
  gravityLanes.forEach((lane, i) => {
    box(g, 26, lane.top - 8, 748, lane.bottom - lane.top + 16, 0x222342, 12);
    box(g, 31, lane.top, 738, lane.bottom - lane.top, 0x101d35, 6);
    box(g, 30, lane.top - 2, 740, 4, teams[i], 2);
    box(g, 30, lane.bottom - 2, 740, 4, teams[i], 2);
    for (let x = 40; x < 770; x += 32) {
      box(g, x, lane.top - 7, 16, 3, 0x535376, 1);
      box(g, x, lane.bottom + 4, 16, 3, 0x535376, 1);
    }
  });
}
function drawGravity(g, s) {
  gravityLanes.forEach((lane, i) => {
    for (let n = 0; n < 13; n++) {
      g.fillStyle(teams[i], 0.06);
      g.fillCircle(55 + ((n * 73 + s.time * 9) % 690), lane.top + 20 + ((n * 29) % 130), 1.5);
    }
    s.obstacles.forEach((o) => {
      const y = o.side === 0 ? lane.bottom - o.h : lane.top;
      box(g, o.x + 3, y + 3, o.w, o.h, 0x0b1225, 5);
      box(g, o.x, y, o.w, o.h, 0xea855d, 5);
      box(g, o.x + 4, y + 4, o.w - 8, o.h - 8, 0x6e3e50, 3);
      for (let j = 0; j < o.h - 12; j += 18) {
        g.lineStyle(4, 0xf8b26b);
        g.lineBetween(o.x + 8, y + j + 6, o.x + o.w - 8, y + j + 12);
      }
      g.lineStyle(2, 0xffcf90);
      g.strokeRoundedRect(o.x, y, o.w, o.h, 5);
    });
    const p = s.players[i];
    g.fillStyle(teams[i], 0.12);
    g.fillCircle(p.x, p.y, 24);
    astronaut(g, p.x, p.y, teams[i], p.gravity, p.alive);
    const y = p.y - p.gravity * 31;
    g.lineStyle(2, teams[i], 0.7);
    g.lineBetween(p.x - 4, y + p.gravity * 4, p.x, y);
    g.lineBetween(p.x, y, p.x + 4, y + p.gravity * 4);
  });
}
const backgrounds = {
  pong: drawPongBackground,
  tank: drawTankBackground,
  bomber: drawBomberBackground,
  racing: drawRacingBackground,
  gravity: drawGravityBackground,
};
const foregrounds = {
  pong: drawPong,
  tank: drawTank,
  bomber: drawBomber,
  racing: drawRacing,
  gravity: drawGravity,
};
let rendererId = 0;

export function createArcadeRenderer(scene, initialState) {
  const key = `arena-background-${++rendererId}`;
  const painter = scene.make.graphics({ x: 0, y: 0, add: false });
  const stats = { backgroundBuilds: 0 };
  let tiles = null,
    image = null,
    disposed = false;
  const rebuild = (state) => {
    painter.clear();
    backgrounds[state.gameId](painter, state);
    // Every background paints an opaque 800x500 base, replacing the old canvas.
    // Reuse the same CanvasTexture when a Bomber crate changes.
    painter.generateTexture(key, 800, 500);
    if (!image) image = scene.add.image(0, 0, key).setOrigin(0);
    tiles = state.tiles ? state.tiles.slice() : null;
    stats.backgroundBuilds++;
  };
  rebuild(initialState);
  const moving = scene.add.graphics();
  const renderer = {
    stats,
    render(state) {
      if (disposed) return;
      if (state.tiles && state.tiles.some((tile, i) => tile !== tiles[i])) rebuild(state);
      moving.clear();
      foregrounds[state.gameId](moving, state);
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      moving.destroy();
      image.destroy();
      painter.destroy();
      scene.textures.remove(key);
    },
  };
  scene.events.once('shutdown', () => renderer.destroy());
  scene.events.once('destroy', () => renderer.destroy());
  return renderer;
}
