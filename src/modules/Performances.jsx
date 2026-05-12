import { useState, useMemo } from 'react';
import { TrendingUp, ShoppingCart, Award, Target, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtFcfa } from '../utils/format.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PERIODS = [
  { id: '7j',   label: '7 jours',   days: 7 },
  { id: '30j',  label: '30 jours',  days: 30 },
  { id: '90j',  label: '90 jours',  days: 90 },
  { id: 'tout', label: 'Tout',      days: null },
];

function filterPeriod(orders, days) {
  if (!days) return orders;
  const cutoff = Date.now() - days * 86_400_000;
  return orders.filter(o => new Date(o.createdAt || 0).getTime() >= cutoff);
}

function computeStats(orders) {
  const total    = orders.length;
  const ca       = orders.reduce((s, o) => s + (o.net ?? o.total ?? 0), 0);
  const livrees  = orders.filter(o => o.status === 'livrée').length;
  const annulees = orders.filter(o => o.status === 'annulée').length;
  const attente  = orders.filter(o => o.status === 'attente').length;
  const preparees = orders.filter(o => o.status === 'préparée').length;
  const txLivraison = total > 0 ? Math.round(livrees / total * 100) : 0;
  const avgOrder = total > 0 ? ca / total : 0;
  return { total, ca, livrees, annulees, attente, preparees, txLivraison, avgOrder };
}

