import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireAdmin, logActivity, getUserPermissions } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.nom, u.email, u.statut, u.must_change_password,
           u.derniere_connexion, u.session_timeout, u.created_at,
           r.nom as role_nom, r.id as role_id
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY u.created_at DESC
  `).all();

  res.json(users);
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.nom, u.email, u.statut, u.must_change_password,
           u.derniere_connexion, u.session_timeout, u.created_at,
           r.nom as role_nom, r.id as role_id
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  // Get custom permissions for this user
  const customPerms = db.prepare(`
    SELECT p.id, p.module, p.action, p.description, up.granted
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = ?
  `).all(req.params.id);

  res.json({ ...user, customPerms });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nom, email, password, roleId, statut = 'actif',
          sessionTimeout = 30, customPerms = [] } = req.body;

  if (!nom || !email || !password || !roleId) {
    return res.status(400).json({ error: 'Nom, email, mot de passe et rôle sont requis.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(`
    INSERT INTO users (nom, email, password_hash, role_id, statut, session_timeout, must_change_password)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(nom.trim(), email.toLowerCase().trim(), hash, roleId, statut, sessionTimeout);

  const newUserId = result.lastInsertRowid;

  // Apply custom permissions
  if (customPerms.length > 0) {
    const insertPerm = db.prepare(`
      INSERT INTO user_permissions (user_id, permission_id, granted)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, permission_id) DO UPDATE SET granted = excluded.granted
    `);
    for (const cp of customPerms) {
      insertPerm.run(newUserId, cp.permissionId, cp.granted ? 1 : 0);
    }
  }

  logActivity({
    userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
    action: `Création de l'utilisateur "${nom}" (${email})`,
    module: 'admin',
    nouvelleValeur: JSON.stringify({ nom, email, role: roleId, statut }),
    resultat: 'succes'
  });

  res.status(201).json({ id: newUserId, nom, email, statut });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nom, email, roleId, statut, sessionTimeout, customPerms, newPassword } = req.body;
  const userId = parseInt(req.params.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  const updates = [];
  const values = [];
  const changes = [];

  if (nom && nom !== user.nom) {
    updates.push('nom = ?'); values.push(nom);
    changes.push(`nom: "${user.nom}" → "${nom}"`);
  }
  if (email && email.toLowerCase() !== user.email) {
    const exists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), userId);
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé.' });
    updates.push('email = ?'); values.push(email.toLowerCase());
    changes.push(`email: "${user.email}" → "${email.toLowerCase()}"`);
  }
  if (roleId && roleId !== user.role_id) {
    const oldRole = db.prepare('SELECT nom FROM roles WHERE id = ?').get(user.role_id);
    const newRole = db.prepare('SELECT nom FROM roles WHERE id = ?').get(roleId);
    updates.push('role_id = ?'); values.push(roleId);
    changes.push(`rôle: "${oldRole?.nom}" → "${newRole?.nom}"`);
  }
  if (statut && statut !== user.statut) {
    updates.push('statut = ?'); values.push(statut);
    changes.push(`statut: "${user.statut}" → "${statut}"`);
  }
  if (sessionTimeout && sessionTimeout !== user.session_timeout) {
    updates.push('session_timeout = ?'); values.push(sessionTimeout);
  }
  if (newPassword) {
    if (newPassword.length < 8) return res.status(400).json({ error: 'Mot de passe trop court.' });
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push('password_hash = ?'); values.push(hash);
    updates.push('must_change_password = ?'); values.push(1);
    changes.push('mot de passe réinitialisé');
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values, userId);
  }

  // Sync custom permissions
  if (Array.isArray(customPerms)) {
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
    const insertPerm = db.prepare(`
      INSERT INTO user_permissions (user_id, permission_id, granted) VALUES (?, ?, ?)
    `);
    for (const cp of customPerms) {
      insertPerm.run(userId, cp.permissionId, cp.granted ? 1 : 0);
    }
  }

  if (changes.length > 0) {
    logActivity({
      userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
      action: `Modification de l'utilisateur "${user.nom}"`,
      module: 'admin',
      ancienneValeur: changes.map(c => c.split(' → ')[0].split(': ')[1]).join(', '),
      nouvelleValeur: changes.join(', '),
      resultat: 'succes'
    });
  }

  res.json({ ok: true });
});

// ─── PATCH /api/users/:id/toggle ─────────────────────────────────────────────
router.patch('/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  // Prevent deactivating yourself
  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
  }

  const newStatut = user.statut === 'actif' ? 'inactif' : 'actif';
  db.prepare('UPDATE users SET statut = ? WHERE id = ?').run(newStatut, user.id);

  logActivity({
    userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
    action: `${newStatut === 'inactif' ? 'Désactivation' : 'Activation'} du compte "${user.nom}"`,
    module: 'admin',
    ancienneValeur: user.statut,
    nouvelleValeur: newStatut,
    resultat: 'succes'
  });

  res.json({ ok: true, statut: newStatut });
});

export default router;
