import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db.js';
import { requireAuth, requireAdmin, logActivity } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, email, statut, must_change_password, derniere_connexion, session_timeout, created_at, roles(id, nom)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(u => ({ ...u, role_nom: u.roles?.nom, role_id: u.roles?.id })));
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, nom, email, statut, must_change_password, derniere_connexion, session_timeout, created_at, roles(id, nom)')
    .eq('id', req.params.id)
    .limit(1);

  if (error || !users?.length) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  const user = { ...users[0], role_nom: users[0].roles?.nom, role_id: users[0].roles?.id };

  const { data: customPerms } = await supabase
    .from('user_permissions')
    .select('granted, permissions(id, module, action, description)')
    .eq('user_id', req.params.id);

  res.json({ ...user, customPerms: (customPerms || []).map(cp => ({ ...cp.permissions, granted: cp.granted })) });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nom, email, password, roleId, statut = 'actif', sessionTimeout = 30, customPerms = [] } = req.body;
  if (!nom || !email || !password || !roleId)
    return res.status(400).json({ error: 'Nom, email, mot de passe et rôle requis.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Mot de passe minimum 8 caractères.' });

  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).limit(1);
  if (existing?.length) return res.status(409).json({ error: 'Email déjà utilisé.' });

  const hash = await bcrypt.hash(password, 12);
  const { data: newUser, error } = await supabase.from('users').insert({
    nom: nom.trim(), email: email.toLowerCase().trim(),
    password_hash: hash, role_id: roleId, statut,
    session_timeout: sessionTimeout, must_change_password: true
  }).select('id').single();

  if (error) return res.status(500).json({ error: error.message });

  if (customPerms.length > 0) {
    await supabase.from('user_permissions').upsert(
      customPerms.map(cp => ({ user_id: newUser.id, permission_id: cp.permissionId, granted: !!cp.granted }))
    );
  }

  await logActivity({
    userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
    action: `Création utilisateur "${nom}" (${email})`, module: 'admin',
    nouvelleValeur: JSON.stringify({ nom, email, statut }), resultat: 'succes'
  });

  res.status(201).json({ id: newUser.id, nom, email, statut });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nom, email, roleId, statut, sessionTimeout, customPerms, newPassword } = req.body;
  const userId = parseInt(req.params.id);

  const { data: users } = await supabase.from('users').select('*').eq('id', userId).limit(1);
  const user = users?.[0];
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  const updates = {};
  const changes = [];

  if (nom && nom !== user.nom)             { updates.nom = nom; changes.push(`nom → "${nom}"`); }
  if (email && email.toLowerCase() !== user.email) {
    const { data: ex } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).neq('id', userId).limit(1);
    if (ex?.length) return res.status(409).json({ error: 'Email déjà utilisé.' });
    updates.email = email.toLowerCase();
    changes.push(`email → "${email.toLowerCase()}"`);
  }
  if (roleId && roleId !== user.role_id)   { updates.role_id = roleId; changes.push(`rôle modifié`); }
  if (statut && statut !== user.statut)    { updates.statut = statut; changes.push(`statut → "${statut}"`); }
  if (sessionTimeout)                      { updates.session_timeout = sessionTimeout; }
  if (newPassword) {
    if (newPassword.length < 8) return res.status(400).json({ error: 'Mot de passe trop court.' });
    updates.password_hash = await bcrypt.hash(newPassword, 12);
    updates.must_change_password = true;
    changes.push('mot de passe réinitialisé');
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('users').update(updates).eq('id', userId);
  }

  if (Array.isArray(customPerms)) {
    await supabase.from('user_permissions').delete().eq('user_id', userId);
    if (customPerms.length > 0) {
      await supabase.from('user_permissions').insert(
        customPerms.map(cp => ({ user_id: userId, permission_id: cp.permissionId, granted: !!cp.granted }))
      );
    }
  }

  if (changes.length > 0) {
    await logActivity({
      userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
      action: `Modification utilisateur "${user.nom}"`, module: 'admin',
      nouvelleValeur: changes.join(', '), resultat: 'succes'
    });
  }

  res.json({ ok: true });
});

// ─── PATCH /api/users/:id/toggle ─────────────────────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  const { data: users } = await supabase.from('users').select('*').eq('id', req.params.id).limit(1);
  const user = users?.[0];
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Impossible de désactiver votre propre compte.' });

  const newStatut = user.statut === 'actif' ? 'inactif' : 'actif';
  await supabase.from('users').update({ statut: newStatut }).eq('id', user.id);

  await logActivity({
    userId: req.user.id, userNom: req.user.nom, userEmail: req.user.email,
    action: `${newStatut === 'inactif' ? 'Désactivation' : 'Activation'} compte "${user.nom}"`,
    module: 'admin', ancienneValeur: user.statut, nouvelleValeur: newStatut, resultat: 'succes'
  });

  res.json({ ok: true, statut: newStatut });
});

export default router;
