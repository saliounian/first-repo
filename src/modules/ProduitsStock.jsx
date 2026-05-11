import { useState } from 'react';
import { Search, Plus, ArrowRight, Edit2, Trash2, CheckCircle, X, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, Badge, Tabs } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { uid } from '../data/store.js';
import { fmtFcfa } from '../utils/format.js';

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto">
        <Package size={22} className="text-muted" />
      </div>
      <div className="text-muted text-sm">Aucun produit. Commencez par en ajouter un.</div>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl">
        <Plus size={14} /> Nouveau produit
      </button>
    </div>
  );
}

// ─── Product modal ────────────────────────────────────────────────────────────
function ProductModal({ product, shops, stockPoints, categories = [], onClose, onSave }) {
  const isEdit = !!product;
  const [f, setF] = useState({
    name:     product?.name     || '',
    sku:      product?.sku      || '',
    category: product?.category || '',
    price:    product?.price    || '',
    boutique: '',
    point:    '',
    qtyInit:  0,
  });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const shopPts = stockPoints.filter(sp => sp.shopId === f.boutique);

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Produit modifié' : 'Produit ajouté'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom du produit *</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Riz parfumé 25kg" className="field-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">SKU / Référence</label>
              <input value={f.sku} onChange={e => set('sku', e.target.value)} placeholder="RIZ-25" className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Catégorie *</label>
              <input list="cat-list" value={f.category} onChange={e => set('category', e.target.value)}
                placeholder="Saisir ou choisir…" className="field-input"/>
              <datalist id="cat-list">
                {[...new Set([...categories, f.category].filter(Boolean))].map(c => <option key={c} value={c}/>)}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Prix de vente (FCFA)</label>
              <input type="number" value={f.price} onChange={e => set('price', +e.target.value)} placeholder="14500" className="field-input" />
            </div>
          </div>

          {!isEdit && shops.length > 0 && (
            <div className="border-t border-line/50 pt-3 space-y-3">
              <div className="text-xs font-semibold text-ink uppercase tracking-wider">Stock initial (optionnel)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique d'origine</label>
                  <select value={f.boutique} onChange={e => { set('boutique', e.target.value); set('point', ''); }} className="field-input">
                    <option value="">Aucune</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {f.boutique && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                    <select value={f.point} onChange={e => set('point', e.target.value)} className="field-input">
                      <option value="">Choisir…</option>
                      {shopPts.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                )}
                {f.boutique && f.point && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Quantité initiale</label>
                    <input type="number" min="0" value={f.qtyInit} onChange={e => set('qtyInit', +e.target.value)} className="field-input" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button disabled={!f.name.trim() || !f.category} onClick={() => {
            onSave({ id: product?.id || uid(), name: f.name.trim(), sku: f.sku, category: f.category, price: f.price || 0 },
              f.boutique && f.point ? { shopId: f.boutique, pointId: f.point, qty: f.qtyInit } : null);
            setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
          }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer modal ───────────────────────────────────────────────────────────
function TransferModal({ shops, stockPoints, products, stockByPoint, onClose, onTransfer }) {
  const [f, setF] = useState({ product: '', fromShop: '', fromPoint: '', toShop: '', toPoint: '', qty: 1 });
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const fromPts = stockPoints.filter(sp => sp.shopId === f.fromShop);
  const toPts   = stockPoints.filter(sp => sp.shopId === f.toShop);
  const maxQty  = f.product && f.fromPoint ? ((stockByPoint[f.product] || {})[f.fromPoint] || 0) : 999;

  function stockForProduct(pid) {
    const row = stockByPoint[pid] || {};
    return shops.map(sh => {
      const pts = stockPoints.filter(sp => sp.shopId === sh.id);
      const qty = pts.reduce((s, sp) => s + (row[sp.id] || 0), 0);
      return { shop: sh, qty };
    }).filter(x => x.qty > 0);
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">Transfert validé</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div>
            <div className="font-semibold text-ink">Transfert de stock</div>
            <div className="text-xs text-muted">Étape {step} / 3</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {step === 1 && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Produit</label>
              <select value={f.product} onChange={e => set('product', e.target.value)} className="field-input">
                <option value="">Choisir…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {f.product && stockForProduct(f.product).length > 0 && (
                <div className="mt-3 bg-bone rounded-xl p-3 space-y-1">
                  {stockForProduct(f.product).map(({ shop, qty }) => (
                    <div key={shop.id} className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: shop.color }} />{shop.name}
                      </span>
                      <span className="font-medium tabular-nums">{qty} u.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <>
              <div className="text-xs font-semibold text-ink uppercase tracking-wider">Source</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
                  <select value={f.fromShop} onChange={e => { set('fromShop', e.target.value); set('fromPoint', ''); }} className="field-input">
                    <option value="">Choisir…</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                  <select value={f.fromPoint} onChange={e => set('fromPoint', e.target.value)} disabled={!f.fromShop} className="field-input disabled:opacity-50">
                    <option value="">Choisir…</option>
                    {fromPts.map(sp => {
                      const q = (stockByPoint[f.product] || {})[sp.id] || 0;
                      return <option key={sp.id} value={sp.id} disabled={q === 0}>{sp.name} ({q} u.)</option>;
                    })}
                  </select>
                </div>
              </div>
              {f.fromPoint && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Quantité (max {maxQty})</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set('qty', Math.max(1, f.qty - 1))} className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand">−</button>
                    <span className="w-10 text-center font-semibold text-lg">{f.qty}</span>
                    <button onClick={() => set('qty', Math.min(maxQty, f.qty + 1))} className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand">+</button>
                  </div>
                </div>
              )}
              <div className="text-xs font-semibold text-ink uppercase tracking-wider mt-3">Destination</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
                  <select value={f.toShop} onChange={e => { set('toShop', e.target.value); set('toPoint', ''); }} className="field-input">
                    <option value="">Choisir…</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                  <select value={f.toPoint} onChange={e => set('toPoint', e.target.value)} disabled={!f.toShop} className="field-input disabled:opacity-50">
                    <option value="">Choisir…</option>
                    {toPts.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Récapitulatif</div>
              {[
                ['Produit',  products.find(p => p.id === f.product)?.name],
                ['Quantité', `${f.qty} unités`],
                ['De',       `${shops.find(s => s.id === f.fromShop)?.name} / ${stockPoints.find(sp => sp.id === f.fromPoint)?.name}`],
                ['Vers',     `${shops.find(s => s.id === f.toShop)?.name} / ${stockPoints.find(sp => sp.id === f.toPoint)?.name}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-line/40 last:border-0">
                  <span className="text-xs text-muted">{k}</span>
                  <span className="text-sm font-medium text-ink">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Retour</button>}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !f.product) || (step === 2 && (!f.fromShop || !f.fromPoint || !f.toShop || !f.toPoint))}
              className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">Suivant</button>
          ) : (
            <button onClick={() => {
              onTransfer(f);
              setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
            }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">Valider</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProduitsStock() {
  const {
    products, setProducts,
    shops, stockPoints,
    stockByPoint, setStockByPoint: setStockByPt,
    transfers, setTransfers,
    categories, setCategories,
  } = useStore();

  const [tab, setTab]           = useState('catalogue');
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [productModal, setProductModal] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const tabs = [
    { id: 'catalogue',  label: 'Catalogue',  count: products.length },
    { id: 'transferts', label: 'Transferts', count: transfers.length },
  ];

  function saveProduct(p, stockInit) {
    setProducts(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      return i >= 0 ? prev.map((x, j) => j === i ? p : x) : [...prev, p];
    });
    // Save new category to store
    if (p.category && !categories.includes(p.category)) {
      setCategories(prev => [...prev, p.category]);
    }
    if (stockInit) {
      setStockByPt(prev => ({
        ...prev,
        [p.id]: { ...(prev[p.id] || {}), [stockInit.pointId]: (prev[p.id]?.[stockInit.pointId] || 0) + stockInit.qty }
      }));
    }
  }

  function deleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id));
    setStockByPt(prev => { const n = { ...prev }; delete n[id]; return n; });
    setToDelete(null);
  }

  function doTransfer(f) {
    setStockByPt(prev => {
      const row = { ...(prev[f.product] || {}) };
      row[f.fromPoint] = Math.max(0, (row[f.fromPoint] || 0) - f.qty);
      row[f.toPoint]   = (row[f.toPoint] || 0) + f.qty;
      return { ...prev, [f.product]: row };
    });
    const prod     = products.find(p => p.id === f.product);
    const fromShop = `${shops.find(s => s.id === f.fromShop)?.name} / ${stockPoints.find(sp => sp.id === f.fromPoint)?.name}`;
    const toShop   = `${shops.find(s => s.id === f.toShop)?.name} / ${stockPoints.find(sp => sp.id === f.toPoint)?.name}`;
    setTransfers(prev => [{
      id: uid(),
      product:     prod?.name,
      fromShop,                      // → from_shop  (display)
      toShop,                        // → to_shop    (display)
      fromShopId:  f.fromShop,       // → from_shop_id
      toShopId:    f.toShop,         // → to_shop_id
      fromPointId: f.fromPoint,      // → from_point_id (new column)
      toPointId:   f.toPoint,        // → to_point_id   (new column)
      qty:  f.qty,
      date: new Date().toLocaleDateString('fr-FR'),
    }, ...prev]);
  }

  function totalStock(pid) {
    const row = stockByPoint[pid] || {};
    return Object.values(row).reduce((s, v) => s + v, 0);
  }

  let filtered = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }
  if (filterCat)  filtered = filtered.filter(p => p.category === filterCat);
  if (filterShop) filtered = filtered.filter(p => {
    const pts = stockPoints.filter(sp => sp.shopId === filterShop).map(sp => sp.id);
    return pts.some(spId => (stockByPoint[p.id]?.[spId] || 0) > 0);
  });

  return (
    <div className="fade-in">
      {productModal !== null && (
        <ProductModal
          product={productModal === 'add' ? null : productModal}
          shops={shops} stockPoints={stockPoints} categories={categories}
          onClose={() => setProductModal(null)}
          onSave={saveProduct}
        />
      )}
      {transferModal && (
        <TransferModal
          shops={shops} stockPoints={stockPoints} products={products} stockByPoint={stockByPoint}
          onClose={() => setTransferModal(false)}
          onTransfer={doTransfer}
        />
      )}
      {toDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3" />
            <div className="font-semibold text-ink mb-1">Supprimer « {toDelete.name} » ?</div>
            <div className="text-sm text-muted mb-5">Le stock associé sera aussi supprimé.</div>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={() => deleteProduct(toDelete.id)} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="PRODUITS & STOCK" title="Produits & Stock" actionLabel="Nouveau produit" onAction={() => setProductModal('add')} />
      </div>
      <MobileTopBar subtitle="PRODUITS & STOCK" />

      <div className="px-4 lg:px-8 py-5 space-y-4">
        <div className="lg:hidden">
          <button onClick={() => setProductModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Nouveau produit
          </button>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {/* ── CATALOGUE ── */}
        {tab === 'catalogue' && (
          products.length === 0 ? (
            <EmptyState onAdd={() => setProductModal('add')} />
          ) : (
            <Card>
              <div className="px-4 lg:px-5 pt-4 pb-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, SKU…"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                  className="px-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                  <option value="">Toutes catégories</option>
                  {[...new Set([...categories, ...products.map(p => p.category).filter(Boolean)])].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {shops.length > 0 && (
                  <select value={filterShop} onChange={e => setFilterShop(e.target.value)}
                    className="px-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                    <option value="">Toutes boutiques</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                <span className="text-xs text-muted ml-auto">{filtered.length} produit(s)</span>
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                      <th className="text-left py-2.5 px-5 font-medium">Produit</th>
                      <th className="text-left py-2.5 px-3 font-medium">Catégorie</th>
                      <th className="text-right py-2.5 px-3 font-medium">Prix</th>
                      {shops.map(sh => (
                        <th key={sh.id} className="text-center py-2.5 px-2 font-medium min-w-[40px]" style={{ color: sh.color }}>
                          {sh.name.slice(0, 3).toUpperCase()}
                        </th>
                      ))}
                      <th className="text-right py-2.5 px-3 font-medium">Total</th>
                      <th className="w-20 py-2.5 px-5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const total = totalStock(p.id);
                      return (
                        <tr key={p.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50 group">
                          <td className="py-3 px-5">
                            <div className="font-medium text-ink">{p.name}</div>
                            {p.sku && <div className="text-[11px] text-muted">{p.sku}</div>}
                          </td>
                          <td className="px-3"><Badge tone="soft" size="xs">{p.category}</Badge></td>
                          <td className="text-right tabular-nums px-3 font-medium">{p.price ? fmtFcfa(p.price) : '—'}</td>
                          {shops.map(sh => {
                            const pts = stockPoints.filter(sp => sp.shopId === sh.id).map(sp => sp.id);
                            const qty = pts.reduce((s, spId) => s + ((stockByPoint[p.id] || {})[spId] || 0), 0);
                            return (
                              <td key={sh.id} className="text-center tabular-nums px-2">
                                <span style={{ color: qty === 0 ? undefined : sh.color }}
                                  className={qty === 0 ? 'text-muted/40 text-sm' : 'text-sm font-medium'}>
                                  {qty}
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-right tabular-nums px-3 font-semibold">{total}</td>
                          <td className="px-5">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setTransferModal(true)} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-brick-50 text-brick-500"><ArrowRight size={12} /></button>
                              <button onClick={() => setProductModal(p)} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-sand text-muted"><Edit2 size={12} /></button>
                              <button onClick={() => setToDelete(p)} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-rose-50 text-muted hover:text-rose-500"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="lg:hidden divide-y divide-line/50">
                {filtered.map(p => {
                  const total = totalStock(p.id);
                  return (
                    <li key={p.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-ink">{p.name}</div>
                          <div className="text-[11px] text-muted">{[p.sku, p.category].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => setTransferModal(true)} className="w-8 h-8 grid place-items-center rounded-lg bg-brick-50 text-brick-500"><ArrowRight size={13} /></button>
                          <button onClick={() => setProductModal(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted"><Edit2 size={12} /></button>
                          <button onClick={() => setToDelete(p)} className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted hover:text-rose-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted">Total stock : <span className="font-semibold text-ink">{total}</span></span>
                        {p.price > 0 && <span className="text-muted tabular-nums">{fmtFcfa(p.price)}</span>}
                      </div>
                      {shops.length > 0 && (
                        <div className="mt-2 flex gap-3">
                          {shops.map(sh => {
                            const pts = stockPoints.filter(sp => sp.shopId === sh.id).map(sp => sp.id);
                            const qty = pts.reduce((s, spId) => s + ((stockByPoint[p.id] || {})[spId] || 0), 0);
                            return (
                              <div key={sh.id} className="text-center">
                                <div className="text-xs font-semibold tabular-nums" style={{ color: qty === 0 ? '#ccc' : sh.color }}>{qty}</div>
                                <div className="text-[9px] text-muted">{sh.name.slice(0, 3)}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )
        )}

        {/* ── TRANSFERTS ── */}
        {tab === 'transferts' && (
          <div className="space-y-4">
            <button onClick={() => setTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              <ArrowRight size={14} /> Nouveau transfert
            </button>
            {transfers.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm">Aucun transfert enregistré.</div>
            ) : (
              <Card>
                <div className="px-5 pt-4 pb-3 text-sm font-semibold text-ink">Historique ({transfers.length})</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                      <th className="text-left py-2.5 px-5 font-medium">Produit</th>
                      <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">De</th>
                      <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">Vers</th>
                      <th className="text-right py-2.5 px-3 font-medium">Qté</th>
                      <th className="text-left py-2.5 px-5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map(tr => (
                      <tr key={tr.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50">
                        <td className="py-3 px-5 font-medium text-ink">{tr.product}</td>
                        <td className="px-3 text-xs text-muted hidden lg:table-cell">{tr.fromShop}</td>
                        <td className="px-3 text-xs text-muted hidden lg:table-cell">{tr.toShop}</td>
                        <td className="px-3 text-right tabular-nums font-semibold">{tr.qty}</td>
                        <td className="px-5 text-xs text-muted">{tr.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
