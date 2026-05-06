import jwt from 'jsonwebtoken';
import supabase from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gestcopta-dev-secret-change-in-prod';

// ─── getUserPermissions ────────────────────────────────────────────────────────
export async function getUserPermissions(userId) {
  const { data, error } = await supabase.rpc('get_user_permissions', { p_user_id: userId });
  if (error) { console.error('[getUserPermissions]', error); return []; }
  return (data || []).map(p => `${p.module}.${p.action}`);
}

// ─── getUserShops ─────────────────────────────────────────────────────────────
// Returns array of shop_ids the user can access.
// Empty array [] = ALL shops (admin / no restriction set).
export async function getUserShops(userId) {
  const { data, error } = await supabase.rpc('get_user_shops', { p_user_id: userId });
  if (error) { console.error('[getUserShops]', error); return []; }
  return (data || []).map(r => r.shop_id);
}

// ─── setUserShops ─────────────────────────────────────────────────────────────
// Replace shop assignments for a user. Pass [] for "all shops".
export async function setUserShops(userId, shopIds) {
  await supabase.from('user_shops').delete().eq('user_id', userId);
  if (shopIds.length > 0) {
    await supabase.from('user_shops').insert(shopIds.map(sid => ({ user_id: userId, shop_id: sid })));
  }
}

// ─── logActivity ──────────────────────────────────────────────────────────────
export async function logActivity({ userId, userNom, userEmail, action, module,
  ancienneValeur, nouvelleValeur, resultat = 'succes', raisonEchec }) {
  try {
    await supabase.from('activity_logs').insert({
      user_id:         userId || null,
      user_nom:        userNom || null,
      user_email:      userEmail || null,
      action,
      module,
      ancienne_valeur: ancienneValeur ? String(ancienneValeur) : null,
      nouvelle_valeur: nouvelleValeur ? String(nouvelleValeur) : null,
      resultat,
      raison_echec:    raisonEchec || null,
    });
  } catch (e) {
    console.error('[logActivity]', e.message);
  }
}

// ─── issueToken ───────────────────────────────────────────────────────────────
export function issueToken(user, res) {
  const payload = { sub: user.id, role: user.role_nom };
  const expiresIn = `${user.session_timeout || 30}m`;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: (user.session_timeout || 30) * 60 * 1000,
  });
  return token;
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }

  const { data, error } = await supabase.rpc('get_user_by_id', { p_id: payload.sub });
  const user = data?.[0];

  if (error || !user) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }
  if (user.statut !== 'actif') {
    res.clearCookie('token');
    return res.status(403).json({ error: 'Compte désactivé. Contactez votre administrateur.' });
  }

  // Refresh token on activity
  issueToken(user, res);
  req.user = user;
  next();
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });
  if (req.user.role_nom !== 'admin') {
    logActivity({
      userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
      action: 'Accès refusé : zone admin', module: 'admin',
      resultat: 'echec', raisonEchec: 'Rôle admin requis'
    });
    return res.status(403).json({ error: 'Réservé aux administrateurs.' });
  }
  next();
}

// ─── requirePermission ────────────────────────────────────────────────────────
export function requirePermission(module, action) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });
    const perms = await getUserPermissions(req.user.id);
    if (!perms.includes(`${module}.${action}`)) {
      logActivity({
        userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
        action: `Accès refusé : ${module}.${action}`, module,
        resultat: 'echec', raisonEchec: `Permission manquante : ${module}.${action}`
      });
      return res.status(403).json({ error: `Accès refusé. Permission requise : ${module}.${action}` });
    }
    next();
  };
}
