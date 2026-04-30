import { ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function MobileTopBar({ alerts = 3, subtitle = 'LUN. 28 AVRIL · TOUTES BOUTIQUES' }) {
  const { user } = useAuth();
  const letter = user?.nom?.charAt(0)?.toLowerCase() || 'g';
  return (
    <div className="lg:hidden px-4 pt-4 pb-3 bg-bone">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brick-500 text-white grid place-items-center font-bold text-sm">{letter}</div>
          <div className="font-semibold tracking-tight text-ink">gestCopta</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <button className="relative w-9 h-9 grid place-items-center rounded-full bg-surface border border-line/70">
            <Bell size={15} className="text-ink/70" />
            {alerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full grid place-items-center">{alerts}</span>
            )}
          </button>
        </div>
      </div>
      <div className="text-[10px] tracking-[0.18em] text-muted/90 mt-2 flex items-center gap-1">
        {subtitle} <ChevronDown size={11} className="text-muted" />
      </div>
    </div>
  );
}
