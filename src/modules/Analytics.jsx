import { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, HBarRow, Donut, Tabs } from '../components/ui.jsx';
import StatChartModal from '../components/StatChartModal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { fmtFcfa, fmtDateTime } from '../utils/format.js';
import { downloadCSV } from '../utils/download.js';
import { toast } from '../utils/toast.jsx';

function Legend({ color, label, value }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }}/>
      <span className="text-ink/85 truncate">{label}</span>
      <span className="ml-auto tabular-nums text-muted">{value}</span>
    </li>
  );
}

export default function Analytics() {
  const { orders, clients, products, shops, stockPoints, stockByPoint, totalStockForProduct } = useStore();
  const [shopFilter, setShopFilter] = useState('all');
  const [chartMetric, setChartMetric] = useState(null); // 'ca' | 'orders' | 'panier' | 'clients'

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const filteredOrders = shopFilter === 'all'
    ? orders
    : orders.filter(o => o.shopId === shopFilter);

  const totalCA      = filteredOrders.reduce((s, o) => s + (o.net ?? o.total ?? 0), 0);
  const nbOrders     = filteredOrders.length;
  const livrées      = filteredOrders.filter(o => o.status === 'livrée');
  const panier       = livrées.length > 0
    ? Math.round(livrées.reduce((s, o) => s + (o.net ?? o.total ?? 0), 0) / livrées.length)
    : 0;
  const nbClients    = clients.length;

  // CA par boutique
  const caParBoutique = shops.map(sh => {
    const ca = orders.filter(o => o.shopId === sh.id).reduce((s, o) => s + (o.net ?? o.total ?? 0), 0);
    return { name: sh.name, color: sh.color, ca };
  }).sort((a, b) => b.ca - a.ca);
  const maxCa = Math.max(...caParBoutique.map(s => s.ca), 1);

  // Top produits (par nb de ventes depuis lineItems)
  const prodVentes = {};
  orders.forEach(o => (o.lineItems || []).forEach(l => {
    prodVentes[l.name] = (prodVentes[l.name] || 0) + l.qty;
  }));
  const topProds = Object.entries(prodVentes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const maxVentes = Math.max(...topProds.map(([, v]) => v), 1);

  // Santé stock
  const totalUnits = products.reduce((s, p) => s + totalStockForProduct(p.id), 0);
  const ruptures   = products.filter(p => totalStockForProduct(p.id) === 0).length;
  const bas        = products.filter(p => { const q = totalStockForProduct(p.id); return q > 0 && q <= 5; }).length;
  const bon        = products.length - ruptures - bas;
  const totalProd  = products.length || 1;
  const stockGood  = Math.round((bon / totalProd) * 100);
  const stockLow   = Math.round((bas / totalProd) * 100);
  const stockOut   = Math.round((ruptures / totalProd) * 100);

  const tabs = [
    { id: 'all', label: 'Toutes' },
    ...shops.map(s => ({ id: s.id, label: s.name }))
  ];

  function exportCSV() {
    downloadCSV('analytique-commandes.csv',
      ['Client', 'Boutique', 'Montant', 'Statut', 'Date'],
      filteredOrders.map(o => [o.client, o.shop, o.net ?? o.total ?? 0, o.status, fmtDateTime(o.createdAt)])
    );
    toast.success('Export CSV téléchargé');
  }

  const isEmpty = orders.length === 0;

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader breadcrumb="VUE D'ENSEMBLE" title="Analytique"
          searchPlaceholder={null}
          rightExtras={
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-surface text-ink/80">
              <Download size={14}/> Exporter
            </button>
          }
        />
      </div>
      <MobileTopBar subtitle="ANALYTIQUE"/>

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs — cliquables → graphe d'évolution */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="CA total"      value={fmtFcfa(totalCA)}                         accent large onClick={() => setChartMetric('ca')}/>
          <KpiCard label="Commandes"     value={nbOrders}                                             onClick={() => setChartMetric('orders')}/>
          <KpiCard label="Panier moyen"  value={fmtFcfa(panier)}  sublabel="cmds livrées"             onClick={() => setChartMetric('panier')}/>
          <KpiCard label="Clients"       value={nbClients}                                            onClick={() => setChartMetric('clients')}/>
        </div>

        {chartMetric && (
          <StatChartModal
            metric={chartMetric}
            initialPeriod="month"
            orders={orders}
            clients={clients}
            shops={shops}
            shopFilter={shopFilter}
            onClose={() => setChartMetric(null)}
          />
        )}

        {/* Filtre boutique */}
        <div className="overflow-x-auto no-scrollbar">
          <Tabs tabs={tabs} value={shopFilter} onChange={setShopFilter}/>
        </div>

        {isEmpty ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto">
              <BarChart3 size={22} className="text-muted"/>
            </div>
            <div className="text-muted text-sm">Aucune donnée. Commencez par enregistrer des commandes.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* CA par boutique */}
            <Card className="p-4 lg:p-5">
              <CardHeader title="CA par boutique" subtitle="Chiffre d'affaires cumulé"/>
              <div className="px-1 pb-2 space-y-1">
                {caParBoutique.length === 0
                  ? <div className="text-sm text-muted py-4 text-center">Aucune boutique</div>
                  : caParBoutique.map(s => (
                    <HBarRow key={s.name} label={s.name} pct={Math.round((s.ca / maxCa) * 100)}
                      color={s.color} value={fmtFcfa(s.ca)}/>
                  ))
                }
              </div>
            </Card>

            {/* Top produits */}
            <Card className="p-4 lg:p-5">
              <CardHeader title="Top produits" subtitle="Quantités vendues"/>
              <div className="px-1 pb-2 space-y-1">
                {topProds.length === 0
                  ? <div className="text-sm text-muted py-4 text-center">Aucune vente enregistrée</div>
                  : topProds.map(([name, qty]) => (
                    <HBarRow key={name} label={name} pct={Math.round((qty / maxVentes) * 100)} value={`${qty} u.`}/>
                  ))
                }
              </div>
            </Card>

            {/* Santé stock */}
            <Card className="p-4 lg:p-5">
              <CardHeader title="Santé du stock" subtitle={`${products.length} produit(s) · ${totalUnits} unités`}/>
              {products.length === 0 ? (
                <div className="text-sm text-muted py-4 text-center">Aucun produit</div>
              ) : (
                <>
                  <div className="flex items-center gap-5 pl-1">
                    <Donut size={120} stroke={18}
                      centerValue={`${stockGood}%`} centerLabel="bon état"
                      data={[
                        { label: 'Bon état', value: bon,      color: '#0D5C2E' },
                        { label: 'Bas',      value: bas,      color: '#F4A93B' },
                        { label: 'Rupture',  value: ruptures, color: '#E5786E' },
                      ]}
                    />
                    <ul className="text-sm space-y-2 flex-1 min-w-0">
                      <Legend color="#0D5C2E" label="Bon état" value={`${bon} (${stockGood}%)`}/>
                      <Legend color="#F4A93B" label="Bas"      value={`${bas} (${stockLow}%)`}/>
                      <Legend color="#E5786E" label="Rupture"  value={`${ruptures} (${stockOut}%)`}/>
                    </ul>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Commandes récentes filtrées */}
        {filteredOrders.length > 0 && (
          <Card>
            <CardHeader title="Dernières commandes" subtitle={`${filteredOrders.length} commande(s)`}/>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-wider text-muted">
                    <th className="text-left py-2 px-5 font-medium">Client</th>
                    <th className="text-left py-2 px-3 font-medium">Boutique</th>
                    <th className="text-right py-2 px-3 font-medium">Montant</th>
                    <th className="text-left py-2 px-3 font-medium">Statut</th>
                    <th className="text-left py-2 px-5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 10).map(o => (
                    <tr key={o.id} className="border-b border-line/40 last:border-0">
                      <td className="py-2.5 px-5 font-medium text-ink">{o.client}</td>
                      <td className="px-3 text-muted text-xs">{o.shop || '—'}</td>
                      <td className="px-3 text-right tabular-nums font-semibold text-brick-600">{fmtFcfa(o.net ?? o.total ?? 0)}</td>
                      <td className="px-3 text-xs text-muted">{o.status}</td>
                      <td className="px-5 text-xs text-muted whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="lg:hidden">
          <button onClick={exportCSV} className="w-full flex items-center justify-center gap-2 py-3 border border-line/70 rounded-xl text-sm text-ink/80 bg-surface">
            <Download size={14}/> Exporter les données
          </button>
        </div>
      </div>
    </div>
  );
}
