# 2 PLAYER ARENA

A local and real-time online arcade for two people. React/Vite renders the platform; Phaser 3 renders five action games. A Node/Express and Socket.IO server owns online game rules and physics. MySQL stores accounts, completed online matches, and rankings.

## Features

- Seven games, each with local and private online modes: Gravity Duel, Tic Tac Toe, Connect Five, Pong Battle, Tank Battle, Bomber Arena, Mini Racing.
- Original SVG game illustrations and procedurally drawn Phaser arenas. Dark purple/cyan UI, search, categories, mode filtering, responsive navigation, mobile controls, loading and error states, notifications.
- Light/dark theme switch in the top navigation. Dark is the default; the browser remembers your choice and synchronizes it across tabs. Theme settings remain usable if browser storage is blocked.
- Six-character invitation codes, two exclusive player slots, host game selection, readiness, countdowns, both-player rematch voting.
- HttpOnly JWT session cookies, bcrypt passwords, optional accounts, guest sessions, username/email login, editable username, profile, match history, per-game and overall rankings.
- 60 Hz authoritative action simulation, 20 Hz snapshots, 100 ms render interpolation, up to 20 Hz changed client input with a 100 ms heartbeat, stale input expiry, 30-second reconnect grace period.
- Shared game rules for local and server play; lazy-loaded Phaser; listeners and game instances disposed on unmount.

## Requirements

- Node.js 22.12+ (Node 24 LTS recommended), npm, MySQL 8.0+.
- Modern browser supporting Canvas and WebSockets. Keyboard recommended for two-player local action games; touch controls also provided.

## Install and configure

```powershell
npm install
Copy-Item .env.example .env
```

On macOS/Linux use `cp .env.example .env`. Set your own MySQL credentials in `.env`. No real credentials are included. Development generates an ephemeral signing key in memory if `JWT_SECRET` is blank; restarting the server then expires all sessions. Production requires a stable secret of at least 32 random characters supplied through your secret manager.

| Variable | Default / purpose |
| --- | --- |
| `PORT` | `3001`, API and Socket.IO listener |
| `HOST` | `0.0.0.0` |
| `CLIENT_ORIGIN` | `http://localhost:5173`; comma-separated exact allowed browser origins |
| `NODE_ENV` | Set `production` for secure cookies and built frontend serving |
| `JWT_SECRET` | Required stable secret in production; never a `VITE_` variable |
| `MYSQL_HOST`, `MYSQL_PORT` | `127.0.0.1`, `3306` |
| `MYSQL_USER`, `MYSQL_PASSWORD` | Application database account and password |
| `MYSQL_DATABASE` | `arena` |
| `VITE_API_URL` | Optional client build variable for a separate API origin. Blank uses same-origin paths. |
| `API_PROXY_TARGET` | Development proxy only, defaults to `http://127.0.0.1:3001` |

The backend loads root `.env` even when launched through the server workspace. Optional `server/.env` can provide variables not already defined. Optional client `.env` follows Vite conventions. Restart processes after changing environment variables.

## MySQL setup

Using an administrator account, create a database and a restricted application account. Replace the password below with your own:

```sql
CREATE DATABASE arena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arena'@'localhost' IDENTIFIED BY '<your password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON arena.* TO 'arena'@'localhost';
```

Update `.env`, then run:

```powershell
npm run db:setup
```

This installs `database/schema.sql` and `database/seed.sql`, which are safe to rerun for initial setup. The seed contains the real game catalog only. These are initial schema scripts, not a versioned migration system. Use a separate migration account and remove runtime DDL privileges for production. Back up the database before future schema changes.

Tables: `users`, `games`, `matches`, `match_players`, `player_stats`, `room_history`. Foreign keys, unique account names/emails, unique match/player slots, unique player/game stats, and ranking/history indexes enforce data integrity. Match UUIDs provide idempotency. Result insertion and statistics updates occur in one transaction. Guests occupy real room slots but do not get persistent player stats. Local games remain temporary because browser-reported local results are not trusted for rankings.

## Start development

