import { useState } from 'react';
import { Eye, Download, Send, MoreHorizontal, Plus, X, ArrowLeft, ChevronDown } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, KpiCard, StatusBadge, Tabs } from '../components/ui.jsx';
import { invoices, invoiceKPIs } from '../data/mockData.js';
import { fmtFcfa, fmtFcfaFull } from '../utils/format.js';

export default function Invoices() {
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const tabs = [
    { id: 'all',     label: 'Toutes',    count: invoices.length },
    { id: 'payée',   label: 'Payées',    count: invoices.filter(i => i.status === 'payée').length },
    { id: 'attente', label: 'Attente',   count: invoices.filter(i => i.status === 'attente').length },
    { id: 'retard',  label: 'En retard', count: invoices.filter(i => i.status === 'retard').length }
  ];
  const filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab);

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="COMPTABILITÉ"
          title="Factures"
          searchPlaceholder="Client, ID facture..."
          filters={<HeaderFilter>30 jours ▾</HeaderFilter>}
          actionLabel="Nouvelle facture"
          onAction={() => setShowModal(true)}
          rightExtras={<button className="px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">Exporter</button>}
        />
      </div>
      <MobileTopBar alerts={3} subtitle="FACTURES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Total émis"  value={fmtFcfa(invoiceKPIs.total)}   sublabel="ce mois · FCFA" accent large />
          <KpiCard label="Payées"      value={fmtFcfa(invoiceKPIs.paid)}    sublabel="68% du total" />
          <KpiCard label="En attente"  value={fmtFcfa(invoiceKPIs.pending)} deltaTone="warning" sublabel="dans les délais" />
          <KpiCard label="En retard"   value={fmtFcfa(invoiceKPIs.overdue)} delta="2 clients" deltaTone="neg" sublabel="à relancer" />
        </div>

        {/* Mobile: new invoice button */}
        <button
          onClick={() => setShowModal(true)}
          className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} /> Nouvelle facture
        </button>

        <Card>
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            <div className="text-xs text-muted">{filtered.length} factures</div>
          </div>

          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-line/50 px-2">
            {filtered.map(inv => (
              <li key={inv.id} className="px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] text-brick-500 font-semibold">{inv.id}</span>
                      <span className="text-[11px] text-muted">{inv.date}</span>
                    </div>
                    <div className="text-sm font-medium text-ink truncate">{inv.client}</div>
                    <div className="text-[11px] text-muted mt-0.5">Échéance · {inv.due}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">{fmtFcfa(inv.total)}</div>
                    <div className="mt-0.5"><StatusBadge status={inv.status} /></div>
                  </div>
                </div>
                {/* Mobile action row */}
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-line/40">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg bg-bone/40 text-ink/70 hover:border-brick-200">
                    <Eye size={12} /> Voir
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg bg-none text-ink/70 hover:border-brick-200">
                    <Download size={12} /> Télécharger
                  </button>
                  {inv.status !== 'payée' && (
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-brick-200 rounded-lg bg-brick-50 text-brick-600 font-medium">
                      <Send size={12} /> Relancer
                    </button>
                  )}
                  {inv.status === 'payée' && (
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg text-ink/70">
                      <MoreHorizontal size={12} /> Plus
                    </button>
                  )}
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
                  <th className="text-left py-2 px-3 font-medium">Échéance</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-left py-2 px-3 font-medium">Statut</th>
                  <th className="text-right py-2 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer">
                    <td className="py-3 px-5 font-mono text-xs text-brick-500 font-semibold">{inv.id}</td>
                    <td className="px-3 tabular-nums text-muted">{inv.date}</td>
                    <td className="px-3 font-medium text-ink">{inv.client}</td>
                    <td className="px-3 text-muted">{inv.due}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">{fmtFcfa(inv.total)}</td>
                    <td className="px-3"><StatusBadge status={inv.status} /></td>
                    <td className="text-right px-5">
                      <div className="inline-flex items-center gap-1 text-muted">
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded" title="Voir"><Eye size={13} /></button>
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded" title="Télécharger"><Download size={13} /></button>
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded" title="Envoyer"><Send size={13} /></button>
                        <button className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded" title="Plus"><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showModal && <NewInvoiceModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ===================================================================
// NOUVELLE FACTURE MODAL
// ===================================================================
function NewInvoiceModal({ onClose }) {
  const total = 87_500;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-[520px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="font-semibold text-ink">Nouvelle facture</div>
        </div>
        {/* Desktop header */}
        <div className="hidden lg:flex px-6 pt-5 pb-3 items-start justify-between border-b border-line/60">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">FACTURES · NOUVELLE</div>
            <h2 className="text-lg font-semibold text-ink mt-1">Créer une facture</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-5 space-y-4">
          <Field label="Client *">
            <input placeholder="Nom ou téléphone..." className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg focus:outline-none focus:border-brick-300 bg-surface" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date d'émission">
              <input type="date" className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg focus:outline-none focus:border-brick-300 bg-surface" />
            </Field>
            <Field label="Échéance">
              <input type="date" className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg focus:outline-none focus:border-brick-300 bg-surface" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} placeholder="Détail des prestations ou produits..." className="w-full px-3 py-2.5 text-sm border border-line/70 rounded-lg focus:outline-none focus:border-brick-300 bg-surface resize-none" />
          </Field>
          <div className="bg-brick-50/70 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Montant total</div>
            <div className="text-3xl font-semibold tabular-nums text-brick-600 mt-0.5">{fmtFcfaFull(total)}</div>
            <div className="text-xs text-muted">FCFA</div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="hidden lg:block px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Annuler</button>
          <button className="flex-1 lg:flex-initial px-4 py-2.5 text-sm border border-line/70 rounded-lg">Brouillon</button>
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
