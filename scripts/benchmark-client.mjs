// Repeatable Chromium canvas-work sample, not an FPS / physical-device claim.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:5176';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'client',
    '--host',
    '127.0.0.1',
    '--port',
    '5176',
    '--strictPort',
  ],
  { stdio: 'ignore' }
);
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch();
  const samples = [];
  for (const id of ['tank', 'bomber', 'racing']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      window.__paint = { fill: 0, stroke: 0, drawImage: 0, frames: 0 };
      for (const name of ['fill', 'stroke', 'drawImage']) {
        const original = CanvasRenderingContext2D.prototype[name];
        CanvasRenderingContext2D.prototype[name] = function (...args) {
          window.__paint[name]++;
          return original.apply(this, args);
        };
      }
      const frame = () => {
        window.__paint.frames++;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.goto(`${base}/play/${id}/local`);
    await page.locator('canvas').waitFor();
    await page.waitForTimeout(3600);
    await page.evaluate(() => {
      window.__paint = { fill: 0, stroke: 0, drawImage: 0, frames: 0 };
    });
    await page.waitForTimeout(2000);
    const result = await page.evaluate(() => window.__paint);
    samples.push({
      game: id,
      ...result,
      paintCallsPerFrame: Math.round(
        (result.fill + result.stroke + result.drawImage) / result.frames
      ),
    });
    await page.close();
  }
  const html = await readFile('client/dist/index.html', 'utf8');
  const entry = html.match(/src="\/assets\/([^" ]+\.js)"/)?.[1];
  const report = {
    description:
      'Canvas fill/stroke/drawImage calls over a 2s idle sample in headless Chromium; includes the offscreen cache when regenerated.',
    samples,
    entryBytes: entry ? (await stat(`client/dist/assets/${entry}`)).size : null,
  };
  await mkdir('.local', { recursive: true });
  const label = process.argv[2] || 'latest';
  if (!/^[a-z-]+$/.test(label)) throw new Error('Use an alphabetic report label.');
  await writeFile(`.local/performance-${label}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
