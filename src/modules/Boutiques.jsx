import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, X, MapPin, Phone, User, Store } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import ActionMenu from '../components/ActionMenu.jsx';
import { Card, KpiCard } from '../components/ui.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { SHOP_COLORS, uid } from '../data/store.js';
import { fmtFcfa } from '../utils/format.js';

// ─── Modal ajout/modif boutique ───────────────────────────────────────────────
function ShopModal({ shop, onClose, onSave }) {
  const isEdit = !!shop;
  const [f, setF] = useState({
    name:     shop?.name    || '',
    color:    shop?.color   || SHOP_COLORS[0],
    manager:  shop?.manager || '',
    phone:    shop?.phone   || '',
    address:  shop?.address || '',
  });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Boutique modifiée' : 'Boutique ajoutée'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface z-10">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier la boutique' : 'Nouvelle boutique'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom de la boutique *</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Plateau" className="field-input"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {SHOP_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full transition-transform ${f.color === c ? 'scale-125 ring-2 ring-offset-2 ring-ink/30' : ''}`}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Responsable</label>
            <input value={f.manager} onChange={e => set('manager', e.target.value)} placeholder="Nom du responsable" className="field-input"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Téléphone</label>
            <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+221 77 xxx xx xx" className="field-input"/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Adresse</label>
            <input value={f.address} onChange={e => set('address', e.target.value)} placeholder="Quartier, Ville" className="field-input"/>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button disabled={!f.name.trim()} onClick={() => {
            onSave({ id: shop?.id || uid(), ...f });
            setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
          }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto py-4 px-4 flex items-start lg:items-center justify-center">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <Trash2 size={36} className="text-rose-500 mx-auto mb-3"/>
        <div className="font-semibold text-ink mb-1">Supprimer « {label} » ?</div>
        <div className="text-sm text-muted mb-5">Action irréversible.</div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function Boutiques() {
  const { shops, setShops, totalStockForShop } = useStore();
  const [modal, setModal]   = useState(null); // null | 'add' | shop
  const [toDelete, setToDelete] = useState(null);

  function save(s) {
    setShops(prev => {
      const i = prev.findIndex(x => x.id === s.id);
      if (i >= 0) { const n = [...prev]; n[i] = s; return n; }
      return [...prev, s];
    });
  }

  function remove(id) {
    setShops(prev => prev.filter(s => s.id !== id));
    setToDelete(null);
  }

  return (
    <div className="fade-in">
      {modal !== null && <ShopModal shop={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={save}/>}
      {toDelete && <DeleteConfirm label={toDelete.name} onConfirm={() => remove(toDelete.id)} onCancel={() => setToDelete(null)}/>}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="BOUTIQUES" title="Gestion des boutiques" actionLabel="Nouvelle boutique" onAction={() => setModal('add')}/>
      </div>
      <MobileTopBar subtitle="BOUTIQUES"/>

      <div className="px-4 lg:px-8 py-5 space-y-4">
        <div className="lg:hidden">
          <button onClick={() => setModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14}/> Nouvelle boutique
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard label="Boutiques" value={shops.length} accent large/>
          <KpiCard label="Unités en stock" value={shops.reduce((s, sh) => s + totalStockForShop(sh.id), 0)}/>
          <KpiCard label="Points de stock" value={0} sublabel="voir module"/>
        </div>

        {shops.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto">
              <Store size={22} className="text-muted"/>
            </div>
            <div className="text-muted text-sm">Aucune boutique. Commencez par en créer une.</div>
            <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl">
              <Plus size={14}/> Nouvelle boutique
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map(shop => {
              const total = totalStockForShop(shop.id);
              return (
                <Card key={shop.id} className="overflow-hidden">
                  <div className="h-1.5 w-full" style={{ background: shop.color }}/>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="font-semibold text-ink text-base">{shop.name}</div>
                        {shop.manager && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
                            <User size={11}/><span>{shop.manager}</span>
                          </div>
                        )}
                      </div>
                      <ActionMenu actions={[
                        { label: 'Modifier',   icon: Edit2,  onClick: () => setModal(shop) },
                        'divider',
                        { label: 'Supprimer',  icon: Trash2, onClick: () => setToDelete(shop), danger: true },
                      ]}/>
                    </div>
                    <div className="space-y-1 text-xs text-muted mb-3">
                      {shop.address && <div className="flex items-center gap-1.5"><MapPin size={11}/><span className="truncate">{shop.address}</span></div>}
                      {shop.phone   && <div className="flex items-center gap-1.5"><Phone size={11}/><span>{shop.phone}</span></div>}
                    </div>
                    <div className="bg-bone rounded-lg px-3 py-2 flex justify-between text-sm">
                      <span className="text-muted text-xs">Unités en stock</span>
                      <span className="font-semibold tabular-nums">{total}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
