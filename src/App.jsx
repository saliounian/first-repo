import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './utils/toast.jsx';
import Sidebar from './components/Sidebar.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import Dashboard from './modules/Dashboard.jsx';
import Analytics from './modules/Analytics.jsx';
import Boutiques from './modules/Boutiques.jsx';
import ProduitsStock from './modules/ProduitsStock.jsx';
import PointDeStock from './modules/PointDeStock.jsx';
import Orders from './modules/Orders.jsx';
import Clients from './modules/Clients.jsx';
import Invoices from './modules/Invoices.jsx';
import Reports from './modules/Reports.jsx';
import Admin from './modules/Admin.jsx';
import Login from './modules/Login.jsx';
import ChangePassword from './modules/ChangePassword.jsx';

const ROUTES = {
  dashboard:    { Component: Dashboard,  title: 'Tableau de bord' },
  analytics:    { Component: Analytics,  title: 'Analytique' },
  stock:        { Component: ProduitsStock, title: 'Produits & Stock' },
  pointdestock: { Component: PointDeStock,  title: 'Point de stock' },
  boutiques:    { Component: Boutiques,     title: 'Boutiques' },
  orders:       { Component: Orders,     title: 'Commandes' },
  clients:      { Component: Clients,    title: 'Clients' },
  invoices:     { Component: Invoices,   title: 'Factures' },
  reports:      { Component: Reports,    title: 'Rapports' },
  admin:        { Component: Admin,      title: 'Administration' }
};

// ─── Inner app (needs auth context) ──────────────────────────────────────────
function AppShell() {
  const { user, loading, can } = useAuth();
  const [route, setRoute]     = useState('dashboard');
  const [fabOpen, setFabOpen] = useState(false);

  // Reset route to dashboard whenever user changes (login/logout)
  useEffect(() => {
    setRoute('dashboard');
    setFabOpen(false);
  }, [user?.id]);

  // Guard: if route requires admin and user is not admin, fall back to dashboard
  useEffect(() => {
    if (route === 'admin' && user?.role !== 'admin') setRoute('dashboard');
  }, [route, user?.role]);

  // Reset FAB state when leaving Orders route
  useEffect(() => {
    if (route !== 'orders') setFabOpen(false);
  }, [route]);

  // 1. Loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brick-500 text-white grid place-items-center font-bold text-lg">g</div>
          <div className="text-sm text-muted animate-pulse">Chargement…</div>
        </div>
      </div>
    );
  }

  // 2. Not authenticated → Login
  if (!user) return <Login />;

  // 3. First login → forced password change
  if (user.mustChangePassword) return <ChangePassword />;

  // 4. Authenticated app
  const currentRoute = ROUTES[route] || ROUTES.dashboard;
  const { Component, initialView } = currentRoute;

  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar route={route} setRoute={setRoute} />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Component
          key={route}
          navigate={setRoute}
          initialView={initialView}
          fabOpen={fabOpen}
          setFabOpen={setFabOpen}
        />
      </main>
      <MobileBottomNav route={route} setRoute={setRoute} onFab={() => { setFabOpen(true); setRoute('orders'); }} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
