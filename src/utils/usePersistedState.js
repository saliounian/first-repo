import { useState, useEffect, useRef } from 'react';

/**
 * Like useState but persists value to localStorage under `key`.
 * Hydrates from storage on first mount; falls back to `initial` if absent or parse fails.
 */
export function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      console.warn(`usePersistedState: failed to read ${key}`, e);
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  // Skip the very first effect run so we don't immediately rewrite the value we just hydrated
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`usePersistedState: failed to write ${key}`, e);
    }
  }, [key, value]);

  return [value, setValue];
}

/** Optional helper to wipe a key (e.g. for "reset" buttons). */
export function clearPersistedState(key) {
  try { localStorage.removeItem(key); } catch {}
}
