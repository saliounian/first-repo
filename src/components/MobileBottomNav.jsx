import { useState } from 'react';
import { Home, Package, Users, MoreHorizontal, Plus, BarChart3, FileText, FileBarChart, ShoppingCart, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { id: 'dashboard', label: 'Accueil',  icon: Home,          always: true },
  { id: 'stock',     label: 'Stock',    icon: Package,       perm: { module: 'stock',    action: 'voir' } },
  { id: 'fab',       label: '',         icon: Plus,          fab: true },
  { id: 'clients',   label: 'Clients',  icon: Users,         perm: { module: 'clients',  action: 'voir' } },
  { id: 'more',      label: 'Plus',     icon: MoreHorizontal, always: true }
];

export default function MobileBottomNav({ route, setRoute, onFab }) {
  const { can, user, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const moreItems = [
    { id: 'analytics', label: 'Analytique', icon: BarChart3,   perm: { module: 'analytique', action: 'voir' } },
    { id: 'orders',    label: 'Commandes',  icon: ShoppingCart, perm: { module: 'commandes',  action: 'voir' } },
    { id: 'invoices',  label: 'Factures',   icon: FileText,     perm: { module: 'finances',   action: 'voir_ca' } },
    { id: 'reports',   label: 'Rapports',   icon: FileBarChart, perm: { module: 'rapports',   action: 'voir' } },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : [])
  ].filter(item => !item.perm || can(item.perm.module, item.perm.action));

  const moreRoutes = moreItems.map(m => m.id);

  const visibleTabs = TABS.filter(t =>
    t.fab || t.id === 'more' || t.always || !t.perm || can(t.perm.module, t.perm.action)
  );

  const handleTab = (t) => {
    if (t.id === 'more') { setShowMore(s => !s); return; }
    setShowMore(false);
    setRoute(t.id);
  };

  return (
    <>
      {/* Plus overlay */}
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="fixed bottom-[64px] left-0 right-0 bg-surface border-t border-line/70 px-4 pt-4 pb-5 slide-in shadow-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Navigation</div>
              <button onClick={() => setShowMore(false)} className="w-7 h-7 grid place-items-center rounded-full hover:bg-bone">
                <X size={14} className="text-muted" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map(item => {
                const Icon = item.icon;
                const active = route === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setRoute(item.id); setShowMore(false); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      active
                        ? 'border-brick-200 bg-brick-50 text-brick-600'
                        : 'border-line/70 text-ink/70 bg-bone/40 hover:border-brick-200 hover:text-brick-500'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                    <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Logout in more menu */}
            <button
              onClick={() => { setShowMore(false); logout(); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted border border-line/60 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/40 transition-colors"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-line/70 z-30">
        <ul className="flex items-end justify-around px-2 pt-2 pb-3">
          {visibleTabs.map((t) => {
            const Icon = t.icon;

            if (t.fab) {
              return (
                <li key={t.id} className="-mt-6">
                  <button
                    onClick={() => { setShowMore(false); onFab?.(); }}
                    className="w-12 h-12 rounded-full bg-brick-500 hover:bg-brick-600 active:scale-95 text-white grid place-items-center shadow-lg shadow-brick-500/30 transition-all"
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </button>
                </li>
              );
            }

            const active =
              route === t.id ||
              (t.id === 'more' && moreRoutes.includes(route)) ||
              (t.id === 'more' && showMore);

            return (
              <li key={t.id}>
                <button
                  onClick={() => handleTab(t)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors ${
                    active ? 'text-brick-500' : 'text-muted'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.7} />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
