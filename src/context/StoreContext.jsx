import { createContext, useContext, useMemo } from 'react';
import { usePersistedState } from '../utils/usePersistedState.js';
import { useAuth } from './AuthContext.jsx';
import { KEYS, INIT } from '../data/store.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { allowedShops, user } = useAuth();

  const [shops,        setShops]        = usePersistedState(KEYS.shops,        INIT.shops);
  const [products,     setProducts]     = usePersistedState(KEYS.products,     INIT.products);
  const [stockPoints,  setStockPoints]  = usePersistedState(KEYS.stockPoints,  INIT.stockPoints);
  const [stockByPoint, setStockByPoint] = usePersistedState(KEYS.stockByPoint, INIT.stockByPoint);
  const [clients,      setClients]      = usePersistedState(KEYS.clients,      INIT.clients);
  const [orders,       setOrders]       = usePersistedState(KEYS.orders,       INIT.orders);
  const [invoices,     setInvoices]     = usePersistedState(KEYS.invoices,     INIT.invoices);
  const [transfers,    setTransfers]    = usePersistedState(KEYS.transfers,    INIT.transfers);
  const [categories,   setCategories]   = usePersistedState(KEYS.categories,   INIT.categories);

  // ─── Shop access filter ───────────────────────────────────────────────────
  // [] = toutes boutiques (admin ou pas de restriction)
  const isRestricted = allowedShops.length > 0 && user?.role !== 'admin';
  const allowedSet   = useMemo(() => new Set(allowedShops), [allowedShops]);

  function shopAllowed(shopId) {
    return !isRestricted || allowedSet.has(shopId);
  }

  // ─── Filtered views (lecture seule) ──────────────────────────────────────
  const visibleShops       = useMemo(() => shops.filter(s => shopAllowed(s.id)), [shops, allowedSet, isRestricted]);
  const visibleShopIds     = useMemo(() => new Set(visibleShops.map(s => s.id)), [visibleShops]);
  const visibleStockPoints = useMemo(() => stockPoints.filter(sp => visibleShopIds.has(sp.shopId)), [stockPoints, visibleShopIds]);
  const visibleOrders      = useMemo(() => orders.filter(o => !o.shopId || visibleShopIds.has(o.shopId)), [orders, visibleShopIds]);
  const visibleInvoices    = useMemo(() => invoices.filter(i => !i.shopId || visibleShopIds.has(i.shopId)), [invoices, visibleShopIds]);
  const visibleTransfers   = useMemo(() => transfers.filter(t => !t.fromShopId || visibleShopIds.has(t.fromShopId)), [transfers, visibleShopIds]);
  // Clients: filtrés par boutiques des commandes passées
  const visibleClientIds   = useMemo(() => new Set(visibleOrders.map(o => o.clientId).filter(Boolean)), [visibleOrders]);
  const visibleClients     = useMemo(() =>
    isRestricted ? clients.filter(c => visibleClientIds.has(c.id)) : clients,
    [clients, visibleClientIds, isRestricted]
  );

  // ─── Stock consume / restore (livraison de commande) ─────────────────────
  // Chaque lineItem PORTE son pointId explicite : on déduit du point indiqué.
  // Synchronise aussi stockPoints[*].stockVendu et stockActuel (agrégats).
  // Retourne breakdown { productId: { pointId: qty } } pour pouvoir restaurer.
  function consumeStockForOrder(lineItems, shopId) {
    const breakdown = {};
    const pointDelta = {}; // { pointId: totalQty } pour MAJ aggregates

    setStockByPoint(prev => {
      const next = { ...prev };
      for (const item of lineItems) {
        const row = { ...(next[item.productId] || {}) };
        // Privilégier le pointId explicite ; fallback FIFO si absent (anciennes commandes)
        const targetPoint = item.pointId
          || (stockPoints.filter(sp => sp.shopId === shopId).sort((a, b) => (row[b.id] || 0) - (row[a.id] || 0))[0]?.id);
        if (!targetPoint) continue;
        row[targetPoint] = (row[targetPoint] || 0) - item.qty;
        breakdown[item.productId] = breakdown[item.productId] || {};
        breakdown[item.productId][targetPoint] = (breakdown[item.productId][targetPoint] || 0) + item.qty;
        pointDelta[targetPoint] = (pointDelta[targetPoint] || 0) + item.qty;
        next[item.productId] = row;
      }
      return next;
    });

    // MAJ aggregates stockPoints : stockVendu += qty, stockActuel -= qty
    setStockPoints(prev => prev.map(sp => {
      const d = pointDelta[sp.id];
      if (!d) return sp;
      return {
        ...sp,
        stockVendu:  (sp.stockVendu  || 0) + d,
        stockActuel: (sp.stockActuel || 0) - d,
      };
    }));

    return breakdown;
  }

  // Restaure le stock à partir d'un breakdown précédemment retourné par consumeStockForOrder
  function restoreStockFromBreakdown(breakdown) {
    if (!breakdown) return;
    const pointDelta = {};
    setStockByPoint(prev => {
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
      return next;
    });

    // Restaurer aggregates : stockVendu -= qty, stockActuel += qty
    setStockPoints(prev => prev.map(sp => {
      const d = pointDelta[sp.id];
      if (!d) return sp;
      return {
        ...sp,
        stockVendu:  Math.max(0, (sp.stockVendu  || 0) - d),
        stockActuel: (sp.stockActuel || 0) + d,
      };
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function totalStockForProduct(productId) {
    const row = stockByPoint[productId] || {};
    const pts = isRestricted
      ? visibleStockPoints.map(sp => sp.id)
      : Object.keys(row);
    return pts.reduce((s, spId) => s + (row[spId] || 0), 0);
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

  return (
    <StoreContext.Provider value={{
      // Raw setters (écriture — pour l'admin)
      shops:        visibleShops,   setShops,
      products,                     setProducts,
      stockPoints:  visibleStockPoints, setStockPoints,
      stockByPoint,                 setStockByPoint,
      clients:      visibleClients, setClients,
      orders:       visibleOrders,  setOrders,
      invoices:     visibleInvoices,setInvoices,
      transfers:    visibleTransfers,setTransfers,
      categories,                   setCategories,
      // Pour les menus boutique (admin voit tout, user voit les siennes)
      allShops: shops,
      // helpers
      totalStockForProduct,
      totalStockForShop,
      stockForPoint,
      consumeStockForOrder,
      restoreStockFromBreakdown,
      stockForProductByShop,
      shopAllowed,
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
