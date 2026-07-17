import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, X, Search, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import ActionMenu from '../components/ActionMenu.jsx';
import { Card, Badge } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { CLIENT_TYPES, uid } from '../data/store.js';

function ClientModal({ client, onClose, onSave }) {
  const isEdit = !!client;
  const [f, setF] = useState({
    name:    client?.name    || '',
    phone:   client?.phone   || '',
    type:    client?.type    || 'régulier',
    address: client?.address || '',
    email:   client?.email   || '',
    note:    client?.note    || '',
  });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2"/>
        <div className="font-semibold text-ink">{isEdit ? 'Client modifié' : 'Client ajouté'}</div>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface z-10">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier le client' : 'Nouveau client'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom complet *</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Prénom Nom / Société" className="field-input"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
              <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 xxx xx xx" className="field-input"/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Type</label>
              <select value={f.type} onChange={e => set('type', e.target.value)} className="field-input">
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Email</label>
            <input value={f.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" className="field-input"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse</label>
            <input value={f.address} onChange={e => set('address', e.target.value)} placeholder="Quartier, Ville" className="field-input"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Note</label>
            <textarea value={f.note} onChange={e => set('note', e.target.value)} placeholder="Informations complémentaires…"
              className="field-input resize-none" rows={2}/>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button disabled={!f.name.trim()} onClick={() => {
            onSave({ id: client?.id || uid(), ...f, orders: client?.orders || 0, total: client?.total || 0, createdAt: client?.createdAt || new Date().toISOString() });
            setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
          }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} closeOnBackdrop>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <Trash2 size={36} className="text-rose-500 mx-auto mb-3"/>
        <div className="font-semibold text-ink mb-1">Supprimer « {label} » ?</div>
        <div className="text-sm text-muted mb-5">Action irréversible.</div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
        </div>
      </div>
    </Modal>
  );
}

const TYPE_TONE = { pro: 'pro', nouveau: 'new', régulier: 'soft' };
const initials = name => (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

export default function Clients() {
  const { clients, setClients } = useStore();
  const [modal, setModal]           = useState(null);
  const [toDelete, setToDelete]     = useState(null);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');

  function save(c) {
    setClients(prev => {
      const i = prev.findIndex(x => x.id === c.id);
      if (i >= 0) { const n = [...prev]; n[i] = c; return n; }
      return [...prev, c];
    });
  }

  function remove(id) { setClients(prev => prev.filter(c => c.id !== id)); setToDelete(null); }

  let filtered = clients;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q));
  }
  if (filterType) filtered = filtered.filter(c => c.type === filterType);

  return (
    <div className="fade-in">
      {modal !== null && <ClientModal client={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={save}/>}
      {toDelete && <DeleteConfirm label={toDelete.name} onConfirm={() => remove(toDelete.id)} onCancel={() => setToDelete(null)}/>}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="CLIENTS" title="Registre clients" actionLabel="Nouveau client" onAction={() => setModal('add')}/>
      </div>
      <MobileTopBar subtitle="CLIENTS"/>

      <div className="px-4 lg:px-8 py-5 space-y-4">
        <div className="lg:hidden">
          <button onClick={() => setModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14}/> Nouveau client
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, téléphone…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300"/>
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
            <option value="">Tous types</option>
            {CLIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <span className="text-xs text-muted">{filtered.length} client(s)</span>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto">
              <Users size={22} className="text-muted"/>
            </div>
            <div className="text-muted text-sm">Aucun client enregistré.</div>
            <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl">
              <Plus size={14}/> Nouveau client
            </button>
          </div>
        ) : (
          <Card>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                    <th className="text-left py-2.5 px-5 font-medium">Nom</th>
                    <th className="text-left py-2.5 px-3 font-medium">Téléphone</th>
                    <th className="text-left py-2.5 px-3 font-medium">Email</th>
                    <th className="text-left py-2.5 px-3 font-medium">Type</th>
                    <th className="text-left py-2.5 px-3 font-medium">Adresse</th>
                    <th className="text-right py-2.5 px-3 font-medium">Cmds</th>
                    <th className="w-20 py-2.5 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-line/40 last:border-0 hover:bg-bone/50 group">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brick-50 text-brick-600 grid place-items-center text-[11px] font-semibold shrink-0">{initials(c.name)}</div>
                          <span className="font-medium text-ink">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 text-muted tabular-nums">{c.phone || '—'}</td>
                      <td className="px-3 text-muted text-xs">{c.email || '—'}</td>
                      <td className="px-3"><Badge tone={TYPE_TONE[c.type] || 'soft'} size="xs">{c.type}</Badge></td>
                      <td className="px-3 text-muted text-xs">{c.address || '—'}</td>
                      <td className="px-3 text-right tabular-nums font-medium">{c.orders || 0}</td>
                      <td className="px-5">
                        <ActionMenu actions={[
                          { label: 'Modifier',  icon: Edit2,  onClick: () => setModal(c) },
                          'divider',
                          { label: 'Supprimer', icon: Trash2, onClick: () => setToDelete(c), danger: true },
                        ]}/>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted text-sm">Aucun résultat.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="lg:hidden divide-y divide-line/50">
              {filtered.map(c => (
                <li key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brick-50 text-brick-600 grid place-items-center text-sm font-semibold shrink-0">{initials(c.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink">{c.name}</span>
                      <Badge tone={TYPE_TONE[c.type] || 'soft'} size="xs">{c.type}</Badge>
                    </div>
                    {c.phone   && <div className="text-xs text-muted mt-0.5 tabular-nums">{c.phone}</div>}
                    {c.address && <div className="text-xs text-muted truncate">{c.address}</div>}
                  </div>
                  <ActionMenu actions={[
                    { label: 'Modifier',  icon: Edit2,  onClick: () => setModal(c) },
                    'divider',
                    { label: 'Supprimer', icon: Trash2, onClick: () => setToDelete(c), danger: true },
                  ]}/>
                </li>
              ))}
              {filtered.length === 0 && <li className="py-8 text-center text-muted text-sm">Aucun résultat.</li>}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
