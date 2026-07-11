import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db.js';
import { requireAuth, getUserPermissions, getUserShops, logActivity, issueToken } from '../middleware/auth.js';

const router = Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis.' });

  const p_email = email.toLowerCase().trim();

  // Erreur DB/RPC (ex: projet Supabase en pause, réseau) ≠ identifiants invalides.
  // Ne pas masquer une panne derrière un faux « mot de passe incorrect ».
  // Retry léger (1 tentative après 500ms) pour absorber un cold-start Supabase
  // après reprise du projet. Ne s'applique QU'AU cas erreur, jamais au cas !user.
  let data, error;
  for (let attempt = 0; attempt < 2; attempt++) {
    ({ data, error } = await supabase.rpc('get_user_by_email', { p_email }));
    if (!error) break;
    console.error(`[login] RPC get_user_by_email (tentative ${attempt + 1}):`, error);
    if (attempt === 0) await new Promise(r => setTimeout(r, 500));
  }
  if (error) {
    return res.status(503).json({ error: 'Service temporairement indisponible, réessayez dans quelques instants.' });
  }

  const user = data?.[0];
  if (!user) {
    await logActivity({ action: `Tentative connexion échouée (email inconnu: ${email})`, module: 'auth', resultat: 'echec', raisonEchec: 'Email inconnu' });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  if (user.statut !== 'actif') {
    await logActivity({ userId: user.id, userNom: user.nom, userEmail: user.email, action: 'Tentative connexion compte désactivé', module: 'auth', resultat: 'echec', raisonEchec: 'Compte inactif' });
    return res.status(403).json({ error: 'Compte désactivé. Contactez votre administrateur.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await logActivity({ userId: user.id, userNom: user.nom, userEmail: user.email, action: 'Tentative connexion (mot de passe incorrect)', module: 'auth', resultat: 'echec', raisonEchec: 'Mot de passe incorrect' });
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  await supabase.from('users').update({ derniere_connexion: new Date().toISOString() }).eq('id', user.id);

  issueToken(user, res);

  await logActivity({ userId: user.id, userNom: user.nom, userEmail: user.email, action: 'Connexion réussie', module: 'auth', resultat: 'succes' });

  const [permissions, allowedShops] = await Promise.all([
    getUserPermissions(user.id),
    getUserShops(user.id),
  ]);

  return res.json({
    user: {
      id: user.id, nom: user.nom, email: user.email,
      role: user.role_nom, statut: user.statut,
      mustChangePassword: user.must_change_password === true,
      sessionTimeout: user.session_timeout,
      // [] = toutes boutiques (pas de restriction), sinon liste des IDs autorisés
      allowedShops,
    },
    permissions
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  const { id, nom, email } = req.user;
  await logActivity({ userId: id, userNom: nom, userEmail: email, action: 'Déconnexion', module: 'auth', resultat: 'succes' });
  res.clearCookie('token');
  res.json({ ok: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const u = req.user;
  const [permissions, allowedShops] = await Promise.all([
    getUserPermissions(u.id),
    getUserShops(u.id),
  ]);
  res.json({
    user: {
      id: u.id, nom: u.nom, email: u.email,
      role: u.role_nom, statut: u.statut,
      mustChangePassword: u.must_change_password === true,
      sessionTimeout: u.session_timeout,
      allowedShops,
    },
    permissions
  });
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const u = req.user;

  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  if (!/\d/.test(newPassword))
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins un chiffre.' });

  if (!u.must_change_password) {
    if (!currentPassword)
      return res.status(400).json({ error: 'Mot de passe actuel requis.' });
    const valid = await bcrypt.compare(currentPassword, u.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await supabase.from('users').update({ password_hash: hash, must_change_password: false }).eq('id', u.id);

  await logActivity({ userId: u.id, userNom: u.nom, userEmail: u.email, action: 'Modification du mot de passe', module: 'auth', resultat: 'succes' });

  res.json({ ok: true, mustChangePassword: false });
});

export default router;
