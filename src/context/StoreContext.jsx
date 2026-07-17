import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { dataApi } from '../utils/api.js';
import { toast } from '../utils/toast.jsx';

const StoreContext = createContext(null);

/**
 * Build a setter that:
 *  - applies an updater function locally (optimistic)
 *  - syncs with the backend (upsert/delete based on diff)
 *  - on error, refetches from server to recover
 *
 * Items are identified by `id`. Diff = added/updated rows + removed rows.
 */
function makeSyncedSetter({ entity, setItems, fetchAll }) {
  return (updater) => {
    // Use the functional setState so prev is always React's latest state (no stale closure)
    setItems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const nextIds = new Set(next.map(x => x.id));
      const removed = prev.filter(x => !nextIds.has(x.id));
      const upserts = next.filter(x => {
        const old = prev.find(p => p.id === x.id);
        return !old || JSON.stringify(old) !== JSON.stringify(x);
      });
      Promise.all([
        ...removed.map(x => dataApi.remove(entity, x.id)),
        ...upserts.map(x => dataApi.upsert(entity, x)),
      ]).catch(async (e) => {
        console.error(`[StoreContext] sync ${entity} failed`, e);
        toast.error(`Erreur sauvegarde ${entity}: ${e.message || e}`);
        try {
          const server = await fetchAll();
          setItems(server);
        } catch (e2) {
          console.error(`[StoreContext] recover ${entity} failed`, e2);
        }
      });
      return next;
    });
  };
}

