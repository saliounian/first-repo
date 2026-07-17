import { Router } from 'express';
import supabase from '../db.js';
import { requireAuth, getUserShops } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ─── Helpers ────────────────────────────────────────────────────────────────
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

const ENTITIES = {
  // orderBy : tri par défaut au listage (le plus récent en premier).
  //           null = pas de colonne created_at (ex: categories).
  shops:           { table: 'shops',          shopFilter: 'id',           orderBy: 'created_at' },
  products:        { table: 'products',       shopFilter: null,           orderBy: 'created_at' },
  'stock-points':  { table: 'stock_points',   shopFilter: 'shop_id',      orderBy: 'created_at' },
  clients:         { table: 'clients',        shopFilter: null,           orderBy: 'created_at' },
  orders:          { table: 'orders',         shopFilter: 'shop_id',      orderBy: 'created_at' },
  invoices:        { table: 'invoices',       shopFilter: 'shop_id',      orderBy: 'created_at' },
  transfers:       { table: 'transfers',      shopFilter: 'from_shop_id', orderBy: 'created_at' },
  categories:      { table: 'categories',     shopFilter: null, pkCol: 'name', orderBy: null },
};

async function allowedFilter(req, cfg) {
  if (!cfg.shopFilter) return null;
  if (req.user.role_nom === 'admin') return null;
  const shops = await getUserShops(req.user.id);
  if (shops.length === 0) return null;
  return { col: cfg.shopFilter, vals: shops };
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTANT : routes spécifiques (/stock, /stock/cell) AVANT les routes
// génériques (/:entity), sinon Express matche /stock comme entity → 404
// → Promise.all dans StoreContext échoue → tout l'état reste vide.
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET /api/data/stock ────────────────────────────────────────────────────
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

// ─── PUT /api/data/stock — upsert (pas de delete race condition) ─────────────
router.put('/stock', async (req, res) => {
  const map = req.body || {};
  const rows = [];
  for (const productId in map) {
    for (const pointId in map[productId]) {
      rows.push({ product_id: productId, point_id: pointId, qty: map[productId][pointId] || 0 });
    }
  }
  if (rows.length === 0) {
    await supabase.from('stock_by_point').delete().neq('product_id', '___never___');
    return res.json({ ok: true });
  }
  const { error: upErr } = await supabase.from('stock_by_point').upsert(rows, { onConflict: 'product_id,point_id' });
  if (upErr) return res.status(500).json({ error: upErr.message });

  // Supprimer les cellules absentes du payload
  const { data: existing } = await supabase.from('stock_by_point').select('product_id,point_id');
  const sentKeys = new Set(rows.map(r => `${r.product_id}::${r.point_id}`));
  const toDelete = (existing || []).filter(r => !sentKeys.has(`${r.product_id}::${r.point_id}`));
  for (const r of toDelete) {
    await supabase.from('stock_by_point').delete().eq('product_id', r.product_id).eq('point_id', r.point_id);
  }
  res.json({ ok: true });
});

// ─── PATCH /api/data/stock/cell ─────────────────────────────────────────────
router.patch('/stock/cell', async (req, res) => {
  const { productId, pointId, qty } = req.body;
  if (!productId || !pointId) return res.status(400).json({ error: 'productId + pointId requis' });
  const { error } = await supabase.from('stock_by_point').upsert(
    { product_id: productId, point_id: pointId, qty: qty || 0 },
    { onConflict: 'product_id,point_id' }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── Generic CRUD (déclarés APRÈS les routes spécifiques) ─────────────────
router.get('/:entity', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  let q = supabase.from(cfg.table).select('*');
  const filt = await allowedFilter(req, cfg);
  if (filt) q = q.in(filt.col, filt.vals);
  if (cfg.orderBy) q = q.order(cfg.orderBy, { ascending: false });
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data || []));
});

router.post('/:entity', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const payload = snakeKeys(req.body);
  const { data, error } = await supabase.from(cfg.table).upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data));
});

router.put('/:entity/:id', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const pk = cfg.pkCol || 'id';
  const payload = snakeKeys(req.body);
  const { data, error } = await supabase.from(cfg.table).update(payload).eq(pk, req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(camelKeys(data));
});

router.delete('/:entity/:id', async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: 'Entity not found' });
  const pk = cfg.pkCol || 'id';
  const { error } = await supabase.from(cfg.table).delete().eq(pk, req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
