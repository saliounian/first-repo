import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'gestcopta-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle, setTheme };
}

export default function ThemeToggle({ variant = 'pill' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        title={dark ? 'Mode clair' : 'Mode sombre'}
        className="w-9 h-9 grid place-items-center rounded-full bg-surface border border-line/70 hover:border-brick-300 transition-colors"
      >
        {dark ? <Sun size={15} className="text-brick-500" /> : <Moon size={15} className="text-ink/75" />}
      </button>
    );
  }

  // single pill button
  return (
    <button
      onClick={toggle}
      title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-line/60 bg-sand hover:bg-surface/60 transition-colors text-[11px] font-medium text-muted hover:text-ink"
    >
      {dark
        ? <><Sun size={13} className="text-brick-500" /><span>Mode clair</span></>
        : <><Moon size={13} /><span>Mode sombre</span></>
      }
    </button>
  );
}
