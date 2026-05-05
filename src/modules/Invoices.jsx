import { useState, useEffect, useRef } from 'react';
import { Eye, Download, Send, MoreHorizontal, Plus, X, ArrowLeft, ChevronDown, Trash2, CheckCircle, Edit3 } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, KpiCard, StatusBadge, Tabs } from '../components/ui.jsx';
import { invoices as initialInvoices, invoiceKPIs } from '../data/mockData.js';
import { fmtFcfa, fmtFcfaFull } from '../utils/format.js';
import { usePersistedState } from '../utils/usePersistedState.js';
import { downloadCSV, printHTML, fmtDate } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordConfirmModal from '../components/PasswordConfirmModal.jsx';

function exportInvoicesCSV(list) {
  downloadCSV(`factures-${new Date().toISOString().slice(0, 10)}.csv`,
    ['ID', 'Date', 'Client', 'Échéance', 'Total (FCFA)', 'Statut'],
    list.map(i => [i.id, i.date, i.client, i.due, i.total, i.status])
  );
  toast.success(`${list.length} factures exportées`);
}

function printInvoice(inv) {
  const notesBlock = inv.notes
    ? `<div style="display:flex;justify-content:flex-end;margin-top:24px"><div style="max-width:340px;text-align:right;border-left:3px solid #0d5c2e;padding:8px 12px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#7a7e7b;margin-bottom:4px">Notes & observations</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${escapeHtml(inv.notes)}</div></div></div>`
    : '';
  const html = `
    <div class="header">
      <div>
        <div class="brand">gestCopta</div>
        <h1 style="margin-top:8px">Facture ${inv.id}</h1>
        <div class="muted">Émise le ${inv.date} · échéance ${inv.due}</div>
        ${inv.fromOrderId ? `<div class="muted" style="margin-top:4px;font-size:11px">Liée à la commande ${inv.fromOrderId}</div>` : ''}
      </div>
      <div class="meta">
        <span class="badge ${inv.status === 'retard' ? 'danger' : inv.status === 'attente' ? 'warn' : ''}">${inv.status}</span>
      </div>
    </div>
    <h2>Client</h2>
    <div style="font-size:16px;font-weight:500">${escapeHtml(inv.client)}</div>
    <h2>Détail</h2>
    <table>
      <thead><tr><th>Description</th><th class="right">Montant</th></tr></thead>
      <tbody>
        <tr><td>${escapeHtml(inv.description || 'Prestations & marchandises')}</td><td class="right">${inv.total.toLocaleString('fr-FR')} FCFA</td></tr>
      </tbody>
    </table>
    <div class="total-row">Total · ${inv.total.toLocaleString('fr-FR')} FCFA</div>
    ${notesBlock}
    <p class="muted" style="margin-top:32px;font-size:11px">Document généré automatiquement par gestCopta · ${fmtDate()}</p>
  `;
  printHTML({ title: `Facture ${inv.id}`, body: html });
  toast.success(`Aperçu facture ${inv.id} ouvert`);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const STATUSES = ['payée', 'attente', 'retard'];

export default function Invoices() {
  const { can } = useAuth();
  const canEdit   = can('finances', 'modifier');
  const canDelete = can('finances', 'modifier');
  const [pwdAction, setPwdAction] = useState(null);
  const [invoices, setInvoices] = usePersistedState('gestcopta:invoices', initialInvoices);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [prefill, setPrefill] = useState(null); // pre-fill draft when invoice created from order
  const [detail, setDetail]   = useState(null);
  const [menuFor, setMenuFor] = useState(null);

  // Auto-open NewInvoice modal when an order requested an invoice creation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('gestcopta:invoiceFromOrder');
      if (raw) {
        const draft = JSON.parse(raw);
        sessionStorage.removeItem('gestcopta:invoiceFromOrder');
        setPrefill(draft);
        setShowNew(true);
      }
    } catch {}
  }, []);

  const tabs = [
    { id: 'all',     label: 'Toutes',    count: invoices.length },
    { id: 'payée',   label: 'Payées',    count: invoices.filter(i => i.status === 'payée').length },
    { id: 'attente', label: 'Attente',   count: invoices.filter(i => i.status === 'attente').length },
    { id: 'retard',  label: 'En retard', count: invoices.filter(i => i.status === 'retard').length }
  ];
  let filtered = tab === 'all' ? invoices : invoices.filter(i => i.status === tab);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i =>
      i.id.toLowerCase().includes(q) ||
      i.client.toLowerCase().includes(q)
    );
  }

  function setStatus(id, status) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setMenuFor(null);
  }
  function deleteInvoice(id) {
    setInvoices(prev => prev.filter(i => i.id !== id));
    setMenuFor(null);
    setDetail(null);
  }
  function saveInvoice(inv) {
    setInvoices(prev => {
      const i = prev.findIndex(x => x.id === inv.id);
      if (i >= 0) { const n = [...prev]; n[i] = inv; return n; }
      return [inv, ...prev];
    });
  }

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="COMPTABILITÉ"
          title="Factures"
          searchPlaceholder="Client, ID facture..."
          searchValue={search}
          onSearchChange={setSearch}
          filters={<HeaderFilter value="30" onChange={() => {}} options={[
            { value: '7', label: '7 derniers jours' },
            { value: '30', label: '30 derniers jours' },
            { value: '90', label: '90 derniers jours' },
            { value: 'mtd', label: 'Mois en cours' },
          ]} />}
          actionLabel="Nouvelle facture"
          onAction={() => setShowNew(true)}
          rightExtras={
            <button
              onClick={() => exportInvoicesCSV(invoices)}
              className="px-3 py-2 text-[15px] border border-line/70 rounded-lg hover:bg-surface">
              Exporter
            </button>
          }
        />
      </div>
      <MobileTopBar alerts={3} subtitle="FACTURES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Total émis"  value={fmtFcfa(invoiceKPIs.total)}   sublabel="ce mois · FCFA" accent large />
          <KpiCard label="Payées"      value={fmtFcfa(invoiceKPIs.paid)}    sublabel="68% du total" />
          <KpiCard label="En attente"  value={fmtFcfa(invoiceKPIs.pending)} deltaTone="warning" sublabel="dans les délais" />
          <KpiCard label="En retard"   value={fmtFcfa(invoiceKPIs.overdue)} delta="2 clients" deltaTone="neg" sublabel="à relancer" />
        </div>

        <button
          onClick={() => setShowNew(true)}
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
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setDetail({ inv, mode: 'view' })}>
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
                  <button
                    onClick={() => setDetail({ inv, mode: 'view' })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg bg-bone/40 text-ink/70 hover:border-brick-200">
                    <Eye size={12} /> Voir
                  </button>
                  <button
                    onClick={() => printInvoice(inv)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg text-ink/70 hover:border-brick-200">
                    <Download size={12} /> PDF
                  </button>
                  {inv.status !== 'payée' ? (
                    <button
                      onClick={() => toast.success(`Relance envoyée à ${inv.client}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-brick-200 rounded-lg bg-brick-50 text-brick-600 font-medium">
                      <Send size={12} /> Relancer
                    </button>
                  ) : (
                    <button
                      onClick={() => setDetail({ inv, mode: 'edit' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-line/70 rounded-lg text-ink/70">
                      <Edit3 size={12} /> Modifier
                    </button>
                  )}
                </div>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-center py-10 text-muted text-sm">Aucune facture.</li>}
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
                  <tr key={inv.id}
                    onClick={() => setDetail({ inv, mode: 'view' })}
                    className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer">
                    <td className="py-3 px-5 font-mono text-xs text-brick-500 font-semibold">{inv.id}</td>
                    <td className="px-3 tabular-nums text-muted">{inv.date}</td>
                    <td className="px-3 font-medium text-ink">{inv.client}</td>
                    <td className="px-3 text-muted">{inv.due}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">{fmtFcfa(inv.total)}</td>
                    <td className="px-3"><StatusBadge status={inv.status} /></td>
                    <td className="text-right px-5" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1 text-muted relative">
                        <button onClick={() => setDetail({ inv, mode: 'view' })}
                          className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-brick-500 rounded" title="Voir">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => alert(`Téléchargement PDF facture ${inv.id}`)}
                          className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-brick-500 rounded" title="Télécharger PDF">
                          <Download size={13} />
                        </button>
                        <button onClick={() => toast.success(`Relance envoyée à ${inv.client}`)}
                          className="w-7 h-7 grid place-items-center hover:bg-surface hover:text-brick-500 rounded" title="Envoyer / Relancer">
                          <Send size={13} />
                        </button>
                        <button onClick={() => setMenuFor(menuFor === inv.id ? null : inv.id)}
                          className={`w-7 h-7 grid place-items-center hover:bg-surface hover:text-ink rounded ${menuFor === inv.id ? 'bg-surface text-ink' : ''}`} title="Plus">
                          <MoreHorizontal size={13} />
                        </button>
                        {menuFor === inv.id && (
                          <InvoiceActionMenu
                            inv={inv}
                            onClose={() => setMenuFor(null)}
                            onSetStatus={setStatus}
                            onEdit={() => { setDetail({ inv, mode: 'edit' }); setMenuFor(null); }}
                            onDelete={deleteInvoice}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted text-sm">Aucune facture.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} onCreate={(inv) => { saveInvoice(inv); setShowNew(false); }} />}

      {detail && (
        <InvoiceDetailModal
          inv={detail.inv}
          mode={detail.mode}
          onClose={() => setDetail(null)}
          onSave={(inv) => { saveInvoice(inv); setDetail(null); }}
          onDelete={() => deleteInvoice(detail.inv.id)}
        />
      )}
    </div>
  );
}

// ===================================================================
function InvoiceActionMenu({ inv, onClose, onSetStatus, onEdit, onDelete }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const setItems = STATUSES.filter(s => s !== inv.status).map(s => ({
    status: s,
    label: s === 'payée' ? 'Marquer payée' : s === 'attente' ? 'Marquer en attente' : 'Marquer en retard',
  }));

  return (
    <div ref={ref}
      className="absolute top-9 right-0 w-52 bg-surface border border-line/70 rounded-xl shadow-pop z-20 py-1.5 text-sm">
      {setItems.map(({ status, label }) => (
        <button key={status}
          onClick={() => onSetStatus(inv.id, status)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-bone/60 text-ink/85 text-left">
          <CheckCircle size={14} className="text-brick-600" />
          <span>{label}</span>
        </button>
      ))}
      <div className="border-t border-line/50 my-1" />
      <button onClick={onEdit}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-bone/60 text-ink/85 text-left">
        <Edit3 size={14} className="text-muted" /> <span>Modifier</span>
      </button>
      <button onClick={() => { if (confirm(`Supprimer ${inv.id} ?`)) onDelete(inv.id); }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 text-rose-600 text-left">
        <Trash2 size={14} /> <span>Supprimer</span>
      </button>
    </div>
  );
}

// ===================================================================
function InvoiceDetailModal({ inv, mode: initialMode, onClose, onSave, onDelete }) {
  const [mode, setMode] = useState(initialMode);
  const [f, setF]       = useState({ ...inv });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-surface w-full lg:rounded-2xl lg:max-w-md lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <div className="font-semibold text-ink">{isEdit ? 'Modifier' : 'Facture'} {inv.id}</div>
            <div className="text-[11px] text-muted">{inv.date}</div>
          </div>
          <StatusBadge status={f.status} />
        </div>
        <div className="hidden lg:flex px-6 pt-5 pb-3 items-start justify-between border-b border-line/60">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">FACTURE · {isEdit ? 'MODIFICATION' : 'DÉTAIL'}</div>
            <h2 className="text-lg font-semibold text-ink mt-1">{inv.id} — {inv.client}</h2>
            <p className="text-xs text-muted mt-0.5">{inv.date} · échéance {inv.due}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={f.status} />
            <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-5 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Client</label>
            <input value={f.client} disabled={!isEdit} onChange={e => set('client', e.target.value)} className="field-input disabled:bg-bone/60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Date</label>
              <input value={f.date} disabled={!isEdit} onChange={e => set('date', e.target.value)} className="field-input disabled:bg-bone/60" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Échéance</label>
              <input value={f.due} disabled={!isEdit} onChange={e => set('due', e.target.value)} className="field-input disabled:bg-bone/60" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Total (FCFA)</label>
              <input type="number" value={f.total} disabled={!isEdit} onChange={e => set('total', +e.target.value)} className="field-input disabled:bg-bone/60" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Statut</label>
              <select value={f.status} onChange={e => set('status', e.target.value)} className="field-input">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-between gap-2 bg-surface">
          <button
            onClick={() => { if (confirm(`Supprimer ${inv.id} ?`)) onDelete(); }}
            className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5">
            <Trash2 size={14} /> Supprimer
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => printInvoice(inv)}
              className="px-3 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone flex items-center gap-1.5">
              <Download size={14} /> PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">
              {isEdit ? 'Annuler' : 'Fermer'}
            </button>
            {!isEdit ? (
              <button onClick={() => setMode('edit')} className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg">Modifier</button>
            ) : (
              <button onClick={() => onSave(f)} className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg">Enregistrer</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
function NewInvoiceModal({ onClose, onCreate }) {
  const [client, setClient] = useState('');
  const [date, setDate]     = useState(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase());
  const [due, setDue]       = useState('comptant');
  const [total, setTotal]   = useState(87500);
  const [description, setDescription] = useState('');

  function create() {
    if (!client.trim()) { toast.error('Client requis'); return; }
    onCreate({
      id: `#F-${Math.floor(220 + Math.random() * 99)}`,
      date, client: client.trim(), due,
      total: +total || 0, status: 'attente',
      description,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-[520px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="font-semibold text-ink">Nouvelle facture</div>
        </div>
        <div className="hidden lg:flex px-6 pt-5 pb-3 items-start justify-between border-b border-line/60">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">FACTURES · NOUVELLE</div>
            <h2 className="text-lg font-semibold text-ink mt-1">Créer une facture</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 px-4 lg:px-6 py-5 space-y-4">
          <Field label="Client *">
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Nom ou téléphone..." className="field-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date d'émission">
              <input value={date} onChange={e => setDate(e.target.value)} className="field-input" />
            </Field>
            <Field label="Échéance">
              <select value={due} onChange={e => setDue(e.target.value)} className="field-input">
                <option value="comptant">Comptant</option>
                <option value="15 jours">15 jours</option>
                <option value="30 jours">30 jours</option>
                <option value="60 jours">60 jours</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Détail des prestations ou produits..." className="field-input resize-none" />
          </Field>
          <Field label="Montant (FCFA)">
            <input type="number" min="0" value={total} onChange={e => setTotal(e.target.value)} className="field-input tabular-nums" />
          </Field>
          <div className="bg-brick-50/70 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted">Montant total</div>
            <div className="text-3xl font-semibold tabular-nums text-brick-600 mt-0.5">{fmtFcfaFull(+total || 0)}</div>
            <div className="text-xs text-muted">FCFA</div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="hidden lg:block px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Annuler</button>
          <button
            onClick={() => {
              localStorage.setItem('gestcopta:invoiceDraft', JSON.stringify({ client, date, due, total, description }));
              toast.success('Brouillon enregistré');
            }}
            className="flex-1 lg:flex-initial px-4 py-2.5 text-sm border border-line/70 rounded-lg">Brouillon</button>
          <button
            onClick={create}
            disabled={!client.trim() || !total}
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
