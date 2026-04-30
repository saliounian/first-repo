import {
  LayoutDashboard, BarChart3, Package, ClipboardList, ShoppingCart,
  Users, FileText, FileBarChart, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, always: true },
  { id: 'analytics', label: 'Analytique',      icon: BarChart3,       perm: { module: 'analytique',  action: 'voir' } },
  { id: 'stock',     label: 'Stock',           icon: Package,         perm: { module: 'stock',       action: 'voir' } },
  { id: 'inventory', label: 'Inventaires',     icon: ClipboardList,   perm: { module: 'stock',       action: 'inventaire_complet' } },
  { id: 'orders',    label: 'Commandes',       icon: ShoppingCart,    perm: { module: 'commandes',   action: 'voir' } },
  { id: 'clients',   label: 'Clients',         icon: Users,           perm: { module: 'clients',     action: 'voir' } },
  { id: 'invoices',  label: 'Factures',        icon: FileText,        perm: { module: 'finances',    action: 'voir_ca' } },
  { id: 'reports',   label: 'Rapports',        icon: FileBarChart,    perm: { module: 'rapports',    action: 'voir' } }
];

const ROLE_DISPLAY = {
  admin: 'Admin', commercial: 'Commercial', stock: 'Gest. stock',
  livreur: 'Livreur', technicien: 'Technicien', comptable: 'Comptable'
};

export default function Sidebar({ route, setRoute }) {
  const { user, can, logout } = useAuth();

  const visibleNav = NAV.filter(item =>
    item.always || !item.perm || can(item.perm.module, item.perm.action)
  );

  const initials = user?.nom
    ? user.nom.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="hidden lg:flex w-56 shrink-0 bg-sand/60 border-r border-line/70 flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brick-500 text-white grid place-items-center font-bold text-sm">g</div>
        <div className="font-semibold tracking-tight text-ink">gestCopta</div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 overflow-y-auto no-scrollbar">
        <div className="text-[10px] tracking-[0.14em] text-muted/80 mb-2 px-3">NAVIGATION</div>
        <ul className="space-y-px">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setRoute(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-surface text-brick-600 font-medium'
                      : 'text-ink/75 hover:text-ink hover:bg-surface/60'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-brick-500' : 'text-muted'} strokeWidth={1.6} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <ul className="space-y-px mt-4">
            <div className="text-[10px] tracking-[0.14em] text-muted/80 mb-2 px-3">ADMIN</div>
            <li>
              <button
                onClick={() => setRoute('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  route === 'admin'
                    ? 'bg-surface text-brick-600 font-medium'
                    : 'text-ink/75 hover:text-ink hover:bg-surface/60'
                }`}
              >
                <ShieldCheck size={15} className={route === 'admin' ? 'text-brick-500' : 'text-muted'} strokeWidth={1.6} />
                <span>Utilisateurs & Rôles</span>
              </button>
            </li>
          </ul>
        )}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pt-2 pb-1">
        <ThemeToggle />
      </div>

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-1 space-y-0.5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-brick-500/95 text-white grid place-items-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-medium text-ink truncate">{user?.nom || '—'}</div>
            <div className="text-[11px] text-muted">{ROLE_DISPLAY[user?.role] || user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
        >
          <LogOut size={13} strokeWidth={1.8} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
