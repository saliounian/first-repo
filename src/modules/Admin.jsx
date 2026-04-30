import { useState, useEffect, useCallback } from 'react';
import {
  Users, ClipboardList, Plus, Pencil, Power, PowerOff,
  Search, ChevronDown, Loader2, X, Check, AlertCircle, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { AccessDenied } from '../components/Gate.jsx';

// ─── API helpers ──────────────────────────────────────────────────────────────
const api = (path, opts = {}) =>
  fetch(`/api${path}`, { credentials: 'include', ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });

const MODULE_LABELS = {
  commandes: 'Commandes', produits: 'Produits', stock: 'Stock',
  livraisons: 'Livraisons', finances: 'Finances', clients: 'Clients',
  admin: 'Administration', analytique: 'Analytique', rapports: 'Rapports'
};

const ROLE_LABELS = {
  admin: 'Admin', commercial: 'Commercial', stock: 'Gestionnaire stock',
  livreur: 'Livreur', technicien: 'Technicien', comptable: 'Comptable'
};

const STATUS_COLOR = {
  actif:   'bg-brick-50 text-brick-600 border-brick-100',
  inactif: 'bg-rose-50  text-rose-600  border-rose-100'
};

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Main Admin ───────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState('users');
  const { user: me } = useAuth();

  // Defense in depth: even if route somehow loads, deny non-admins
  if (me?.role !== 'admin') {
    return (
      <div className="fade-in">
        <MobileTopBar subtitle="ADMINISTRATION" />
        <AccessDenied message="Cette section est réservée aux administrateurs." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <MobileTopBar subtitle="ADMINISTRATION" />

      <div className="hidden lg:block px-8 pt-6 pb-4 border-b border-line/60">
        <div className="text-[10px] tracking-[0.14em] text-muted uppercase">PARAMÈTRES · ADMIN</div>
        <h1 className="text-2xl font-semibold text-ink mt-0.5">Administration</h1>
        <p className="text-sm text-muted mt-0.5">Gérez les utilisateurs, rôles et le journal d'activité.</p>
      </div>

      <div className="px-4 lg:px-8 pt-5 pb-8 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-sand rounded-xl border border-line/60 w-fit">
          {[
            { id: 'users',  icon: Users,         label: 'Utilisateurs' },
            { id: 'logs',   icon: ClipboardList,  label: 'Journal d\'activité' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-surface text-brick-600 shadow-sm' : 'text-muted hover:text-ink'
              }`}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' ? <UsersPanel me={me} /> : <LogsPanel />}
      </div>
    </div>
  );
}

// ─── UsersPanel ───────────────────────────────────────────────────────────────
function UsersPanel({ me }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modalUser, setModal]   = useState(null); // null = closed, 'new' = create, object = edit

  const load = useCallback(() => {
    setLoading(true);
    api('/users')
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleUser(u) {
    await api(`/users/${u.id}/toggle`, { method: 'PATCH' });
    load();
  }

  return (
    <>
      <Card>
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap border-b border-line/60">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 pr-3 py-1.5 text-sm border border-line/70 rounded-lg bg-surface focus:outline-none focus:border-brick-500 w-52" />
          </div>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={14} /> Nouvel utilisateur
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted gap-2">
            <Loader2 size={18} className="animate-spin" /> Chargement…
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="lg:hidden divide-y divide-line/50">
              {filtered.map(u => (
                <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brick-500/90 text-white grid place-items-center text-sm font-semibold shrink-0">
                    {u.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{u.nom}</div>
                    <div className="text-[11px] text-muted truncate">{u.email}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted">{ROLE_LABELS[u.role_nom] || u.role_nom}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[u.statut]}`}>
                        {u.statut}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(u)} className="w-8 h-8 grid place-items-center rounded hover:bg-brick-50 text-muted hover:text-brick-600"><Pencil size={13} /></button>
                    {u.id !== me?.id && (
                      <button onClick={() => toggleUser(u)} className={`w-8 h-8 grid place-items-center rounded ${u.statut === 'actif' ? 'hover:bg-rose-50 text-muted hover:text-rose-600' : 'hover:bg-brick-50 text-muted hover:text-brick-600'}`}>
                        {u.statut === 'actif' ? <PowerOff size={13} /> : <Power size={13} />}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                    {['Utilisateur', 'Rôle', 'Statut', 'Dernière connexion', 'Timeout', 'Actions'].map(h => (
                      <th key={h} className={`py-2.5 px-4 font-medium ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brick-500/90 text-white grid place-items-center text-xs font-semibold">
                            {u.nom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-ink">{u.nom}</div>
                            <div className="text-[11px] text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-ink/80">{ROLE_LABELS[u.role_nom] || u.role_nom}</td>
                      <td className="px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[u.statut]}`}>
                          {u.statut}
                        </span>
                      </td>
                      <td className="px-4 text-muted tabular-nums text-[12px]">{fmtDate(u.derniere_connexion)}</td>
                      <td className="px-4 text-muted text-[12px]">{u.session_timeout} min</td>
                      <td className="px-4 text-right">
                        <div className="inline-flex items-center gap-1 text-muted">
                          <button onClick={() => setModal(u)} title="Modifier"
                            className="w-7 h-7 grid place-items-center hover:bg-brick-50 hover:text-brick-600 rounded transition-colors">
                            <Pencil size={12} />
                          </button>
                          {u.id !== me?.id && (
                            <button onClick={() => toggleUser(u)}
                              title={u.statut === 'actif' ? 'Désactiver' : 'Activer'}
                              className={`w-7 h-7 grid place-items-center rounded transition-colors ${
                                u.statut === 'actif'
                                  ? 'hover:bg-rose-50 hover:text-rose-600'
                                  : 'hover:bg-brick-50 hover:text-brick-600'
                              }`}>
                              {u.statut === 'actif' ? <PowerOff size={12} /> : <Power size={12} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted text-sm">Aucun utilisateur trouvé.</div>
              )}
            </div>
          </>
        )}
      </Card>

      {modalUser !== null && (
        <UserModal
          editUser={modalUser === 'new' ? null : modalUser}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}

// ─── UserModal ────────────────────────────────────────────────────────────────
function UserModal({ editUser, onClose, onSaved }) {
  const isEdit = Boolean(editUser);

  const [roles, setRoles]       = useState([]);
  const [allPerms, setAllPerms] = useState([]);   // all available permissions
  const [rolePerms, setRolePerms] = useState([]); // permissions granted by selected role
  const [checked, setChecked]   = useState({});   // { permId: true/false }

  const [nom, setNom]         = useState(editUser?.nom || '');
  const [email, setEmail]     = useState(editUser?.email || '');
  const [pwd, setPwd]         = useState('');
  const [roleId, setRoleId]   = useState(editUser?.role_id || '');
  const [statut, setStatut]   = useState(editUser?.statut || 'actif');
  const [timeout, setTimeout_] = useState(editUser?.session_timeout || 30);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [initDone, setInitDone] = useState(false);

  // Load roles and permissions
  useEffect(() => {
    Promise.all([
      api('/roles').then(r => r.json()),
      api('/roles/permissions/all').then(r => r.json())
    ]).then(([rolesData, permsData]) => {
      setRoles(rolesData);
      setAllPerms(permsData);
      if (!roleId && rolesData.length > 0) setRoleId(rolesData[0].id);
    });
  }, []);

  // When role changes, load its default permissions
  useEffect(() => {
    if (!roleId || allPerms.length === 0) return;
    api(`/roles/${roleId}/permissions`)
      .then(r => r.json())
      .then(rp => {
        setRolePerms(rp.map(p => p.id));
        if (!initDone) {
          // Initialize checkboxes: role defaults + custom user overrides
          const initial = {};
          if (isEdit && editUser.customPerms) {
            // Start from role defaults
            rp.forEach(p => { initial[p.id] = true; });
            // Apply custom overrides
            editUser.customPerms.forEach(cp => { initial[cp.id] = cp.granted === 1; });
          } else {
            rp.forEach(p => { initial[p.id] = true; });
          }
          setChecked(initial);
          setInitDone(true);
        }
      });
  }, [roleId, allPerms]);

  // When role changes after init, re-apply role defaults (keep custom state)
  useEffect(() => {
    if (!initDone || !roleId) return;
    api(`/roles/${roleId}/permissions`)
      .then(r => r.json())
      .then(rp => {
        setRolePerms(rp.map(p => p.id));
        // Reset to role defaults
        const next = {};
        rp.forEach(p => { next[p.id] = true; });
        setChecked(next);
      });
  }, [roleId]);

  // Group all permissions by module
  const grouped = allPerms.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  // Compute overrides: permissions that differ from role defaults
  function getCustomPerms() {
    return Object.entries(checked).map(([permId, granted]) => ({
      permissionId: parseInt(permId),
      granted
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!roleId) return setError('Sélectionnez un rôle.');
    if (!isEdit && (!pwd || pwd.length < 8)) return setError('Mot de passe : 8 caractères minimum.');
    setLoading(true);
    try {
      const body = {
        nom, email, roleId: parseInt(roleId), statut,
        sessionTimeout: parseInt(timeout),
        customPerms: getCustomPerms(),
        ...(pwd ? { password: pwd, newPassword: pwd } : {})
      };
      const res = await api(
        isEdit ? `/users/${editUser.id}` : '/users',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm slide-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-surface w-full lg:rounded-2xl lg:max-w-[700px] lg:shadow-pop h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-line/60 flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-muted">ADMINISTRATION · UTILISATEURS</div>
            <h2 className="text-lg font-semibold text-ink mt-0.5">
              {isEdit ? `Modifier — ${editUser.nom}` : 'Nouvel utilisateur'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink p-1"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Nom complet *">
                <input value={nom} onChange={e => setNom(e.target.value)} required
                  className="field-input" placeholder="Mamadou Fall" />
              </Field>
              <Field label="Email *">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="field-input" placeholder="prenom@gestcopta.sn" />
              </Field>
              <Field label={isEdit ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe temporaire *'}>
                <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
                  required={!isEdit} className="field-input" placeholder="••••••••" />
              </Field>
              <Field label="Délai d'inactivité (minutes)">
                <input type="number" min="5" max="480" value={timeout}
                  onChange={e => setTimeout_(e.target.value)} className="field-input" />
              </Field>
            </div>

            {/* Role + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Rôle de base *">
                <select value={roleId} onChange={e => setRoleId(e.target.value)} required
                  className="field-input">
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{ROLE_LABELS[r.nom] || r.nom}</option>
                  ))}
                </select>
              </Field>
              <Field label="Statut">
                <div className="flex gap-2 mt-0.5">
                  {['actif', 'inactif'].map(s => (
                    <button key={s} type="button" onClick={() => setStatut(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all capitalize ${
                        statut === s
                          ? 'border-brick-500 bg-brick-50 text-brick-600 font-medium'
                          : 'border-line/70 text-muted hover:border-brick-200'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase tracking-wider text-muted">
                  Permissions personnalisées
                </label>
                <span className="text-[11px] text-muted">
                  {Object.values(checked).filter(Boolean).length} / {allPerms.length} accordées
                </span>
              </div>

              <div className="border border-line/70 rounded-xl overflow-hidden divide-y divide-line/50">
                {Object.entries(grouped).map(([mod, perms]) => (
                  <div key={mod} className="bg-surface">
                    <div className="px-4 py-2 bg-sand/60 border-b border-line/40">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted">
                        {MODULE_LABELS[mod] || mod}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-line/30">
                      {perms.map(p => {
                        const isRoleDefault = rolePerms.includes(p.id);
                        const isGranted = checked[p.id] ?? isRoleDefault;
                        return (
                          <label key={p.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-brick-50/30 cursor-pointer transition-colors">
                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                              isGranted
                                ? 'bg-brick-500 border-brick-500'
                                : 'border-line/70 bg-surface'
                            }`}
                              onClick={() => setChecked(c => ({ ...c, [p.id]: !isGranted }))}>
                              {isGranted && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-sm text-ink/80 flex-1">{p.description}</span>
                            {isRoleDefault && (
                              <span className="text-[10px] text-muted/70 shrink-0">défaut</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-line/60 flex gap-2 justify-end bg-surface">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-line/70 rounded-lg hover:bg-sand">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-brick-500 hover:bg-brick-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer l\'utilisateur')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LogsPanel ────────────────────────────────────────────────────────────────
function LogsPanel() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers]     = useState([]);
  const [modules, setModules] = useState([]);

  const [filterUser,   setFilterUser]   = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [offset, setOffset]             = useState(0);
  const LIMIT = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: LIMIT, offset,
      ...(filterUser   && { userId: filterUser }),
      ...(filterModule && { module: filterModule }),
      ...(filterResult && { resultat: filterResult }),
      ...(dateFrom     && { dateFrom }),
      ...(dateTo       && { dateTo })
    });
    api(`/logs?${params}`).then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    }).finally(() => setLoading(false));
  }, [filterUser, filterModule, filterResult, dateFrom, dateTo, offset]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api('/logs/users').then(r => r.json()).then(setUsers);
    api('/logs/modules').then(r => r.json()).then(setModules);
  }, []);

  // CSV export
  function exportCsv() {
    const header = ['Date', 'Utilisateur', 'Email', 'Module', 'Action', 'Ancienne valeur', 'Nouvelle valeur', 'Résultat'];
    const rows = logs.map(l => [
      l.created_at, l.user_nom || '', l.user_email || '',
      l.module, l.action,
      l.ancienne_valeur || '', l.nouvelle_valeur || '', l.resultat
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'journal_activite.csv'; a.click();
  }

  const RESULT_STYLE = { succes: 'text-brick-600 bg-brick-50', echec: 'text-rose-600 bg-rose-50' };

  return (
    <Card>
      {/* Filters */}
      <div className="px-4 lg:px-5 py-4 border-b border-line/60 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setOffset(0); }}
          className="field-input text-sm">
          <option value="">Tous les utilisateurs</option>
          {users.map(u => <option key={u.user_id} value={u.user_id}>{u.user_nom}</option>)}
        </select>
        <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setOffset(0); }}
          className="field-input text-sm">
          <option value="">Tous les modules</option>
          {modules.map(m => <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>)}
        </select>
        <select value={filterResult} onChange={e => { setFilterResult(e.target.value); setOffset(0); }}
          className="field-input text-sm">
          <option value="">Tous les résultats</option>
          <option value="succes">Succès</option>
          <option value="echec">Échec</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setOffset(0); }}
          className="field-input text-sm" placeholder="Du" />
        <div className="flex gap-2">
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setOffset(0); }}
            className="field-input text-sm flex-1" placeholder="Au" />
          <button onClick={exportCsv} title="Exporter CSV"
            className="w-9 h-9 shrink-0 grid place-items-center border border-line/70 rounded-lg hover:bg-sand text-muted hover:text-ink transition-colors">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="px-5 py-2 text-[11px] text-muted border-b border-line/40">
        {total} entrée{total !== 1 ? 's' : ''} — lecture seule, non modifiable
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* Mobile */}
          <ul className="lg:hidden divide-y divide-line/50">
            {logs.map(l => (
              <li key={l.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted tabular-nums">{fmtDate(l.created_at)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RESULT_STYLE[l.resultat]}`}>
                    {l.resultat}
                  </span>
                </div>
                <div className="text-sm font-medium text-ink">{l.action}</div>
                <div className="text-[11px] text-muted">
                  {l.user_nom || 'Système'} · {MODULE_LABELS[l.module] || l.module}
                </div>
                {(l.ancienne_valeur || l.nouvelle_valeur) && (
                  <div className="text-[11px] text-muted font-mono bg-sand/60 rounded px-2 py-1">
                    {l.ancienne_valeur && <span className="text-rose-500">{l.ancienne_valeur}</span>}
                    {l.ancienne_valeur && l.nouvelle_valeur && <span> → </span>}
                    {l.nouvelle_valeur && <span className="text-brick-600">{l.nouvelle_valeur}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.1em] text-muted">
                  {['Date & Heure', 'Utilisateur', 'Module', 'Action', 'Ancienne → Nouvelle valeur', 'Résultat'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-line/40 last:border-0 hover:bg-brick-50/10">
                    <td className="py-2.5 px-4 tabular-nums text-muted text-[12px] whitespace-nowrap">{fmtDate(l.created_at)}</td>
                    <td className="px-4">
                      <div className="font-medium text-ink">{l.user_nom || '—'}</div>
                      <div className="text-[11px] text-muted">{l.user_email || ''}</div>
                    </td>
                    <td className="px-4 text-muted text-[12px]">{MODULE_LABELS[l.module] || l.module}</td>
                    <td className="px-4 text-ink/80 max-w-[280px]">{l.action}</td>
                    <td className="px-4 text-[11px] font-mono text-muted max-w-[200px]">
                      {l.ancienne_valeur && <span className="text-rose-500">{l.ancienne_valeur}</span>}
                      {l.ancienne_valeur && l.nouvelle_valeur && <span className="text-muted"> → </span>}
                      {l.nouvelle_valeur && <span className="text-brick-600">{l.nouvelle_valeur}</span>}
                      {!l.ancienne_valeur && !l.nouvelle_valeur && '—'}
                    </td>
                    <td className="px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${RESULT_STYLE[l.resultat]}`}>
                        {l.resultat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">Aucun événement trouvé.</div>
            )}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="px-5 py-3 border-t border-line/60 flex items-center justify-between text-sm">
              <span className="text-muted">{offset + 1} – {Math.min(offset + LIMIT, total)} sur {total}</span>
              <div className="flex gap-2">
                <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
                  className="px-3 py-1 border border-line/70 rounded-lg disabled:opacity-40 hover:bg-sand">
                  ← Précédent
                </button>
                <button disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}
                  className="px-3 py-1 border border-line/70 rounded-lg disabled:opacity-40 hover:bg-sand">
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] uppercase tracking-wider text-muted">{label}</label>
      {children}
    </div>
  );
}
