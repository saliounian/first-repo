import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, X, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { Card } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { uid } from '../data/store.js';

const EMPTY = { name: '', shopId: '', stockInitial: 0, respNom: '', respAdresse: '', respFonction: '' };

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-bone border border-line/50 grid place-items-center mx-auto">
        <Package size={22} className="text-muted" />
      </div>
      <div className="text-muted text-sm">Aucun point de stock. Ajoutez-en un.</div>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-xl">
        <Plus size={14} /> Ajouter un point
      </button>
    </div>
  );
}

function PointForm({ point, shops, onClose, onSave }) {
  const isEdit = !!point;
  const [f, setF] = useState(isEdit ? {
    name: point.name, shopId: point.shopId,
    stockInitial: point.stockInitial,
    respNom: point.responsable?.nom || '', respAdresse: point.responsable?.adresse || '', respFonction: point.responsable?.fonction || '',
  } : { ...EMPTY });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl p-8 text-center shadow-xl">
        <CheckCircle size={44} className="text-brick-500 mx-auto mb-2" />
        <div className="font-semibold text-ink">{isEdit ? 'Modifié' : 'Ajouté'}</div>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/70 sticky top-0 bg-surface">
          <div className="font-semibold text-ink">{isEdit ? 'Modifier' : 'Nouveau point de stock'}</div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-sand text-muted"><X size={15} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Nom du point *</label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Dépôt principal" className="field-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Boutique</label>
              <select value={f.shopId} onChange={e => set('shopId', e.target.value)} className="field-input">
                <option value="">Choisir…</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted block mb-1.5">Stock initial (stock de départ)</label>
              <input type="number" min="0" value={f.stockInitial} onChange={e => set('stockInitial', +e.target.value)} className="field-input" />
              <p className="text-[10px] text-muted mt-1">Les valeurs Vendus et Actuels sont calculées automatiquement depuis les commandes et transferts.</p>
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
          <button disabled={!f.name.trim()} onClick={() => {
            onSave({
              id: point?.id || uid(), shopId: f.shopId, name: f.name.trim(),
              stockInitial: f.stockInitial,
              responsable: { nom: f.respNom, adresse: f.respAdresse, fonction: f.respFonction },
            });
            setDone(true); setTimeout(() => { setDone(false); onClose(); }, 900);
          }} className="flex-1 py-2.5 bg-brick-500 hover:bg-brick-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium">
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function PointDeStock() {
  const { stockPoints: points, setStockPoints: setPoints, shops, computeStockPointStats } = useStore();
  const [modal, setModal]       = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [filterShop, setFilter] = useState('');

  function save(p) {
    setPoints(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      return i >= 0 ? prev.map((x, j) => j === i ? p : x) : [...prev, p];
    });
  }

  const filtered = filterShop ? points.filter(p => p.shopId === filterShop) : points;

  return (
    <div className="fade-in">
      {modal !== null && <PointForm point={modal === 'add' ? null : modal} shops={shops} onClose={() => setModal(null)} onSave={save} />}
      {toDelete && (
        <Modal onClose={() => setToDelete(null)} closeOnBackdrop>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="text-rose-500 mx-auto mb-3" />
            <div className="font-semibold text-ink mb-1">Supprimer « {toDelete.name} » ?</div>
            <div className="text-sm text-muted mb-5">Action irréversible.</div>
            <div className="flex gap-3">
              <button onClick={() => setToDelete(null)} className="flex-1 py-2.5 border border-line/70 rounded-xl text-sm font-medium hover:bg-sand">Annuler</button>
              <button onClick={() => { setPoints(prev => prev.filter(p => p.id !== toDelete.id)); setToDelete(null); }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="hidden lg:block">
        <PageHeader breadcrumb="POINT DE STOCK" title="Points de stock" actionLabel="Ajouter un point" onAction={() => setModal('add')} />
      </div>
      <MobileTopBar subtitle="POINTS DE STOCK" />

      <div className="px-4 lg:px-8 py-5 space-y-4">
        <div className="lg:hidden">
          <button onClick={() => setModal('add')} className="w-full py-2.5 bg-brick-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <Plus size={14} /> Ajouter un point de stock
          </button>
        </div>

        {points.length > 0 && (
          <div className="flex items-center gap-3">
            <select value={filterShop} onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-surface border border-line/70 rounded-xl focus:outline-none focus:border-brick-300">
              <option value="">Toutes les boutiques</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="text-xs text-muted">{filtered.length} point(s)</span>
          </div>
        )}

        {points.length === 0 ? (
          <EmptyState onAdd={() => setModal('add')} />
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden lg:block overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70 text-[10px] uppercase tracking-[0.12em] text-muted">
                    <th className="text-left py-3 px-5 font-medium">Point de stock</th>
                    <th className="text-left py-3 px-3 font-medium">Boutique</th>
                    <th className="text-right py-3 px-3 font-medium">Initial</th>
                    <th className="text-right py-3 px-3 font-medium">Vendus</th>
                    <th className="text-right py-3 px-3 font-medium">Actuels</th>
                    <th className="text-left py-3 px-3 font-medium">Responsable</th>
                    <th className="text-left py-3 px-3 font-medium">Adresse</th>
                    <th className="text-left py-3 px-3 font-medium">Fonction</th>
                    <th className="w-20 py-3 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pt => {
                    const shop = shops.find(s => s.id === pt.shopId);
                    const stats = computeStockPointStats(pt.id);
                    return (
                      <tr key={pt.id} className="border-b border-line/40 last:border-0 hover:bg-bone/60 group">
                        <td className="py-3 px-5">
                          <div className="font-medium text-ink">{pt.name}</div>
                        </td>
                        <td className="px-3">
                          {shop && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                            <span className="w-2 h-2 rounded-full" style={{ background: shop.color }} />{shop.name}
                          </span>}
                        </td>
                        <td className="text-right tabular-nums px-3">{stats.initial}</td>
                        <td className="text-right tabular-nums px-3 text-brick-600 font-medium">{stats.vendu}</td>
                        <td className="text-right tabular-nums px-3 font-semibold">{stats.actuel}</td>
                        <td className="px-3 text-ink">{pt.responsable?.nom}</td>
                        <td className="px-3 text-muted text-xs">{pt.responsable?.adresse}</td>
                        <td className="px-3 text-muted text-xs">{pt.responsable?.fonction}</td>
                        <td className="px-5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal(pt)} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-sand text-muted hover:text-ink"><Edit2 size={12} /></button>
                            <button onClick={() => setToDelete(pt)} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-rose-50 text-muted hover:text-rose-500"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map(pt => {
                const shop = shops.find(s => s.id === pt.shopId);
                const stats = computeStockPointStats(pt.id);
                return (
                  <Card key={pt.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-ink">{pt.name}</div>
                        {shop && <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: shop.color }} />
                          <span className="text-xs text-muted">{shop.name}</span>
                        </div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setModal(pt)} className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted"><Edit2 size={12} /></button>
                        <button onClick={() => setToDelete(pt)} className="w-8 h-8 grid place-items-center rounded-lg border border-line/70 text-muted"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[['Initial', stats.initial, ''], ['Vendus', stats.vendu, 'text-brick-600'], ['Actuels', stats.actuel, 'font-semibold']].map(([l, v, cls]) => (
                        <div key={l} className="bg-bone rounded-lg py-2">
                          <div className={`text-sm tabular-nums text-ink ${cls}`}>{v}</div>
                          <div className="text-[10px] text-muted mt-0.5">{l}</div>
                        </div>
                      ))}
                    </div>
                    {pt.responsable?.nom && (
                      <div className="mt-3 pt-3 border-t border-line/40 text-xs text-muted space-y-0.5">
                        <div className="font-medium text-ink">{pt.responsable.nom}</div>
                        <div>{pt.responsable.adresse}</div>
                        <div>{pt.responsable.fonction}</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
