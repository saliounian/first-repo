import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [permissions, setPermissions] = useState([]);   // ["module.action", ...]
  const [loading, setLoading]         = useState(true);

  // Fetch session on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setUser(data.user);
          setPermissions(data.permissions);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── can(module, action) ────────────────────────────────────────────────
  const can = useCallback((module, action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;   // Admin voit tout
    return permissions.includes(`${module}.${action}`);
  }, [user, permissions]);

  // ─── login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion.');
    setUser(data.user);
    setPermissions(data.permissions);
    return data;
  }, []);

  // ─── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setPermissions([]);
  }, []);

  // ─── verifyPassword ─────────────────────────────────────────────────────
  // Confirms the current user's identity before sensitive actions.
  const verifyPassword = useCallback(async (password) => {
    const res = await fetch('/api/auth/verify-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.ok;
  }, []);

  // ─── changePassword ─────────────────────────────────────────────────────
  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de mot de passe.');
    setUser(u => ({ ...u, mustChangePassword: false }));
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, permissions, loading,
      can, login, logout, verifyPassword, changePassword, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
