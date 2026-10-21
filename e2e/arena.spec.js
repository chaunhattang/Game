import { test, expect } from '@playwright/test';
const errorsFor = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};
test('homepage, filters, details, navigation and responsive layouts', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Better together. Better as rivals.' })
  ).toBeVisible();
  await expect(page.locator('.game-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Strategy', exact: true }).click();
  await expect(page.locator('.game-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'All games', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search games' }).fill('Pong');
  await expect(page.locator('.game-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Pong Battle', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pong Battle' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Local play', exact: true })).toBeVisible();
  await page.goto('/');
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  for (const path of [
    '/',
    '/games/connectfive',
    '/play/tictactoe/local',
    '/play/pong/online',
    '/login',
    '/register',
    '/profile',
    '/leaderboard',
    '/unknown',
  ]) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
  }
  expect(errors).toEqual([]);
});
test('local Tic Tac Toe highlights a winner, tracks score, and handles a draw', async ({
  page,
}) => {
  await page.goto('/play/tictactoe/local');
  const cells = page.locator('.tic-board .cell');
  for (const index of [0, 3, 1, 4, 2]) await cells.nth(index).click();
  await expect(page.getByRole('status')).toHaveText('Player 1 wins!');
  await expect(page.locator('.winning')).toHaveCount(3);
  await expect(page.locator('.player-label.p1 strong')).toHaveText('1');
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  for (const index of [0, 1, 2, 4, 3, 5, 7, 6, 8]) await cells.nth(index).click();
  await expect(page.getByRole('status')).toHaveText('A well-fought draw');
});
test('local Connect Five wins with five stones', async ({ page }) => {
  await page.goto('/play/connectfive/local');
  const cells = page.locator('.gomoku .cell');
  for (let x = 0; x < 4; x++) {
    await cells.nth(x).click();
    await cells.nth(15 + x).click();
  }
  await cells.nth(4).click();
  await expect(page.getByRole('status')).toHaveText('Player 1 wins!');
  await expect(page.locator('.winning')).toHaveCount(5);
});
for (const id of ['pong', 'tank', 'bomber', 'racing', 'gravity'])
  test(`${id} loads Phaser, accepts controls, restarts and cleans up`, async ({ page }) => {
    const errors = errorsFor(page);
    await page.goto(`/play/${id}/local`);
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(3300);
    await page.keyboard.down('KeyW');
    await page.keyboard.down('Space');
    await page.waitForTimeout(300);
    await page.keyboard.up('Space');
    await page.keyboard.up('KeyW');
    await page.getByRole('button', { name: 'Restart round', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.screenshot({ path: `test-results/${id}-local.png` });
    await page.goto('/');
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
async function register(page, name) {
  await page.goto('/register');
  await page.getByLabel('Username', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(`${name}@arena.test`);
  await page.getByLabel('Password', { exact: true }).fill('Browser-testing-123');
  await page.getByLabel('Confirm password').fill('Browser-testing-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
async function createRoom(a, b, id = 'tictactoe') {
  await a.goto(`/play/${id}/online`);
  await a.getByRole('button', { name: 'Create private room', exact: true }).click();
  await expect(a.locator('.room-code')).toBeVisible();
  const code = await a.locator('.room-code').innerText();
  await b.goto(`/room/${code}`);
  await expect(b.locator('.player-slot strong').filter({ hasText: '(you)' })).toBeVisible();
  await a.getByRole('button', { name: 'I’m ready', exact: true }).click();
  await b.getByRole('button', { name: 'I’m ready', exact: true }).click();
  await a.getByRole('button', { name: 'Start game', exact: true }).click();
  return code;
}
test('two browser sessions synchronize, reconnect, rematch, and persist registered results', async ({
  browser,
}) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    cc = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage(),
    c = await cc.newPage();
  const errors = [errorsFor(a), errorsFor(b)];
  const registered = process.env.ARENA_TEST_DB === '1';
  const name = `browser_${Date.now().toString(36)}`;
  if (registered) {
    await register(a, `${name}a`);
    await register(b, `${name}b`);
  }
  const code = await createRoom(a, b);
  await c.goto(`/room/${code}`);
  await expect(c.getByRole('alert')).toContainText('full');
  await expect(a.getByRole('button', { name: 'Square 1 empty', exact: true })).toBeEnabled();
  await expect(b.getByRole('button', { name: 'Square 1 empty', exact: true })).toBeDisabled();
  await a.getByRole('button', { name: 'Square 1 empty', exact: true }).click();
  await expect(b.locator('.tic-board .cell').nth(0)).toHaveText('×');
  await b.reload();
  await expect(b.locator('.tic-board .cell').nth(0)).toHaveText('×');
  await expect(b.locator('.tic-board .cell').nth(3)).toBeEnabled();
  for (const [p, i] of [
    [b, 3],
    [a, 1],
    [b, 4],
    [a, 2],
  ])
    await p.locator('.tic-board .cell').nth(i).click();
  await expect(a.locator('.match-bar [role="status"]')).toHaveText('Player 1 wins!');
  await expect(b.locator('.match-bar [role="status"]')).toHaveText('Player 1 wins!');
  if (registered) {
    await expect(a.getByText('Account results saved.', { exact: true })).toBeVisible();
  }
  await a.getByRole('button', { name: 'Vote for a rematch', exact: true }).click();
  await b.getByRole('button', { name: 'Vote for a rematch', exact: true }).click();
  await expect(a.locator('.tic-board .cell').filter({ hasText: '×' })).toHaveCount(0);
  await expect(a.locator('.match-bar [role="status"]')).toHaveText('Your turn');
  if (registered) {
    await a.getByRole('button', { name: 'Leave room', exact: true }).click();
    await a.goto('/profile');
    await expect(a.locator('.stat').filter({ hasText: 'Wins' }).locator('strong')).toHaveText('1');
    await expect(a.locator('.result-badge.win')).toBeVisible();
    await a.goto('/leaderboard');
    await expect(a.getByText(`${name}a`, { exact: true })).toBeVisible();
  }
  expect(errors.flat()).toEqual([]);
  await ca.close();
  await cb.close();
  await cc.close();
});
for (const id of ['pong', 'tank', 'bomber', 'racing', 'gravity'])
  test(`online ${id} delivers live snapshots to two canvases`, async ({ browser }) => {
    const ca = await browser.newContext(),
      cb = await browser.newContext(),
      a = await ca.newPage(),
      b = await cb.newPage(),
      errors = [errorsFor(a), errorsFor(b)];
    await createRoom(a, b, id);
    await expect(a.locator('canvas')).toBeVisible();
    await expect(b.locator('canvas')).toBeVisible();
    await a.waitForTimeout(3500);
    await a.keyboard.down('KeyW');
    await a.waitForTimeout(300);
    await a.keyboard.up('KeyW');
    await expect(a.locator('.match-bar [role="status"]')).toHaveText(/\d+ : \d+/);
    await a.screenshot({ path: `test-results/${id}-online.png` });
    expect(errors.flat()).toEqual([]);
    await ca.close();
    await cb.close();
  });
test('login rejects wrong credentials and accepts a registered account', async ({ page }) => {
  test.skip(process.env.ARENA_TEST_DB !== '1', 'Requires isolated MySQL.');
  const name = `login_${Date.now().toString(36)}`;
  await register(page, name);
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.goto('/login');
  await page.getByLabel('Email or username').fill(name);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  await page.getByLabel('Password', { exact: true }).fill('Browser-testing-123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
});

test('Gravity Duel local flip wins, touch controls and restart work', async ({ page }) => {
  const errors = errorsFor(page);
  await page.goto('/play/gravity/local');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.getByRole('button', { name: 'Player 1 action', exact: true }).click();
  await expect(page.locator('.match-status')).toHaveText('Player 1 wins!', { timeout: 12000 });
  await expect(page.locator('.player-label.p1 strong')).toHaveText('1');
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await expect(page.locator('.match-status')).toHaveText('0 : 0');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
  await page.screenshot({ path: 'test-results/gravity-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('Gravity Duel online validates a complete match and mutual rematch', async ({ browser }) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    a = await ca.newPage(),
    b = await cb.newPage();
  const registered = process.env.ARENA_TEST_DB === '1',
    name = `orbit_${Date.now().toString(36)}`;
  if (registered) {
    await register(a, `${name}a`);
    await register(b, `${name}b`);
  }
  await createRoom(a, b, 'gravity');
  await expect(a.locator('canvas')).toBeVisible();
  await a.waitForTimeout(3300);
  await a.keyboard.down('Space');
  await a.waitForTimeout(200);
  await a.keyboard.up('Space');
  for (const p of [a, b])
    await expect(p.locator('.match-bar [role="status"]')).toHaveText('Player 1 wins!', {
      timeout: 12000,
    });
  if (registered)
    await expect(a.getByText('Account results saved.', { exact: true })).toBeVisible();
  await a.getByRole('button', { name: 'Vote for a rematch', exact: true }).click();
  await b.getByRole('button', { name: 'Vote for a rematch', exact: true }).click();
  await expect(a.locator('.match-bar [role="status"]')).toHaveText('0 : 0');
  await expect(a.locator('canvas')).toHaveCount(1);
  await ca.close();
  await cb.close();
});

test('online input heartbeat keeps held movement active with fewer idle packets', async ({
  browser,
}) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    a = await ca.newPage(),
    b = await cb.newPage();
  await createRoom(a, b, 'pong');
  await expect(a.locator('canvas')).toBeVisible();
  await a.waitForTimeout(3300);
  await a.evaluate(async () => {
    const { getSocket } = await import('/src/services/socket.js');
    const socket = await getSocket();
    window.inputPacketCount = 0;
    window.countInputPackets = (event) => {
      if (event === 'game:input') window.inputPacketCount++;
    };
    socket.onAnyOutgoing(window.countInputPackets);
  });
  await a.keyboard.down('KeyW');
  await a.waitForTimeout(700);
  await a.keyboard.up('KeyW');
  await a.waitForTimeout(150);
  const sample = await a.evaluate(async () => {
    const { emit, getSocket } = await import('/src/services/socket.js');
    const socket = await getSocket();
    socket.offAnyOutgoing(window.countInputPackets);
    return {
      packets: window.inputPacketCount,
      y: (await emit('room:sync')).room.game.players[0].y,
    };
  });
  expect(sample.y).toBeLessThanOrEqual(65);
  expect(sample.packets).toBeGreaterThanOrEqual(5);
  expect(sample.packets).toBeLessThanOrEqual(12);
  await ca.close();
  await cb.close();
});

test('Bomber cached scenery updates when an actual blast destroys a crate', async ({ page }) => {
  await page.goto('/play/bomber/local');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(3300);
  const pixel = () =>
    page
      .locator('canvas')
      .evaluate((canvas) => Array.from(canvas.getContext('2d').getImageData(280, 90, 1, 1).data));
  const before = await pixel();
  expect(before[0]).toBeGreaterThan(before[1]);
  await page.keyboard.down('Space');
  await page.waitForTimeout(70);
  await page.keyboard.up('Space');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyS');
  await page.waitForTimeout(2300);
  const after = await pixel();
  expect(after[1]).toBeGreaterThan(after[0]);
  await expect(page.locator('.match-status')).toHaveText('0 : 0');
});
