import { Router } from 'express';
import supabase from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/logs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { userId, module, resultat, dateFrom, dateTo, limit = 100, offset = 0 } = req.query;

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (userId)   query = query.eq('user_id', userId);
  if (module)   query = query.eq('module', module);
  if (resultat) query = query.eq('resultat', resultat);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

  const { data: logs, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ logs, total: count, limit: parseInt(limit), offset: parseInt(offset) });
});

// ─── GET /api/logs/users ─────────────────────────────────────────────────────
router.get('/users', async (_req, res) => {
  const { data } = await supabase
    .from('activity_logs')
    .select('user_id, user_nom, user_email')
    .not('user_id', 'is', null)
    .order('user_nom');

  // Deduplicate
  const seen = new Set();
  const users = (data || []).filter(r => {
    if (seen.has(r.user_id)) return false;
    seen.add(r.user_id); return true;
  });
  res.json(users);
});

// ─── GET /api/logs/modules ───────────────────────────────────────────────────
router.get('/modules', async (_req, res) => {
  const { data } = await supabase.from('activity_logs').select('module').order('module');
  const modules = [...new Set((data || []).map(r => r.module))];
  res.json(modules);
});

export default router;
