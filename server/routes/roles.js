import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/roles ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY id').all();
  res.json(roles);
});

// ─── GET /api/roles/:id/permissions ──────────────────────────────────────────
router.get('/:id/permissions', (req, res) => {
  const perms = db.prepare(`
    SELECT p.*
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.module, p.action
  `).all(req.params.id);
  res.json(perms);
});

// ─── GET /api/roles/permissions/all ──────────────────────────────────────────
router.get('/permissions/all', (req, res) => {
  const perms = db.prepare('SELECT * FROM permissions ORDER BY module, action').all();
  res.json(perms);
});

export default router;
