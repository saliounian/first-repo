import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, Check, ChevronDown } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel.jsx';

export default function PageHeader({
  breadcrumb,
  title,
  searchPlaceholder = 'Rechercher...',
  searchValue,
  onSearchChange,
  filters = null,
  actionLabel,
  onAction,
  rightExtras = null,
  alerts = 3,
}) {
  const [showNotif, setShowNotif] = useState(false);
  return (
    <header className="px-4 md:px-8 pt-6 pb-5 bg-bone sticky top-0 z-10 border-b border-line/70">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="text-[11px] tracking-[0.14em] text-muted uppercase mb-2 font-medium">{breadcrumb}</div>
          )}
          <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {searchPlaceholder && (
            <div className="relative hidden md:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
                readOnly={!onSearchChange}
                className="pl-9 pr-3 py-2 text-[15px] bg-surface border border-line/70 rounded-lg w-64 focus:outline-none focus:border-brick-300"
              />
            </div>
          )}
          {filters}
          {rightExtras}
          <button
            onClick={() => setShowNotif(true)}
            className="relative w-10 h-10 grid place-items-center rounded-lg bg-surface border border-line/70 hover:border-brick-200 transition-colors"
            title="Notifications"
          >
            <Bell size={16} className="text-ink/75" />
            {alerts > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full grid place-items-center">{alerts}</span>
            )}
          </button>
          {actionLabel && (
            <button
              onClick={onAction}
              className="flex items-center gap-1.5 px-4 py-2 bg-brick-500 hover:bg-brick-600 text-white text-[15px] font-medium rounded-lg transition-colors"
            >
              <Plus size={16} strokeWidth={2.4} />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      <NotificationsPanel open={showNotif} onClose={() => setShowNotif(false)} />
    </header>
  );
}

/**
 * HeaderFilter — supports two modes:
 *  - simple button: <HeaderFilter onClick={...}>Label</HeaderFilter>
 *  - dropdown: <HeaderFilter value={v} onChange={fn} options={[{value,label}, ...]} />
 */
export function HeaderFilter({ children, onClick, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (options && Array.isArray(options)) {
    const current = options.find(o => o.value === value);
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-4 py-2 text-[15px] bg-surface border border-line/70 rounded-lg hover:border-brick-200 transition-colors text-ink/80">
          <span>{current?.label || children}</span>
          <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 mt-1.5 w-52 bg-surface border border-line/70 rounded-xl shadow-pop z-30 py-1.5">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-[14px] text-left hover:bg-bone/60 ${value === opt.value ? 'text-brick-600' : 'text-ink/85'}`}>
                <span>{opt.label}</span>
                {value === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-[15px] bg-surface border border-line/70 rounded-lg hover:border-brick-200 transition-colors text-ink/80"
    >
      {children}
    </button>
  );
}