```powershell
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:3001/api/health>

Or run `npm run dev -w server` and `npm run dev -w client` separately. Health reports `degraded` if MySQL is unavailable; guest local and online games remain usable, while account/history/ranking APIs return a clear 503 error. No in-memory substitute is used for account persistence.

## Playing

Choose a game card, read its instructions, and select Local Play for one computer. Player 1 and Player 2 take turns in board games. Local round scores stay until you leave that game screen.

For online play, create a private room, copy the six-character invitation code, and give it to a friend. The second player enters it under Online Rooms or visits `/room/CODE`. Both players select **I’m ready**; the host starts. After finishing, both must vote for a rematch. Each guest requires a separate browser profile/private window: two tabs sharing one cookie cannot occupy both slots. Accounts also cannot control both slots.

Refresh within 30 seconds to recover the same slot using the HttpOnly session cookie. Online simulation pauses when either player disconnects. Expiry awards an active-match forfeit to the connected opponent and closes the room. Explicit Leave closes the room immediately, forfeiting an active match. There are no spectator slots. Rooms expire after two hours or the reconnect deadline.

### Two computers / phones on a LAN

1. On the server computer find its LAN IPv4 address, for example `192.168.1.20`.
2. Set `CLIENT_ORIGIN=http://localhost:5173,http://192.168.1.20:5173` and restart development.
3. Permit incoming TCP 5173 through the host firewall on your trusted private network.
4. Both devices open `http://192.168.1.20:5173`. Vite proxies API and sockets, so clients do not need direct access to 3001.
5. Create and join a room. For devices outside your LAN, deploy behind a public HTTPS reverse proxy with WebSocket support.

Use the same hostname for all pages on a device so its session cookie remains consistent. Plain HTTP on a LAN is for development only. Clipboard access may be restricted on HTTP; the room code remains visible and a notification provides a copyable fallback.

### Controls and rules

| Game | Player 1 | Player 2 | Win condition |
| --- | --- | --- | --- |
| Tic Tac Toe | Click/tap empty square | Click/tap empty square | Three in a row; full board draws |
| Connect Five | Click/tap empty intersection | Click/tap empty intersection | Five **or more** horizontally, vertically, diagonally; overlines allowed |
| Gravity Duel | Space or W to flip, A/D move | Enter or Up to flip, Left/Right move | Last survivor; simultaneous elimination draws; at 90s compare passed barriers |
| Pong | W/S | Up/Down | First to 7; paddle hits increase ball speed |
| Tank | W/S drive, A/D rotate, Space fire | Up/Down drive, Left/Right rotate, Enter fire | Reduce opposing tank from 3 HP to zero |
| Bomber | WASD, Space bomb | Arrows, Enter bomb | Eliminate rival; simultaneous blasts draw |
| Racing | W/S accelerate/brake, A/D steer | Up/Down accelerate/brake, Left/Right steer | Three clockwise laps with all four ordered checkpoints |

Online WASD controls your own slot regardless of player number. Arrow keys also work for player 2. Touch controls provide movement and action buttons. Active game controls suppress browser scrolling. Switching tabs clears held inputs. Bombs have a two-second fuse, blast range three, chain reactions, solid walls, and destructible crates. Racing uses off-road drag and track/arena bounds rather than complex rigid-body physics. Gravity Duel has a 90-second active-play limit, mirrored obstacle courses and press-to-flip gravity. Short taps are buffered for 120 ms so touch input reaches the simulation and network. Other action games draw after ten minutes of active play. Sound is optional and synthesized locally; no external audio assets.

## Structure

```text
client/src/
  components/common/       UI states and original artwork
  components/layout/       Navigation, footer, toast, sound toggle
  components/games/        Board input and lazy Phaser lifecycle
  games/                   Original illustrated arcade renderer and board styles
  pages/                   Home, details, local/online, auth, profile, leaderboard
  contexts/ hooks/ stores/  Authentication, REST loading, room state
  services/                Axios and Socket.IO lifecycle
shared/
  catalog.js               Game metadata and instructions
  board.js                 Tic Tac Toe and Gomoku validation
  arcade.js                Fixed-step Pong/Tank/Bomber/Racing/Gravity dispatch
  gravity.js               Mirrored-lane gravity physics and collisions
server/src/
  config/                  Environment, MySQL, schema setup
  middleware/              HttpOnly JWT sessions and revocation
  routes/                  REST API with Zod validation
  repositories/            Transactional/idempotent result persistence
  sockets/                 Room ownership, networking, fixed server tick
  app.js index.js          Express setup, startup, shutdown
server/tests/              Unit, real-socket and MySQL integration tests
database/                  Schema and catalog seed
e2e/                       Playwright multi-context browser verification
scripts/                   Isolated MySQL verification helper
```

Add a new game to `shared/catalog.js`, implement its shared rules/simulation and renderer, validate its inputs in the server, add a catalog seed, and test local and online behavior before enabling `active`. The current seven games share renderers and simulation modules instead of empty per-game directories.

## REST API

