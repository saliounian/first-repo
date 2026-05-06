import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * Dropdown action menu rendered via portal (escapes overflow:hidden/scroll containers).
 * actions: [{ label, icon?: LucideIcon, onClick, danger?: bool, disabled?: bool } | 'divider']
 */
export default function ActionMenu({ actions, iconSize = 14 }) {
  const [pos, setPos] = useState(null); // { top|bottom, right, above }
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  // Close on outside click (bubble phase + target check) / scroll / resize
  useEffect(() => {
    if (!pos) return;
    function onMouseDown(e) {
      // Ignore clicks inside menu or trigger button
      if (menuRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setPos(null);
    }
    function onScroll(e) {
      // Ignore scroll inside the menu itself
      if (menuRef.current?.contains(e.target)) return;
      setPos(null);
    }
    const close = () => setPos(null);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('scroll',    onScroll, true);
    window.addEventListener('resize',      close);
    window.addEventListener('keydown',     (e) => { if (e.key === 'Escape') close(); });
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('scroll',    onScroll, true);
      window.removeEventListener('resize',      close);
    };
  }, [pos]);

  function toggle(e) {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const above = rect.bottom > window.innerHeight - 200;
    setPos({
      right: window.innerWidth - rect.right,
      top:   above ? window.innerHeight - rect.top + 4 : rect.bottom + 4,
      above,
    });
  }

  const menu = pos && createPortal(
    <div
      ref={menuRef}
      style={{
        position:  'fixed',
        right:     pos.right,
        ...(pos.above ? { bottom: pos.top } : { top: pos.top }),
        zIndex:    9999,
        minWidth:  '170px',
      }}
      className="bg-surface border border-line/70 rounded-xl shadow-2xl py-1 overflow-hidden"
    >
      {actions.filter(Boolean).map((a, i) =>
        a === 'divider' ? (
          <div key={i} className="my-1 border-t border-line/50"/>
        ) : (
          <button
            key={a.label}
            type="button"
            disabled={a.disabled}
            onClick={(e) => {
              e.stopPropagation();
              a.onClick();
              setPos(null);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left
              disabled:opacity-40 disabled:cursor-not-allowed
              ${a.danger
                ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                : 'text-ink hover:bg-bone'
              }`}
          >
            {a.icon && <a.icon size={14} className={a.danger ? 'text-rose-500' : 'text-muted'}/>}
            <span>{a.label}</span>
          </button>
        )
      )}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`w-8 h-8 grid place-items-center rounded-lg hover:bg-sand active:bg-sand text-muted hover:text-ink transition-colors ${pos ? 'bg-sand text-ink' : ''}`}
        aria-label="Actions"
      >
        <MoreVertical size={iconSize}/>
      </button>
      {menu}
    </>
  );
}
