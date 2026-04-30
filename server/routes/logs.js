import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/logs ────────────────────────────────────────────────────────────
// Query params: userId, module, resultat, dateFrom, dateTo, limit, offset
router.get('/', (req, res) => {
  const { userId, module, resultat, dateFrom, dateTo,
          limit = 100, offset = 0 } = req.query;

  const conditions = [];
  const params = [];

  if (userId) { conditions.push('l.user_id = ?'); params.push(userId); }
  if (module)  { conditions.push('l.module = ?'); params.push(module); }
  if (resultat){ conditions.push('l.resultat = ?'); params.push(resultat); }
  if (dateFrom){ conditions.push("date(l.created_at) >= date(?)"); params.push(dateFrom); }
  if (dateTo)  { conditions.push("date(l.created_at) <= date(?)"); params.push(dateTo); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const logs = db.prepare(`
    SELECT l.id, l.user_id, l.user_nom, l.user_email,
           l.action, l.module, l.ancienne_valeur, l.nouvelle_valeur,
           l.resultat, l.raison_echec, l.created_at
    FROM activity_logs l
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM activity_logs l ${where}
  `).get(...params).cnt;

  res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// ─── GET /api/logs/users ─────────────────────────────────────────────────────
// Returns list of distinct users who have logs (for filter dropdown)
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT DISTINCT user_id, user_nom, user_email
    FROM activity_logs
    WHERE user_id IS NOT NULL
    ORDER BY user_nom
  `).all();
  res.json(users);
});

// ─── GET /api/logs/modules ───────────────────────────────────────────────────
router.get('/modules', (req, res) => {
  const modules = db.prepare(`
    SELECT DISTINCT module FROM activity_logs ORDER BY module
  `).all().map(r => r.module);
  res.json(modules);
});

export default router;
