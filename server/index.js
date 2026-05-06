import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes  from './routes/auth.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import logsRoutes  from './routes/logs.js';

export const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ─── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/logs',  logsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route non trouvée.' }));
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Erreur serveur interne.' });
});

// ─── Local dev server ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n✅  Salih Holding API  →  http://localhost:${PORT}`);
  });
}
