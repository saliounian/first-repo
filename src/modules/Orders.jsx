import { useState } from 'react';
import { Eye, Edit3, MoreHorizontal, X, Plus, Minus, ArrowLeft } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, KpiCard, StatusBadge, Tabs } from '../components/ui.jsx';
import { orders, orderKPIs, shops } from '../data/mockData.js';
import { fmtFcfa, fmtFcfaFull } from '../utils/format.js';

export default function Orders({ fabOpen, setFabOpen }) {
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(fabOpen || false);

  const tabs = [
    { id: 'all',     label: 'Toutes',    count: orders.length },
    { id: 'attente', label: 'Attente',   count: orders.filter(o => o.status === 'attente').length },
    { id: 'préparée',label: 'Préparées', count: orders.filter(o => o.status === 'préparée').length },
    { id: 'livrée',  label: 'Livrées',   count: orders.filter(o => o.status === 'livrée').length },
    { id: 'annulée', label: 'Annulées',  count: orders.filter(o => o.status === 'annulée').length }
  ];

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="COMMERCE"
          title="Registre des commandes"
          searchPlaceholder="Client, ID, téléphone..."
          filters={<HeaderFilter>30 jours ▾</HeaderFilter>}
          actionLabel="Commande rapide"
          onAction={() => setShowModal(true)}
          rightExtras={<button className="px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">Exporter</button>}
        />
      </div>
      <MobileTopBar alerts={3} subtitle="COMMANDES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Aujourd'hui" value={orderKPIs.today} delta={orderKPIs.todayDelta} sublabel="vs hier" accent large />
          <KpiCard label="En attente" value={orderKPIs.pending} sublabel={orderKPIs.pendingDelta} deltaTone="warning" />
          <KpiCard label="Préparées" value={orderKPIs.prepared} sublabel={orderKPIs.preparedDelta} />
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
              <li key={o.id} className="px-3 py-3 flex items-center gap-3">
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
                  <tr key={o.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer">
                    <td className="py-3 px-5 font-mono text-xs text-brick-500 font-semibold">{o.id}</td>
                    <td className="px-3 tabular-nums text-muted">{o.date}</td>
                    <td className="px-3 font-medium text-ink">{o.client}</td>
                    <td className="px-3 tabular-nums text-muted">{o.phone}</td>
                    <td className="px-3 text-ink/80">{o.shop}</td>
                    <td className="text-right tabular-nums px-3">{o.qty}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">{fmtFcfa(o.total)}</td>
                    <td className="px-3"><StatusBadge status={o.status} /></td>
                    <td className="text-right px-5">
                      <div className="inline-flex items-center gap-1 text-muted">
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded"><Eye size={13} /></button>
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded"><Edit3 size={13} /></button>
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded"><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showModal && <NewOrderModal onClose={() => { setShowModal(false); setFabOpen?.(false); }} />}
    </div>
  );
}

// ===================================================================
// NEW ORDER — full-screen on mobile, modal on desktop
// ===================================================================
function NewOrderModal({ onClose }) {
  const [shop, setShop] = useState('plateau');
  const [items, setItems] = useState([
    { id: 1, name: 'Riz parfumé 25kg', qty: 2, price: 14_500 },
    { id: 2, name: 'Huile soja 5L',    qty: 3, price: 6_800 }
  ]);

  const updateQty = (id, delta) =>
    setItems(items.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it));

  const remove = (id) => setItems(items.filter(it => it.id !== id));
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-[560px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile top bar style */}
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
          {/* Client */}
          <div className="space-y-3">
            <Field label="Nom client *">
              <input defaultValue="Mamadou Sow" className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg focus:outline-none focus:border-brick-300 bg-surface" />
              <div className="text-[11px] text-brick-500 mt-1">✓ Existant · 12 cmds</div>
            </Field>
            <Field label="Téléphone *">
              <input defaultValue="+221 77 432 18 90" className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg tabular-nums focus:outline-none focus:border-brick-300 bg-surface" />
            </Field>
          </div>

          {/* Shop selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">Boutique</label>
            <div className="flex gap-2 flex-wrap">
              {shops.map(s => (
                <button
                  key={s.id}
                  onClick={() => setShop(s.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm border transition-all ${
                    shop === s.id
                      ? 'border-brick-500 bg-brick-50 text-brick-600 font-medium'
                      : 'border-line/70 text-ink/70 hover:border-brick-200 bg-surface'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider text-muted">Articles</label>
              <span className="text-[11px] text-muted">prix modifiables</span>
            </div>
            <div className="border border-line/70 rounded-lg divide-y divide-line/60 bg-surface">
              {items.map((it, idx) => (
                <div key={it.id} className={`flex items-center gap-3 px-3 py-3 ${idx === 0 ? 'bg-brick-50/40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${idx === 0 ? 'text-brick-600' : 'text-ink'}`}>{it.name}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 border border-line/70 rounded-md bg-bone/40">
                    <button onClick={() => updateQty(it.id, -1)} className="w-7 h-7 grid place-items-center hover:bg-surface rounded-l-md"><Minus size={11} /></button>
                    <span className="w-8 text-center font-semibold tabular-nums">×{it.qty}</span>
                    <button onClick={() => updateQty(it.id, +1)} className="w-7 h-7 grid place-items-center hover:bg-surface rounded-r-md"><Plus size={11} /></button>
                  </div>
                  <div className="w-20 text-right tabular-nums text-sm font-semibold">{fmtFcfa(it.price * it.qty)}</div>
                  <button onClick={() => remove(it.id)} className="text-muted hover:text-rose-500 px-1"><X size={13} /></button>
                </div>
              ))}
            </div>
            <button className="mt-2 text-xs text-brick-500 hover:underline flex items-center gap-1">
              <Plus size={11} /> Ajouter article
            </button>
          </div>

          {/* Total card */}
          <div className="bg-brick-50/70 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Total estimé</div>
            <div className="text-3xl font-semibold tabular-nums text-brick-600 mt-0.5">{fmtFcfaFull(total)}</div>
            <div className="text-xs text-muted">FCFA</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="hidden lg:block px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Annuler</button>
          <button className="flex-1 lg:flex-initial px-4 py-2.5 text-sm border border-line/70 rounded-lg hover:bg-bone">Brouillon</button>
          <button className="flex-1 lg:flex-initial px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg">
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
