import { useState } from 'react';
import { X, ShoppingCart, AlertTriangle, FileText, ArrowRightLeft, Clock, Check } from 'lucide-react';
import { recentActivity, stockAlerts } from '../data/mockData.js';

const KIND_META = {
  order:    { Icon: ShoppingCart,   tone: 'bg-brick-50 text-brick-600' },
  pending:  { Icon: Clock,          tone: 'bg-amber-50 text-amber-700' },
  alert:    { Icon: AlertTriangle,  tone: 'bg-rose-50 text-rose-600' },
  invoice:  { Icon: FileText,       tone: 'bg-blue-50 text-blue-700' },
  transfer: { Icon: ArrowRightLeft, tone: 'bg-brick-50 text-brick-600' },
};

export default function NotificationsPanel({ open, onClose }) {
  // Build a notifications list from recent activity + stock alerts
  const initialItems = [
    ...stockAlerts.map((a, i) => ({
      id: `alert-${i}`,
      kind: 'alert',
      title: `Stock ${a.level}`,
      detail: `${a.product} · ${a.shop}`,
      time: 'récent',
      read: false,
    })),
    ...recentActivity.map((a, i) => ({
      id: `act-${i}`,
      kind: a.kind,
      title: a.label,
      detail: `${a.detail} · ${a.delta}`,
      time: a.time,
      read: false,
    })),
  ];

  const [items, setItems] = useState(initialItems);
  const unread = items.filter(i => !i.read).length;

  const markRead = (id) => setItems(items.map(i => i.id === id ? { ...i, read: true } : i));
  const markAll  = () => setItems(items.map(i => ({ ...i, read: true })));
  const dismiss  = (id) => setItems(items.filter(i => i.id !== id));

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
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm px-6">
              <Check size={32} className="mx-auto mb-3 text-brick-500" />
              Aucune notification.
            </div>
          ) : (
            <ul className="divide-y divide-line/50">
              {items.map(it => {
                const meta = KIND_META[it.kind] || KIND_META.order;
                const { Icon, tone } = meta;
                return (
                  <li key={it.id}
                    className={`px-5 py-4 flex items-start gap-3 transition-colors ${
                      it.read ? 'bg-surface' : 'bg-brick-50/30'
                    } hover:bg-bone/60`}
                    onClick={() => markRead(it.id)}
                  >
                    <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tone}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-ink text-[15px] truncate">{it.title}</div>
                        <span className="text-[11px] text-muted shrink-0 mt-0.5">{it.time}</span>
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