export function StoreProvider({ children }) {
  const { user, loading: authLoading, allowedShops } = useAuth();

  const [shops,        setShopsState]        = useState([]);
  const [products,     setProductsState]     = useState([]);
  const [stockPoints,  setStockPointsState]  = useState([]);
  const [stockByPoint, setStockByPointState] = useState({});
  const [clients,      setClientsState]      = useState([]);
  const [orders,       setOrdersState]       = useState([]);
  const [invoices,     setInvoicesState]     = useState([]);
  const [transfers,    setTransfersState]    = useState([]);
  const [categories,   setCategoriesState]   = useState([]);
  const [loading,      setLoading]           = useState(true);

  // ─── Initial fetch on user change ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Clear state on logout
      setShopsState([]); setProductsState([]); setStockPointsState([]);
      setStockByPointState({}); setClientsState([]); setOrdersState([]);
      setInvoicesState([]); setTransfersState([]); setCategoriesState([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all([
      dataApi.list('shops'),
      dataApi.list('products'),
      dataApi.list('stock-points'),
      dataApi.getStock(),
      dataApi.list('clients'),
      dataApi.list('orders'),
      dataApi.list('invoices'),
      dataApi.list('transfers'),
      dataApi.list('categories'),
    ]).then(([s, p, sp, sbp, c, o, inv, t, cat]) => {
      if (cancelled) return;
      setShopsState(s);
      setProductsState(p);
      setStockPointsState(sp);
      setStockByPointState(sbp || {});
      setClientsState(c);
      setOrdersState(o);
      setInvoicesState(inv);
      setTransfersState(t);
      setCategoriesState((cat || []).map(c => c.name).filter(Boolean));
    }).catch(e => {
      console.error('[StoreContext] initial fetch failed', e);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // ─── Synced setters (write-through to API) ────────────────────────────────
  const setShops        = useMemo(() => makeSyncedSetter({ entity: 'shops',         setItems: setShopsState,        fetchAll: () => dataApi.list('shops') }), []);
  const setProducts     = useMemo(() => makeSyncedSetter({ entity: 'products',      setItems: setProductsState,     fetchAll: () => dataApi.list('products') }), []);
  const setStockPoints  = useMemo(() => makeSyncedSetter({ entity: 'stock-points',  setItems: setStockPointsState,  fetchAll: () => dataApi.list('stock-points') }), []);
  const setClients      = useMemo(() => makeSyncedSetter({ entity: 'clients',       setItems: setClientsState,      fetchAll: () => dataApi.list('clients') }), []);
  const setOrders       = useMemo(() => makeSyncedSetter({ entity: 'orders',        setItems: setOrdersState,       fetchAll: () => dataApi.list('orders') }), []);
  const setInvoices     = useMemo(() => makeSyncedSetter({ entity: 'invoices',      setItems: setInvoicesState,     fetchAll: () => dataApi.list('invoices') }), []);
  const setTransfers    = useMemo(() => makeSyncedSetter({ entity: 'transfers',     setItems: setTransfersState,    fetchAll: () => dataApi.list('transfers') }), []);

  // Categories ({name} as PK) — functional setter
  const setCategories = useMemo(() => (updater) => {
    setCategoriesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const added = next.filter(n => !prev.includes(n));
      const removed = prev.filter(n => !next.includes(n));
      Promise.all([
        ...removed.map(n => dataApi.remove('categories', n)),
        ...added.map(n => dataApi.upsert('categories', { name: n })),
      ]).catch(e => {
        console.error('[categories]', e);
        toast.error(`Erreur sauvegarde catégories: ${e.message || e}`);
      });
      return next;
    });
  }, []);

  // Stock by point — bulk replace via PUT /data/stock
  const setStockByPoint = useMemo(() => (updater) => {
    setStockByPointState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dataApi.putStock(next).catch(e => {
        console.error('[stock]', e);
        toast.error(`Erreur sauvegarde stock: ${e.message || e}`);
      });
      return next;
    });
  }, []);

  // ─── Shop access filter (frontend safety) ─────────────────────────────────
  const isRestricted = (allowedShops?.length || 0) > 0 && user?.role !== 'admin';
  const allowedSet   = useMemo(() => new Set(allowedShops || []), [allowedShops]);
  const visibleShops       = useMemo(() => isRestricted ? shops.filter(s => allowedSet.has(s.id)) : shops, [shops, allowedSet, isRestricted]);
  const visibleShopIds     = useMemo(() => new Set(visibleShops.map(s => s.id)), [visibleShops]);
  const visibleStockPoints = useMemo(() => stockPoints.filter(sp => visibleShopIds.has(sp.shopId)), [stockPoints, visibleShopIds]);
  const visibleOrders      = useMemo(() => orders.filter(o => !o.shopId || visibleShopIds.has(o.shopId)), [orders, visibleShopIds]);
  const visibleInvoices    = useMemo(() => invoices.filter(i => !i.shopId || visibleShopIds.has(i.shopId)), [invoices, visibleShopIds]);
  const visibleTransfers   = useMemo(() => transfers.filter(t => !t.fromShopId || visibleShopIds.has(t.fromShopId)), [transfers, visibleShopIds]);
  const visibleClientIds   = useMemo(() => new Set(visibleOrders.map(o => o.clientId).filter(Boolean)), [visibleOrders]);
  const visibleClients     = useMemo(() =>
    isRestricted ? clients.filter(c => visibleClientIds.has(c.id)) : clients,
    [clients, visibleClientIds, isRestricted]
  );

  // ─── Stock helpers ────────────────────────────────────────────────────────
  function totalStockForProduct(productId) {
    const row = stockByPoint[productId] || {};
    return Object.values(row).reduce((s, v) => s + v, 0);
  }
  function totalStockForShop(shopId) {
    const pts = visibleStockPoints.filter(sp => sp.shopId === shopId).map(sp => sp.id);
    return products.reduce((sum, p) => {
      const row = stockByPoint[p.id] || {};
      return sum + pts.reduce((s, spId) => s + (row[spId] || 0), 0);
    }, 0);
  }
  function stockForPoint(spId) {
    return products.reduce((sum, p) => sum + ((stockByPoint[p.id] || {})[spId] || 0), 0);
  }
  function stockForProductByShop(productId, shopId) {
    const pts = visibleStockPoints.filter(sp => sp.shopId === shopId).map(sp => sp.id);
    const row = stockByPoint[productId] || {};
    return pts.reduce((s, spId) => s + (row[spId] || 0), 0);
  }

  // Dynamic stock stats for a stock point.
  //
  // Initial = photo FIGÉE du stock de départ. Ne bouge JAMAIS sur un transfert
  //           inter-points ni une commande — uniquement sur un réapprovisionnement
  //           (entrée de nouvelles quantités, loggée avec fromPointId = null).
  //     initial = stockInitial (saisi à la création/modif du point)
  //             + Σ réappros arrivant ici (toPointId = spId ET fromPointId = null)
  //
  // Actuels = stock réel disponible, recalculé dynamiquement :
  //     actuel = initial
  //            + Σ transferts inter-points entrants (toPointId = spId, fromPointId ≠ null)
  //            − Σ transferts inter-points sortants (fromPointId = spId)
  //            − vendu
  //
  // Vendus  = Σ qty des commandes livrées/préparées dont lineItem.pointId = spId
  //
  // Un réappro n'a pas de fromPointId → jamais compté comme "sortant". Un transfert
  // inter-points a fromPointId ET toPointId → jamais compté dans Initial. Pas de
  // double comptage.
  function computeStockPointStats(spId) {
    const sp = stockPoints.find(p => p.id === spId);
    const base = sp?.stockInitial || 0;

    const reapproIn = transfers
      .filter(t => t.toPointId === spId && (t.fromPointId == null || t.fromPointId === ''))
      .reduce((s, t) => s + (t.qty || 0), 0);
    const transfersIn = transfers
      .filter(t => t.toPointId === spId && t.fromPointId != null && t.fromPointId !== '')
      .reduce((s, t) => s + (t.qty || 0), 0);
    const transfersOut = transfers
      .filter(t => t.fromPointId === spId)
      .reduce((s, t) => s + (t.qty || 0), 0);

    // Initial figé (+ réappros seulement)
    const initial = base + reapproIn;

    const vendu = orders.reduce((sum, o) => {
      if (o.status !== 'livrée' && o.status !== 'préparée') return sum;
      return sum + (o.lineItems || [])
        .filter(item => item.pointId === spId)
        .reduce((s, item) => s + (item.qty || 0), 0);
    }, 0);

    const actuel = initial + transfersIn - transfersOut - vendu;

    return { initial, vendu, actuel };
  }

  // ─── Stock consume / restore (livraison de commande) ─────────────────────
  function consumeStockForOrder(lineItems, shopId) {
    const breakdown = {};
    const pointDelta = {};

    setStockByPointState(prev => {
      const next = { ...prev };
      for (const item of lineItems) {
        const row = { ...(next[item.productId] || {}) };
        const targetPoint = item.pointId
          || (stockPoints.filter(sp => sp.shopId === shopId).sort((a, b) => (row[b.id] || 0) - (row[a.id] || 0))[0]?.id);
        if (!targetPoint) continue;
        row[targetPoint] = (row[targetPoint] || 0) - item.qty;
        breakdown[item.productId] = breakdown[item.productId] || {};
        breakdown[item.productId][targetPoint] = (breakdown[item.productId][targetPoint] || 0) + item.qty;
        pointDelta[targetPoint] = (pointDelta[targetPoint] || 0) + item.qty;
        next[item.productId] = row;
      }
      // Persist to backend
      dataApi.putStock(next).catch(e => console.error('[stock consume]', e));
      return next;
    });

    // Update aggregates on stock_points (vendu / actuel)
    setStockPoints(prev => prev.map(sp => {
      const d = pointDelta[sp.id];
      if (!d) return sp;
      return { ...sp, stockVendu: (sp.stockVendu || 0) + d, stockActuel: (sp.stockActuel || 0) - d };
    }));

    return breakdown;
  }

  function restoreStockFromBreakdown(breakdown) {
    if (!breakdown) return;
    const pointDelta = {};
    setStockByPointState(prev => {
      const next = { ...prev };
      for (const productId in breakdown) {
        const row = { ...(next[productId] || {}) };
        for (const spId in breakdown[productId]) {
          const qty = breakdown[productId][spId];
          row[spId] = (row[spId] || 0) + qty;
          pointDelta[spId] = (pointDelta[spId] || 0) + qty;
        }
        next[productId] = row;
      }
      dataApi.putStock(next).catch(e => console.error('[stock restore]', e));
      return next;
    });
    setStockPoints(prev => prev.map(sp => {
      const d = pointDelta[sp.id];
      if (!d) return sp;
      return { ...sp, stockVendu: Math.max(0, (sp.stockVendu || 0) - d), stockActuel: (sp.stockActuel || 0) + d };
    }));
  }

  return (
    <StoreContext.Provider value={{
      // Filtered views (visible)
      shops:        visibleShops,        setShops,
      products,                          setProducts,
      stockPoints:  visibleStockPoints,  setStockPoints,
      stockByPoint,                      setStockByPoint,
      clients:      visibleClients,      setClients,
      orders:       visibleOrders,       setOrders,
      invoices:     visibleInvoices,     setInvoices,
      transfers:    visibleTransfers,    setTransfers,
      categories,                        setCategories,
      // Raw data (admin / lookup)
      allShops: shops,
      // helpers
      totalStockForProduct,
      totalStockForShop,
      stockForPoint,
      stockForProductByShop,
      computeStockPointStats,
      consumeStockForOrder,
      restoreStockFromBreakdown,
      // state
      loading,
      isRestricted,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
