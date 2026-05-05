import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card } from '../components/ui.jsx';
import { shops, stockPoints as initialPoints } from '../data/mockData.js';
import { usePersistedState } from '../utils/usePersistedState.js';

const EMPTY = {
  name: '', shopId: '',
  stockInitial: 0, stockVendu: 0,
  respNom: '', respAdresse: '', respFonction: ''
};

function Modal({ point, onClose, onSave }) {
  const isEdit = !!point;
  const [f, setF] = useState(isEdit ? {
    name:         point.name,
    shopId:       point.shopId,
    stockInitial: point.stockInitial,
    stockVendu:   point.stockVendu,
    respNom:      point.responsable.nom,
    respAdresse:  point.responsable.adresse,
    respFonction: point.responsable.fonction,
  } : { ...EMPTY });
  const [ok, setOk] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function submit() {
    onSave({
      id:           point?.id || `sp${Date.now()}`,
      shopId:       f.shopId,
      name:         f.name,
      stockInitial: +f.stockInitial,
      stockVendu:   +f.stockVendu,
      stockActuel:  +f.stockInitial - +f.stockVendu,
      responsable:  { nom: f.respNom, adresse: f.respAdresse, fonction: f.respFonction },
    });
    setOk(true);
    setTimeout(() => { setOk(false); onClose(); }, 900);
  }

  if (ok) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Modifié' : 'Ajouté'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier' : 'Nouveau point de stock'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom du point</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Dépôt principal" className="field-input" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
            <select value={f.shopId} onChange={e => set('shopId', e.target.value)} className="field-input">
              <option value="">Choisir…</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Stock initial</label>
              <input type="number" min="0" value={f.stockInitial} onChange={e => set('stockInitial', e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Articles vendus</label>
              <input type="number" min="0" value={f.stockVendu} onChange={e => set('stockVendu', e.target.value)} className="field-input" />
            </div>
          </div>

          <div className="border-t border-line/50 pt-3 space-y-3">
            <div className="text-xs font-semibold text-ink uppercase tracking-wider">Responsable</div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom complet</label>
              <input value={f.respNom} onChange={e => set('respNom', e.target.value)} placeholder="Prénom Nom" className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse</label>
              <input value={f.respAdresse} onChange={e => set('respAdresse', e.target.value)} placeholder="Quartier, Ville" className="field-input" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Fonction</label>
              <input value={f.respFonction} onChange={e => set('respFonction', e.target.value)} placeholder="Ex: Magasinier chef" className="field-input" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={submit} disabled={!f.name || !f.shopId}
            className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable point card (desktop + mobile) ──────────────────────────────────
function PointCard({ pt, shop, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: shop?.color || '#9CA8A0' }} />
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate">{pt.name}</div>
            {shop && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: shop.color }} />
                <span className="text-xs text-muted">{shop.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit}
              className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted hover:bg-sand hover:text-ink">
              <Edit2 size={12} />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted hover:bg-rose-50 hover:text-rose-500">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['Initial', pt.stockInitial, 'text-ink'],
            ['Vendus',  pt.stockVendu,   'text-brick-600 font-semibold'],
            ['Actuels', pt.stockActuel,  'text-ink font-bold'],
          ].map(([l, v, cls]) => (
            <div key={l} className="bg-bone rounded-lg py-2.5">
              <div className={`text-lg tabular-nums ${cls}`}>{v}</div>
              <div className="text-[10px] text-muted mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {pt.responsable.nom !== '—' && (
          <div className="mt-3 pt-3 border-t border-line/40 space-y-0.5">
            <div className="font-medium text-sm text-ink">{pt.responsable.nom}</div>
            <div className="text-xs text-muted">{pt.responsable.fonction}</div>
            <div className="text-xs text-muted">{pt.responsable.adresse}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function PointDeStock() {
  const [points, setPoints]   = usePersistedState('gestcopta:stockPoints', initialPoints);
  const [modal, setModal]     = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function save(p) {
    setPoints(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if (i >= 0) { const n = [...prev]; n[i] = p; return n; }
      return [...prev, p];
    });
  }

  function confirmDelete() {
    setPoints(prev => prev.filter(p => p.id !== toDelete.id));
    setToDelete(null);
  }

  return (
    <div className="fade-in">
      {modal !== null && (
        <Modal
          point={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3" />
            <div className="font-semibold text-ink mb-1">Supprimer « {toDelete.name} » ?</div>
            <div className="text-sm text-muted mb-5">Cette action est irréversible.</div>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <PageHeader
          breadcrumb="POINT DE STOCK"
          title="Points de stock"
          actionLabel="Ajouter un point"
          onAction={() => setModal('add')}
        />
      </div>
      <MobileTopBar subtitle="POINTS DE STOCK" />

      <div className="px-4 lg:px-8 py-5 space-y-4">
        {/* Mobile add */}
        <div className="lg:hidden">
          <button onClick={() => setModal('add')}
            className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Ajouter un point de stock
          </button>
        </div>

        {/* Card grid (desktop + mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {points.map(pt => {
            const shop = shops.find(s => s.id === pt.shopId);
            return (
              <PointCard
                key={pt.id}
                pt={pt}
                shop={shop}
                onEdit={() => setModal(pt)}
                onDelete={() => setToDelete(pt)}
              />
            );
          })}
        </div>

        {points.length === 0 && (
          <div className="text-center py-10 text-muted text-sm">Aucun point de stock.</div>
        )}
      </div>
    </div>
  );
}