// Simple progress bar
function Bar({ pct, color = 'bg-brick-500' }) {
  return (
    <div className="w-full h-1.5 bg-line/40 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

// Médaille selon rang
function Medal({ rank }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-semibold text-muted tabular-nums">#{rank}</span>;
}

// Initiales
function Avatar({ nom, size = 'md' }) {
  const initials = (nom || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const cls = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full bg-brick-500 text-white grid place-items-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'bg-surface border-line/60',
    green:   'bg-emerald-50 border-emerald-100',
    rose:    'bg-rose-50 border-rose-100',
    amber:   'bg-amber-50 border-amber-100',
    blue:    'bg-blue-50 border-blue-100',
  };
  const iconTones = {
    default: 'bg-brick-50 text-brick-600',
    green:   'bg-emerald-100 text-emerald-700',
    rose:    'bg-rose-100 text-rose-700',
    amber:   'bg-amber-100 text-amber-700',
    blue:    'bg-blue-100 text-blue-700',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${iconTones[tone]}`}>
          <Icon size={18} />
        </div>
        <span className="text-xs text-muted font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-ink tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

// ─── Vue personnelle (non-admin ou admin cliquant sur soi) ─────────────────────
function PersonalView({ nom, myOrders, period }) {
  const s = useMemo(() => computeStats(myOrders), [myOrders]);

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="Commandes" value={s.total} sub={`Période : ${period}`} />
        <StatCard icon={TrendingUp}   label="CA généré"  value={fmtFcfa(s.ca)} sub={`Moy. ${fmtFcfa(s.avgOrder)} / cmd`} tone="blue" />
        <StatCard icon={CheckCircle}  label="Livrées"    value={s.livrees} sub={`Taux : ${s.txLivraison}%`} tone="green" />
        <StatCard icon={XCircle}      label="Annulées"   value={s.annulees} sub={`${s.total > 0 ? Math.round(s.annulees/s.total*100) : 0}% des cmds`} tone="rose" />
      </div>

      {/* Répartition statuts */}
      <Card>
        <div className="px-5 pt-4 pb-2 text-sm font-semibold text-ink">Répartition des statuts</div>
        <div className="px-5 pb-5 space-y-3">
          {[
            { label: 'Livrées',   count: s.livrees,   color: 'bg-emerald-500' },
            { label: 'En attente', count: s.attente,  color: 'bg-amber-400' },
            { label: 'Préparées', count: s.preparees, color: 'bg-blue-500' },
            { label: 'Annulées',  count: s.annulees,  color: 'bg-rose-400' },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">{label}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
              <Bar pct={s.total > 0 ? count / s.total * 100 : 0} color={color} />
            </div>
          ))}
        </div>
      </Card>

      {/* Dernières commandes */}
      {myOrders.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-3 text-sm font-semibold text-ink">
            Dernières commandes
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line/60 text-[10px] uppercase tracking-wider text-muted">
                <th className="text-left py-2 px-5 font-medium">N°</th>
                <th className="text-left py-2 px-3 font-medium">Client</th>
                <th className="text-left py-2 px-3 font-medium hidden lg:table-cell">Boutique</th>
                <th className="text-right py-2 px-3 font-medium">Montant</th>
                <th className="text-left py-2 px-5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {[...myOrders]
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 10)
                .map(o => {
                  const statusColor = {
                    livrée:   'text-emerald-600 bg-emerald-50',
                    préparée: 'text-blue-600 bg-blue-50',
                    attente:  'text-amber-700 bg-amber-50',
                    annulée:  'text-rose-600 bg-rose-50',
                  }[o.status] || 'text-muted bg-bone';
                  return (
                    <tr key={o.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50">
                      <td className="py-2.5 px-5 font-mono text-xs text-muted">{o.id}</td>
                      <td className="px-3 font-medium text-ink">{o.client}</td>
                      <td className="px-3 text-muted hidden lg:table-cell">{o.shop || '—'}</td>
                      <td className="px-3 text-right tabular-nums font-semibold">{fmtFcfa(o.net ?? o.total ?? 0)}</td>
                      <td className="px-5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── Vue classement (admin) ────────────────────────────────────────────────────
function LeaderboardView({ allOrders, sortBy, setSortBy, onSelectUser }) {
  // Grouper par utilisateur
  const rankings = useMemo(() => {
    const map = {};
    allOrders.forEach(o => {
      const key = o.createdById ?? `anon-${o.createdByNom ?? 'inconnu'}`;
      if (!map[key]) {
        map[key] = {
          id:   o.createdById,
          nom:  o.createdByNom || 'Inconnu',
          orders: [],
        };
      }
      map[key].orders.push(o);
    });

    return Object.values(map)
      .map(u => ({ ...u, ...computeStats(u.orders) }))
      .sort((a, b) => {
        if (sortBy === 'ca')     return b.ca - a.ca;
        if (sortBy === 'cmds')   return b.total - a.total;
        if (sortBy === 'taux')   return b.txLivraison - a.txLivraison;
        return b.ca - a.ca;
      });
  }, [allOrders, sortBy]);

  const maxCa = rankings[0]?.ca || 1;

  if (rankings.length === 0) {
    return (
      <Card>
        <div className="text-center py-16 text-muted text-sm">
          <Package size={32} className="mx-auto mb-3 text-muted/40" />
          Aucune commande avec attribution utilisateur.<br/>
          Les prochaines commandes enregistreront automatiquement le créateur.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podium top 3 (desktop) */}
      {rankings.length >= 2 && (
        <div className="hidden lg:grid grid-cols-3 gap-3">
          {rankings.slice(0, 3).map((u, i) => (
            <div
              key={u.id ?? u.nom}
              onClick={() => onSelectUser(u)}
              className={`relative rounded-2xl border p-5 text-center cursor-pointer hover:shadow-md transition-shadow ${
                i === 0 ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-300' :
                i === 1 ? 'bg-bone border-line/60' :
                          'bg-bone border-line/60'
              }`}
            >
              <div className="text-2xl mb-2"><Medal rank={i + 1} /></div>
              <Avatar nom={u.nom} />
              <div className="mt-2 font-semibold text-ink truncate">{u.nom}</div>
              <div className="text-xs text-muted mb-3">{u.total} commande{u.total > 1 ? 's' : ''}</div>
              <div className="text-xl font-bold text-brick-600 tabular-nums">{fmtFcfa(u.ca)}</div>
              <div className="text-xs text-muted">CA total</div>
              <div className="mt-3">
                <Bar pct={u.ca / maxCa * 100} color={i === 0 ? 'bg-amber-400' : 'bg-brick-400'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table complète */}
      <Card>
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap border-b border-line/60">
          <div className="text-sm font-semibold text-ink">Classement ({rankings.length} utilisateurs)</div>
          <div className="flex gap-1.5">
            {[
              { id: 'ca',   label: 'CA' },
              { id: 'cmds', label: 'Commandes' },
              { id: 'taux', label: 'Taux livraison' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === s.id
                    ? 'bg-brick-500 text-white'
                    : 'bg-bone border border-line/70 text-muted hover:bg-sand'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/60 text-[10px] uppercase tracking-wider text-muted">
                <th className="text-left py-2.5 px-5 font-medium w-12">Rang</th>
                <th className="text-left py-2.5 px-3 font-medium">Utilisateur</th>
                <th className="text-right py-2.5 px-3 font-medium">Commandes</th>
                <th className="text-right py-2.5 px-3 font-medium">CA Total</th>
                <th className="text-right py-2.5 px-3 font-medium hidden lg:table-cell">Moy./Cmd</th>
                <th className="text-right py-2.5 px-3 font-medium hidden lg:table-cell">Livrées</th>
                <th className="text-right py-2.5 px-5 font-medium">Taux</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((u, i) => (
                <tr
                  key={u.id ?? u.nom}
                  onClick={() => onSelectUser(u)}
                  className="border-b border-line/40 last:border-0 hover:bg-bone/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-5">
                    <Medal rank={i + 1} />
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={u.nom} size="sm" />
                      <div>
                        <div className="font-medium text-ink">{u.nom}</div>
                        {/* CA bar */}
                        <div className="w-24 mt-1 hidden lg:block">
                          <Bar pct={u.ca / maxCa * 100} color={i === 0 ? 'bg-amber-400' : 'bg-brick-400'} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-right tabular-nums font-semibold">{u.total}</td>
                  <td className="px-3 text-right tabular-nums font-semibold text-brick-600">{fmtFcfa(u.ca)}</td>
                  <td className="px-3 text-right tabular-nums text-muted hidden lg:table-cell">{fmtFcfa(u.avgOrder)}</td>
                  <td className="px-3 text-right tabular-nums text-emerald-600 hidden lg:table-cell">{u.livrees}</td>
                  <td className="px-5 text-right">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.txLivraison >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      u.txLivraison >= 50 ? 'bg-amber-50 text-amber-700' :
                                            'bg-rose-50 text-rose-600'
                    }`}>
                      {u.txLivraison}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Performances() {
  const { orders } = useStore();
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';

  const [period,    setPeriod]    = useState('30j');
  const [sortBy,    setSortBy]    = useState('ca');
  // Admin peut cliquer sur un utilisateur pour voir son détail
  const [selected,  setSelected]  = useState(null);

  const currentDays = PERIODS.find(p => p.id === period)?.days ?? null;

  // Commandes filtrées par période
  const periodOrders = useMemo(() => filterPeriod(orders, currentDays), [orders, currentDays]);

  // Commandes de l'utilisateur courant
  const myOrders = useMemo(
    () => periodOrders.filter(o => o.createdById === user?.id),
    [periodOrders, user?.id]
  );

  // Commandes de l'utilisateur sélectionné (admin drill-down)
  const selectedOrders = useMemo(() => {
    if (!selected) return [];
    return periodOrders.filter(o => o.createdById === selected.id);
  }, [periodOrders, selected]);

  const periodLabel = PERIODS.find(p => p.id === period)?.label || period;

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="PERFORMANCES"
          title="Performances"
          actionLabel={selected ? `← Retour classement` : undefined}
          onAction={selected ? () => setSelected(null) : undefined}
        />
      </div>
      <MobileTopBar subtitle="PERFORMANCES" />

      <div className="px-4 lg:px-8 py-5 space-y-5">

        {/* Filtre période */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted font-medium">Période :</span>
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                period === p.id
                  ? 'bg-ink text-surface'
                  : 'bg-surface border border-line/70 text-muted hover:bg-sand'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Admin : classement ou drill-down ── */}
        {isAdmin && !selected && (
          <LeaderboardView
            allOrders={periodOrders}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectUser={setSelected}
          />
        )}

        {isAdmin && selected && (
          <>
            {/* Header drill-down */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-muted hover:text-ink transition-colors"
              >
                ← Classement
              </button>
              <span className="text-muted">/</span>
              <div className="flex items-center gap-2">
                <Avatar nom={selected.nom} size="sm" />
                <span className="font-semibold text-ink">{selected.nom}</span>
              </div>
            </div>
            <PersonalView nom={selected.nom} myOrders={selectedOrders} period={periodLabel} />
          </>
        )}

        {/* ── Non-admin : mes stats ── */}
        {!isAdmin && (
          <>
            <div className="flex items-center gap-2.5">
              <Avatar nom={user?.nom} />
              <div>
                <div className="font-semibold text-ink">{user?.nom}</div>
                <div className="text-xs text-muted capitalize">{user?.role} · {periodLabel}</div>
              </div>
            </div>
            {myOrders.length === 0 ? (
              <Card>
                <div className="text-center py-14 text-muted text-sm">
                  <Target size={32} className="mx-auto mb-3 text-muted/40" />
                  Aucune commande enregistrée sur cette période.<br/>
                  <span className="text-xs">Vos prochaines commandes apparaîtront ici.</span>
                </div>
              </Card>
            ) : (
              <PersonalView nom={user?.nom} myOrders={myOrders} period={periodLabel} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
