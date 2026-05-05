import { useState } from 'react';
import { Download, FileText, TrendingUp, Package, Users, Wallet, ChevronRight, BarChart3, X } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, LineChart, HBarRow } from '../components/ui.jsx';
import { revenueCurve, topShops, topProducts, shops, analyticsKPIs, clients, orders, invoices, stockPoints, transferHistory } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';
import { downloadCSV, printHTML, fmtDate } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';

const REPORTS = [
  { id: 'sales',    icon: TrendingUp, name: 'Ventes & CA',            desc: 'Synthèse CA par boutique, jour, produit', period: '30 jours',    color: '#0D5C2E' },
  { id: 'inv',      icon: Package,    name: 'Inventaire physique',    desc: 'État stock, écarts, valorisation',        period: 'mensuel',      color: '#F4A93B' },
  { id: 'clients',  icon: Users,      name: 'Comportement client',    desc: 'Top clients, fréquence, panier moyen',    period: '30 jours',    color: '#3B82F6' },
  { id: 'cash',     icon: Wallet,     name: 'Trésorerie',             desc: 'Encaissements, créances, dettes',         period: 'hebdo',        color: '#8B5CF6' },
  { id: 'fiscal',   icon: FileText,   name: 'Rapport fiscal',         desc: 'TVA, déclarations, attestations',         period: 'trimestriel',  color: '#EC4899' },
  { id: 'transfer', icon: BarChart3,  name: 'Transferts inter-bout.', desc: 'Flux entre boutiques, valorisation',      period: '30 jours',    color: '#F97316' }
];

const PERIOD_OPTIONS = [
  { value: '7',   label: '7 derniers jours' },
  { value: '30',  label: '30 derniers jours' },
  { value: '90',  label: '90 derniers jours' },
  { value: 'mtd', label: 'Mois en cours' },
  { value: 'ytd', label: 'Année en cours' },
];

// Build dataset for each report
function buildReport(id) {
  switch (id) {
    case 'sales':
      return {
        title: 'Ventes & CA',
        headers: ['Jour', 'CA (FCFA)'],
        rows: revenueCurve.map(r => [`Jour ${r.day}`, r.value]),
        summary: `Total: ${fmtFcfa(revenueCurve.reduce((s, r) => s + r.value, 0))}`,
      };
    case 'inv':
      return {
        title: 'Inventaire physique',
        headers: ['Point de stock', 'Initial', 'Vendus', 'Actuels', 'Responsable'],
        rows: stockPoints.map(sp => [sp.name, sp.stockInitial, sp.stockVendu, sp.stockActuel, sp.responsable?.nom || '—']),
        summary: `${stockPoints.length} points · ${stockPoints.reduce((s, p) => s + p.stockActuel, 0)} unités`,
      };
    case 'clients':
      return {
        title: 'Comportement client',
        headers: ['Client', 'Type', 'Cmds', 'Total (FCFA)', 'Dernière'],
        rows: clients.map(c => [c.name, c.type, c.orders, c.total, c.last]),
        summary: `${clients.length} clients · CA total ${fmtFcfa(clients.reduce((s, c) => s + c.total, 0))}`,
      };
    case 'cash':
      return {
        title: 'Trésorerie',
        headers: ['Facture', 'Client', 'Montant (FCFA)', 'Statut', 'Échéance'],
        rows: invoices.map(i => [i.id, i.client, i.total, i.status, i.due]),
        summary: `Émis ${fmtFcfa(invoices.reduce((s, i) => s + i.total, 0))} · Retard ${fmtFcfa(invoices.filter(i => i.status === 'retard').reduce((s, i) => s + i.total, 0))}`,
      };
    case 'fiscal':
      return {
        title: 'Rapport fiscal',
        headers: ['Période', 'CA HT', 'TVA 18%', 'CA TTC'],
        rows: [
          ['Janvier 2026',  2_400_000, 432_000, 2_832_000],
          ['Février 2026',  2_750_000, 495_000, 3_245_000],
          ['Mars 2026',     2_980_000, 536_400, 3_516_400],
          ['Avril 2026',    3_030_000, 545_400, 3_575_400],
        ],
        summary: 'Trimestre 1 + avril · TVA 18%',
      };
    case 'transfer':
      return {
        title: 'Transferts inter-boutiques',
        headers: ['Date', 'De', 'Vers', 'Produit', 'Qté', 'Statut'],
        rows: transferHistory.map(t => [t.date, t.from, t.to, t.product, t.qty, t.status]),
        summary: `${transferHistory.length} mouvements`,
      };
    default:
      return { title: '—', headers: [], rows: [], summary: '' };
  }
}

