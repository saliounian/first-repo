import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, X, Search, ShoppingCart, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import ActionMenu from '../components/ActionMenu.jsx';
import Modal from '../components/Modal.jsx';
import { Card } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ORDER_STATUSES, uid } from '../data/store.js';

// Compute list of products available in a shop (from stockByPoint)
function productsForShop(shopId, products, stockPoints, stockByPoint) {
  if (!shopId) return products;
  const pts = stockPoints.filter(sp => sp.shopId === shopId).map(sp => sp.id);
  return products.filter(p =>
    pts.some(spId => (stockByPoint[p.id] || {})[spId] > 0)
  );
}
import { fmtFcfa, fmtDateTime } from '../utils/format.js';

const STATUS_COLOR = { attente: 'text-amber-600', préparée: 'text-blue-600', livrée: 'text-brick-600', annulée: 'text-rose-500' };

function FraisRow({ label, value, sens, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-28 shrink-0">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-line/70">
        {['+', '-'].map(s => (
          <button key={s} type="button" onClick={() => onChange('sens', s)}
            className={`w-7 h-7 text-sm font-bold transition-colors ${
              sens === s ? 'bg-brick-500 text-white' : 'bg-surface text-muted hover:bg-bone'
            }`}>{s}</button>
        ))}
      </div>
      <input type="number" min="0" value={value}
        onChange={e => onChange('montant', +e.target.value)}
        placeholder="0" className="field-input flex-1 py-1.5 text-sm"/>
    </div>
  );
}

function calcNet(f) {
  const base  = f.total || 0;
  const apply = (frais) => (frais.sens === '+' ? 1 : -1) * (Number(frais.montant) || 0);
  return base + apply(f.fraisLivraison) + apply(f.fraisInstallation) + apply(f.fraisService);
}

