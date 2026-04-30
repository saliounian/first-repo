import db from '../db.js';

// ─── canDo ────────────────────────────────────────────────────────────────────
// Checks if a user has permission for module.action.
// User-specific overrides (user_permissions) take precedence over role defaults.
export function canDo(userId, module, action) {
  // 1. Explicit user-level override
  const custom = db.prepare(`
    SELECT up.granted
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = ? AND p.module = ? AND p.action = ?
  `).get(userId, module, action);

  if (custom !== undefined) return custom.granted === 1;

  // 2. Role-level permission
  const rolePerm = db.prepare(`
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON rp.role_id = u.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = ? AND p.module = ? AND p.action = ?
  `).get(userId, module, action);

  return rolePerm !== undefined;
}

// ─── getUserPermissions ────────────────────────────────────────────────────────
// Returns all granted permissions for a user as an array of "module.action" strings.
export function getUserPermissions(userId) {
  // Get role permissions for the user
  const rolePerms = db.prepare(`
    SELECT p.module, p.action
    FROM users u
    JOIN role_permissions rp ON rp.role_id = u.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = ?
  `).all(userId);

  // Get user-specific overrides
  const userPerms = db.prepare(`
    SELECT p.module, p.action, up.granted
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = ?
  `).all(userId);

  // Build set from role permissions
  const granted = new Set(rolePerms.map(p => `${p.module}.${p.action}`));

  // Apply user overrides
  for (const p of userPerms) {
    const key = `${p.module}.${p.action}`;
    if (p.granted === 1) granted.add(key);
    else granted.delete(key);
  }

  return [...granted];
}

// ─── logActivity ──────────────────────────────────────────────────────────────
export function logActivity({ userId, userNom, userEmail, action, module,
  ancienneValeur, nouvelleValeur, resultat = 'succes', raisonEchec }) {
  try {
    db.prepare(`
      INSERT INTO activity_logs
        (user_id, user_nom, user_email, action, module,
         ancienne_valeur, nouvelle_valeur, resultat, raison_echec)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      userNom || null,
      userEmail || null,
      action,
      module,
      ancienneValeur ? String(ancienneValeur) : null,
      nouvelleValeur ? String(nouvelleValeur) : null,
      resultat,
      raisonEchec || null
    );
  } catch (e) {
    console.error('[logActivity] Failed to write log:', e.message);
  }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
  }

  const user = db.prepare(`
    SELECT u.*, r.nom as role_nom
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
  `).get(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }

  if (user.statut !== 'actif') {
    req.session.destroy(() => {});
    return res.status(403).json({ error: 'Compte désactivé. Contactez votre administrateur.' });
  }

  // Inactivity timeout check (per-user setting, in minutes)
  const timeoutMs = (user.session_timeout || 30) * 60 * 1000;
  const lastActivity = req.session.lastActivity || Date.now();
  if (Date.now() - lastActivity > timeoutMs) {
    logActivity({
      userId: user.id, userNom: user.nom, userEmail: user.email,
      action: 'Déconnexion automatique (inactivité)',
      module: 'auth', resultat: 'succes'
    });
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }

  req.session.lastActivity = Date.now();
  req.user = user;
  next();
}

// ─── requirePermission ────────────────────────────────────────────────────────
export function requirePermission(module, action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });

    if (!canDo(req.user.id, module, action)) {
      logActivity({
        userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
        action: `Accès refusé : ${module}.${action}`,
        module,
        resultat: 'echec',
        raisonEchec: `Permission manquante : ${module}.${action}`
      });
      return res.status(403).json({
        error: `Accès refusé. Vous n'avez pas la permission : ${module}.${action}`
      });
    }

    next();
  };
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });
  if (req.user.role_nom !== 'admin') {
    logActivity({
      userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
      action: 'Accès refusé : zone admin',
      module: 'admin', resultat: 'echec',
      raisonEchec: 'Rôle admin requis'
    });
    return res.status(403).json({ error: 'Réservé aux administrateurs.' });
  }
  next();
}
