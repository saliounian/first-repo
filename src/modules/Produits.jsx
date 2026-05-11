import { useState } from 'react';
import { Search, Plus, ArrowRight, CheckCircle, X, ChevronRight, Edit2, Trash2, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, Badge, StatusBadge, Tabs } from '../components/ui.jsx';
import { shops, products, stockMatrix, stockByPoint, stockPoints } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';

const CATEGORIES = ['Céréales', 'Huiles', 'Épicerie', 'Boissons', 'Conserves', 'Laitiers', 'Hygiène'];

function totalStock(productId) {
  const row = stockMatrix[productId] || {};
  return shops.reduce((s, sh) => s + (row[sh.id] || 0), 0);
}

function totalStockByPoint(productId) {
  const row = stockByPoint[productId] || {};
  return Object.values(row).reduce((s, v) => s + v, 0);
}

function stockStatus(productId) {
  return stockMatrix[productId]?.alert || null;
}

function productMargin(p) {
  return p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
}

// ─── Transfer modal ───────────────────────────────────────────────────────────
function TransferModal({ initialProduct = null, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    product:   initialProduct || '',
    fromShop:  '',
    fromPoint: '',
    toShop:    '',
    toPoint:   '',
    qty:       1,
  });
  const [done, setDone] = useState(false);

  const fromPoints = stockPoints.filter(sp => sp.shopId === form.fromShop);
  const toPoints   = stockPoints.filter(sp => sp.shopId === form.toShop);
  const maxQty     = form.product && form.fromPoint
    ? ((stockByPoint[form.product] || {})[form.fromPoint] || 0) : 999;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1800);
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl max-w-xs w-full">
        <CheckCircle size={48} className="text-brick-500 mx-auto mb-3" />
        <div className="font-semibold text-ink text-lg">Transfert validé</div>
        <div className="text-sm text-muted mt-1">Stock mis à jour</div>
      </div>
    </div>
  );

  const selProduct = products.find(p => p.id === form.product);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line/70">
          <div>
            <div className="font-semibold text-ink">Transfert de produit</div>
            <div className="text-xs text-muted mt-0.5">Étape {step} / 3</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Produit</label>
                <select value={form.product} onChange={e => set('product', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                  <option value="">Choisir un produit…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — stock total: {totalStockByPoint(p.id)} u.</option>
                  ))}
                </select>
              </div>
              {form.product && (
                <div className="bg-bone rounded-xl p-3 text-xs space-y-1">
                  <div className="font-medium text-ink">{selProduct?.name}</div>
                  <div className="text-muted">Stock par boutique :</div>
                  {shops.map(sh => {
                    const pts = stockPoints.filter(sp => sp.shopId === sh.id);
                    const qty = pts.reduce((s, sp) => s + ((stockByPoint[form.product] || {})[sp.id] || 0), 0);
                    return qty > 0 ? (
                      <div key={sh.id} className="flex justify-between">
                        <span className="text-muted">{sh.name}</span>
                        <span className="font-medium tabular-nums">{qty} u.</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-sm font-medium text-ink mb-3">Source</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
                  <select value={form.fromShop} onChange={e => { set('fromShop', e.target.value); set('fromPoint', ''); }}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                    <option value="">Choisir…</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                  <select value={form.fromPoint} onChange={e => set('fromPoint', e.target.value)} disabled={!form.fromShop}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300 disabled:opacity-50">
                    <option value="">Choisir…</option>
                    {fromPoints.map(sp => {
                      const qty = (stockByPoint[form.product] || {})[sp.id] || 0;
                      return <option key={sp.id} value={sp.id} disabled={qty === 0}>{sp.name} ({qty} u.)</option>;
                    })}
                  </select>
                </div>
              </div>
              {form.fromPoint && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Quantité (max {maxQty})</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set('qty', Math.max(1, form.qty - 1))}
                      className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand">−</button>
                    <span className="text-lg font-semibold tabular-nums w-12 text-center">{form.qty}</span>
                    <button onClick={() => set('qty', Math.min(maxQty, form.qty + 1))}
                      className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand">+</button>
                  </div>
                </div>
              )}
              <div className="text-sm font-medium text-ink mt-4 mb-3">Destination</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
                  <select value={form.toShop} onChange={e => { set('toShop', e.target.value); set('toPoint', ''); }}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                    <option value="">Choisir…</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                  <select value={form.toPoint} onChange={e => set('toPoint', e.target.value)} disabled={!form.toShop}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300 disabled:opacity-50">
                    <option value="">Choisir…</option>
                    {toPoints.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-ink mb-3">Récapitulatif</div>
              {[
                ['Produit',    selProduct?.name],
                ['Quantité',   `${form.qty} unités`],
                ['Valeur',     fmtFcfa((selProduct?.cost || 0) * form.qty)],
                ['De',         `${shops.find(s => s.id === form.fromShop)?.name} / ${stockPoints.find(sp => sp.id === form.fromPoint)?.name}`],
                ['Vers',       `${shops.find(s => s.id === form.toShop)?.name} / ${stockPoints.find(sp => sp.id === form.toPoint)?.name}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-line/40 last:border-0">
                  <span className="text-xs text-muted">{k}</span>
                  <span className="text-sm font-medium text-ink">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Retour</button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !form.product) ||
                (step === 2 && (!form.fromShop || !form.fromPoint || !form.toShop || !form.toPoint))
              }
              className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
              Suivant
            </button>
          ) : (
            <button onClick={validate} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              Valider
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add/Edit product modal ───────────────────────────────────────────────────
function ProductModal({ product = null, onClose }) {
  const isEdit = !!product;
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name:      product?.name || '',
    sku:       product?.sku  || '',
    category:  product?.category || '',
    price:     product?.price || '',
    cost:      product?.cost  || '',
    alertSeuil: 5,
    boutique:  '',
    point:     '',
    qtyInit:   0,
  });

  const shopPoints = stockPoints.filter(sp => sp.shopId === form.boutique);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1800);
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl max-w-xs w-full">
        <CheckCircle size={48} className="text-brick-500 mx-auto mb-3" />
        <div className="font-semibold text-ink text-lg">{isEdit ? 'Produit modifié' : 'Produit ajouté'}</div>
        <div className="text-sm text-muted mt-1">Catalogue mis à jour</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom du produit</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Riz parfumé 25kg"
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">SKU / Référence</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="RIZ-25"
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Catégorie</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                <option value="">Choisir…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Prix de vente (FCFA)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="14500"
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Coût d'achat (FCFA)</label>
              <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="12000"
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
            </div>
            {form.price && form.cost && (
              <div className="col-span-2 bg-brick-50/60 border border-brick-100 rounded-xl px-4 py-2.5 flex justify-between text-sm">
                <span className="text-muted">Marge brute estimée</span>
                <span className="font-semibold text-brick-600">{productMargin({ price: +form.price, cost: +form.cost })}%</span>
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Seuil d'alerte (unités)</label>
              <input type="number" value={form.alertSeuil} onChange={e => set('alertSeuil', e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
            </div>
          </div>

          {!isEdit && (
            <>
              <div className="border-t border-line/50 pt-4">
                <div className="text-sm font-medium text-ink mb-3">Stock initial</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique d'origine</label>
                    <select value={form.boutique} onChange={e => { set('boutique', e.target.value); set('point', ''); }}
                      className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                      <option value="">Aucune (hors stock)</option>
                      {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  {form.boutique && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                      <select value={form.point} onChange={e => set('point', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                        <option value="">Choisir…</option>
                        {shopPoints.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                      </select>
                    </div>
                  )}
                  {form.boutique && form.point && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Quantité initiale</label>
                      <input type="number" value={form.qtyInit} onChange={e => set('qtyInit', e.target.value)} min="0"
                        className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={submit} disabled={!form.name || !form.category}
            className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter le produit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Produits() {
  const [tab, setTab]           = useState('catalogue');
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [transferProduct, setTransferProduct] = useState(null);

  const tabs = [
    { id: 'catalogue',  label: 'Catalogue',    count: products.length },
    { id: 'ajouter',    label: 'Ajouter' },
    { id: 'transferts', label: 'Transferts' },
  ];

  let filtered = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (filterCat)  filtered = filtered.filter(p => p.category === filterCat);
  if (filterShop) filtered = filtered.filter(p => (stockMatrix[p.id]?.[filterShop] || 0) > 0);

  const totalProducts = products.length;
  const totalUnits    = products.reduce((s, p) => s + totalStock(p.id), 0);
  const totalValeur   = products.reduce((s, p) => s + totalStock(p.id) * p.cost, 0);
  const enRupture     = products.filter(p => stockStatus(p.id) === 'rupture').length;

  return (
    <div className="fade-in">
      {showAdd         && <ProductModal onClose={() => setShowAdd(false)} />}
      {editProduct     && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} />}
      {transferProduct !== null && <TransferModal initialProduct={transferProduct} onClose={() => setTransferProduct(null)} />}

      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="PRODUITS"
          title="Gestion des produits"
          actionLabel="Nouveau produit"
          onAction={() => setShowAdd(true)}
        />
      </div>
      <MobileTopBar subtitle="PRODUITS" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Produits"       value={totalProducts} accent large />
          <KpiCard label="Unités totales" value={totalUnits.toLocaleString('fr-FR')} />
          <KpiCard label="Valeur stock"   value={fmtFcfa(totalValeur)} />
          <KpiCard label="Ruptures"       value={enRupture} delta={enRupture > 0 ? 'À réapprovisionner' : 'Aucune'} deltaTone={enRupture > 0 ? 'neg' : 'pos'} />
        </div>

        {/* Mobile add button */}
        <div className="lg:hidden">
          <button onClick={() => setShowAdd(true)}
            className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Nouveau produit
          </button>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={t => { setTab(t); if (t === 'ajouter') { setShowAdd(true); setTab('catalogue'); } }} />

        {tab === 'catalogue' && (
          <Card>
            <div className="px-4 lg:px-5 pt-4 pb-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, SKU…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300" />
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                <option value="">Toutes catégories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterShop} onChange={e => setFilterShop(e.target.value)}
                className="px-3 py-2 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                <option value="">Toutes boutiques</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="text-xs text-muted ml-auto">{filtered.length} produit(s)</div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                    <th className="text-left py-2 px-5 font-medium">Produit</th>
                    <th className="text-left py-2 px-3 font-medium">Catégorie</th>
                    <th className="text-right py-2 px-3 font-medium">Prix vente</th>
                    <th className="text-right py-2 px-3 font-medium">Coût</th>
                    <th className="text-right py-2 px-3 font-medium">Marge</th>
                    <th className="text-center py-2 px-3 font-medium">Stock total</th>
                    <th className="text-left py-2 px-3 font-medium">Statut</th>
                    <th className="text-left py-2 px-3 font-medium">Par boutique</th>
                    <th className="w-24 py-2 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const total  = totalStock(p.id);
                    const status = stockStatus(p.id);
                    const margin = productMargin(p);
                    return (
                      <tr key={p.id} className="border-b border-line/40 last:border-0 hover:bg-bone/60 group">
                        <td className="py-3 px-5">
                          <div className="font-medium text-ink">{p.name}</div>
                          <div className="text-[11px] text-muted tabular-nums">{p.sku}</div>
                        </td>
                        <td className="px-3">
                          <Badge tone="soft">{p.category}</Badge>
                        </td>
                        <td className="text-right tabular-nums px-3 font-medium">{fmtFcfa(p.price)}</td>
                        <td className="text-right tabular-nums px-3 text-muted">{fmtFcfa(p.cost)}</td>
                        <td className="text-right tabular-nums px-3">
                          <span className={`font-semibold ${margin >= 20 ? 'text-brick-600' : margin >= 10 ? 'text-amber-600' : 'text-rose-500'}`}>
                            {margin}%
                          </span>
                        </td>
                        <td className="text-center tabular-nums px-3 font-semibold">{total}</td>
                        <td className="px-3">
                          {status ? <StatusBadge status={status} /> : <Badge tone="success">ok</Badge>}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            {shops.map(sh => {
                              const qty = stockMatrix[p.id]?.[sh.id] || 0;
                              return (
                                <div key={sh.id} title={`${sh.name}: ${qty}`}
                                  className="w-4 h-4 rounded grid place-items-center text-[9px] font-bold text-white"
                                  style={{ background: qty === 0 ? '#e5e5e5' : sh.color, color: qty === 0 ? '#999' : 'white' }}>
                                  {qty > 99 ? '…' : qty}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setTransferProduct(p.id)} title="Transférer"
                              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-brick-50 text-brick-500">
                              <ArrowRight size={13} />
                            </button>
                            <button onClick={() => setEditProduct(p)} title="Modifier"
                              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-sand text-muted">
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="lg:hidden divide-y divide-line/50 px-2">
              {filtered.map(p => {
                const total  = totalStock(p.id);
                const status = stockStatus(p.id);
                return (
                  <li key={p.id} className="py-3 px-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm text-ink">{p.name}</div>
                        <div className="text-[11px] text-muted">{p.sku} · {p.category}</div>
                      </div>
                      {status ? <StatusBadge status={status} /> : <Badge tone="success" size="xs">ok</Badge>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-muted">
                        {fmtFcfa(p.price)} · marge {productMargin(p)}%
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{total} u.</span>
                        <button onClick={() => setTransferProduct(p.id)}
                          className="w-7 h-7 grid place-items-center rounded-lg bg-brick-50 text-brick-500">
                          <ArrowRight size={13} />
                        </button>
                        <button onClick={() => setEditProduct(p)}
                          className="w-7 h-7 grid place-items-center rounded-lg border border-line/70 text-muted">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {shops.map(sh => {
                        const qty = stockMatrix[p.id]?.[sh.id] || 0;
                        return (
                          <div key={sh.id} className="flex-1 text-center">
                            <div className="text-[10px] text-muted truncate">{sh.name.slice(0, 3)}</div>
                            <div className="text-xs font-semibold tabular-nums" style={{ color: qty === 0 ? '#ccc' : sh.color }}>{qty}</div>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {tab === 'transferts' && (
          <div className="space-y-4">
            <button onClick={() => setTransferProduct('')}
              className="w-full lg:w-auto px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium flex items-center gap-2">
              <ArrowRight size={14} /> Nouveau transfert de produit
            </button>
            <Card>
              <CardHeader title="Transferts récents" subtitle="5 derniers mouvements" />
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line/70 text-[10px] uppercase tracking-wider text-muted">
                      <th className="text-left py-2 px-5 font-medium">Produit</th>
                      <th className="text-left py-2 px-3 font-medium">De</th>
                      <th className="text-left py-2 px-3 font-medium">Vers</th>
                      <th className="text-right py-2 px-3 font-medium">Qté</th>
                      <th className="text-left py-2 px-3 font-medium">Validateur</th>
                      <th className="text-left py-2 px-5 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { product: 'Riz parfumé 25kg',  from: 'Plateau / Dépôt principal',   to: 'Liberté 6 / Dépôt principal',   qty: 10, val: 'Aissa Diop',  status: 'validé' },
                      { product: 'Huile soja 5L',      from: 'Almadies / Entrepôt central', to: 'Yoff / Dépôt principal',         qty: 15, val: 'Aissa Diop',  status: 'validé' },
                      { product: 'Sucre poudre 1kg',   from: 'Plateau / Réserve arrière',   to: 'Plateau / Dépôt principal',      qty: 30, val: 'Oumar Sy',    status: 'validé' },
                      { product: 'Lait poudre 900g',   from: 'Almadies / Zone froide',      to: 'Almadies / Entrepôt central',    qty: 8,  val: 'Ibou Diagne', status: 'validé' },
                      { product: 'Café arabica 200g',  from: 'Yoff / Dépôt principal',      to: 'Liberté 6 / Vitrine',            qty: 20, val: 'Astou Gaye', status: 'en attente' },
                    ].map((tr, i) => (
                      <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-bone/60">
                        <td className="py-3 px-5 font-medium text-ink">{tr.product}</td>
                        <td className="px-3 text-xs text-muted">{tr.from}</td>
                        <td className="px-3 text-xs text-muted">{tr.to}</td>
                        <td className="px-3 text-right tabular-nums font-semibold">{tr.qty}</td>
                        <td className="px-3 text-xs text-muted">{tr.val}</td>
                        <td className="px-5">
                          <Badge tone={tr.status === 'validé' ? 'success' : 'warning'}>{tr.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="lg:hidden divide-y divide-line/50 px-3">
                {[
                  { product: 'Riz parfumé 25kg', from: 'Plateau', to: 'Liberté 6', qty: 10, status: 'validé' },
                  { product: 'Huile soja 5L',    from: 'Almadies', to: 'Yoff',     qty: 15, status: 'validé' },
                  { product: 'Café arabica 200g',from: 'Yoff',    to: 'Liberté 6', qty: 20, status: 'en attente' },
                ].map((tr, i) => (
                  <li key={i} className="py-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm text-ink">{tr.product}</div>
                      <Badge tone={tr.status === 'validé' ? 'success' : 'warning'} size="xs">{tr.status}</Badge>
                    </div>
                    <div className="text-xs text-muted mt-1 flex items-center gap-1">
                      {tr.from} <ArrowRight size={10} /> {tr.to} · {tr.qty} u.
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
