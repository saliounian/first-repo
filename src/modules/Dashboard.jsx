import { ShoppingCart, Users, Package, Store, ArrowRight } from 'lucide-react';
import MobileTopBar from '../components/MobileTopBar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { Card, KpiCard } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { fmtFcfa, fmtDateTime } from '../utils/format.js';

export default function Dashboard({ navigate }) {
  const { shops, products, clients, orders, stockPoints, totalStockForProduct } = useStore();

  const totalStock   = products.reduce((s, p) => s + totalStockForProduct(p.id), 0);
  const pending      = orders.filter(o => o.status === 'attente').length;
  const todayOrders  = orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().slice(0, 10)));
  const todayCA      = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const recentOrders = [...orders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

  const shortcuts = [
    { label: '+ Commande', sub: 'Saisir', icon: ShoppingCart, action: () => navigate('orders') },
    { label: 'Clients',    sub: 'Gérer',  icon: Users,        action: () => navigate('clients') },
    { label: 'Boutiques',  sub: 'Gérer',  icon: Store,        action: () => navigate('boutiques') },
    { label: 'Stock',      sub: 'Voir',   icon: Package,      action: () => navigate('stock') },
  ];

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader breadcrumb="TABLEAU DE BORD" title="Tableau de bord"/>
      </div>
      <MobileTopBar subtitle="TABLEAU DE BORD"/>

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="CA aujourd'hui"  value={fmtFcfa(todayCA)}   accent large/>
          <KpiCard label="Cmds en attente" value={pending}            delta={pending > 0 ? 'À traiter' : 'Aucune'} deltaTone={pending > 0 ? 'neg' : 'pos'}/>
          <KpiCard label="Unités en stock" value={totalStock.toLocaleString('fr-FR')}/>
          <KpiCard label="Clients"         value={clients.length}/>
        </div>

        {/* Raccourcis */}
        <div>
          <div className="text-[10px] tracking-[0.14em] text-muted uppercase mb-2">Raccourcis</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {shortcuts.map(({ label, sub, icon: Icon, action }) => (
              <button key={label} onClick={action}
                className="bg-surface border border-line/70 rounded-xl px-4 py-3.5 text-left hover:bg-bone/80 transition-colors flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brick-50 grid place-items-center shrink-0">
                  <Icon size={16} className="text-brick-500"/>
                </div>
                <div>
                  <div className="font-medium text-sm text-ink">{label}</div>
                  <div className="text-xs text-muted">{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Commandes récentes */}
          <Card>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">Commandes récentes</div>
              <button onClick={() => navigate('orders')} className="text-xs text-brick-500 hover:underline flex items-center gap-1">
                Toutes <ArrowRight size={11}/>
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-5 pb-5 text-sm text-muted">Aucune commande.</div>
            ) : (
              <ul className="divide-y divide-line/40">
                {recentOrders.map(o => (
                  <li key={o.id} className="px-5 py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-ink">{o.client}</div>
                      <div className="text-xs text-muted">{o.shop || '—'} · {fmtDateTime(o.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{fmtFcfa(o.total || 0)}</div>
                      <div className={`text-[10px] font-medium ${
                        o.status === 'livrée' ? 'text-brick-600' : o.status === 'annulée' ? 'text-rose-500' : 'text-amber-600'
                      }`}>{o.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Résumé boutiques */}
          <Card>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">Boutiques</div>
              <button onClick={() => navigate('boutiques')} className="text-xs text-brick-500 hover:underline flex items-center gap-1">
                Gérer <ArrowRight size={11}/>
              </button>
            </div>
            {shops.length === 0 ? (
              <div className="px-5 pb-5 space-y-2">
                <div className="text-sm text-muted">Aucune boutique créée.</div>
                <button onClick={() => navigate('boutiques')} className="text-xs text-brick-500 hover:underline">
                  Créer ma première boutique →
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line/40">
                {shops.map(s => (
                  <li key={s.id} className="px-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}/>
                      <span className="font-medium text-sm text-ink">{s.name}</span>
                    </div>
                    <div className="text-xs text-muted">{stockPoints.filter(sp => sp.shopId === s.id).length} point(s)</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Setup guide si vide */}
        {shops.length === 0 && clients.length === 0 && orders.length === 0 && (
          <Card className="px-5 py-6">
            <div className="text-sm font-semibold text-ink mb-3">🚀 Démarrage rapide</div>
            <ol className="space-y-2 text-sm text-muted list-decimal list-inside">
              <li><button onClick={() => navigate('boutiques')} className="text-brick-500 hover:underline">Créer vos boutiques</button></li>
              <li><button onClick={() => navigate('pointdestock')} className="text-brick-500 hover:underline">Ajouter des points de stock</button></li>
              <li><button onClick={() => navigate('stock')} className="text-brick-500 hover:underline">Enregistrer vos produits</button></li>
              <li><button onClick={() => navigate('clients')} className="text-brick-500 hover:underline">Ajouter vos clients</button></li>
              <li><button onClick={() => navigate('orders')} className="text-brick-500 hover:underline">Créer votre première commande</button></li>
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