function exportReport(id, mode = 'csv') {
  const r = buildReport(id);
  if (mode === 'csv') {
    const filename = `rapport-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, r.headers, r.rows);
    toast.success(`${r.title} — CSV téléchargé`);
  } else {
    const tableRows = r.rows.map(row =>
      `<tr>${row.map((c, i) => `<td${typeof c === 'number' ? ' class="right"' : ''}>${typeof c === 'number' ? c.toLocaleString('fr-FR') : c}</td>`).join('')}</tr>`
    ).join('');
    const tableHead = `<tr>${r.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const html = `
      <div class="header">
        <div>
          <div class="brand">gestCopta</div>
          <h1 style="margin-top:8px">${r.title}</h1>
          <div class="muted">${r.summary}</div>
        </div>
        <div class="meta">
          <div class="muted">Édité le</div>
          <div>${fmtDate()}</div>
        </div>
      </div>
      <table>
        <thead>${tableHead}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
    printHTML({ title: r.title, body: html });
    toast.success(`${r.title} — Aperçu ouvert`);
  }
}

function exportAll() {
  REPORTS.forEach(r => {
    const data = buildReport(r.id);
    downloadCSV(`rapport-${r.id}-${new Date().toISOString().slice(0, 10)}.csv`, data.headers, data.rows);
  });
  toast.success(`${REPORTS.length} rapports exportés`);
}

export default function Reports() {
  const [period, setPeriod]       = useState('30');
  const [shopFilter, setShopFilter] = useState('all');
  const [preview, setPreview]     = useState(null); // report id

  const shopOptions = [
    { value: 'all', label: 'Toutes boutiques' },
    ...shops.map(s => ({ value: s.id, label: s.name }))
  ];

  return (
    <div className="fade-in">
      {preview && <ReportPreview reportId={preview} onClose={() => setPreview(null)} />}

      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="ANALYSE"
          title="Rapports & exports"
          searchPlaceholder="Rechercher rapport..."
          filters={
            <>
              <HeaderFilter value={shopFilter} onChange={setShopFilter} options={shopOptions} />
              <HeaderFilter value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
            </>
          }
          rightExtras={
            <button onClick={exportAll} className="flex items-center gap-1.5 px-4 py-2 text-[15px] border border-line/70 rounded-lg hover:bg-surface text-ink/80">
              <Download size={15} /> Exporter tout
            </button>
          }
        />
      </div>
      <MobileTopBar alerts={3} subtitle="RAPPORTS & EXPORTS" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Période"       value="30 jours"               sublabel="29 mar — 28 avr" />
          <KpiCard label="CA total"      value={fmtFcfa(analyticsKPIs.ca)} delta={analyticsKPIs.caDelta} sublabel="vs préc." accent />
          <KpiCard label="Marge"         value={`${analyticsKPIs.margin}%`} delta={analyticsKPIs.marginDelta} />
          <KpiCard label="Clients actifs" value={analyticsKPIs.activeClients} delta={analyticsKPIs.clientsDelta} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-4 lg:p-5">
            <CardHeader title="CA · 30 derniers jours" subtitle="Toutes boutiques" />
            <LineChart data={revenueCurve} height={200} />
          </Card>
          <Card className="p-4 lg:p-5">
            <CardHeader title="Part par boutique" />
            {topShops.map((s, i) => (
              <HBarRow key={s.name} label={s.name} pct={s.pct} color={shops[i % shops.length].color} />
            ))}
          </Card>
        </div>

        {/* Mobile export bar */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => toast.info(`Période: ${PERIOD_OPTIONS.find(o => o.value === period)?.label}`)}
            className="px-3 py-2 text-sm bg-surface border border-line/70 rounded-lg whitespace-nowrap text-ink/80 shrink-0">
            {PERIOD_OPTIONS.find(o => o.value === period)?.label || '30 jours'} ▾
          </button>
          <button onClick={exportAll}
            className="ml-auto px-3 py-2 text-sm border border-line/70 rounded-lg flex items-center gap-1.5 text-ink/80 shrink-0 bg-surface">
            <Download size={13} /> Exporter tout
          </button>
        </div>

        {/* Report cards */}
        <div>
          <h2 className="text-base font-semibold text-ink mb-3 px-0.5">Rapports disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORTS.map(r => {
              const Icon = r.icon;
              return (
                <Card key={r.id} className="p-4 lg:p-5 hover:border-brick-200 transition-colors group">
                  <div onClick={() => setPreview(r.id)} className="flex items-start gap-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: r.color + '18' }}>
                      <Icon size={18} strokeWidth={1.7} style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink">{r.name}</div>
                      <div className="text-xs text-muted mt-0.5 leading-snug">{r.desc}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted mt-2">période · {r.period}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted group-hover:text-brick-500 shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-line/70 flex items-center gap-2">
                    <button
                      onClick={() => setPreview(r.id)}
                      className="flex-1 text-xs py-2 rounded-lg border border-line/70 hover:bg-bone text-ink/80 transition-colors">
                      Aperçu
                    </button>
                    <button
                      onClick={() => exportReport(r.id, 'csv')}
                      className="flex-1 text-xs py-2 rounded-lg text-white font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-90"
                      style={{ background: r.color }}>
                      <Download size={11} /> Exporter
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

// ───── Preview modal ─────────────────────────────────────────────────────────
function ReportPreview({ reportId, onClose }) {
  const r = buildReport(reportId);
  const meta = REPORTS.find(x => x.id === reportId);
  const Icon = meta?.icon || FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-3xl lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="px-5 lg:px-6 pt-5 pb-4 border-b border-line/60 flex items-start justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg grid place-items-center" style={{ background: (meta?.color || '#0D5C2E') + '18' }}>
              <Icon size={18} style={{ color: meta?.color || '#0D5C2E' }} />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.14em] uppercase text-muted">RAPPORT</div>
              <h2 className="text-lg font-semibold text-ink mt-0.5">{r.title}</h2>
              <p className="text-xs text-muted mt-0.5">{r.summary}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 px-3 lg:px-6 py-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                {r.headers.map((h, i) => (
                  <th key={i} className={`py-2.5 px-3 font-medium ${i === r.headers.length - 1 ? 'text-right' : 'text-left'}`}>{h}</th>
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
          <button onClick={() => exportReport(reportId, 'print')}
            className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone flex items-center gap-1.5">
            <FileText size={14} /> Imprimer
          </button>
          <button onClick={() => exportReport(reportId, 'csv')}
            className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5">
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>
    </div>
  );
}
