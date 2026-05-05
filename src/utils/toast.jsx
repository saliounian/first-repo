import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastCtx = createContext(() => {});
let _toast = () => {};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((msg, opts = {}) => {
    const id = Date.now() + Math.random();
    const tone = opts.tone || 'success';
    const duration = opts.duration ?? 2800;
    setItems(prev => [...prev, { id, msg, tone }]);
    if (duration > 0) {
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  _toast = push;

  const dismiss = (id) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map(t => {
          const Icon = t.tone === 'error' ? AlertTriangle : t.tone === 'info' ? Info : CheckCircle;
          const tones = {
            success: 'border-brick-100 text-brick-600 bg-surface',
            error:   'border-rose-200 text-rose-700 bg-surface',
            info:    'border-line/70 text-ink bg-surface',
            warning: 'border-amber-200 text-amber-700 bg-surface',
          };
          return (
            <div key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-pop text-[14px] border ${tones[t.tone] || tones.success} slide-in`}>
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1">{t.msg}</span>
              <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/** Imperative API — usable outside React components */
export const toast = (msg, opts) => _toast(msg, opts);
toast.success = (m, o) => _toast(m, { ...o, tone: 'success' });
toast.error   = (m, o) => _toast(m, { ...o, tone: 'error' });
toast.info    = (m, o) => _toast(m, { ...o, tone: 'info' });
toast.warning = (m, o) => _toast(m, { ...o, tone: 'warning' });
