import { useState, useMemo } from 'react';
import { X, ShoppingCart, AlertTriangle, FileText, ArrowRightLeft, Clock, Check, PackagePlus } from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import { fmtFcfa } from '../utils/format.js';

const KIND_META = {
  order:    { Icon: ShoppingCart,   tone: 'bg-brick-50 text-brick-600' },
  pending:  { Icon: Clock,          tone: 'bg-amber-50 text-amber-700' },
  alert:    { Icon: AlertTriangle,  tone: 'bg-rose-50 text-rose-600' },
  invoice:  { Icon: FileText,       tone: 'bg-blue-50 text-blue-700' },
  transfer: { Icon: ArrowRightLeft, tone: 'bg-brick-50 text-brick-600' },
  restock:  { Icon: PackagePlus,    tone: 'bg-emerald-50 text-emerald-700' },
};

// Temps relatif simple
function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

// Seuil "stock bas" (sans threshold configuré, on utilise ≤ 5)
const LOW_THRESHOLD = 5;

export default function NotificationsPanel({ open, onClose }) {
  const {
    products, shops, stockPoints, stockByPoint,
    orders, transfers, invoices,
  } = useStore();

  // IDs supprimés ou lus (session uniquement)
  const [dismissed, setDismissed] = useState(new Set());
  const [readIds,   setReadIds]   = useState(new Set());

  // ── Calcul notifications depuis données réelles ────────────────────────────
  const notifications = useMemo(() => {
    const items = [];

    // 1. Alertes stock — rupture (=0) et bas (≤ seuil) par produit × boutique
    products.forEach(p => {
      const row = stockByPoint[p.id] || {};
      shops.forEach(sh => {
        const pts = stockPoints.filter(sp => sp.shopId === sh.id).map(sp => sp.id);
        // N'alerter que si ce produit a déjà été stocké dans cette boutique
        const hasEntries = pts.some(spId => spId in row);
        if (!hasEntries) return;
        const qty = pts.reduce((s, spId) => s + (row[spId] || 0), 0);
        if (qty === 0) {
          items.push({
            id:     `rupture-${p.id}-${sh.id}`,
            kind:   'alert',
            title:  'Stock rupture',
            detail: `${p.name} · ${sh.name}`,
            time:   '',
            ts:     Date.now() + 2, // priorité haute
          });
        } else if (qty <= LOW_THRESHOLD) {
          items.push({
            id:     `bas-${p.id}-${sh.id}`,
            kind:   'alert',
            title:  'Stock bas',
            detail: `${p.name} · ${sh.name} (${qty} u. restantes)`,
            time:   '',
            ts:     Date.now() + 1,
          });
        }
      });
    });

    // 2. Commandes récentes (10 dernières, triées par createdAt)
    [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10)
      .forEach(o => {
        const kindMap  = { attente: 'pending', livrée: 'order', préparée: 'order', annulée: 'order' };
        const labelMap = {
          attente:   'Commande en attente',
          livrée:    'Commande livrée',
          préparée:  'Commande préparée',
          annulée:   'Commande annulée',
        };
        const totalStr = o.total ? ` · ${fmtFcfa(o.total)}` : '';
        items.push({
          id:     `order-${o.id}`,
          kind:   kindMap[o.status] || 'order',
          title:  labelMap[o.status] || 'Commande',
          detail: `${o.client || '—'} · ${o.id}${totalStr}`,
          time:   relTime(o.createdAt),
          ts:     new Date(o.createdAt || 0).getTime(),
        });
      });

    // 3. Transferts / réappros récents (8 derniers — déjà triés newest-first)
    transfers.slice(0, 8).forEach(t => {
      const isRestock = !t.fromShopId;
      items.push({
        id:     `tr-${t.id}`,
        kind:   isRestock ? 'restock' : 'transfer',
        title:  isRestock ? 'Réapprovisionnement' : 'Transfert de stock',
        detail: `${t.product} · ${t.qty} u. → ${t.toShop}`,
        time:   t.date || '',
        ts:     0,
      });
    });

    // 4. Factures récentes (5 dernières)
    [...invoices]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .forEach(inv => {
        const totalStr = inv.total ? ` · ${fmtFcfa(inv.total)}` : '';
        items.push({
          id:     `inv-${inv.id}`,
          kind:   'invoice',
          title:  inv.status === 'payée' ? 'Facture payée' : 'Facture en attente',
          detail: `${inv.client || '—'} · ${inv.id}${totalStr}`,
          time:   relTime(inv.createdAt),
          ts:     new Date(inv.createdAt || 0).getTime(),
        });
      });

    // Filtrer supprimées, trier alertes en premier puis par date desc
    return items
      .filter(it => !dismissed.has(it.id))
      .sort((a, b) => {
        // Alertes toujours en premier
        const aIsAlert = a.kind === 'alert';
        const bIsAlert = b.kind === 'alert';
        if (aIsAlert !== bIsAlert) return aIsAlert ? -1 : 1;
        return b.ts - a.ts;
      });
  }, [products, shops, stockPoints, stockByPoint, orders, transfers, invoices, dismissed]);

  const unread = notifications.filter(it => !readIds.has(it.id)).length;

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAll  = () => setReadIds(new Set(notifications.map(it => it.id)));
  const dismiss  = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    markRead(id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        onClick={e => e.stopPropagation()}
        className="relative bg-surface w-full sm:max-w-md h-full flex flex-col shadow-xl slide-in"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-line/70 flex items-center justify-between">
          <div>
            <div className="font-semibold text-ink text-lg">Notifications</div>
            <div className="text-xs text-muted mt-0.5">
              {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={markAll}
                className="text-[12px] text-brick-500 hover:text-brick-600 font-medium px-2 py-1 rounded-lg hover:bg-brick-50">
                Tout marquer lu
              </button>
            )}
            <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-sand text-muted">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm px-6">
              <Check size={32} className="mx-auto mb-3 text-brick-500" />
              Aucune notification.
            </div>
          ) : (
            <ul className="divide-y divide-line/50">
              {notifications.map(it => {
                const meta = KIND_META[it.kind] || KIND_META.order;
                const { Icon, tone } = meta;
                const isRead = readIds.has(it.id);
                return (
                  <li key={it.id}
                    className={`px-5 py-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      isRead ? 'bg-surface' : 'bg-brick-50/30'
                    } hover:bg-bone/60`}
                    onClick={() => markRead(it.id)}
                  >
                    <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tone}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-ink text-[15px] truncate">{it.title}</div>
                        {it.time && (
                          <span className="text-[11px] text-muted shrink-0 mt-0.5">{it.time}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted mt-0.5 truncate">{it.detail}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); dismiss(it.id); }}
                      className="w-7 h-7 grid place-items-center rounded-lg hover:bg-rose-50 text-muted hover:text-rose-500 shrink-0 self-center">
                      <X size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
