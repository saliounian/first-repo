import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [allowedShops,setAllowedShops]= useState([]); // [] = toutes boutiques
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setUser(data.user);
          setPermissions(data.permissions);
          setAllowedShops(data.user.allowedShops || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const can = useCallback((module, action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.includes(`${module}.${action}`);
  }, [user, permissions]);

  // canAccessShop(id) — true si pas de restriction ou boutique autorisée
  const canAccessShop = useCallback((shopId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (allowedShops.length === 0) return true; // pas de restriction = tout
    return allowedShops.includes(shopId);
  }, [user, allowedShops]);

  const login = useCallback(async (email, password) => {
    const res  = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion.');
    setUser(data.user);
    setPermissions(data.permissions);
    setAllowedShops(data.user.allowedShops || []);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setPermissions([]);
    setAllowedShops([]);
  }, []);

  const verifyPassword = useCallback(async (password) => {
    const res = await fetch('/api/auth/verify-password', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.ok;
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const res  = await fetch('/api/auth/change-password', {
      method: 'PUT', credentials: 'include',
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
      user, permissions, allowedShops, loading,
      can, canAccessShop, login, logout, verifyPassword, changePassword, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};
