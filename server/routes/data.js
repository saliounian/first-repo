import { Router } from 'express';
import supabase from '../db.js';
import { requireAuth, getUserShops } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ─── Helpers conversion camelCase ↔ snake_case (top-level only) ──────────────
const camelToSnake = k => k.replace(/[A-Z]/g, l => '_' + l.toLowerCase());
const snakeToCamel = k => k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());

function snakeKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const r = {};
  for (const k in obj) r[camelToSnake(k)] = obj[k];
  return r;
}

function camelKeys(obj) {
  if (Array.isArray(obj)) return obj.map(camelKeys);
  if (obj === null || typeof obj !== 'object') return obj;
  const r = {};
  for (const k in obj) r[snakeToCamel(k)] = obj[k];
  return r;
}

// ─── Entity config ──────────────────────────────────────────────────────────
// shopFilter: column to filter by user's allowed shops (null = no filter)
const ENTITIES = {
  shops:           { table: 'shops',          shopFilter: 'id' },
  products:        { table: 'products',       shopFilter: null },
  'stock-points':  { table: 'stock_points',   shopFilter: 'shop_id' },
  clients:         { table: 'clients',        shopFilter: null },
  orders:          { table: 'orders',         shopFilter: 'shop_id' },
  invoices:        { table: 'invoices',       shopFilter: 'shop_id' },
  transfers:       { table: 'transfers',      shopFilter: 'from_shop_id' },
  categories:      { table: 'categories',     shopFilter: null, pkCol: 'name' },
};

// Restrict shop_filter list to user's allowed shops (admin = unlimited)
async function allowedFilter(req, cfg) {
  if (!cfg.shopFilter) return null;
  if (req.user.role_nom === 'admin') return null;
  const shops = await getUserShops(req.user.id);
  if (shops.length === 0) return null; // no restriction set = all allowed
  return { col: cfg.shopFilter, vals: shops };
}

// ─── GET /api/data/:entity ──────────────────────────────────────────────────
router.get('/:entity', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });

  let q = supabase.from(cfg.table).select('*');
  const filt = await allowedFilter(req, cfg);
  if (filt) q = q.in(filt.col, filt.vals);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data || []));
});

// ─── POST /api/data/:entity (upsert) ────────────────────────────────────────
router.post('/:entity', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const payload = snakeKeys(req.body);
  const { data, error } = await supabase.from(cfg.table).upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data));
});

// ─── PUT /api/data/:entity/:id (update) ─────────────────────────────────────
router.put('/:entity/:id', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const pk = cfg.pkCol || 'id';
  const payload = snakeKeys(req.body);
  const { data, error } = await supabase.from(cfg.table).update(payload).eq(pk, req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data));
});

// ─── DELETE /api/data/:entity/:id ───────────────────────────────────────────
router.delete('/:entity/:id', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const pk = cfg.pkCol || 'id';
  const { error } = await supabase.from(cfg.table).delete().eq(pk, req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── Stock by point — special endpoints (composite PK) ──────────────────────
// GET /api/data/stock — returns nested object: { productId: { pointId: qty } }
router.get('/stock', async (_req, res) => {
  const { data, error } = await supabase.from('stock_by_point').select('*');
  if (error) return res.status(500).json({ error: error.message });
  const nested = {};
  for (const row of (data || [])) {
    if (!nested[row.product_id]) nested[row.product_id] = {};
    nested[row.product_id][row.point_id] = row.qty;
  }
  res.json(nested);
});

// PUT /api/data/stock — receives full nested map, replaces entire table
router.put('/stock', async (req, res) => {
  const map = req.body || {};
  const rows = [];
  for (const productId in map) {
    for (const pointId in map[productId]) {
      rows.push({ product_id: productId, point_id: pointId, qty: map[productId][pointId] });
    }
  }
  // Replace all rows: delete then insert (transaction-like via Supabase)
  await supabase.from('stock_by_point').delete().neq('product_id', '___never___');
  if (rows.length > 0) {
    const { error } = await supabase.from('stock_by_point').insert(rows);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true });
});

// PATCH /api/data/stock/cell — update single cell { productId, pointId, qty }
router.patch('/stock/cell', async (req, res) => {
  const { productId, pointId, qty } = req.body;
  if (!productId || !pointId) return res.status(400).json({ error: 'productId + pointId required' });
  const { error } = await supabase.from('stock_by_point').upsert({ product_id: productId, point_id: pointId, qty: qty || 0 });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
