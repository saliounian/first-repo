import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, getUserPermissions, logActivity } from '../middleware/auth.js';

const router = Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const user = db.prepare(`
    SELECT u.*, r.nom as role_nom
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.email = ?
  `).get(email.toLowerCase().trim());

  // Generic error to avoid user enumeration
  if (!user) {
    logActivity({
      action: `Tentative de connexion échouée (email inconnu: ${email})`,
      module: 'auth', resultat: 'echec', raisonEchec: 'Email inconnu'
    });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  if (user.statut !== 'actif') {
    logActivity({
      userId: user.id, userNom: user.nom, userEmail: user.email,
      action: 'Tentative de connexion sur compte désactivé',
      module: 'auth', resultat: 'echec', raisonEchec: 'Compte inactif'
    });
    return res.status(403).json({ error: 'Compte désactivé. Contactez votre administrateur.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    logActivity({
      userId: user.id, userNom: user.nom, userEmail: user.email,
      action: 'Tentative de connexion échouée (mot de passe incorrect)',
      module: 'auth', resultat: 'echec', raisonEchec: 'Mot de passe incorrect'
    });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  // Update last connection
  db.prepare("UPDATE users SET derniere_connexion = datetime('now','localtime') WHERE id = ?")
    .run(user.id);

  // Set session
  req.session.userId = user.id;
  req.session.lastActivity = Date.now();

  logActivity({
    userId: user.id, userNom: user.nom, userEmail: user.email,
    action: 'Connexion réussie',
    module: 'auth', resultat: 'succes'
  });

  const permissions = getUserPermissions(user.id);

  return res.json({
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role_nom,
      statut: user.statut,
      mustChangePassword: user.must_change_password === 1,
      sessionTimeout: user.session_timeout
    },
    permissions
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', requireAuth, (req, res) => {
  const { id, nom, email } = req.user;
  logActivity({
    userId: id, userNom: nom, userEmail: email,
    action: 'Déconnexion', module: 'auth', resultat: 'succes'
  });
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  const permissions = getUserPermissions(u.id);
  res.json({
    user: {
      id: u.id,
      nom: u.nom,
      email: u.email,
      role: u.role_nom,
      statut: u.statut,
      mustChangePassword: u.must_change_password === 1,
      sessionTimeout: u.session_timeout
    },
    permissions
  });
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const u = req.user;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }
  if (!/\d/.test(newPassword)) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins un chiffre.' });
  }

  // If it's a forced change (first login), don't require old password
  if (!u.must_change_password) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel requis.' });
    }
    const valid = await bcrypt.compare(currentPassword, u.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }
  }

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
    .run(hash, u.id);

  logActivity({
    userId: u.id, userNom: u.nom, userEmail: u.email,
    action: 'Modification du mot de passe',
    module: 'auth', resultat: 'succes'
  });

  res.json({ ok: true, mustChangePassword: false });
});

export default router;
