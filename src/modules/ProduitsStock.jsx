import { useState } from 'react';
import { Search, Plus, ArrowRight, Edit2, CheckCircle, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, Badge, Tabs } from '../components/ui.jsx';
import { shops, products as initialProducts, stockMatrix, stockByPoint, stockPoints } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';
import { usePersistedState } from '../utils/usePersistedState.js';

const CATEGORIES = ['Céréales', 'Huiles', 'Épicerie', 'Boissons', 'Conserves', 'Laitiers', 'Hygiène'];

function totalStock(productId, prods) {
  const row = stockMatrix[productId] || {};
  return shops.reduce((s, sh) => s + (row[sh.id] || 0), 0);
}

// ─── Transfer modal ───────────────────────────────────────────────────────────
function TransferModal({ preProduct, onClose }) {
  const [step, setStep]   = useState(1);
  const [f, setF]         = useState({ product: preProduct || '', fromShop: '', fromPoint: '', toShop: '', toPoint: '', qty: 1 });
  const [done, setDone]   = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const fromPts = stockPoints.filter(sp => sp.shopId === f.fromShop);
  const toPts   = stockPoints.filter(sp => sp.shopId === f.toShop);
  const maxQty  = f.product && f.fromPoint ? ((stockByPoint[f.product] || {})[f.fromPoint] || 0) : 999;

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">Transfert validé</div>
      </div>
    </div>
  );

  const selProd = initialProducts.find(p => p.id === f.product);
  const step1OK = f.product;
  const step2OK = f.fromShop && f.fromPoint && f.toShop && f.toPoint;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                {initialProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {totalStock(p.id)} u. total</option>
                ))}
              </select>
              {f.product && (
                <div className="mt-3 bg-bone rounded-xl p-3 space-y-1">
                  {shops.map(sh => {
                    const qty = stockMatrix[f.product]?.[sh.id] || 0;
                    return qty > 0 ? (
                      <div key={sh.id} className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: sh.color }} />
                          {sh.name}
                        </span>
                        <span className="font-medium tabular-nums">{qty} u.</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">Source</div>
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
                    <button onClick={() => set('qty', Math.max(1, f.qty - 1))} className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand text-lg">−</button>
                    <span className="w-10 text-center font-semibold tabular-nums text-lg">{f.qty}</span>
                    <button onClick={() => set('qty', Math.min(maxQty, f.qty + 1))} className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center hover:bg-sand text-lg">+</button>
                  </div>
                </div>
              )}
              <div className="text-xs font-semibold text-ink uppercase tracking-wider mt-4 mb-1">Destination</div>
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
                ['Produit',    selProd?.name],
                ['Quantité',   `${f.qty} unités`],
                ['De',         `${shops.find(s => s.id === f.fromShop)?.name} / ${stockPoints.find(sp => sp.id === f.fromPoint)?.name}`],
                ['Vers',       `${shops.find(s => s.id === f.toShop)?.name} / ${stockPoints.find(sp => sp.id === f.toPoint)?.name}`],
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
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Retour</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !step1OK) || (step === 2 && !step2OK)}
              className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
              Suivant
            </button>
          ) : (
            <button onClick={() => { setDone(true); setTimeout(() => { setDone(false); onClose(); }, 1200); }}
              className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              Valider
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit product modal ─────────────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product;
  const [f, setF] = useState({
    name:      product?.name     || '',
    sku:       product?.sku      || '',
    category:  product?.category || '',
    price:     product?.price    || '',
    boutique:  '',
    point:     '',
    qtyInit:   0,
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom du produit</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Riz parfumé 25kg" className="field-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">SKU / Référence</label>
              <input value={f.sku} onChange={e => set('sku', e.target.value)} placeholder="RIZ-25" className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Catégorie</label>
              <select value={f.category} onChange={e => set('category', e.target.value)} className="field-input">
                <option value="">Choisir…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Prix de vente (FCFA)</label>
              <input type="number" value={f.price} onChange={e => set('price', e.target.value)} placeholder="14500" className="field-input" />
            </div>
          </div>

          {!isEdit && (
            <div className="border-t border-line/50 pt-3 space-y-3">
              <div className="text-xs font-semibold text-ink uppercase tracking-wider">Stock initial</div>
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
                    <input type="number" min="0" value={f.qtyInit} onChange={e => set('qtyInit', e.target.value)} className="field-input" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={() => { onSave(f); setDone(true); setTimeout(() => { setDone(false); onClose(); }, 1000); }}
            disabled={!f.name || !f.category}
            className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProduitsStock() {
  const [tab, setTab]       = useState('catalogue');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [products, setProducts]     = usePersistedState('gestcopta:products', initialProducts);
  const [productModal, setProductModal] = useState(null); // null | 'add' | product
  const [transferModal, setTransferModal] = useState(null); // null | productId

  const tabs = [
    { id: 'catalogue',  label: 'Catalogue',   count: products.length },
    { id: 'transferts', label: 'Transferts' },
  ];

  let filtered = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (filterCat)  filtered = filtered.filter(p => p.category === filterCat);
  if (filterShop) filtered = filtered.filter(p => (stockMatrix[p.id]?.[filterShop] || 0) > 0);

  return (
    <div className="fade-in">
      {productModal !== null && (
        <ProductModal
          product={productModal === 'add' ? null : productModal}
          onClose={() => setProductModal(null)}
          onSave={p => {
            if (productModal === 'add') {
              setProducts(prev => [...prev, { ...p, id: `p${Date.now()}` }]);
            } else {
              setProducts(prev => prev.map(x => x.id === productModal.id ? { ...x, ...p } : x));
            }
          }}
        />
      )}
      {transferModal !== null && (
        <TransferModal preProduct={transferModal} onClose={() => setTransferModal(null)} />
      )}

      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="PRODUITS & STOCK"
          title="Produits & Stock"
          actionLabel="Nouveau produit"
          onAction={() => setProductModal('add')}
        />
      </div>
      <MobileTopBar subtitle="PRODUITS & STOCK" />

      <div className="px-4 lg:px-8 py-5 space-y-4">
        {/* Mobile add */}
        <div className="lg:hidden">
          <button onClick={() => setProductModal('add')}
            className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Nouveau produit
          </button>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {/* ── CATALOGUE ── */}
        {tab === 'catalogue' && (
          <Card>
            {/* Filters */}
            <div className="px-4 lg:px-5 pt-4 pb-3 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
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
                      <th key={sh.id} className="text-center py-2.5 px-2 font-medium" style={{ color: sh.color }}>
                        {sh.name.slice(0, 3).toUpperCase()}
                      </th>
                    ))}
                    <th className="text-right py-2.5 px-3 font-medium">Total</th>
                    <th className="w-16 py-2.5 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const total = totalStock(p.id);
                    return (
                      <tr key={p.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50 group">
                        <td className="py-3 px-5">
                          <div className="font-medium text-ink">{p.name}</div>
                          <div className="text-[11px] text-muted">{p.sku}</div>
                        </td>
                        <td className="px-3">
                          <Badge tone="soft" size="xs">{p.category}</Badge>
                        </td>
                        <td className="text-right tabular-nums px-3 font-medium">{fmtFcfa(p.price)}</td>
                        {shops.map(sh => {
                          const qty = stockMatrix[p.id]?.[sh.id] || 0;
                          return (
                            <td key={sh.id} className="text-center tabular-nums px-2">
                              <span className={`text-sm font-medium ${qty === 0 ? 'text-muted/40' : ''}`}
                                style={qty > 0 ? { color: sh.color } : {}}>
                                {qty}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-right tabular-nums px-3 font-semibold text-ink">{total}</td>
                        <td className="px-5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setTransferModal(p.id)} title="Transférer"
                              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-brick-50 text-brick-500">
                              <ArrowRight size={12} />
                            </button>
                            <button onClick={() => setProductModal(p)} title="Modifier"
                              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-sand text-muted hover:text-ink">
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5 + shops.length + 2} className="py-10 text-center text-muted text-sm">Aucun produit trouvé.</td></tr>
                  )}
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
                        <div className="text-[11px] text-muted">{p.sku} · {p.category}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setTransferModal(p.id)}
                          className="w-8 h-8 grid place-items-center rounded-lg bg-brick-50 text-brick-500">
                          <ArrowRight size={13} />
                        </button>
                        <button onClick={() => setProductModal(p)}
                          className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex gap-3">
                        {shops.map(sh => {
                          const qty = stockMatrix[p.id]?.[sh.id] || 0;
                          return (
                            <div key={sh.id} className="text-center">
                              <div className="text-xs font-semibold tabular-nums" style={{ color: qty === 0 ? '#ccc' : sh.color }}>{qty}</div>
                              <div className="text-[9px] text-muted">{sh.name.slice(0, 3)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted">
                        Total <span className="font-semibold text-ink tabular-nums">{total}</span>
                         · <span className="tabular-nums">{fmtFcfa(p.price)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* ── TRANSFERTS ── */}
        {tab === 'transferts' && (
          <div className="space-y-4">
            <button onClick={() => setTransferModal('')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              <ArrowRight size={14} /> Nouveau transfert
            </button>

            <Card>
              <div className="px-5 pt-4 pb-3 text-sm font-semibold text-ink">Transferts récents</div>
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
                  {[
                    { p: 'Riz parfumé 25kg',  from: 'Plateau / Dépôt principal',   to: 'Liberté 6 / Dépôt principal',  qty: 10, date: '28 AVR · 14:31' },
                    { p: 'Huile soja 5L',      from: 'Almadies / Entrepôt central', to: 'Yoff / Dépôt principal',       qty: 15, date: '27 AVR · 11:15' },
                    { p: 'Sucre poudre 1kg',   from: 'Plateau / Réserve arrière',   to: 'Plateau / Dépôt principal',    qty: 30, date: '26 AVR · 09:40' },
                    { p: 'Lait poudre 900g',   from: 'Almadies / Zone froide',      to: 'Almadies / Entrepôt central',  qty: 8,  date: '25 AVR · 16:22' },
                    { p: 'Café arabica 200g',  from: 'Yoff / Dépôt principal',      to: 'Liberté 6 / Vitrine',          qty: 20, date: '25 AVR · 08:55' },
                  ].map((tr, i) => (
                    <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-bone/50">
                      <td className="py-3 px-5 font-medium text-ink">{tr.p}</td>
                      <td className="px-3 text-xs text-muted hidden lg:table-cell">{tr.from}</td>
                      <td className="px-3 text-xs text-muted hidden lg:table-cell">{tr.to}</td>
                      <td className="px-3 text-right tabular-nums font-semibold">{tr.qty}</td>
                      <td className="px-5 text-xs text-muted">{tr.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
