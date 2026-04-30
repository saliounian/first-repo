import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// DB is initialized on import (schema creation runs immediately)
import db from './db.js';
import { seed } from './seed.js';

import authRoutes  from './routes/auth.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import logsRoutes  from './routes/logs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

// Run seed on first launch
seed();

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));

// ─── Body parser ──────────────────────────────────────────────────────────
app.use(express.json());

// ─── Sessions ─────────────────────────────────────────────────────────────
// Using MemoryStore (adequate for development).
// For production: replace with connect-sqlite3 or connect-pg-simple.
app.use(session({
  secret: 'gestcopta-rbac-secret-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: false,       // set to true with HTTPS in production
    maxAge: 24 * 60 * 60 * 1000  // 24h max; per-user timeout enforced in middleware
  }
}));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/logs',  logsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ─── 404 / Error handlers ─────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route non trouvée.' }));
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Erreur serveur interne.' });
});

app.listen(PORT, () => {
  console.log(`\n✅  gestCopta API  →  http://localhost:${PORT}`);
  console.log(`    Dev frontend    →  http://localhost:5173`);
  console.log(`    Admin:  admin@gestcopta.sn  /  Admin1234!\n`);
});
