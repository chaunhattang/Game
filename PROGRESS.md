# Implementation checklist

- [x] Foundation and startup
- [x] Responsive website, navigation, catalog, details and lobby
- [x] Local and online Tic Tac Toe, reconnect and rematch
- [x] Accounts, MySQL schema, transactional results, history and rankings
- [x] Connect Five (local + online; freestyle overlines allowed)
- [x] Pong Battle (local + authoritative online)
- [x] Tank Battle (local + authoritative online)
- [x] Bomber Arena (local + authoritative online)
- [x] Mini Racing (local + authoritative online)
- [x] Gravity Duel (new game: local + authoritative online, keyboard + touch)
- [x] Automated rules, API, networking and browser tests
- [x] Production build and deployment/setup documentation

## Executed verification — 2026-10-21

- Dependencies installed successfully with Node 24.21.0/npm 11.19.0 and pinned in `package-lock.json`.
- `npm audit`: **0 vulnerabilities** after updating Vitest and installing the formatting tool.
- `npm run build`: **passed**. Phaser is lazy-loaded separately from the website and board game UI.
- `npm run test:db`: **48/48 Vitest tests passed**, using a real isolated MySQL 8 instance; **13/13 Playwright Chromium browser tests passed**. No database tests were skipped during this full run.
- Final `node scripts/test-with-mysql.mjs --unit-only` verification: **48/48 passed** after the shutdown improvements. The application's actual schema setup CLI also completed successfully against the isolated database.
- `node scripts/smoke-production.mjs`: **passed** with production mode launched from the server workspace. Verified direct SPA URLs, built assets, CSP, Secure + HttpOnly + SameSite session cookie, and JSON API 404.
- Frontend and backend development processes started successfully. A database-free server correctly reported degraded health and allowed guest play rather than inventing persistent account data.
- Visually inspected desktop/mobile homepage captures and the Phaser tank arena. Playwright also checks mobile overflow on home, details, local/online, login, registration, profile, leaderboard, and 404 routes.

### Test coverage

Rules: Tic Tac Toe all winning axes, draw, invalid/occupied/out-of-bounds moves; Gomoku all axes, overlines and row wrap prevention. Action games: countdown, Pong collisions/speed/first to seven; tank health, walls, bullets and fire rate; Bomber fuses, walls, crates and simultaneous draw; racing checkpoint order, laps, off-road drag and bounds; deterministic simulations.

API/MySQL: registration, password hashing, duplicates, validation, email/username login, invalid credentials, account authorization, profile edit, transactional match/stat updates, concurrent duplicate insertion prevention, history, leaderboard, match details, origin checks and logout revocation.

Socket.IO: real separate clients, room create/join, duplicate identity and third-player rejection, readiness and host restrictions, server countdown, synchronized turns/winners, out-of-turn rejection, reconnect/pause, disconnect expiry, malformed inputs, each game's snapshots, server-owned action finishes and rematches.

Browser: navigation, game filters/search, responsive layouts, local Tic Tac Toe win/draw and score tracking, local Gomoku win, all four Phaser games with keyboard input/restart/cleanup, two separate browser sessions for online Tic Tac Toe with third-player rejection and refresh/reconnect, mutual rematch, actual MySQL-backed account results/profile/history/leaderboard, online canvases for every action game, login failure and success. Browser page errors were collected and asserted empty.

Screenshots and traces are ignored under `test-results/`; they can be regenerated with the test commands. The initial accessible-name test failure and search label layout issue were fixed, and the final full browser run passed.

## Light/dark theme update

- Added a top-navigation sun/moon switch with accessible labels, available on desktop and mobile.
- Added a light palette for shared navigation, catalog, forms, rooms, profiles, rankings, UI states, and Tic Tac Toe. Arcade arenas retain their original player contrast.
- Stored preference uses `arena-theme` in browser localStorage, synchronizes across tabs, and initializes before the application renders. Storage failures fall back to a per-page choice.
- Browser checks passed for default dark mode, light palette, persistence after reload/navigation, cross-tab synchronization, board interaction, switching back to dark, and layouts at 390px and 320px, with no page errors.
- Production frontend build passed after introducing the theme feature.

