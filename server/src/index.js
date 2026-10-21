import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { pool, databaseReady } from './config/db.js';
import { attachRooms } from './sockets/rooms.js';
const http = createServer(createApp());
const io = new Server(http, {
  cors: { origin: config.origins, credentials: true },
  allowRequest: (req, cb) =>
    cb(null, !req.headers.origin || config.origins.includes(req.headers.origin)),
  maxHttpBufferSize: 16384,
});
const manager = attachRooms(io);
http.listen(config.port, config.host, async () =>
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'listening',
      port: config.port,
      database: (await databaseReady()) ? 'connected' : 'unavailable',
    })
  )
);
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => {
    console.error(JSON.stringify({ level: 'error', event: 'shutdown_timeout' }));
    process.exit(1);
  }, 10000);
  deadline.unref();
  manager.close();
  await new Promise((resolve) => io.close(resolve));
  await manager.drain();
  await pool.end();
  clearTimeout(deadline);
  console.log(JSON.stringify({ level: 'info', event: 'shutdown_complete' }));
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
