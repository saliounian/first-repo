import { Router } from 'express';
import supabase from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/roles ───────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('roles').select('*').order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── GET /api/roles/permissions/all ──────────────────────────────────────────
// Must be before /:id route to avoid conflict
router.get('/permissions/all', async (_req, res) => {
  const { data, error } = await supabase.from('permissions').select('*').order('module').order('action');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── GET /api/roles/:id/permissions ──────────────────────────────────────────
router.get('/:id/permissions', async (req, res) => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(id, module, action, description)')
    .eq('role_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(r => r.permissions));
});

export default router;