All successful REST responses are `{ "data": ... }`; failures are `{ "error": "safe message" }`. Authenticated requests use cookies (`withCredentials` in Axios). Mutating requests require an allowed Origin when the browser supplies one. Unknown/invalid inputs return 400, unauthorized requests 401, disallowed origins 403, missing records 404, duplicate account names 409, throttling 429, database unavailability 503.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | HTTP/API and MySQL status (200 with `ok` or `degraded`) |
| POST | `/api/session` | Establish or retain a guest/account session |
| POST | `/api/auth/register` | `{username,email,password,confirmPassword}` |
| POST | `/api/auth/login` | `{identifier,password}`; email or username |
| GET | `/api/auth/me` | Current authenticated user |
| POST | `/api/auth/logout` | Revoke current session, clear cookie |
| GET | `/api/games`, `/api/games/:slug` | Catalog and individual game |
| GET | `/api/matches`, `/api/matches/:id` | Latest 50 matches or match details |
| GET | `/api/users/me/matches` | Latest 50 personal matches (authenticated) |
| GET/PATCH | `/api/users/me` | Read profile / update `{username}` |
| GET | `/api/users/:id/stats` | Per-game stats |
| GET | `/api/leaderboard`, `/api/leaderboard/:gameId` | Up to 100 ranked accounts |

Leaderboard ordering: wins descending, win rate descending, then account ID. Each game's rating starts at 1000, gains 20 per win and loses 10 per loss, clamped to zero. Overall rating sums gains/losses across games over one baseline of 1000. No Elo or skill-based matchmaking is claimed. Public match/profile APIs do not expose account email or password hashes; email is available only on your own authenticated account.

## Socket contract

Socket handshakes authenticate the cookie. All client event payloads are Zod validated, ownership comes from the verified server session, and acknowledgments are `{ok:true,...}` or `{ok:false,error}`. Never send player IDs, winners, client coordinates, velocities, timestamps or scores.

| Client event | Payload |
| --- | --- |
| `room:create` | `{gameId}` |
| `room:join` | `{code}` uppercase, exactly six characters |
| `room:sync` / `room:leave` | `{}` |
| `room:select` | `{gameId}`, host only in lobby; clears readiness |
| `room:ready` | `{ready:boolean}` |
| `room:start` | `{}`, host only; two connected ready players required |
| `game:move` | `{index:integer}` for board games |
| `game:input` | Exactly `{up,down,left,right,action}` booleans |
| `game:rematch-vote` | `{}` once per player after finishing |

Server emits `room:state` (public room/players and authoritative game), `room:resumed`, `room:closed`, `player:disconnected`, `player:reconnected`, `game:started`, `game:state` (`{state,sequence}` action snapshots), `game:finished`, and `server:error`. Slot IDs are available only via the requesting socket’s sync acknowledgment. Secrets/session identifiers never appear in room broadcasts.

## Tests

```powershell
npm test
npx playwright install chromium
npm run test:e2e
npm run build
node scripts/smoke-production.mjs
npm audit
```

`npm test` runs shared rules, simulations, and real Socket.IO integration. MySQL account tests are explicitly skipped unless `ARENA_TEST_DB=1` and a test DB is configured. Ordinary browser tests work without MySQL; account browser tests are explicitly skipped without the test flag. Do not point integration tests at production.

For a full, reproducible account/history/rankings test using an **isolated disposable MySQL instance**, set the installed MySQL server binary and run:

```powershell
$env:ARENA_MYSQL_BIN='C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe'
npm run test:db
```

On other systems set `ARENA_MYSQL_BIN` to your `mysqld` binary. The helper initializes a fresh directory under ignored `.local/`, binds port 3307 on loopback, uses a passwordless **test-only** root account, installs schema/seed, runs unit/integration and Playwright checks, and shuts down that instance. It never uses or changes the existing MySQL service. Override `ARENA_TEST_MYSQL_PORT` if 3307 is occupied. `node scripts/test-with-mysql.mjs --unit-only` runs just the backend/rules checks. Retained test data can be removed after the helper exits. Never use this test instance for deployment.

Playwright owns separate API/frontend processes on 3101/5174. It tests navigation, responsive overflow, local winners/draws, all Phaser canvases, cleanup, two separate browser sessions, third-player rejection, refresh/reconnection, rematches, and—with the isolated DB—registration/login, saved match results and leaderboard visibility. Screenshots and failure traces are written to ignored `test-results/`. See `PROGRESS.md` for the actual executed verification record.

## Production deployment

```powershell
npm ci
npm run build
# Set NODE_ENV=production, CLIENT_ORIGIN=https://your-domain, JWT_SECRET and database variables.
npm start
```

Express serves `client/dist` and SPA routes in production. Deploy to a Node-capable host with MySQL reachability. Configure a TLS reverse proxy with WebSocket upgrades for `/socket.io/`, and forward HTTP traffic to the Node port. HTTPS is required for secure cookies. Prefer one public origin for frontend/API; for separate origins configure the allowlist, Vite API URL, CSP, and a compatible same-site cookie strategy. Do not put secrets into frontend builds. Configure proxy trust deliberately for your infrastructure before using forwarded IPs; it is not blindly enabled. Bind the API behind the proxy, restrict MySQL network access, use managed secrets, database backups, a process supervisor and monitoring. No external deployment was performed by this local repository task.