function OrderModal({ order, clients, setClients, shops, products, stockPoints, stockByPoint, onClose, onSave }) {
  const isEdit = !!order;
  const blank  = { montant: '', sens: '+' };
  const [f, setF] = useState({
    client:           order?.client           || '',
    clientId:         order?.clientId         || '',
    phone:            order?.phone            || '',
    shop:             order?.shop             || '',
    shopId:           order?.shopId           || (shops[0]?.id || ''),
    lineItems:        order?.lineItems        || [],
    total:            order?.total            || 0,
    status:           order?.status           || 'attente',
    note:             order?.note             || '',
    adresseLivraison: order?.adresseLivraison || '',
    fraisLivraison:   order?.fraisLivraison   || { ...blank },
    fraisInstallation:order?.fraisInstallation|| { ...blank },
    fraisService:     order?.fraisService     || { ...blank },
  });
  const [newProd, setNewProd] = useState({ productId: '', qty: 1 });
  const [stockError, setStockError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setFrais = (key, field, val) => setF(p => ({ ...p, [key]: { ...p[key], [field]: val } }));

  const net = calcNet(f);

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2"/>
        <div className="font-semibold text-ink">{isEdit ? 'Commande modifiée' : 'Commande créée'}</div>
        <div className="text-sm text-muted mt-1">Net à payer : {fmtFcfa(net)}</div>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface z-10">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier la commande' : 'Nouvelle commande'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Client (champ libre + autocomplétion sur clients existants) */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Client *</label>
            <input
              list="client-suggestions"
              value={f.client}
              onChange={e => {
                const name = e.target.value;
                set('client', name);
                const match = clients.find(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
                if (match) {
                  set('clientId', match.id);
                  if (match.phone && !f.phone) set('phone', match.phone);
                } else {
                  set('clientId', '');
                }
              }}
              placeholder="Nom du client" className="field-input"
            />
            <datalist id="client-suggestions">
              {clients.map(c => <option key={c.id} value={c.name}/>)}
            </datalist>
            {f.clientId && <div className="text-[10px] text-brick-600 mt-1">✓ Client existant relié</div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
              <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 xxx xx xx" className="field-input"/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
              {shops.length > 0 ? (
                <select value={f.shopId} onChange={e => {
                  const s = shops.find(s => s.id === e.target.value);
                  set('shopId', e.target.value); set('shop', s?.name || '');
                }} className="field-input">
                  <option value="">Choisir…</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <input value={f.shop} onChange={e => set('shop', e.target.value)} placeholder="Boutique" className="field-input"/>
              )}
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Articles</label>
            {/* Add product row : produit + point + qty + add */}
            {(() => {
              const shopPoints = stockPoints.filter(sp => sp.shopId === f.shopId);
              const availablePoints = newProd.productId
                ? shopPoints.filter(sp => (stockByPoint[newProd.productId] || {})[sp.id] > 0)
                : [];
              return (
                <div className="space-y-2 mb-2">
                  <select value={newProd.productId} onChange={e => { setNewProd(p => ({ ...p, productId: e.target.value, pointId: '' })); setStockError(''); }}
                    className="field-input py-2 text-sm">
                    <option value="">Choisir un produit…</option>
                    {(f.shopId
                      ? productsForShop(f.shopId, products, stockPoints, stockByPoint)
                      : products
                    ).map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.price ? ` — ${p.price.toLocaleString('fr-FR')} F` : ''}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select value={newProd.pointId || ''} onChange={e => { setNewProd(p => ({ ...p, pointId: e.target.value })); setStockError(''); }}
                      disabled={!newProd.productId}
                      className="field-input flex-1 py-2 text-sm disabled:opacity-50">
                      <option value="">Point de stock…</option>
                      {availablePoints.map(sp => {
                        const avail = (stockByPoint[newProd.productId] || {})[sp.id] || 0;
                        return <option key={sp.id} value={sp.id}>{sp.name} ({avail} dispo)</option>;
                      })}
                    </select>
                    <input type="number" min="1" value={newProd.qty}
                      onChange={e => { setNewProd(p => ({ ...p, qty: +e.target.value })); setStockError(''); }}
                      className="field-input w-16 py-2 text-sm text-center" placeholder="Qté"/>
                    <button type="button" disabled={!newProd.productId || !newProd.pointId}
                      onClick={() => {
                        const prod  = products.find(p => p.id === newProd.productId);
                        const point = stockPoints.find(sp => sp.id === newProd.pointId);
                        if (!prod || !point) return;
                        const avail = (stockByPoint[prod.id] || {})[point.id] || 0;
                        const qty   = newProd.qty || 1;
                        if (avail <= 0) {
                          setStockError(`Stock épuisé pour "${point.name}". Aucune unité disponible.`);
                          return;
                        }
                        if (qty > avail) {
                          setStockError(`Stock insuffisant : ${qty} demandé(s) mais seulement ${avail} disponible(s) à "${point.name}".`);
                          return;
                        }
                        setStockError('');
                        const item = { productId: prod.id, name: prod.name, qty, unitPrice: prod.price || 0,
                                       pointId: point.id, pointName: point.name };
                        const idx = f.lineItems.findIndex(l => l.productId === prod.id && l.pointId === point.id);
                        const updated = idx >= 0
                          ? f.lineItems.map((l, i) => i === idx ? { ...l, qty: Math.min(l.qty + qty, avail) } : l)
                          : [...f.lineItems, item];
                        const newTotal = updated.reduce((s, l) => s + l.unitPrice * l.qty, 0);
                        set('lineItems', updated); set('total', newTotal);
                        setNewProd({ productId: '', pointId: '', qty: 1 });
                      }}
                      className="px-3 py-2 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl shrink-0">
                      +
                    </button>
                  </div>
                  {stockError && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      <span className="shrink-0 mt-0.5">⚠</span>
                      <span>{stockError}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Items list */}
            {f.lineItems.length > 0 && (
              <div className="border border-line/50 rounded-xl overflow-hidden">
                {f.lineItems.map((item, i) => (
                  <div key={`${item.productId}-${item.pointId || i}`} className="flex items-center gap-2 px-3 py-2 border-b border-line/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{item.name}</div>
                      <div className="text-xs text-muted">
                        {item.pointName && <span className="text-brick-600">📍 {item.pointName} · </span>}
                        {item.unitPrice.toLocaleString('fr-FR')} F × {item.qty} = {(item.unitPrice * item.qty).toLocaleString('fr-FR')} F
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => {
                        const updated = f.lineItems.map((l, j) => j === i ? { ...l, qty: Math.max(1, l.qty - 1) } : l);
                        set('lineItems', updated); set('total', updated.reduce((s, l) => s + l.unitPrice * l.qty, 0));
                      }} className="w-6 h-6 rounded border border-line/50 text-muted hover:text-ink grid place-items-center text-xs">−</button>
                      <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
                      <button type="button" onClick={() => {
                        const updated = f.lineItems.map((l, j) => j === i ? { ...l, qty: l.qty + 1 } : l);
                        set('lineItems', updated); set('total', updated.reduce((s, l) => s + l.unitPrice * l.qty, 0));
                      }} className="w-6 h-6 rounded border border-line/50 text-muted hover:text-ink grid place-items-center text-xs">+</button>
                      <button type="button" onClick={() => {
                        const updated = f.lineItems.filter((_, j) => j !== i);
                        set('lineItems', updated); set('total', updated.reduce((s, l) => s + l.unitPrice * l.qty, 0));
                      }} className="w-6 h-6 rounded border border-rose-200 text-rose-400 hover:text-rose-600 grid place-items-center ml-1">
                        <X size={10}/>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="px-3 py-2 bg-bone/50 flex justify-between text-sm font-semibold">
                  <span className="text-muted">Sous-total articles</span>
                  <span className="tabular-nums">{fmtFcfa(f.total)}</span>
                </div>
              </div>
            )}
            {f.lineItems.length === 0 && (
              <div className="text-xs text-muted text-center py-3 border border-dashed border-line/50 rounded-xl">
                Aucun article ajouté
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Montant articles (FCFA)</label>
              <input type="number" min="0" value={f.total} onChange={e => set('total', +e.target.value)} placeholder="0" className="field-input" readOnly/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Statut</label>
              <select value={f.status} onChange={e => set('status', e.target.value)} className="field-input">
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse de livraison</label>
            <input value={f.adresseLivraison} onChange={e => set('adresseLivraison', e.target.value)} placeholder="Quartier, Ville" className="field-input"/>
          </div>

          {/* Frais */}
          <div className="border-t border-line/50 pt-3 space-y-2">
            <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">Frais supplémentaires <span className="text-muted font-normal normal-case">(+ ajout / − déduction)</span></div>
            <FraisRow label="Livraison" value={f.fraisLivraison.montant} sens={f.fraisLivraison.sens}
              onChange={(field, val) => setFrais('fraisLivraison', field, val)}/>
            <FraisRow label="Installation" value={f.fraisInstallation.montant} sens={f.fraisInstallation.sens}
              onChange={(field, val) => setFrais('fraisInstallation', field, val)}/>
            <FraisRow label="Service" value={f.fraisService.montant} sens={f.fraisService.sens}
              onChange={(field, val) => setFrais('fraisService', field, val)}/>
          </div>

          {/* Net à payer */}
          <div className="bg-brick-50/60 border border-brick-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Net à payer</span>
            <span className="text-xl font-bold tabular-nums text-brick-600">{fmtFcfa(net)}</span>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Note</label>
            <input value={f.note} onChange={e => set('note', e.target.value)} placeholder="Remarque, instructions…" className="field-input"/>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button disabled={!f.client.trim()} onClick={() => {
            // Match client : par ID, sinon par nom (case-insensitive trimmed), sinon par téléphone
            const nameTrim = f.client.trim();
            const phoneTrim = (f.phone || '').trim();
            let existing = clients.find(c =>
              (f.clientId && c.id === f.clientId) ||
              (nameTrim && c.name.toLowerCase().trim() === nameTrim.toLowerCase()) ||
              (phoneTrim && c.phone && c.phone.trim() === phoneTrim)
            );

            let resolvedClientId = existing?.id;
            const resolvedClientName = existing?.name || nameTrim;

            // Pas trouvé → créer client automatiquement
            if (!existing && nameTrim) {
              const newClient = {
                id:        uid(),
                name:      nameTrim,
                phone:     phoneTrim,
                type:      'nouveau',
                address:   f.adresseLivraison || '',
                email:     '',
                note:      '',
                orders:    0,
                total:     0,
                createdAt: new Date().toISOString(),
              };
              setClients(prev => [...prev, newClient]);
              resolvedClientId = newClient.id;
            }

            onSave({
              id:               order?.id || `#${Date.now().toString(36).toUpperCase().slice(-6)}`,
              client:           resolvedClientName,
              clientId:         resolvedClientId || null,
              phone:            f.phone,
              shop:             shops.find(s => s.id === f.shopId)?.name || f.shop,
              shopId:           f.shopId,
              lineItems:        f.lineItems,
              items:            f.lineItems.map(l => `${l.name} ×${l.qty}`).join(', '),
              total:            f.total || 0,
              net:              net,
              status:           f.status,
              note:             f.note,
              adresseLivraison: f.adresseLivraison,
              fraisLivraison:   f.fraisLivraison,
              fraisInstallation:f.fraisInstallation,
              fraisService:     f.fraisService,
              date:             order?.date || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              createdAt:        order?.createdAt || new Date().toISOString(),
            });
            setDone(true); setTimeout(() => { setDone(false); onClose(); }, 1000);
          }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Créer la commande'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function OrderDetail({ order, onClose }) {
  const fraisApply = (fr) => fr ? (fr.sens === '+' ? 1 : -1) * (Number(fr.montant) || 0) : 0;
  return (
    <Modal onClose={onClose} closeOnBackdrop>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70">
          <div>
            <div className="font-semibold text-ink">Commande {order.id}</div>
            <div className="text-xs text-muted">{fmtDateTime(order.createdAt)} · {order.shop}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-2 text-sm">
          {[
            ['Client',      order.client],
            ['Téléphone',   order.phone],
            ['Boutique',    order.shop],
            ['Articles',    order.items],
            ['Adresse livr.',order.adresseLivraison],
            ['Note',        order.note],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span className="text-muted w-28 shrink-0">{k}</span>
              <span className="text-ink">{v}</span>
            </div>
          ))}
          <div className="border-t border-line/50 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted">Montant articles</span><span className="tabular-nums">{fmtFcfa(order.total || 0)}</span></div>
            {order.fraisLivraison?.montant ? <div className="flex justify-between"><span className="text-muted">Frais livraison</span><span className={`tabular-nums ${order.fraisLivraison.sens === '-' ? 'text-rose-500' : ''}`}>{order.fraisLivraison.sens}{fmtFcfa(order.fraisLivraison.montant)}</span></div> : null}
            {order.fraisInstallation?.montant ? <div className="flex justify-between"><span className="text-muted">Frais installation</span><span className={`tabular-nums ${order.fraisInstallation.sens === '-' ? 'text-rose-500' : ''}`}>{order.fraisInstallation.sens}{fmtFcfa(order.fraisInstallation.montant)}</span></div> : null}
            {order.fraisService?.montant ? <div className="flex justify-between"><span className="text-muted">Frais service</span><span className={`tabular-nums ${order.fraisService.sens === '-' ? 'text-rose-500' : ''}`}>{order.fraisService.sens}{fmtFcfa(order.fraisService.montant)}</span></div> : null}
            <div className="flex justify-between pt-2 border-t border-line/50 font-semibold text-base">
              <span>Net à payer</span>
              <span className="tabular-nums text-brick-600">{fmtFcfa(order.net ?? order.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const { orders, setOrders, clients, setClients, shops, products, stockPoints, stockByPoint,
          consumeStockForOrder, restoreStockFromBreakdown } = useStore();
  const { user } = useAuth();
  const [modal, setModal]       = useState(null);
  const [detail, setDetail]     = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ─── Sync stock based on status transitions ──────────────────────────────
  // Statuts qui consomment le stock : 'préparée' et 'livrée' (article sorti)
  function shouldDeduct(status) {
    return status === 'préparée' || status === 'livrée';
  }

  function applyStockEffect(order, prevStatus, newStatus) {
    const wasDeducted = shouldDeduct(prevStatus);
    const willDeduct  = shouldDeduct(newStatus);
    if (!wasDeducted && willDeduct) {
      // → consommer
      const breakdown = consumeStockForOrder(order.lineItems || [], order.shopId);
      return { ...order, status: newStatus, stockBreakdown: breakdown };
    }
    if (wasDeducted && !willDeduct) {
      // → restaurer
      restoreStockFromBreakdown(order.stockBreakdown);
      const next = { ...order, status: newStatus };
      delete next.stockBreakdown;
      return next;
    }
    return { ...order, status: newStatus };
  }

  function save(o) {
    setOrders(prev => {
      const i = prev.findIndex(x => x.id === o.id);
      const prevStatus   = i >= 0 ? prev[i].status : null;
      const prevBreakdown = i >= 0 ? prev[i].stockBreakdown : null;
      // Stamp creator on new orders only (preserve on edits)
      const withUser = i >= 0 ? o : {
        ...o,
        createdById:  o.createdById  ?? user?.id   ?? null,
        createdByNom: o.createdByNom ?? user?.nom  ?? null,
      };
      let processed = i >= 0
        ? { ...prev[i], ...withUser, stockBreakdown: prevBreakdown }
        : withUser;
      processed = applyStockEffect(processed, prevStatus, o.status);

      if (i >= 0) { const n = [...prev]; n[i] = processed; return n; }
      return [processed, ...prev];
    });
  }

  function remove(id) {
    setOrders(prev => {
      const order = prev.find(o => o.id === id);
      // Restaurer stock si commande livrée/préparée supprimée
      if (order && shouldDeduct(order.status) && order.stockBreakdown) {
        restoreStockFromBreakdown(order.stockBreakdown);
      }
      return prev.filter(o => o.id !== id);
    });
    setToDelete(null);
  }

  function changeStatus(id, status) {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      return applyStockEffect(o, o.status, status);
    }));
  }

  let filtered = orders;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o => o.client?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q));
  }
  if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus);

  const pending = orders.filter(o => o.status === 'attente').length;
  const today   = orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().slice(0, 10))).length;

  return (
    <div className="fade-in">
      {modal !== null && <OrderModal order={modal === 'add' ? null : modal} clients={clients} setClients={setClients} shops={shops} products={products} stockPoints={stockPoints} stockByPoint={stockByPoint} onClose={() => setModal(null)} onSave={save}/>}
      {detail   && <OrderDetail order={detail} onClose={() => setDetail(null)}/>}
      {toDelete && (
        <Modal onClose={() => setToDelete(null)} closeOnBackdrop>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3"/>
            <div className="font-semibold text-ink mb-1">Supprimer {toDelete.id} ?</div>
            <div className="text-sm text-muted mb-5">Action irréversible.</div>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={() => remove(toDelete.id)} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="COMMANDES" title="Commandes" actionLabel="Nouvelle commande" onAction={() => setModal('add')}/>
      </div>
      <MobileTopBar subtitle="COMMANDES"/>

      <div className="px-4 lg:px-8 py-5 space-y-4">
        <div className="lg:hidden">
          <button onClick={() => setModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14}/> Nouvelle commande
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[['Total', orders.length, 'text-ink'], ['En attente', pending, 'text-amber-600'], ["Aujourd'hui", today, 'text-ink']].map(([l, v, c]) => (
            <div key={l} className="bg-surface border border-line/70 rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-muted">{l}</div>
              <div className={`text-2xl font-semibold tabular-nums mt-1 ${c}`}>{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Client, N° commande…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300"/>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
            <option value="">Tous statuts</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <span className="text-xs text-muted">{filtered.length} commande(s)</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto"><ShoppingCart size={22} className="text-muted"/></div>
            <div className="text-muted text-sm">Aucune commande.</div>
            <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl"><Plus size={14}/> Nouvelle commande</button>
          </div>
        ) : (
          <Card>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                    <th className="text-left py-2.5 px-5 font-medium">N°</th>
                    <th className="text-left py-2.5 px-3 font-medium">Client</th>
                    <th className="text-left py-2.5 px-3 font-medium">Boutique</th>
                    <th className="text-left py-2.5 px-3 font-medium">Articles</th>
                    <th className="text-right py-2.5 px-3 font-medium">Net à payer</th>
                    <th className="text-left py-2.5 px-3 font-medium">Statut</th>
                    <th className="text-left py-2.5 px-3 font-medium">Date</th>
                    <th className="w-12 py-2.5 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50">
                      <td className="py-3 px-5 font-mono text-xs text-muted">{o.id}</td>
                      <td className="px-3 font-medium text-ink">{o.client}</td>
                      <td className="px-3 text-muted text-xs">{o.shop || '—'}</td>
                      <td className="px-3 text-muted text-xs max-w-[160px] truncate">{o.items || '—'}</td>
                      <td className="px-3 text-right tabular-nums font-semibold text-brick-600">{fmtFcfa(o.net ?? o.total ?? 0)}</td>
                      <td className="px-3">
                        <select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}
                          className="text-xs border border-line/50 rounded-lg px-2 py-1 bg-surface focus:outline-none">
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 text-muted text-xs whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                      <td className="px-5">
                        <ActionMenu actions={[
                          { label: 'Voir détail',  icon: Eye,    onClick: () => setDetail(o) },
                          { label: 'Modifier',     icon: Edit2,  onClick: () => setModal(o) },
                          'divider',
                          { label: 'Supprimer',    icon: Trash2, onClick: () => setToDelete(o), danger: true },
                        ]}/>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted text-sm">Aucun résultat.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="lg:hidden divide-y divide-line/50">
              {filtered.map(o => (
                <li key={o.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{o.client}</span>
                        <span className="font-mono text-[10px] text-muted">{o.id}</span>
                      </div>
                      {o.shop && <div className="text-xs text-muted mt-0.5">{o.shop}</div>}
                      {o.items && <div className="text-xs text-muted truncate">{o.items}</div>}
                      <div className="text-[11px] text-muted mt-0.5">{fmtDateTime(o.createdAt)}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-bold tabular-nums text-sm text-brick-600">{fmtFcfa(o.net ?? o.total ?? 0)}</span>
                        <span className={`text-xs font-medium ${STATUS_COLOR[o.status] || 'text-muted'}`}>{o.status}</span>
                      </div>
                    </div>
                    <ActionMenu actions={[
                      { label: 'Voir détail', icon: Eye,    onClick: () => setDetail(o) },
                      { label: 'Modifier',    icon: Edit2,  onClick: () => setModal(o) },
                      { label: 'Changer statut', icon: null, onClick: () => {} },
                      ...ORDER_STATUSES.filter(s => s !== o.status).map(s => ({
                        label: `→ ${s.charAt(0).toUpperCase() + s.slice(1)}`,
                        onClick: () => changeStatus(o.id, s)
                      })),
                      'divider',
                      { label: 'Supprimer', icon: Trash2, onClick: () => setToDelete(o), danger: true },
                    ]}/>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && <li className="py-8 text-center text-muted text-sm">Aucun résultat.</li>}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
