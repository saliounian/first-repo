import { useAuth } from '../context/AuthContext.jsx';

/**
 * usePermission()
 *
 * Returns:
 *  - can(module, action)  → boolean
 *  - canAny(checks)       → boolean (checks = [{ module, action }, ...])
 *  - canAll(checks)       → boolean
 *  - isAdmin              → boolean
 *  - user                 → current user object
 */
export function usePermission() {
  const { can, user } = useAuth();

  return {
    can,
    canAny: (checks) => checks.some(c => can(c.module, c.action)),
    canAll: (checks) => checks.every(c => can(c.module, c.action)),
    isAdmin: user?.role === 'admin',
    user,
  };
}
