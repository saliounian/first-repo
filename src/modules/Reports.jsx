import { useState } from 'react';
import { Download, FileText, TrendingUp, Package, Users, Wallet, ChevronRight, BarChart3, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { fmtFcfa } from '../utils/format.js';
import { downloadCSV, printHTML, fmtDate } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';

const REPORT_META = [
  { id: 'sales',    icon: TrendingUp, name: 'Ventes & CA',          desc: 'CA par boutique et par commande',      color: '#0D5C2E' },
  { id: 'inv',      icon: Package,    name: 'Inventaire',           desc: 'État stock, points de stock',           color: '#F4A93B' },
  { id: 'clients',  icon: Users,      name: 'Clients',              desc: 'Liste clients et commandes',            color: '#3B82F6' },
  { id: 'cash',     icon: Wallet,     name: 'Factures',             desc: 'Encaissements et statuts',              color: '#8B5CF6' },
  { id: 'transfer', icon: BarChart3,  name: 'Transferts',           desc: 'Mouvements inter-boutiques',            color: '#F97316' },
];

function buildReport(id, { orders, clients, products, shops, stockPoints, invoices, transfers, totalStockForProduct }) {
  switch (id) {
    case 'sales':
      return {
        title: 'Ventes & CA',
        headers: ['N°', 'Client', 'Boutique', 'Articles', 'Net à payer', 'Statut', 'Date'],
        rows: orders.map(o => [o.id, o.client, o.shop || '—', o.items || '—', o.net ?? o.total ?? 0, o.status, o.date || '—']),
        summary: `${orders.length} commandes · CA ${fmtFcfa(orders.reduce((s, o) => s + (o.net ?? o.total ?? 0), 0))}`,
      };
    case 'inv':
      return {
        title: 'Inventaire physique',
        headers: ['Produit', 'SKU', 'Catégorie', 'Prix', 'Unités en stock'],
        rows: products.map(p => [p.name, p.sku || '—', p.category || '—', p.price || 0, totalStockForProduct(p.id)]),
        summary: `${products.length} produits · ${products.reduce((s, p) => s + totalStockForProduct(p.id), 0)} unités`,
      };
    case 'clients':
      return {
        title: 'Clients',
        headers: ['Nom', 'Téléphone', 'Type', 'Email', 'Adresse'],
        rows: clients.map(c => [c.name, c.phone || '—', c.type, c.email || '—', c.address || '—']),
        summary: `${clients.length} clients`,
      };
    case 'cash':
      return {
        title: 'Factures',
        headers: ['N°', 'Client', 'Boutique', 'Net à payer', 'Statut', 'Date'],
        rows: invoices.map(i => [i.id, i.client, i.shop || '—', i.net ?? i.total ?? 0, i.status, i.date || '—']),
        summary: `${invoices.length} factures · Total ${fmtFcfa(invoices.reduce((s, i) => s + (i.net ?? i.total ?? 0), 0))}`,
      };
    case 'transfer':
      return {
        title: 'Transferts inter-boutiques',
        headers: ['Produit', 'De', 'Vers', 'Qté', 'Date'],
        rows: transfers.map(t => [t.product || '—', t.from || '—', t.to || '—', t.qty || 0, t.date || '—']),
        summary: `${transfers.length} transfert(s)`,
      };
    default:
      return { title: '—', headers: [], rows: [], summary: '' };
  }
}

function exportReport(id, mode, storeData) {
  const r = buildReport(id, storeData);
  if (mode === 'csv') {
    downloadCSV(`rapport-${id}-${new Date().toISOString().slice(0, 10)}.csv`, r.headers, r.rows);
    toast.success(`${r.title} — CSV téléchargé`);
  } else {
    const tableRows = r.rows.map(row =>
      `<tr>${row.map(c => `<td${typeof c === 'number' ? ' class="right"' : ''}>${typeof c === 'number' ? c.toLocaleString('fr-FR') : c}</td>`).join('')}</tr>`
    ).join('');
    printHTML({
      title: r.title,
      body: `
        <div class="header">
          <div><div class="brand">gestCopta</div><h1>${r.title}</h1><div class="muted">${r.summary}</div></div>
          <div class="meta"><div class="muted">Édité le</div><div>${fmtDate()}</div></div>
        </div>
        <table>
          <thead><tr>${r.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>`
    });
    toast.success(`${r.title} — Aperçu ouvert`);
  }
}

export default function Reports() {
  const store = useStore();
  const { orders, clients, products, shops, stockPoints, invoices, transfers, totalStockForProduct } = store;
  const storeData = { orders, clients, products, shops, stockPoints, invoices, transfers, totalStockForProduct };

  const [preview, setPreview] = useState(null);

  const totalCA    = orders.reduce((s, o) => s + (o.net ?? o.total ?? 0), 0);
  const totalInv   = invoices.reduce((s, i) => s + (i.net ?? i.total ?? 0), 0);
  const totalPayee = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + (i.net ?? i.total ?? 0), 0);

  function exportAll() {
    REPORT_META.forEach(r => {
      const data = buildReport(r.id, storeData);
      if (data.rows.length > 0) {
        downloadCSV(`rapport-${r.id}-${new Date().toISOString().slice(0, 10)}.csv`, data.headers, data.rows);
      }
    });
    toast.success('Rapports exportés');
  }

  return (
    <div className="fade-in">
      {preview && <ReportPreview reportId={preview} storeData={storeData} onClose={() => setPreview(null)}/>}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="ANALYSE" title="Rapports & exports"
          rightExtras={
            <button onClick={exportAll} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-surface text-ink/80">
              <Download size={14}/> Exporter tout
            </button>
          }
        />
      </div>
      <MobileTopBar subtitle="RAPPORTS"/>

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="CA total"   value={fmtFcfa(totalCA)}   accent large/>
          <KpiCard label="Commandes"  value={orders.length}/>
          <KpiCard label="Factures"   value={fmtFcfa(totalInv)}/>
          <KpiCard label="Payées"     value={fmtFcfa(totalPayee)} sublabel="factures payées"/>
        </div>

        <div className="lg:hidden">
          <button onClick={exportAll} className="w-full flex items-center justify-center gap-2 py-3 border border-line/70 rounded-xl text-sm text-ink/80 bg-surface">
            <Download size={14}/> Exporter tout
          </button>
        </div>

        {/* Report cards */}
        <div>
          <h2 className="text-base font-semibold text-ink mb-3">Rapports disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORT_META.map(r => {
              const Icon = r.icon;
              const data = buildReport(r.id, storeData);
              return (
                <Card key={r.id} className="p-4 lg:p-5 hover:border-brick-200 transition-colors group">
                  <div onClick={() => setPreview(r.id)} className="flex items-start gap-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: r.color + '18' }}>
                      <Icon size={18} strokeWidth={1.7} style={{ color: r.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink">{r.name}</div>
                      <div className="text-xs text-muted mt-0.5 leading-snug">{r.desc}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted mt-2">{data.summary || 'Aucune donnée'}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted group-hover:text-brick-500 shrink-0 mt-0.5"/>
                  </div>
                  <div className="mt-3 pt-3 border-t border-line/70 flex items-center gap-2">
                    <button onClick={() => setPreview(r.id)}
                      className="flex-1 text-xs py-2 rounded-lg border border-line/70 hover:bg-bone text-ink/80">
                      Aperçu
                    </button>
                    <button onClick={() => exportReport(r.id, 'csv', storeData)} disabled={data.rows.length === 0}
                      className="flex-1 text-xs py-2 rounded-lg text-white font-medium flex items-center justify-center gap-1 hover:opacity-90 disabled:opacity-40"
                      style={{ background: r.color }}>
                      <Download size={11}/> CSV
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPreview({ reportId, storeData, onClose }) {
  const r    = buildReport(reportId, storeData);
  const meta = REPORT_META.find(x => x.id === reportId);
  const Icon = meta?.icon || FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-3xl lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="px-5 lg:px-6 pt-5 pb-4 border-b border-line/60 flex items-start justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg grid place-items-center" style={{ background: (meta?.color || '#0D5C2E') + '18' }}>
              <Icon size={18} style={{ color: meta?.color || '#0D5C2E' }}/>
            </div>
            <div>
              <div className="text-[11px] tracking-wider uppercase text-muted">RAPPORT</div>
              <h2 className="text-lg font-semibold text-ink mt-0.5">{r.title}</h2>
              <p className="text-xs text-muted mt-0.5">{r.summary}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18}/></button>
        </div>

        <div className="flex-1 px-3 lg:px-6 py-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                {r.headers.map((h, i) => (
                  <th key={i} className={`py-2.5 px-3 font-medium ${typeof r.rows[0]?.[i] === 'number' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row, i) => (
                <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-bone/40">
                  {row.map((c, j) => (
                    <td key={j} className={`py-2.5 px-3 ${typeof c === 'number' ? 'text-right tabular-nums font-medium' : 'text-ink/85'}`}>
                      {typeof c === 'number' ? c.toLocaleString('fr-FR') : c}
                    </td>
                  ))}
                </tr>
              ))}
              {r.rows.length === 0 && (
                <tr><td colSpan={r.headers.length} className="py-10 text-center text-muted text-sm">Aucune donnée.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 lg:px-6 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Fermer</button>
          <button onClick={() => exportReport(reportId, 'print', storeData)}
            className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone flex items-center gap-1.5">
            <FileText size={14}/> Imprimer
          </button>
          <button onClick={() => exportReport(reportId, 'csv', storeData)} disabled={r.rows.length === 0}
            className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5">
            <Download size={14}/> Exporter CSV
          </button>
        </div>
      </div>
    </div>
  );
}
