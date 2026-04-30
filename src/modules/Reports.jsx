import { Download, FileText, TrendingUp, Package, Users, Wallet, ChevronRight, BarChart3 } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, LineChart, HBarRow } from '../components/ui.jsx';
import { revenueCurve, topShops, shops, analyticsKPIs } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';

const REPORTS = [
  { id: 'sales',    icon: TrendingUp, name: 'Ventes & CA',            desc: 'Synthèse CA par boutique, jour, produit', period: '30 jours',    color: '#0D5C2E' },
  { id: 'inv',      icon: Package,    name: 'Inventaire physique',    desc: 'État stock, écarts, valorisation',        period: 'mensuel',      color: '#F4A93B' },
  { id: 'clients',  icon: Users,      name: 'Comportement client',    desc: 'Top clients, fréquence, panier moyen',    period: '30 jours',    color: '#3B82F6' },
  { id: 'cash',     icon: Wallet,     name: 'Trésorerie',             desc: 'Encaissements, créances, dettes',         period: 'hebdo',        color: '#8B5CF6' },
  { id: 'fiscal',   icon: FileText,   name: 'Rapport fiscal',         desc: 'TVA, déclarations, attestations',         period: 'trimestriel',  color: '#EC4899' },
  { id: 'transfer', icon: BarChart3,  name: 'Transferts inter-bout.', desc: 'Flux entre boutiques, valorisation',      period: '30 jours',    color: '#F97316' }
];

export default function Reports() {
  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="ANALYSE"
          title="Rapports & exports"
          searchPlaceholder="Rechercher rapport..."
          filters={
            <>
              <HeaderFilter>Toutes boutiques ▾</HeaderFilter>
              <HeaderFilter>30 jours ▾</HeaderFilter>
            </>
          }
          rightExtras={
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
              <Download size={13} /> Exporter tout
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

        {/* Charts: full-width on mobile, 2/3+1/3 on desktop */}
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

        {/* Filters row — mobile */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Toutes boutiques', '30 jours'].map(f => (
            <button key={f} className="px-3 py-1.5 text-sm bg-surface border border-line/70 rounded-lg whitespace-nowrap text-ink/80 shrink-0">
              {f} ▾
            </button>
          ))}
          <button className="ml-auto px-3 py-1.5 text-sm border border-line/70 rounded-lg flex items-center gap-1.5 text-ink/80 shrink-0 bg-surface">
            <Download size={13} /> Exporter tout
          </button>
        </div>

        {/* Report cards */}
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3 px-0.5">Rapports disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORTS.map(r => {
              const Icon = r.icon;
              return (
                <Card key={r.id} className="p-4 lg:p-5 hover:border-brick-200 cursor-pointer transition-colors group">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                      style={{ background: r.color + '18' }}
                    >
                      <Icon size={16} strokeWidth={1.7} style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink">{r.name}</div>
                      <div className="text-xs text-muted mt-0.5 leading-snug">{r.desc}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted mt-2">période · {r.period}</div>
                    </div>
                    <ChevronRight size={13} className="text-muted group-hover:text-brick-500 shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-line/70 flex items-center gap-2">
                    <button className="flex-1 text-xs py-2 rounded-lg border border-line/70 hover:bg-bone text-ink/80 transition-colors">
                      Aperçu
                    </button>
                    <button
                      className="flex-1 text-xs py-2 rounded-lg text-white font-medium flex items-center justify-center gap-1 transition-colors"
                      style={{ background: r.color }}
                    >
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
