import { useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, LineChart, HBarRow, Donut, Tabs } from '../components/ui.jsx';
import { analyticsKPIs, revenueCurve, topShops, topProducts, stockHealth, shops } from '../data/mockData.js';
import { fmtFcfa, fmtFcfaFull } from '../utils/format.js';
import { downloadCSV } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';

const PERIOD_OPTIONS = [
  { value: '7',   label: '7 derniers jours' },
  { value: '30',  label: '30 derniers jours' },
  { value: '90',  label: '90 derniers jours' },
  { value: 'mtd', label: 'Mois en cours' },
  { value: 'ytd', label: 'Année en cours' },
];

export default function Analytics() {
  const [shopFilter, setShopFilter] = useState('all');
  const [period, setPeriod]         = useState('30');
  const [shopHeader, setShopHeader] = useState('all');

  const tabs = [
    { id: 'all', label: 'Toutes' },
    ...shops.map(s => ({ id: s.id, label: s.name }))
  ];

  const shopOptions = [
    { value: 'all', label: 'Toutes boutiques' },
    ...shops.map(s => ({ value: s.id, label: s.name }))
  ];

  function exportCSV() {
    const rows = revenueCurve.map(r => [`Jour ${r.day}`, r.value]);
    downloadCSV('analytique-ca-30j.csv', ['Jour', 'CA (FCFA)'], rows);
    toast.success('Export CSV téléchargé');
  }

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="VUE D'ENSEMBLE"
          title="Analytique"
          searchPlaceholder={null}
          filters={
            <>
              <HeaderFilter value={shopHeader} onChange={setShopHeader} options={shopOptions} />
              <HeaderFilter value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
            </>
          }
          rightExtras={
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 text-[15px] border border-line/70 rounded-lg hover:bg-surface text-ink/80">
              <Download size={15} /> Exporter
            </button>
          }
        />
      </div>
      <MobileTopBar alerts={3} subtitle="ANALYTIQUE · 30 JOURS" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs — 2 cols on mobile, 5 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="CA" value={fmtFcfa(analyticsKPIs.ca)} delta={analyticsKPIs.caDelta} sublabel="vs préc." accent large />
          <KpiCard label="Marge" value={`${analyticsKPIs.margin}%`} delta={analyticsKPIs.marginDelta} />
          <KpiCard label="Panier moyen" value={analyticsKPIs.cart.toLocaleString('fr-FR')} delta={analyticsKPIs.cartDelta} sublabel="FCFA" />
          <KpiCard label="Commandes" value={analyticsKPIs.orders} delta={analyticsKPIs.ordersDelta} />
          <KpiCard label="Clients actifs" value={analyticsKPIs.activeClients} delta={analyticsKPIs.clientsDelta} />
        </div>

        {/* CA curve */}
        <Card className="p-4 lg:p-5">
          {/* Mobile: stacked layout */}
          <div className="flex flex-col gap-3 lg:hidden mb-3">
            <div>
              <div className="text-sm font-semibold text-ink">Chiffre d'affaires</div>
              <div className="text-xs text-muted mt-0.5">FCFA · 30 derniers jours</div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <Tabs tabs={tabs} value={shopFilter} onChange={setShopFilter} />
            </div>
          </div>
          {/* Desktop: side by side */}
          <div className="hidden lg:flex items-center justify-between mb-3 gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">Chiffre d'affaires</div>
              <div className="text-xs text-muted mt-0.5">FCFA · 30 derniers jours</div>
            </div>
            <Tabs tabs={tabs} value={shopFilter} onChange={setShopFilter} />
          </div>
          <LineChart data={revenueCurve} height={260} />
        </Card>

        {/* Top + health — 1 col mobile, 3 cols desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:p-5">
            <CardHeader title="Top boutiques" subtitle="Part du CA" />
            <div className="px-1 pb-2">
              {topShops.map((s, i) => (
                <HBarRow key={s.name} label={s.name} pct={s.pct} color={shops[i % shops.length].color} />
              ))}
            </div>
          </Card>

          <Card className="p-4 lg:p-5">
            <CardHeader title="Top produits" subtitle="Volume des ventes" />
            <div className="px-1 pb-2">
              {topProducts.map((p) => (
                <HBarRow key={p.name} label={p.name} pct={p.pct} />
              ))}
            </div>
          </Card>

          <Card className="p-4 lg:p-5">
            <CardHeader title="Santé du stock" subtitle="Répartition produits" />
            <div className="flex items-center gap-5 pl-1">
              <Donut
                size={120}
                stroke={18}
                centerValue={`${stockHealth.good}%`}
                centerLabel="bon état"
                data={[
                  { label: 'En bon état', value: stockHealth.good, color: '#0D5C2E' },
                  { label: 'Bas',         value: stockHealth.low,  color: '#F4A93B' },
                  { label: 'Rupture',     value: stockHealth.out,  color: '#E5786E' }
                ]}
              />
              <ul className="text-sm space-y-2 flex-1 min-w-0">
                <Legend color="#0D5C2E" label="En bon état" value={`${stockHealth.good}%`} />
                <Legend color="#F4A93B" label="Bas"         value={`${stockHealth.low}%`} />
                <Legend color="#E5786E" label="Rupture"     value={`${stockHealth.out}%`} />
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between text-sm">
              <span className="text-muted">Valeur stock</span>
              <span className="font-semibold tabular-nums text-ink">{fmtFcfaFull(stockHealth.totalFcfa)} FCFA</span>
            </div>
          </Card>
        </div>

        {/* Mobile export button */}
        <div className="lg:hidden">
          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 py-3 border border-line/70 rounded-xl text-sm text-ink/80 bg-surface hover:border-brick-200">
            <Download size={14} /> Exporter les données
          </button>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
      <span className="text-ink/85 truncate">{label}</span>
      <span className="ml-auto tabular-nums text-muted">{value}</span>
    </li>
  );
}
