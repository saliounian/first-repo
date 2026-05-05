import { useState, useEffect, useRef } from 'react';
import { Eye, Edit3, MoreHorizontal, X, Plus, Minus, ArrowLeft, Trash2, Printer, CheckCircle, Ban, FileText } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, KpiCard, StatusBadge, Tabs } from '../components/ui.jsx';
import { orders as initialOrders, orderKPIs, shops, products as catalog, stockPoints } from '../data/mockData.js';
import { fmtFcfa, fmtFcfaFull } from '../utils/format.js';
import { usePersistedState } from '../utils/usePersistedState.js';
import { downloadCSV, printHTML, fmtDate } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordConfirmModal from '../components/PasswordConfirmModal.jsx';

const STATUSES = ['attente', 'préparée', 'livrée', 'annulée'];

export default function Orders({ fabOpen, setFabOpen, navigate }) {
  const { can } = useAuth();
  const canEdit   = can('commandes', 'modifier_prix') || can('commandes', 'creer');
  const canDelete = can('commandes', 'annuler');
  const [pwdAction, setPwdAction] = useState(null); // { type, payload }
  const [orders, setOrders] = usePersistedState('gestcopta:orders', initialOrders);
  const [tab, setTab]       = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(fabOpen || false);
  const [detail, setDetail] = useState(null);    // { order, mode: 'view' | 'edit' }
  const [menuFor, setMenuFor] = useState(null);  // order id with menu open

  const tabs = [
    { id: 'all',     label: 'Toutes',    count: orders.length },
    { id: 'attente', label: 'Attente',   count: orders.filter(o => o.status === 'attente').length },
    { id: 'préparée',label: 'Préparées', count: orders.filter(o => o.status === 'préparée').length },
    { id: 'livrée',  label: 'Livrées',   count: orders.filter(o => o.status === 'livrée').length },
    { id: 'annulée', label: 'Annulées',  count: orders.filter(o => o.status === 'annulée').length }
  ];

  let filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.client.toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q)
    );
  }

  function setStatus(id, status) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setMenuFor(null);
  }
  function deleteOrder(id) {
    setOrders(prev => prev.filter(o => o.id !== id));
    setMenuFor(null);
    setDetail(null);
  }
  function saveOrder(order) {
    setOrders(prev => {
      const i = prev.findIndex(o => o.id === order.id);
      if (i >= 0) { const n = [...prev]; n[i] = order; return n; }
      return [order, ...prev];
    });
  }

  // Ask for password before destructive ops
  function requestDelete(order) {
    if (!canDelete) { toast.error('Vous n\'avez pas la permission de supprimer une commande'); return; }
    setPwdAction({ type: 'delete', orderId: order.id, label: order.id });
  }
  function requestEdit(order, savedFields) {
    if (!canEdit) { toast.error('Vous n\'avez pas la permission de modifier une commande'); return; }
    setPwdAction({ type: 'edit', order: { ...order, ...savedFields } });
  }
  function execPwdAction() {
    if (!pwdAction) return;
    if (pwdAction.type === 'delete') deleteOrder(pwdAction.orderId);
    if (pwdAction.type === 'edit')   { saveOrder(pwdAction.order); setDetail(null); }
    setPwdAction(null);
    toast.success(pwdAction.type === 'delete' ? 'Commande supprimée' : 'Commande modifiée');
  }

  function createInvoiceFromOrder(o) {
    const draft = {
      client: o.client,
      total: o.total,
      description: `Référence commande ${o.id} · ${o.qty} articles`,
      fromOrderId: o.id,
    };
    sessionStorage.setItem('gestcopta:invoiceFromOrder', JSON.stringify(draft));
    setMenuFor(null);
    toast.success(`Facture pré-remplie depuis ${o.id}`);
    navigate?.('invoices');
  }
  function printOrder(o) {
    const itemRows = (o.items && o.items.length > 0)
      ? o.items.map(it => `<tr><td>${it.name}${it.sku ? ` <span class="muted">(${it.sku})</span>` : ''}</td><td class="right">${it.qty}</td><td class="right">${(it.price || 0).toLocaleString('fr-FR')}</td><td class="right">${(it.total || it.qty * it.price).toLocaleString('fr-FR')}</td></tr>`).join('')
      : `<tr><td>Marchandises</td><td class="right">${o.qty}</td><td class="right">—</td><td class="right">${(o.total || 0).toLocaleString('fr-FR')}</td></tr>`;
    const subtotal = o.subtotal != null ? o.subtotal : o.total;
    const html = `
      <div class="header">
        <div>
          <div class="brand">gestCopta</div>
          <h1 style="margin-top:8px">Bon de commande ${o.id}</h1>
          <div class="muted">${o.date} · ${o.shop}${o.stockPoint ? ` · ${o.stockPoint}` : ''}</div>
        </div>
        <div class="meta"><span class="badge">${o.status}</span></div>
      </div>
      <h2>Client</h2>
      <div style="font-size:16px;font-weight:500">${o.client}</div>
      <div class="muted">${o.phone || '—'}</div>
      <h2>Détail</h2>
      <table>
        <thead><tr><th>Article</th><th class="right">Qté</th><th class="right">Prix unit.</th><th class="right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <table style="width:auto;min-width:280px">
          <tbody>
            <tr><td class="muted">Sous-total</td><td class="right">${subtotal.toLocaleString('fr-FR')} FCFA</td></tr>
            ${o.discount > 0 ? `<tr><td class="muted">Remise${o.discountLabel ? ` (${o.discountLabel})` : ''}</td><td class="right" style="color:#b45309">− ${o.discount.toLocaleString('fr-FR')} FCFA</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <div class="total-row">Total · ${(o.total || 0).toLocaleString('fr-FR')} FCFA</div>
      <p class="muted" style="margin-top:32px;font-size:11px">Édité le ${fmtDate()} · gestCopta</p>
    `;
    printHTML({ title: `Commande ${o.id}`, body: html });
    toast.success(`Aperçu bon ${o.id} ouvert`);
    setMenuFor(null);
  }
  function exportCSV() {
    downloadCSV(`commandes-${new Date().toISOString().slice(0,10)}.csv`,
      ['ID','Date','Client','Téléphone','Boutique','Qté','Total','Statut'],
      orders.map(o => [o.id, o.date, o.client, o.phone, o.shop, o.qty, o.total, o.status]));
    toast.success(`${orders.length} commandes exportées`);
  }

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="COMMERCE"
          title="Registre des commandes"
          searchPlaceholder="Client, ID, téléphone..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={<HeaderFilter value="30" onChange={() => {}} options={[
            { value: '7', label: '7 derniers jours' },
            { value: '30', label: '30 derniers jours' },
            { value: '90', label: '90 derniers jours' },
            { value: 'mtd', label: 'Mois en cours' },
          ]} />}
          actionLabel="Commande rapide"
          onAction={() => setShowModal(true)}
          rightExtras={
            <button
              onClick={exportCSV}
              className="px-3 py-2 text-[15px] border border-line/70 rounded-lg hover:bg-surface">
              Exporter
            </button>
          }
        />
      </div>
      <MobileTopBar alerts={3} subtitle="COMMANDES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Aujourd'hui" value={orderKPIs.today} delta={orderKPIs.todayDelta} sublabel="vs hier" accent large />
          <KpiCard label="En attente" value={orders.filter(o => o.status === 'attente').length} sublabel={orderKPIs.pendingDelta} deltaTone="warning" />
          <KpiCard label="Préparées" value={orders.filter(o => o.status === 'préparée').length} sublabel={orderKPIs.preparedDelta} />
          <KpiCard label="CA du jour" value={fmtFcfa(orderKPIs.caToday)} sublabel={orderKPIs.caTodayDelta} />
        </div>

        <Card>
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            <div className="text-xs text-muted">{filtered.length} cmd</div>
          </div>

          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-line/50 px-2">
            {filtered.map(o => (
              <li key={o.id}
                onClick={() => setDetail({ order: o, mode: 'view' })}
                className="px-3 py-3 flex items-center gap-3 cursor-pointer active:bg-brick-50/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-brick-500 font-semibold">{o.id}</span>
                    <span className="text-[11px] text-muted">{o.shop}</span>
                  </div>
                  <div className="text-sm font-medium text-ink truncate mt-0.5">{o.client}</div>
                  <div className="text-[11px] text-muted">{o.date} · {o.qty} art.</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{fmtFcfa(o.total)}</div>
                  <div className="mt-0.5"><StatusBadge status={o.status} /></div>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-center py-10 text-muted text-sm">Aucune commande.</li>
            )}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="text-left py-2 px-5 font-medium">ID</th>
                  <th className="text-left py-2 px-3 font-medium">Date</th>
                  <th className="text-left py-2 px-3 font-medium">Client</th>
                  <th className="text-left py-2 px-3 font-medium">Téléphone</th>
                  <th className="text-left py-2 px-3 font-medium">Boutique</th>
                  <th className="text-right py-2 px-3 font-medium">Qté</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-left py-2 px-3 font-medium">Statut</th>
                  <th className="text-right py-2 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}
                    onClick={() => setDetail({ order: o, mode: 'view' })}
                    className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer">
                    <td className="py-3 px-5 font-mono text-xs text-brick-500 font-semibold">{o.id}</td>
                    <td className="px-3 tabular-nums text-muted">{o.date}</td>
                    <td className="px-3 font-medium text-ink">{o.client}</td>
                    <td className="px-3 tabular-nums text-muted">{o.phone}</td>
                    <td className="px-3 text-ink/80">{o.shop}</td>
                    <td className="text-right tabular-nums px-3">{o.qty}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">{fmtFcfa(o.total)}</td>
                    <td className="px-3"><StatusBadge status={o.status} /></td>
                    <td className="text-right px-5" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1 text-muted relative">
                        <button
                          onClick={() => setDetail({ order: o, mode: 'view' })}
                          title="Voir"
                          className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-brick-500 rounded">
                          <Eye size={13} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => setDetail({ order: o, mode: 'edit' })}
                            title="Modifier"
                            className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-brick-500 rounded">
                            <Edit3 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setMenuFor(menuFor === o.id ? null : o.id)}
                          title="Plus"
                          className={`w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded ${menuFor === o.id ? 'bg-surface text-ink' : ''}`}>
                          <MoreHorizontal size={13} />
                        </button>

                        {menuFor === o.id && (
                          <ActionMenu
                            order={o}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onClose={() => setMenuFor(null)}
                            onSetStatus={setStatus}
                            onPrint={printOrder}
                            onDelete={(_id, ord) => requestDelete(ord)}
                            onCreateInvoice={createInvoiceFromOrder}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-muted text-sm">Aucune commande.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showModal && (
        <NewOrderModal
          onClose={() => { setShowModal(false); setFabOpen?.(false); }}
          onCreate={(o) => { saveOrder(o); setShowModal(false); setFabOpen?.(false); }}
        />
      )}

      {detail && (
        <OrderDetailModal
          order={detail.order}
          mode={detail.mode}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setDetail(null)}
          onSave={(o) => requestEdit(detail.order, o)}
          onDelete={() => requestDelete(detail.order)}
        />
      )}

      {pwdAction && (
        <PasswordConfirmModal
          title={pwdAction.type === 'delete' ? `Supprimer la commande ${pwdAction.label}` : 'Confirmer la modification'}
          description={pwdAction.type === 'delete'
            ? 'Cette action est irréversible. Confirmez votre mot de passe pour supprimer.'
            : 'Confirmez votre mot de passe pour valider la modification.'}
          confirmLabel={pwdAction.type === 'delete' ? 'Supprimer' : 'Enregistrer'}
          tone={pwdAction.type === 'delete' ? 'danger' : 'warning'}
          onConfirm={execPwdAction}
          onCancel={() => setPwdAction(null)}
        />
      )}
    </div>
  );
}

// ===================================================================
// Action menu (popover for "..." button)
// ===================================================================
function ActionMenu({ order, canEdit, canDelete, onClose, onSetStatus, onPrint, onDelete, onCreateInvoice }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const setItems = [
    { status: 'préparée', label: 'Marquer préparée', Icon: CheckCircle, tone: 'text-blue-600' },
    { status: 'livrée',   label: 'Marquer livrée',   Icon: CheckCircle, tone: 'text-brick-600' },
    { status: 'annulée',  label: 'Annuler',          Icon: Ban,         tone: 'text-amber-600' },
  ].filter(s => s.status !== order.status);

  return (
    <div ref={ref}
      className="absolute top-9 right-0 w-52 bg-surface border border-line/70 rounded-xl shadow-pop z-20 py-1.5 text-sm">
      {setItems.map(({ status, label, Icon, tone }) => (
        <button key={status}
          onClick={() => onSetStatus(order.id, status)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-bone/60 text-ink/85 text-left">
          <Icon size={14} className={tone} />
          <span>{label}</span>
        </button>
      ))}
      <div className="border-t border-line/50 my-1" />
      <button onClick={() => onCreateInvoice(order)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-bone/60 text-ink/85 text-left">
        <FileText size={14} className="text-blue-600" /> <span>Créer une facture</span>
      </button>
      <button onClick={() => onPrint(order)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-bone/60 text-ink/85 text-left">
        <Printer size={14} className="text-muted" /> <span>Imprimer</span>
      </button>
      {canDelete && (
        <button onClick={() => onDelete(order.id, order)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 text-rose-600 text-left">
          <Trash2 size={14} /> <span>Supprimer</span>
        </button>
      )}
    </div>
  );
}

// ===================================================================
// ORDER DETAIL — view + edit
// ===================================================================
function OrderDetailModal({ order, mode: initialMode, canEdit, canDelete, onClose, onSave, onDelete }) {
  const [mode, setMode] = useState(initialMode);
  const [f, setF]       = useState({ ...order });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const isEdit = mode === 'edit' && canEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-surface w-full lg:rounded-2xl lg:max-w-[520px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <div className="font-semibold text-ink">{isEdit ? 'Modifier' : 'Commande'} {order.id}</div>
            <div className="text-[11px] text-muted">{order.date}</div>
          </div>
          <StatusBadge status={f.status} />
        </div>
        {/* Desktop header */}
        <div className="hidden lg:flex px-6 pt-5 pb-3 items-start justify-between border-b border-line/60">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">COMMANDE · {isEdit ? 'MODIFICATION' : 'DÉTAIL'}</div>
            <h2 className="text-lg font-semibold text-ink mt-1">{order.id} — {order.client}</h2>
            <p className="text-xs text-muted mt-0.5">{order.date} · {order.shop}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={f.status} />
            <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-5 space-y-4">
          <Field label="Client">
            <input value={f.client} disabled={!isEdit} onChange={e => set('client', e.target.value)} className="field-input disabled:bg-bone/60" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <input value={f.phone} disabled={!isEdit} onChange={e => set('phone', e.target.value)} className="field-input disabled:bg-bone/60" />
            </Field>
            <Field label="Boutique">
              <select value={f.shop} disabled={!isEdit} onChange={e => set('shop', e.target.value)} className="field-input disabled:bg-bone/60">
                {shops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Quantité">
              <input type="number" min="0" value={f.qty} disabled={!isEdit} onChange={e => set('qty', +e.target.value)} className="field-input disabled:bg-bone/60" />
            </Field>
            <Field label="Total (FCFA)">
              <input type="number" min="0" value={f.total} disabled={!isEdit} onChange={e => set('total', +e.target.value)} className="field-input disabled:bg-bone/60" />
            </Field>
          </div>
          <Field label="Statut">
            <select value={f.status} onChange={e => set('status', e.target.value)} className="field-input">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-between gap-2 bg-surface">
          {canDelete ? (
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5">
              <Trash2 size={14} /> Supprimer
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">
              {isEdit ? 'Annuler' : 'Fermer'}
            </button>
            {!isEdit ? (
              canEdit && (
                <button onClick={() => setMode('edit')} className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg">
                  Modifier
                </button>
              )
            ) : (
              <button onClick={() => onSave(f)} className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg">
                Enregistrer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// NEW ORDER — full-screen on mobile, modal on desktop
// ===================================================================
function NewOrderModal({ onClose, onCreate }) {
  const [shop, setShop]         = useState('plateau');
  const [stockPoint, setStockPoint] = useState('');
  const [client, setClient]     = useState('');
  const [phone, setPhone]       = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('pct'); // 'pct' | 'fcfa'
  const [items, setItems]       = useState([
    // Pre-fill with one row to guide UX
    { id: Date.now(), productId: '', qty: 1, price: 0 },
  ]);

  // Filter stock points to selected shop
  const shopPoints = stockPoints.filter(sp => sp.shopId === shop);

  function setItem(id, key, value) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it));
  }
  function setItemProduct(id, productId) {
    const p = catalog.find(x => x.id === productId);
    setItems(prev => prev.map(it => it.id === id
      ? { ...it, productId, price: p?.price || 0 }
      : it));
  }
  function addItem() {
    setItems(prev => [...prev, { id: Date.now() + Math.random(), productId: '', qty: 1, price: 0 }]);
  }
  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discountAmount = discountType === 'pct'
    ? Math.round(subtotal * (Number(discount) || 0) / 100)
    : Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountAmount);
  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  // Validation: each item needs a productId, qty > 0
  const validItems = items.filter(it => it.productId && Number(it.qty) > 0);
  const canCreate  = client.trim() && stockPoint && validItems.length > 0;

  function create() {
    if (!client.trim()) { toast.error('Nom du client requis'); return; }
    if (!stockPoint)    { toast.error('Sélectionnez un point de stock'); return; }
    if (validItems.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    const shopName = shops.find(s => s.id === shop)?.name || shop;
    const spName   = stockPoints.find(sp => sp.id === stockPoint)?.name || stockPoint;
    const order = {
      id: `#${Math.floor(2900 + Math.random() * 99)}`,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      client: client.trim(),
      phone: phone.trim() || '—',
      shop: shopName,
      stockPoint: spName,
      qty: totalQty,
      subtotal,
      discount: discountAmount,
      discountLabel: discountType === 'pct' ? `${discount}%` : `${discount} FCFA`,
      total,
      status: 'attente',
      items: validItems.map(it => {
        const p = catalog.find(x => x.id === it.productId);
        return { name: p?.name || '—', sku: p?.sku || '', qty: +it.qty, price: +it.price, total: +it.qty * +it.price };
      }),
    };
    onCreate(order);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-[560px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden px-4 pt-4 pb-2 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="font-semibold text-ink">Commande rapide</div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex px-6 pt-5 pb-3 items-start justify-between border-b border-line/60">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">COMMANDES · MODALE</div>
            <h2 className="text-lg font-semibold text-ink mt-1">Nouvelle commande rapide</h2>
            <p className="text-xs text-muted mt-1">Saisie minimale — le client est créé s'il n'existe pas.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-5 space-y-5">
          <div className="space-y-3">
            <Field label="Nom client *">
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Ex: Mamadou Sow" className="field-input" />
            </Field>
            <Field label="Téléphone">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+221 77 …" className="field-input tabular-nums" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-medium">Boutique</label>
              <select value={shop} onChange={e => { setShop(e.target.value); setStockPoint(''); }} className="field-input">
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-medium">Point de stock *</label>
              <select value={stockPoint} onChange={e => setStockPoint(e.target.value)} className="field-input" disabled={shopPoints.length === 0}>
                <option value="">Choisir un point…</option>
                {shopPoints.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-muted font-medium">Articles</label>
              <span className="text-xs text-muted">{validItems.length} produit{validItems.length > 1 ? 's' : ''}</span>
            </div>
            <div className="border border-line/70 rounded-xl divide-y divide-line/60 bg-surface overflow-hidden">
              {items.map((it) => {
                const p = catalog.find(x => x.id === it.productId);
                return (
                  <div key={it.id} className="px-3 py-3 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <select value={it.productId} onChange={e => setItemProduct(it.id, e.target.value)} className="field-input text-sm">
                          <option value="">— Choisir un produit —</option>
                          {catalog.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku}) · {fmtFcfa(p.price)}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={() => removeItem(it.id)} className="w-9 h-9 grid place-items-center text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"><X size={14} /></button>
                    </div>
                    {it.productId && (
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">Qté</label>
                          <div className="inline-flex items-center gap-1 border border-line/70 rounded-lg bg-bone/40 w-full">
                            <button onClick={() => setItem(it.id, 'qty', Math.max(1, +it.qty - 1))} className="w-9 h-9 grid place-items-center hover:bg-surface rounded-l-lg"><Minus size={12} /></button>
                            <input type="number" min="1" value={it.qty} onChange={e => setItem(it.id, 'qty', +e.target.value || 1)} className="flex-1 text-center font-semibold tabular-nums bg-transparent border-0 focus:outline-none w-full" />
                            <button onClick={() => setItem(it.id, 'qty', +it.qty + 1)} className="w-9 h-9 grid place-items-center hover:bg-surface rounded-r-lg"><Plus size={12} /></button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">Prix unit.</label>
                          <input type="number" min="0" value={it.price} onChange={e => setItem(it.id, 'price', +e.target.value || 0)} className="field-input text-sm tabular-nums" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">Sous-total</label>
                          <div className="px-3 py-2 text-sm font-semibold tabular-nums text-ink bg-bone/60 rounded-lg">{fmtFcfa(it.qty * it.price)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={addItem} className="mt-2 text-sm text-brick-500 hover:underline flex items-center gap-1.5">
              <Plus size={13} /> Ajouter un produit
            </button>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-medium">Remise globale</label>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="field-input tabular-nums" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5 font-medium">Type</label>
              <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="field-input">
                <option value="pct">% Pourcentage</option>
                <option value="fcfa">FCFA Montant fixe</option>
              </select>
            </div>
          </div>

          <div className="bg-brick-50/70 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Sous-total</span>
              <span className="tabular-nums font-medium">{fmtFcfaFull(subtotal)} FCFA</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-700">
                <span>Remise ({discountType === 'pct' ? `${discount}%` : 'fixe'})</span>
                <span className="tabular-nums font-medium">− {fmtFcfaFull(discountAmount)} FCFA</span>
              </div>
            )}
            <div className="border-t border-brick-100 pt-2 mt-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">Total à payer</div>
                <div className="text-3xl font-semibold tabular-nums text-brick-600 mt-0.5 leading-none">{fmtFcfaFull(total)}</div>
              </div>
              <div className="text-xs text-muted text-right">FCFA<br />{totalQty} articles</div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="hidden lg:block px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Annuler</button>
          <button
            onClick={() => {
              localStorage.setItem('gestcopta:orderDraft', JSON.stringify({ shop, client, phone, items }));
              toast.success('Brouillon enregistré');
            }}
            className="flex-1 lg:flex-initial px-4 py-2.5 text-sm border border-line/70 rounded-lg hover:bg-bone">
            Brouillon
          </button>
          <button
            onClick={create}
            disabled={!client.trim() || total === 0}
            className="flex-1 lg:flex-initial px-5 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg">
            Créer →
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
