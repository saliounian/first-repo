import { useState } from 'react';
import { MapPin, Phone, User, ArrowRight, ChevronDown, ChevronRight, CheckCircle, Package, Plus, X, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, Badge, Tabs } from '../components/ui.jsx';
import { shops as initialShops, shopDetails as initialDetails, stockPoints, stockByPoint, products, transferHistory } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';
import { usePersistedState } from '../utils/usePersistedState.js';

// Color palette for shop creation
const COLOR_PALETTE = ['#0D5C2E', '#3D8253', '#6FA681', '#1E7A3E', '#9CA8A0', '#7B3F00', '#B8860B', '#4682B4'];

// Merge initial shops + shopDetails into unified objects
const initialMerged = initialShops.map(s => ({
  ...s,
  ...(initialDetails[s.id] || { manager: '—', phone: '—', address: '—', status: 'actif', caMonth: 0 }),
}));

function totalStockForShop(shopId) {
  const pts = stockPoints.filter(sp => sp.shopId === shopId).map(sp => sp.id);
  return products.reduce((sum, p) => {
    const byPt = stockByPoint[p.id] || {};
    return sum + pts.reduce((s, spId) => s + (byPt[spId] || 0), 0);
  }, 0);
}

function totalValueForShop(shopId) {
  const pts = stockPoints.filter(sp => sp.shopId === shopId).map(sp => sp.id);
  return products.reduce((sum, p) => {
    const byPt = stockByPoint[p.id] || {};
    const qty = pts.reduce((s, spId) => s + (byPt[spId] || 0), 0);
    return sum + qty * p.cost;
  }, 0);
}

function stockForPoint(spId) {
  return products.reduce((sum, p) => sum + ((stockByPoint[p.id] || {})[spId] || 0), 0);
}

