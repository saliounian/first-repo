import { useState } from 'react';
import { ChevronRight, Bell, ArrowLeft, Phone, MapPin, Calendar, ShoppingCart, FileText, Search, Plus, X, CheckCircle } from 'lucide-react';
import PageHeader, { HeaderFilter } from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card, CardHeader, KpiCard, Badge, StatusBadge, Tabs } from '../components/ui.jsx';
import { clients as initialClients, clientKPIs, clientHistory } from '../data/mockData.js';
import { fmtFcfa } from '../utils/format.js';
import { usePersistedState } from '../utils/usePersistedState.js';
import { toast } from '../utils/toast.jsx';

export default function Clients() {
  const [clients, setClients]   = usePersistedState('gestcopta:clients', initialClients);
  const [tab, setTab]           = useState('all');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // null | 'add' | clientObj

  function saveClient(c) {
    setClients(prev => {
      const i = prev.findIndex(x => x.id === c.id);
      if (i >= 0) { const n = [...prev]; n[i] = c; return n; }
      return [c, ...prev];
    });
  }

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
          searchValue={search}
          onSearchChange={setSearch}
          actionLabel="Nouveau client"
          onAction={() => setModal('add')}
        />
      </div>
      {modal !== null && (
        <ClientModal
          client={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveClient}
        />
      )}
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
          <button onClick={() => setModal('add')}
            className="w-10 h-10 grid place-items-center bg-brick-500 hover:bg-brick-600 text-white rounded-xl shrink-0 active:scale-95 transition-transform">
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
              <button onClick={() => { setTab('all'); setSearch(''); }} className="text-brick-500 hover:underline">
                + {clients.length - filtered.length} autres clients
              </button>
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
              <button
                onClick={() => toast.success(`SMS envoyé à ${client.name} (${client.phone})`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
                <Bell size={13} /> Notifier
              </button>
              <button
                onClick={() => toast.info(`Commande pré-remplie pour ${client.name}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-line/70 rounded-lg hover:bg-surface">
                <ShoppingCart size={13} /> Commande
              </button>
            </>
          }
          actionLabel="Facture"
          onAction={() => toast.info(`Facture initialisée pour ${client.name}`)}
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
        <button
          onClick={() => toast.info(`Commande pré-remplie pour ${client.name}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-brick-500 hover:bg-brick-600 text-white font-medium rounded-xl active:scale-95 transition-transform">
          <ShoppingCart size={14} /> Commande
        </button>
        <button
          onClick={() => toast.info(`Facture initialisée pour ${client.name}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-line/70 rounded-xl text-ink/80 active:scale-95 transition-transform">
          <FileText size={14} /> Facture
        </button>
        <button
          onClick={() => toast.success(`SMS envoyé à ${client.name}`)}
          className="w-10 h-10 grid place-items-center border border-line/70 rounded-xl text-muted shrink-0 active:scale-95 transition-transform">
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

// ===================================================================
// NEW / EDIT CLIENT MODAL
// ===================================================================
function ClientModal({ client, onClose, onSave }) {
  const isEdit = !!client;
  const [f, setF] = useState({
    name:    client?.name    || '',
    phone:   client?.phone   || '',
    type:    client?.type    || 'régulier',
    favShop: client?.favShop || 'plateau',
    orders:  client?.orders  || 0,
    total:   client?.total   || 0,
    last:    client?.last    || 'aujourd\'hui',
  });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function submit() {
    if (!f.name.trim()) { toast.error('Nom requis'); return; }
    onSave({
      id: client?.id || `c${Date.now()}`,
      ...f,
      orders: +f.orders || 0,
      total:  +f.total  || 0,
    });
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 900);
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Client modifié' : 'Client ajouté'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in lg:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full lg:rounded-2xl lg:max-w-md lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-4 pt-4 pb-3 flex items-center gap-3 border-b border-line/60">
          <button onClick={onClose} className="w-8 h-8 grid place-items-center -ml-1"><ArrowLeft size={18} /></button>
          <div className="font-semibold text-ink">{isEdit ? 'Modifier client' : 'Nouveau client'}</div>
        </div>
        {/* Desktop header */}
        <div className="hidden lg:flex px-5 pt-5 pb-4 items-center justify-between border-b border-line/60">
          <div className="font-semibold text-ink text-lg">{isEdit ? 'Modifier client' : 'Nouveau client'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom complet *</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Prénom Nom ou Raison sociale" className="field-input" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
            <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 …" className="field-input tabular-nums" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Type</label>
              <select value={f.type} onChange={e => set('type', e.target.value)} className="field-input">
                <option value="régulier">Régulier</option>
                <option value="pro">Pro</option>
                <option value="nouveau">Nouveau</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique favorite</label>
              <select value={f.favShop} onChange={e => set('favShop', e.target.value)} className="field-input">
                <option value="plateau">Plateau</option>
                <option value="almadies">Almadies</option>
                <option value="yoff">Yoff</option>
                <option value="liberte6">Liberté 6</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          {isEdit && (
            <div className="grid grid-cols-2 gap-3 border-t border-line/50 pt-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Cmds</label>
                <input type="number" min="0" value={f.orders} onChange={e => set('orders', e.target.value)} className="field-input" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Total (FCFA)</label>
                <input type="number" min="0" value={f.total} onChange={e => set('total', e.target.value)} className="field-input" />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-line/60 flex items-center justify-end gap-2 bg-surface">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-bone">Annuler</button>
          <button onClick={submit} disabled={!f.name.trim()}
            className="px-5 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