Security includes bcrypt cost 12, bounded password input, HttpOnly SameSite=Lax cookies (Secure in production), 12-hour JWT expiry, logout revocation, Helmet/CSP, parameterized queries, Zod, HTTP/auth/socket rate limits, room and match lifetime caps, cryptographic codes, server-owned physics, input expiry and server-owned win detection. User strings are rendered through React, never injected as HTML. Production refuses a missing/short signing secret. Logs are JSON structured backend events and exclude secrets.

## Practical limits

- You must configure your own persistent MySQL account for normal development/deployment. The isolated test instance is stopped after tests; its passing results do not configure your normal server.
- Rooms, revocations, pending persistence retries and live simulation are single-process memory. Restart closes rooms. Use shared session revocation, durable result/outbox storage and coordinated room ownership before horizontal scaling. Socket.IO adapters alone do not coordinate physics.
- Failed result writes retry with backoff while the process remains running. A process crash before MySQL commit can lose that pending result. Do not treat this as crash-proof tournament accounting.
- Only completed online matches involving registered accounts persist. Guests are not included in rankings; no fabricated rankings are seeded. Room history is best-effort telemetry. No spectators, chat, bot opponents, power-ups, password reset, email verification, uploaded avatars, matchmaking, or anti-cheat beyond authoritative validation are implemented.
- Authentication is cookie-based and initially checks the server; logout revocations are in memory until JWT expiry. A username edit applies to existing account data; sign in again for new room identity metadata.
- Single local keyboard devices can have hardware key rollover limits. Cross-device/LAN instructions are provided, but automated tests use separate browser contexts on this host, not physical remote devices or a public internet deployment.
- Browser coverage is Chromium. Long-duration load testing, accessibility audits, cross-browser/device certification and WAN latency/load profiling remain deployment work. No production-readiness certification is claimed.

## Illustrated graphics update

All seven catalog illustrations are original SVG artwork. The playable arenas now use a shared procedural illustration renderer: a lit Pong table, desert tanks, garden Bomber arena, landscaped racing circuit and an orbital station for Gravity Duel. Board games use dimensional tiles, SVG marks and a wood-grain Gomoku board. These are actual gameplay visuals, not just card images. Light and dark UI modes remain available.

Existing installations should run `npm run db:setup` once to add Gravity Duel to the MySQL catalog before saving registered matches. This setup was successfully run against the configured development database during implementation.

## Rendering and loading optimization

Arena backgrounds are painted to one reusable 800×500 canvas texture per game instance. Only players, effects and moving obstacles are redrawn each frame. Bomber compares its tile values to a saved snapshot and rebuilds that texture when crates change, including in-place local changes and incoming online snapshots. The texture is freed with the scene. A cache costs approximately 1.6 MB of raw RGBA pixel memory per active instance.

React receives small score/result summaries only when their values change. Continuous physics and rendering stay inside Phaser. Finished arenas stop rebuilding their foreground drawing commands. Input changes are sent at up to 20 Hz; a 100 ms heartbeat keeps held keys active within the server's 300 ms expiry. Volatile input packets avoid replaying queued movement after congestion. The existing authoritative simulation and snapshot rates are preserved.

Account/detail/ranking pages and Socket.IO Client load on demand. The navigation remains visible while route chunks load. Motion animation features are loaded separately, and card entrance animations respect reduced-motion preferences.

Measured on this machine in headless Chromium, using two-second idle samples after countdown:

| Game | Canvas fill/stroke/drawImage calls per frame before | After |
| --- | ---: | ---: |
| Tank | 208 | 53 |
| Bomber | 1,145 | 19 |
| Racing | 347 | 29 |

The production main JavaScript entry decreased from 523,557 to 389,175 bytes (about 26%). Deferred chunks are loaded when needed; this entry-size reduction is not a claim about total downloaded bytes for every route. These measurements count drawing API calls and bundle size; they do not certify FPS, CPU, battery life or physical-device/WAN performance.

Run `node scripts/benchmark-client.mjs latest` after `npm run build` to repeat the canvas sample. It owns a temporary Vite process on port 5176, uses separate local-game pages, and writes the report under ignored `.local/performance-latest.json`.

## Assets and licenses

All game illustrations and in-game geometric artwork were created in code for this project. No third-party game characters, logos, sound recordings or game art are copied. Lucide icons use the ISC license; Phaser uses MIT. Other package license notices remain in their packages/lockfile; retain applicable notices when distributing dependencies. The project itself has no license grant selected yet.