// ─── Shop modal (add / edit) ──────────────────────────────────────────────────
function ShopModal({ shop, onClose, onSave }) {
  const isEdit = !!shop;
  const [f, setF] = useState({
    name:    shop?.name    || '',
    color:   shop?.color   || COLOR_PALETTE[0],
    manager: shop?.manager || '',
    phone:   shop?.phone   || '',
    address: shop?.address || '',
    status:  shop?.status  || 'actif',
    caMonth: shop?.caMonth || 0,
  });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function submit() {
    onSave({
      ...shop,
      id: shop?.id || `shop${Date.now()}`,
      ...f,
      caMonth: +f.caMonth || 0,
    });
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 900);
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Boutique modifiée' : 'Boutique ajoutée'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface z-10">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier la boutique' : 'Nouvelle boutique'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom de la boutique</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Plateau" className="field-input" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Couleur d'accent</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${f.color === c ? 'border-ink scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Responsable / Gérant</label>
            <input value={f.manager} onChange={e => set('manager', e.target.value)} placeholder="Prénom Nom" className="field-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
              <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 …" className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Statut</label>
              <select value={f.status} onChange={e => set('status', e.target.value)} className="field-input">
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse</label>
            <input value={f.address} onChange={e => set('address', e.target.value)} placeholder="Rue, Quartier, Ville" className="field-input" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">CA du mois (FCFA)</label>
            <input type="number" min="0" value={f.caMonth} onChange={e => set('caMonth', e.target.value)} placeholder="0" className="field-input" />
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={submit} disabled={!f.name}
            className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer modal ───────────────────────────────────────────────────────────
function TransferModal({ shopList, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fromShop: '', fromPoint: '', toShop: '', toPoint: '', product: '', qty: 1
  });
  const [done, setDone] = useState(false);

  const fromPoints = stockPoints.filter(sp => sp.shopId === form.fromShop);
  const toPoints   = stockPoints.filter(sp => sp.shopId === form.toShop);
  const maxQty     = form.product && form.fromPoint
    ? (stockByPoint[form.product]?.[form.fromPoint] || 0) : 999;

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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line/70">
          <div>
            <div className="font-semibold text-ink">Nouveau transfert</div>
            <div className="text-xs text-muted mt-0.5">Étape {step} / 3</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div className="text-sm font-medium text-ink mb-3">Source</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique source</label>
                  <select value={form.fromShop} onChange={e => { set('fromShop', e.target.value); set('fromPoint', ''); }}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                    <option value="">Choisir…</option>
                    {shopList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Point de stock</label>
                  <select value={form.fromPoint} onChange={e => set('fromPoint', e.target.value)} disabled={!form.fromShop}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300 disabled:opacity-50">
                    <option value="">Choisir…</option>
                    {fromPoints.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-sm font-medium text-ink mt-4 mb-3">Destination</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique dest.</label>
                  <select value={form.toShop} onChange={e => { set('toShop', e.target.value); set('toPoint', ''); }}
                    className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                    <option value="">Choisir…</option>
                    {shopList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

          {step === 2 && (
            <>
              <div className="text-sm font-medium text-ink mb-3">Produit & quantité</div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Produit</label>
                <select value={form.product} onChange={e => set('product', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-bone border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
                  <option value="">Choisir un produit…</option>
                  {products.map(p => {
                    const qty = (stockByPoint[p.id] || {})[form.fromPoint] || 0;
                    return <option key={p.id} value={p.id} disabled={qty === 0}>{p.name} — {qty} unités dispo</option>;
                  })}
                </select>
              </div>
              {form.product && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Quantité (max {maxQty})</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set('qty', Math.max(1, form.qty - 1))}
                      className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center text-ink hover:bg-sand">−</button>
                    <span className="text-lg font-semibold tabular-nums w-12 text-center">{form.qty}</span>
                    <button onClick={() => set('qty', Math.min(maxQty, form.qty + 1))}
                      className="w-9 h-9 rounded-xl border border-line/70 grid place-items-center text-ink hover:bg-sand">+</button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-ink mb-3">Récapitulatif</div>
              {[
                ['Produit',     products.find(p => p.id === form.product)?.name],
                ['Quantité',    `${form.qty} unités`],
                ['De',          `${shopList.find(s => s.id === form.fromShop)?.name} / ${stockPoints.find(sp => sp.id === form.fromPoint)?.name}`],
                ['Vers',        `${shopList.find(s => s.id === form.toShop)?.name} / ${stockPoints.find(sp => sp.id === form.toPoint)?.name}`],
                ['Valeur',      fmtFcfa((products.find(p => p.id === form.product)?.cost || 0) * form.qty)],
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
              className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium text-ink hover:bg-sand">
              Retour
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && (!form.fromShop || !form.fromPoint || !form.toShop || !form.toPoint)) ||
                (step === 2 && !form.product)
              }
              className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
              Suivant
            </button>
          ) : (
            <button onClick={validate} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 text-white rounded-xl text-sm font-medium">
              Valider le transfert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shop card ────────────────────────────────────────────────────────────────
function ShopCard({ shop, onSelect, onTransfer, onEdit, onDelete }) {
  const pts     = stockPoints.filter(sp => sp.shopId === shop.id);
  const total   = totalStockForShop(shop.id);
  const valeur  = totalValueForShop(shop.id);

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: shop.color }} />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-semibold text-ink text-base truncate">{shop.name}</div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
              <User size={11} />
              <span className="truncate">{shop.manager}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge tone={shop.status === 'actif' ? 'success' : 'danger'}>{shop.status}</Badge>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} /><span className="truncate">{shop.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone size={11} /><span>{shop.phone}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="bg-bone rounded-lg py-2">
            <div className="text-sm font-semibold tabular-nums text-ink">{pts.length}</div>
            <div className="text-[10px] text-muted mt-0.5">Points</div>
          </div>
          <div className="bg-bone rounded-lg py-2">
            <div className="text-sm font-semibold tabular-nums text-ink">{total}</div>
            <div className="text-[10px] text-muted mt-0.5">Unités</div>
          </div>
          <div className="bg-bone rounded-lg py-2">
            <div className="text-[11px] font-semibold tabular-nums text-ink leading-tight">{fmtFcfa(valeur)}</div>
            <div className="text-[10px] text-muted mt-0.5">Valeur</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSelect(shop)} className="flex-1 py-2 text-xs font-medium border border-line/70 rounded-xl hover:bg-sand flex items-center justify-center gap-1">
            <Package size={12} /> Voir détail
          </button>
          <button onClick={onTransfer} className="flex-1 py-2 text-xs font-medium bg-brick-500 text-white rounded-xl hover:bg-brick-600 flex items-center justify-center gap-1">
            <ArrowRight size={12} /> Transférer
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={onEdit} className="flex-1 py-1.5 text-xs font-medium border border-line/70 rounded-xl hover:bg-sand flex items-center justify-center gap-1 text-muted hover:text-ink">
            <Edit2 size={11} /> Modifier
          </button>
          <button onClick={onDelete} className="flex-1 py-1.5 text-xs font-medium border border-line/70 rounded-xl hover:bg-rose-50 flex items-center justify-center gap-1 text-muted hover:text-rose-500">
            <Trash2 size={11} /> Supprimer
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Shop detail ─────────────────────────────────────────────────────────────
function ShopDetail({ shop, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const pts    = stockPoints.filter(sp => sp.shopId === shop.id);

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center gap-3 px-4 lg:px-8 pt-5">
        <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-xl border border-line/70 hover:bg-sand">
          <ChevronRight size={16} className="rotate-180 text-ink" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: shop.color }} />
            <span className="font-semibold text-lg text-ink">{shop.name}</span>
          </div>
          <div className="text-xs text-muted">{shop.address}</div>
        </div>
      </div>

      <div className="px-4 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="CA ce mois"    value={fmtFcfa(shop.caMonth)} accent />
        <KpiCard label="Points de stock" value={pts.length} />
        <KpiCard label="Unités totales"  value={totalStockForShop(shop.id)} />
        <KpiCard label="Valeur stock"  value={fmtFcfa(totalValueForShop(shop.id))} />
      </div>

      <div className="px-4 lg:px-8">
        <Card>
          <CardHeader title="Points de stock" subtitle={`${pts.length} point(s) dans cette boutique`} />
          <div className="divide-y divide-line/50">
            {pts.map(sp => {
              const spTotal = stockForPoint(sp.id);
              const isOpen  = expanded === sp.id;
              return (
                <div key={sp.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : sp.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bone/60 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-xs font-bold" style={{ background: shop.color }}>
                        {sp.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-ink">{sp.name}</div>
                        <div className="text-[11px] text-muted">{sp.responsable?.nom || sp.responsable}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums">{spTotal} unités</div>
                        <div className="text-[10px] text-muted">{products.filter(p => ((stockByPoint[p.id] || {})[sp.id] || 0) > 0).length} produits</div>
                      </div>
                      <ChevronDown size={14} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="bg-bone/50 border-t border-line/40">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-muted border-b border-line/40">
                            <th className="text-left py-2 px-5 font-medium">Produit</th>
                            <th className="text-center py-2 px-3 font-medium">Qté</th>
                            <th className="text-right py-2 px-5 font-medium">Valeur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => {
                            const qty = (stockByPoint[p.id] || {})[sp.id] || 0;
                            if (qty === 0) return null;
                            return (
                              <tr key={p.id} className="border-b border-line/30 last:border-0">
                                <td className="py-2.5 px-5">
                                  <div className="font-medium text-ink">{p.name}</div>
                                  <div className="text-[10px] text-muted">{p.sku}</div>
                                </td>
                                <td className="text-center tabular-nums px-3">{qty}</td>
                                <td className="text-right tabular-nums px-5 font-medium">{fmtFcfa(qty * p.cost)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Boutiques() {
  const [shops, setShops]               = usePersistedState('gestcopta:shops', initialMerged);
  const [tab, setTab]                   = useState('boutiques');
  const [selected, setSelected]         = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [shopModal, setShopModal]       = useState(null); // null | 'add' | shop
  const [toDelete, setToDelete]         = useState(null);

  const tabs = [
    { id: 'boutiques',  label: 'Boutiques',      count: shops.length },
    { id: 'points',     label: 'Points de stock', count: stockPoints.length },
    { id: 'historique', label: 'Historique',      count: transferHistory.length },
  ];

  function saveShop(s) {
    setShops(prev => {
      const i = prev.findIndex(x => x.id === s.id);
      if (i >= 0) { const n = [...prev]; n[i] = s; return n; }
      return [...prev, s];
    });
  }

  function confirmDelete() {
    setShops(prev => prev.filter(s => s.id !== toDelete.id));
    if (selected?.id === toDelete.id) setSelected(null);
    setToDelete(null);
  }

  if (selected) {
    // refresh from current shops state (in case it was edited)
    const live = shops.find(s => s.id === selected.id) || selected;
    return (
      <div className="fade-in">
        <MobileTopBar subtitle="BOUTIQUES" />
        <ShopDetail shop={live} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {showTransfer && <TransferModal shopList={shops} onClose={() => setShowTransfer(false)} />}

      {shopModal !== null && (
        <ShopModal
          shop={shopModal === 'add' ? null : shopModal}
          onClose={() => setShopModal(null)}
          onSave={saveShop}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3" />
            <div className="font-semibold text-ink mb-1">Supprimer « {toDelete.name} » ?</div>
            <div className="text-sm text-muted mb-5">Tous les points de stock liés resteront mais sans boutique. Cette action est irréversible.</div>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="BOUTIQUES"
          title="Gestion des boutiques"
          actionLabel="Nouveau transfert"
          onAction={() => setShowTransfer(true)}
          rightExtras={
            <button
              onClick={() => setShopModal('add')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line/70 hover:bg-sand text-ink text-sm font-medium rounded-lg transition-colors">
              <Plus size={14} strokeWidth={2.4} /> Nouvelle boutique
            </button>
          }
        />
      </div>
      <MobileTopBar subtitle="BOUTIQUES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Boutiques actives" value={shops.length} accent large />
          <KpiCard label="Points de stock"   value={stockPoints.length} />
          <KpiCard label="Unités en stock"   value={shops.reduce((s, sh) => s + totalStockForShop(sh.id), 0)} />
          <KpiCard label="Valeur totale"     value={fmtFcfa(shops.reduce((s, sh) => s + totalValueForShop(sh.id), 0))} />
        </div>

        {/* Mobile action buttons */}
        <div className="lg:hidden flex gap-2">
          <button onClick={() => setShopModal('add')}
            className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-ink">
            <Plus size={14} /> Nouvelle boutique
          </button>
          <button onClick={() => setShowTransfer(true)}
            className="flex-1 py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <ArrowRight size={14} /> Transfert
          </button>
        </div>

        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
        </div>

        {tab === 'boutiques' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onSelect={setSelected}
                onTransfer={() => setShowTransfer(true)}
                onEdit={() => setShopModal(shop)}
                onDelete={() => setToDelete(shop)}
              />
            ))}
            {shops.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted text-sm">
                Aucune boutique. Cliquez sur « Nouvelle boutique » pour en créer une.
              </div>
            )}
          </div>
        )}

        {tab === 'points' && (
          <Card>
            <CardHeader title="Tous les points de stock" subtitle="Par boutique" />
            <div className="divide-y divide-line/50">
              {shops.map(shop => {
                const pts = stockPoints.filter(sp => sp.shopId === shop.id);
                return (
                  <div key={shop.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: shop.color }} />
                      <span className="font-semibold text-sm text-ink">{shop.name}</span>
                      <span className="text-xs text-muted">— {pts.length} point(s)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {pts.map(sp => {
                        const total = stockForPoint(sp.id);
                        const nbProd = products.filter(p => ((stockByPoint[p.id] || {})[sp.id] || 0) > 0).length;
                        return (
                          <div key={sp.id} className="bg-bone rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg grid place-items-center text-white text-xs font-bold shrink-0" style={{ background: shop.color }}>
                              {sp.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-ink truncate">{sp.name}</div>
                              <div className="text-[11px] text-muted">{total} unités · {nbProd} produits</div>
                              <div className="text-[11px] text-muted">{sp.responsable?.nom || sp.responsable}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {tab === 'historique' && (
          <Card>
            <CardHeader title="Historique des transferts" subtitle={`${transferHistory.length} derniers mouvements`} />
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                    <th className="text-left py-2 px-5 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">Produit</th>
                    <th className="text-left py-2 px-3 font-medium">De</th>
                    <th className="text-left py-2 px-3 font-medium">Vers</th>
                    <th className="text-right py-2 px-3 font-medium">Qté</th>
                    <th className="text-left py-2 px-3 font-medium">Validateur</th>
                    <th className="text-left py-2 px-5 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transferHistory.map(tr => (
                    <tr key={tr.id} className="border-b border-line/40 last:border-0 hover:bg-bone/60">
                      <td className="py-3 px-5 text-muted text-xs">{tr.date}</td>
                      <td className="px-3 font-medium text-ink">{tr.product}</td>
                      <td className="px-3 text-muted text-xs">{tr.from}</td>
                      <td className="px-3 text-muted text-xs">{tr.to}</td>
                      <td className="px-3 text-right tabular-nums font-semibold">{tr.qty}</td>
                      <td className="px-3 text-muted text-xs">{tr.validateur}</td>
                      <td className="px-5">
                        <Badge tone={tr.status === 'validé' ? 'success' : 'warning'}>{tr.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="lg:hidden divide-y divide-line/50 px-3">
              {transferHistory.map(tr => (
                <li key={tr.id} className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm text-ink">{tr.product}</div>
                    <Badge tone={tr.status === 'validé' ? 'success' : 'warning'}>{tr.status}</Badge>
                  </div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1">
                    <span>{tr.from}</span>
                    <ArrowRight size={10} />
                    <span>{tr.to}</span>
                  </div>
                  <div className="text-xs text-muted mt-0.5">{tr.date} · {tr.qty} unités · {tr.validateur}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
