import { it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { createArcadeRenderer } from '../../client/src/games/renderArcade.js';
import { createArcade } from '../../shared/arcade.js';

function sceneFixture() {
  const textures = new Set(),
    events = new EventEmitter();
  let generations = 0;
  const graphics = () =>
    new Proxy(
      {},
      {
        get(target, name) {
          if (name === 'generateTexture')
            return (key) => {
              textures.add(key);
              generations++;
            };
          return () => {};
        },
      }
    );
  return {
    scene: {
      make: { graphics },
      add: {
        graphics,
        image: () => ({
          setOrigin() {
            return this;
          },
          destroy() {},
        }),
      },
      textures: { remove: (key) => textures.delete(key) },
      events,
    },
    textures,
    get generations() {
      return generations;
    },
  };
}
it('reuses the arena background while players move, and frees the texture on scene exit', () => {
  const f = sceneFixture(),
    s = createArcade('tank'),
    r = createArcadeRenderer(f.scene, s);
  for (let i = 0; i < 120; i++) {
    s.players[0].x++;
    r.render(s);
  }
  expect(f.generations).toBe(1);
  expect(f.textures.size).toBe(1);
  f.scene.events.emit('shutdown');
  f.scene.events.emit('destroy');
  expect(f.textures.size).toBe(0);
  r.render(s);
  expect(f.generations).toBe(1);
});
it('rebuilds Bomber scenery for in-place crate changes but not identical network snapshots', () => {
  const f = sceneFixture(),
    s = createArcade('bomber'),
    r = createArcadeRenderer(f.scene, s);
  r.render(structuredClone(s));
  expect(f.generations).toBe(1);
  const crate = s.tiles.indexOf(2);
  expect(crate).toBeGreaterThan(0);
  s.tiles[crate] = 0;
  r.render(s);
  expect(f.generations).toBe(2);
  r.render(structuredClone(s));
  expect(f.generations).toBe(2);
  r.destroy();
  expect(f.textures.size).toBe(0);
});
it('gives separate rematches independent cache ownership', () => {
  const f = sceneFixture(),
    s = createArcade('racing'),
    first = createArcadeRenderer(f.scene, s),
    second = createArcadeRenderer(f.scene, s);
  expect(f.textures.size).toBe(2);
  first.destroy();
  expect(f.textures.size).toBe(1);
  second.render(s);
  second.destroy();
  expect(f.textures.size).toBe(0);
});
