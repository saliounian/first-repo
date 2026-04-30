import { useState } from 'react';
import { ChevronRight, Bell, ArrowLeft, Phone, MapPin, Calendar, ShoppingCart, FileText, Search, Plus } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, Badge, StatusBadge, Tabs } from '../components/ui.jsx';
import { clients, clientKPIs, clientHistory } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';

export default function Clients() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'all',      label: 'Tous',      count: clients.length },
    { id: 'pro',      label: 'Pro',       count: clients.filter(c => c.type === 'pro').length },
    { id: 'régulier', label: 'Réguliers', count: clients.filter(c => c.type === 'régulier').length },
    { id: 'nouveau',  label: 'Nouveaux',  count: clients.filter(c => c.type === 'nouveau').length },
    { id: 'debt',     label: 'Créance' }
  ];

  let filtered = tab === 'all' ? clients : tab === 'debt' ? clients.slice(0, 3) : clients.filter(c => c.type === tab);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }

  if (selected) return <ClientDetail client={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="CLIENTS"
          title="Registre clients"
          searchPlaceholder="Nom, téléphone..."
          actionLabel="Nouveau client"
        />
      </div>
      <MobileTopBar alerts={3} subtitle="CLIENTS" />

      <div className="px-4 lg:px-8 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Clients totaux" value={clientKPIs.total} delta={clientKPIs.totalDelta} sublabel="ce mois" accent large />
          <KpiCard label="Actifs · 30j"   value={clientKPIs.active30} sublabel={`${clientKPIs.active30Pct}% du fichier`} />
          <KpiCard label="Panier moyen"   value={clientKPIs.cart.toLocaleString('fr-FR')} sublabel={clientKPIs.cartLabel} />
          <KpiCard label="Créances"       value={fmtFcfa(clientKPIs.debt)} delta={`+ ${clientKPIs.debtClients} clients`} deltaTone="neg" />
        </div>

        {/* Mobile search + add */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, téléphone..."
              className="w-full pl-8 pr-3 py-2.5 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300"
            />
          </div>
          <button className="w-10 h-10 grid place-items-center bg-brick-500 text-white rounded-xl shrink-0">
            <Plus size={16} />
          </button>
        </div>

        <Card>
          <div className="px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            <div className="text-xs text-muted">{filtered.length} clients</div>
          </div>

          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-line/50 px-2">
            {filtered.map(c => (
              <li key={c.id} onClick={() => setSelected(c)} className="px-3 py-3 flex items-center gap-3 cursor-pointer active:bg-brick-50/30">
                <div className="w-9 h-9 rounded-full bg-brick-50 text-brick-600 grid place-items-center text-[11px] font-semibold shrink-0">
                  {c.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink truncate">{c.name}</span>
                    {c.type === 'pro' && <Badge tone="pro" size="xs">pro</Badge>}
                    {c.vip && <Badge tone="vip" size="xs">★</Badge>}
                  </div>
                  <div className="text-[11px] text-muted tabular-nums">{c.phone}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{fmtFcfa(c.total)}</div>
                  <div className="text-[10px] text-muted">{c.orders} cmds · {c.last}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="text-left py-2 px-5 font-medium">Nom</th>
                  <th className="text-left py-2 px-3 font-medium">Téléphone</th>
                  <th className="text-right py-2 px-3 font-medium">Cmds</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="text-left py-2 px-3 font-medium">Dernière</th>
                  <th className="text-left py-2 px-3 font-medium">Type</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="border-b border-line/40 last:border-0 hover:bg-brick-50/30 cursor-pointer"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brick-50 text-brick-600 grid place-items-center text-[11px] font-semibold">
                          {c.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </div>
                        <div className="font-medium text-ink">{c.name}</div>
                        {c.vip && <Badge tone="vip" size="xs">★ VIP</Badge>}
                      </div>
                    </td>
                    <td className="px-3 tabular-nums text-muted">{c.phone}</td>
                    <td className="text-right tabular-nums px-3">{c.orders}</td>
                    <td className="text-right tabular-nums px-3 font-semibold">{fmtFcfa(c.total)}</td>
                    <td className="px-3 text-muted">{c.last}</td>
                    <td className="px-3">
                      <Badge tone={c.type === 'pro' ? 'pro' : c.type === 'nouveau' ? 'new' : 'soft'}>{c.type}</Badge>
                    </td>
                    <td className="px-3 text-right text-muted"><ChevronRight size={13} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length < clients.length && (
            <div className="px-4 lg:px-5 py-3 text-xs text-center border-t border-line/70">
              <button className="text-brick-500 hover:underline">+ {clients.length - filtered.length} autres clients</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ===================================================================
// CLIENT DETAIL
// ===================================================================
function ClientDetail({ client, onBack }) {
  const [histTab, setHistTab] = useState('all');

  return (
    <div className="fade-in">
      <div className="hidden lg:block">
        <PageHeader
          breadcrumb={
            <button onClick={onBack} className="hover:text-ink flex items-center gap-1">
              <ArrowLeft size={11} /> CLIENTS / FICHE
            </button>
          }
          title={client.name}
          searchPlaceholder={null}
          rightExtras={
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
                <Bell size={13} /> Notifier
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
                <ShoppingCart size={13} /> Commande
              </button>
            </>
          }
          actionLabel="Facture"
        />
      </div>

      {/* Mobile header with back */}
      <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 bg-bone sticky top-0 z-20 border-b border-line/60">
        <button onClick={onBack} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">{client.name}</div>
          <div className="text-[11px] text-muted">{client.phone}</div>
        </div>
        {client.vip && <Badge tone="vip" size="xs">★ VIP</Badge>}
      </div>

      {/* Mobile quick actions */}
      <div className="lg:hidden px-4 py-3 flex items-center gap-2 border-b border-line/60 bg-surface">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-brick-500 text-white font-medium rounded-xl">
          <ShoppingCart size={14} /> Commande
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-line/70 rounded-xl text-ink/80">
          <FileText size={14} /> Facture
        </button>
        <button className="w-10 h-10 grid place-items-center border border-line/70 rounded-xl text-muted shrink-0">
          <Bell size={15} />
        </button>
      </div>

      <div className="px-4 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brick-50 text-brick-600 grid place-items-center text-base font-semibold shrink-0">
                {client.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-ink truncate">{client.name}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {client.type === 'pro' && <Badge tone="pro">pro</Badge>}
                  {client.vip && <Badge tone="vip">★ VIP</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow icon={<Phone size={12} />}    label="TÉLÉPHONE"      value={client.phone} />
              <InfoRow icon={<MapPin size={12} />}   label="ADRESSE"        value="Marché Sandaga, allée 4" />
              <InfoRow icon={<Calendar size={12} />} label="CLIENT DEPUIS"  value={`${client.since || 'mars 2023'} · ${client.months || 25} mois`} />
            </div>
          </Card>

          <Card className="p-5 bg-brick-50/70">
            <div className="text-[10px] uppercase tracking-wider text-muted">Valeur client</div>
            <div className="text-3xl font-semibold tabular-nums text-brick-600 mt-1">{fmtFcfa(client.total)}</div>
            <div className="text-xs text-muted mt-1">FCFA · {client.orders} commandes · panier {fmtFcfa(client.total / client.orders)}</div>
          </Card>

          <Card className="p-5">
            <CardHeader title="Habitudes" />
            <div className="space-y-3 text-sm">
              <Hab label="Achète surtout"   value={(client.favorites || ['Riz', 'Huile', 'Sucre']).join(' · ')} />
              <Hab label="Boutique préférée" value="Plateau · Almadies" />
              <Hab label="Fréquence"         value={client.frequency || '2× / semaine'} />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card>
            <div className="px-4 lg:px-5 pt-4 pb-3 border-b border-line/60 overflow-x-auto no-scrollbar">
              <Tabs
                tabs={[
                  { id: 'all',  label: 'Historique', count: 47 },
                  { id: 'inv',  label: 'Factures',   count: 12 },
                  { id: 'note', label: 'Notes' },
                  { id: 'act',  label: 'Activité' }
                ]}
                value={histTab}
                onChange={setHistTab}
              />
            </div>

            <div className="px-3 lg:px-5 py-2">
              {clientHistory.map((day, i) => (
                <div key={i} className="py-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted mb-2 px-1">{day.date}</div>
                  <ul className="space-y-1.5">
                    {day.items.map((it, j) => (
                      <li key={j} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bone/60 cursor-pointer">
                        <div className="text-xs tabular-nums text-muted w-10 shrink-0">{it.time}</div>
                        <div className={`w-1 h-9 rounded-full shrink-0 ${it.kind === 'order' ? 'bg-brick-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-xs text-brick-500 font-semibold">{it.id}</span>
                            <span className="text-muted text-xs">{it.kind === 'order' ? 'Commande' : 'Facture'}</span>
                          </div>
                          <div className="text-sm text-ink/85 mt-0.5 truncate">{it.label}</div>
                        </div>
                        <StatusBadge status={it.status} />
                        <div className="text-sm font-semibold tabular-nums text-ink w-20 text-right hidden sm:block">{fmtFcfa(it.total)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">{icon} {label}</div>
      <div className="text-ink/90 mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function Hab({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">{label}</div>
      <div className="text-ink/85">{value}</div>
    </div>
  );
}