## Illustrated arenas and Gravity Duel update

- Redrew every catalog illustration and both board-game surfaces with original code-based art.
- Replaced the in-game arcade renderer with detailed arenas: lit Pong table, desert Tank battlefield, garden Bomber board, landscaped racing track, and an orbital station for Gravity Duel.
- Added Gravity Duel to the catalog, local/online routes, room game selection, authoritative simulation, MySQL catalog seed, instructions and controls. Both players face mirrored obstacles from the same seeded course. Press-to-flip inputs are edge-triggered, short taps are buffered, and obstacle movement is interpolated online.
- Added deterministic simulation tests for countdown, held-input behavior, bounds, mirrored courses, collision/elimination, draws, scoring, timeout, and post-finish immutability; added real-socket completion/rematch checks.
- Successfully ran `npm run db:setup` against the configured development database to add the new game. No credentials were printed or changed.
- Latest rules/API/network tests: **58/58 passed** with real isolated MySQL. Production build and production startup smoke check passed.
- Final full browser run after the canvas fix: **17/17 Playwright tests passed**, including the registered Gravity result and mutual rematch. The isolated database was shut down successfully.
- Browser checks include complete local and online Gravity matches, touch input, rematch, registered result persistence, and existing game regressions. A duplicate-canvas race exposed by StrictMode was fixed with per-instance Phaser mount ownership.
- Additional visual QA passed for the Gravity arena, light-theme catalog and populated board layouts at 320px, with no browser page errors. Screenshots remain in ignored `test-results/`.

## Client performance optimization

- Cached arena scenery in a reusable canvas texture; moving players and effects remain dynamic. Bomber rebuilds only when tile values change. Shutdown/destroy releases each scene's cache, and finished games stop rebuilding foreground drawing commands.
- Replaced periodic full-state React updates with score/result summaries emitted only on value changes.
- Changed client input to up-to-20Hz changes plus a 100ms heartbeat, safely inside the server's 300ms expiry. Volatile sends avoid queued stale input after transport congestion.
- Deferred account/details/ranking routes, Socket.IO Client, and Motion animation features. Navigation stays mounted while a page chunk loads. Reduced-motion preferences suppress entrance animations.
- Recorded before/after canvas API calls per frame in two-second Chromium idle samples: Tank **208 → 53**, Bomber **1,145 → 19**, Racing **347 → 29**. This is drawing-work measurement, not an FPS, CPU or battery-life certification.
- Main production JavaScript entry **523,557 → 389,175 bytes**, about **26% smaller**. Deferred chunks are counted separately and load when needed.
- Added a repeatable `scripts/benchmark-client.mjs` helper; raw reports are kept in ignored `.local/`.
- **61/61** rules/API/network/cache tests passed against isolated MySQL. The complete existing **17/17** browser suite passed, including every arcade game, cleanup, accounts and registered online results. Production build and startup smoke checks passed.
- Two additional focused browser checks passed: held online Pong movement remains active within the lower packet budget; a real Bomber blast changes a cached crate's rendered pixels to ground. Total coverage executed for this update: **19 distinct browser tests passed** (17 full-suite + 2 focused).

## Configuration and deployment work remaining

- Normal runtime needs the user's own persistent MySQL credentials in root `.env`. Isolated test instances are stopped after verification and do not configure or modify the existing MySQL service.
- No external deployment, physical two-device test, WAN/load test, cross-browser certification or production-readiness certification was performed.
- Live rooms, session revocation and failed-result retries use single-process memory. Durable retries/outbox and distributed ownership are required before scaling or guaranteeing results across a process crash.
- Full practical limits, environment settings, REST/socket contracts and production HTTPS guidance are in `README.md`. All six requested games are implemented; none are marked playable while unfinished.
