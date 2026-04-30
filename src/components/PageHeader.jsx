import { Search, Plus } from 'lucide-react';

export default function PageHeader({
  breadcrumb,
  title,
  searchPlaceholder = 'Rechercher...',
  filters = null,
  actionLabel,
  onAction,
  rightExtras = null
}) {
  return (
    <header className="px-4 md:px-8 pt-5 pb-4 bg-bone sticky top-0 z-10 border-b border-line/70">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="text-[10px] tracking-[0.14em] text-muted uppercase mb-1.5">{breadcrumb}</div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-ink leading-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {searchPlaceholder && (
            <div className="relative hidden md:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-8 pr-3 py-1.5 text-sm bg-surface border border-line/70 rounded-lg w-56 focus:outline-none focus:border-brick-300"
              />
            </div>
          )}
          {filters}
          {rightExtras}
          {actionLabel && (
            <button
              onClick={onAction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brick-500 hover:bg-brick-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={14} strokeWidth={2.4} />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function HeaderFilter({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm bg-surface border border-line/70 rounded-lg hover:border-brick-200 transition-colors text-ink/80"
    >
      {children}
    </button>
  );
}
