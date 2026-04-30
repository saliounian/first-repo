import { ShoppingCart, ArrowLeftRight, FileText, Search, AlertTriangle, ChevronRight } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, Badge, MiniBars, Progress, LineChart } from '../components/ui.jsx';
import {
  dashboardKPIs, shopPerformance, stockAlerts, recentActivity, tasks, revenueCurve
} from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';

export default function Dashboard({ navigate }) {
  return (
    <div className="fade-in">
      {/* DESKTOP HEADER */}
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="VUE PAR BOUTIQUE"
          title="Tableau de bord"
          searchPlaceholder="Rechercher..."
          filters={<HeaderFilter>30 jours ▾</HeaderFilter>}
          actionLabel="Commande"
          onAction={() => navigate('orders')}
        />
      </div>

      {/* MOBILE HEADER */}
      <MobileTopBar alerts={3} />

      {/* ====================== MOBILE LAYOUT ====================== */}
      <div className="lg:hidden px-4 pb-6 space-y-4">
        {/* Featured CA card */}
        <div className="bg-brick-50/70 border border-brick-100 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-[0.16em] text-muted uppercase">CA aujourd'hui</div>
              <div className="text-[42px] leading-none font-semibold tabular-nums text-brick-600 mt-1">
                {fmtFcfa(184_000)}
              </div>
              <div className="text-[11px] text-brick-500 font-medium mt-1.5">+18% vs hier · 32 cmds</div>
            </div>
          </div>
          <div className="-mx-1 -mb-1 mt-2 h-16">
            <LineChart data={revenueCurve} height={70} compact />
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="px-4 py-3">
            <div className="text-[10px] tracking-[0.14em] text-muted uppercase">cmds attente</div>
            <div className="text-2xl font-semibold tabular-nums text-ink mt-1">12</div>
          </Card>
          <Card className="px-4 py-3">
            <div className="text-[10px] tracking-[0.14em] text-muted uppercase">stock alertes</div>
            <div className="text-2xl font-semibold tabular-nums text-ink mt-1">30</div>
          </Card>
        </div>

        {/* Raccourcis */}
        <div>
          <div className="text-[10px] tracking-[0.14em] text-muted uppercase mb-2 px-1">Raccourcis</div>
          <div className="grid grid-cols-2 gap-3">
            <ShortcutBtn icon={ShoppingCart}  title="+ Commande"  hint="Nom + tel"   onClick={() => navigate('orders')} />
            <ShortcutBtn icon={ArrowLeftRight} title="→ Transfert" hint="Stock"      onClick={() => navigate('stock')} />
            <ShortcutBtn icon={FileText}      title="≡ Facture"    hint="Émettre"    onClick={() => navigate('invoices')} />
            <ShortcutBtn icon={Search}        title="○ Client"     hint="Rechercher" onClick={() => navigate('clients')} />
          </div>
        </div>

        {/* En direct */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-[10px] tracking-[0.14em] text-muted uppercase">En direct</div>
            <button className="text-[11px] text-brick-500">tout voir →</button>
          </div>
          <ul className="space-y-0.5">
            {recentActivity.slice(0, 5).map((act, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2.5">
                <div className="text-xs tabular-nums text-muted w-12">{act.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink truncate">{act.label}</div>
                </div>
                <div className={`text-sm font-medium tabular-nums ${
                  act.delta?.startsWith('−') ? 'text-amber-600' :
                  act.kind === 'alert' ? 'text-amber-600' : 'text-brick-500'
                }`}>
                  {act.kind === 'alert' ? <AlertTriangle size={14} /> : act.delta}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ====================== DESKTOP LAYOUT ====================== */}
      <div className="hidden lg:block px-8 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="CA du mois"
            value={fmtFcfa(dashboardKPIs.caMonth)}
            delta={dashboardKPIs.caMonthDelta}
            sublabel="vs mois préc."
            accent
            large
          />
          <KpiCard label="Commandes" value={dashboardKPIs.orders} delta={dashboardKPIs.ordersDelta} sublabel="cette sem." />
          <KpiCard label="Stock global" value={`${dashboardKPIs.stockGlobal}%`} delta={dashboardKPIs.stockDelta} sublabel="vs sem. dern." />
          <KpiCard label="Alertes" value={dashboardKPIs.alerts} delta={dashboardKPIs.alertsDelta} deltaTone="neg" sublabel="à traiter" />
        </div>

        {/* Performance + side panels */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader
              title="Performance par boutique"
              subtitle="CA, tendance 7 jours, stock"
              action={<a className="text-xs text-brick-500 hover:underline cursor-pointer">voir tout →</a>}
            />
            <div className="px-5 pb-4">
              <div className="grid grid-cols-12 gap-3 px-2 py-2 text-[10px] tracking-[0.1em] uppercase text-muted border-b border-line/70">
                <div className="col-span-3">Boutique</div>
                <div className="col-span-2 text-right">CA</div>
                <div className="col-span-3">Tendance</div>
                <div className="col-span-2 text-right">Stock</div>
                <div className="col-span-2 text-right">Alerte</div>
              </div>
              {shopPerformance.map((row) => (
                <div key={row.shop} className="grid grid-cols-12 gap-3 px-2 py-3 items-center text-sm border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer rounded">
                  <div className="col-span-3 font-medium text-ink">{row.shop}</div>
                  <div className="col-span-2 text-right tabular-nums">{fmtFcfa(row.ca)}</div>
                  <div className="col-span-3"><MiniBars values={row.bars} color="#0D5C2E" /></div>
                  <div className="col-span-2 text-right">
                    <div className="inline-flex items-center gap-2 w-full max-w-[120px] ml-auto">
                      <div className="flex-1"><Progress value={row.stock} /></div>
                      <span className="text-xs tabular-nums text-muted w-7">{row.stock}%</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    {row.alert > 0 ? (
                      <Badge tone={row.alert > 4 ? 'danger' : 'warning'}>{row.alert}</Badge>
                    ) : (
                      <Badge tone="success">ok</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Alertes stock" subtitle={`${stockAlerts.length} produits`} action={<Badge tone="danger">à traiter</Badge>} />
            <ul className="px-2 pb-3">
              {stockAlerts.map((a, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2.5 hover:bg-bone/60 rounded-lg cursor-pointer">
                  <div className={`w-1 h-7 rounded-full ${a.level === 'rupture' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{a.product}</div>
                    <div className="text-[11px] text-muted">{a.shop}</div>
                  </div>
                  <Badge tone={a.level === 'rupture' ? 'danger' : 'warning'}>{a.level}</Badge>
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('stock')} className="w-full py-2.5 text-sm text-brick-500 hover:bg-brick-50/60 transition-colors border-t border-line/60">
              voir tout le stock →
            </button>
          </Card>
        </div>

        {/* Activity + tasks */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader title="Activités récentes" subtitle="Aujourd'hui · toutes boutiques" />
            <ul className="px-2 pb-3">
              {recentActivity.map((act, i) => (
                <li key={i} className="flex items-center gap-4 px-3 py-2.5 hover:bg-bone/60 rounded-lg">
                  <div className="text-xs tabular-nums text-muted w-12">{act.time}</div>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    act.kind === 'alert' ? 'bg-amber-500' :
                    act.kind === 'pending' ? 'bg-amber-500' :
                    act.kind === 'invoice' ? 'bg-blue-500' :
                    act.kind === 'transfer' ? 'bg-violet-500' : 'bg-brick-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink">{act.label}</div>
                    <div className="text-[11px] text-muted">{act.detail}</div>
                  </div>
                  <div className={`text-sm font-medium tabular-nums ${
                    act.delta?.startsWith('−') ? 'text-amber-600' :
                    act.kind === 'alert' ? 'text-amber-600' : 'text-brick-500'
                  }`}>
                    {act.delta}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Tâches à faire" subtitle={`${tasks.length} en attente`} />
            <ul className="px-3 pb-4 space-y-1.5">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-brick-50/40 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-md bg-brick-50 text-brick-600 grid place-items-center text-[10px] font-bold tracking-wide shrink-0">
                    {t.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink/90 leading-tight">{t.label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{t.hint}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted shrink-0 mt-1" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShortcutBtn({ icon: Icon, title, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-4 bg-surface border border-line/70 rounded-xl text-left hover:border-brick-200 active:bg-brick-50/40 transition-colors"
    >
      <Icon size={16} className="text-brick-500 mb-1" strokeWidth={1.8} />
      <div className="text-sm font-medium text-ink">{title}</div>
      <div className="text-[11px] text-muted">{hint}</div>
    </button>
  );
}
