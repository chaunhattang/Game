import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { api } from './routes/api.js';
import { session } from './middleware/auth.js';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", ...config.origins],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
    })
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.origins.includes(origin)),
      credentials: true,
    })
  );
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 240,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Too many requests.' },
    })
  );
  app.use(express.json({ limit: '16kb' }), cookieParser(), session);
  app.use((req, res, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      !config.origins.includes(req.headers.origin)
    )
      return res.status(403).json({ error: 'Origin not allowed.' });
    next();
  });
  app.use('/api', api);
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  if (config.production) {
    const dist = fileURLToPath(new URL('../../client/dist', import.meta.url));
    app.use(express.static(dist));
    app.get('/{*path}', (req, res) => res.sendFile(resolve(dist, 'index.html')));
  }
  app.use((err, req, res, next) => {
    if (err.name === 'ZodError')
      return res.status(400).json({ error: err.issues.map((i) => i.message).join(' ') });
    const status = err.status || 500;
    if (status >= 500)
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'request_failed',
          path: req.path,
          code: err.code || err.name,
        })
      );
    res
      .status(status)
      .json({ error: status === 500 ? 'An unexpected server error occurred.' : err.message });
  });
  return app;
}
