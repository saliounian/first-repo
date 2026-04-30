import db from './db.js';
import bcrypt from 'bcryptjs';

export function seed() {
  const alreadySeeded = db.prepare('SELECT COUNT(*) as c FROM roles').get().c > 0;
  if (alreadySeeded) return;

  console.log('[seed] Inserting roles, permissions, admin user...');

  // ─── Roles ─────────────────────────────────────────────────────────────
  const roles = [
    { nom: 'admin',      description: 'Accès total à toutes les fonctionnalités' },
    { nom: 'commercial', description: 'Gestion des clients et commandes' },
    { nom: 'stock',      description: 'Gestion de l\'inventaire et des produits' },
    { nom: 'livreur',    description: 'Suivi de ses livraisons uniquement' },
    { nom: 'technicien', description: 'Fiches techniques et bons d\'intervention' },
    { nom: 'comptable',  description: 'Lecture des données financières, aucune modification' },
  ];

  const insertRole = db.prepare('INSERT INTO roles (nom, description) VALUES (?, ?)');
  for (const r of roles) insertRole.run(r.nom, r.description);

  // ─── Permissions ────────────────────────────────────────────────────────
  const permissions = [
    // Commandes
    { module: 'commandes', action: 'creer',    description: 'Créer une commande' },
    { module: 'commandes', action: 'voir',     description: 'Voir les commandes' },
    { module: 'commandes', action: 'modifier_prix', description: 'Modifier le prix d\'une commande' },
    { module: 'commandes', action: 'annuler',  description: 'Annuler une commande' },
    { module: 'commandes', action: 'valider',  description: 'Valider/confirmer une commande' },
    // Produits & Prix
    { module: 'produits',  action: 'voir',     description: 'Voir la liste des produits' },
    { module: 'produits',  action: 'modifier_prix', description: 'Modifier le prix d\'un produit' },
    { module: 'produits',  action: 'ajouter',  description: 'Ajouter un nouveau produit' },
    { module: 'produits',  action: 'supprimer',description: 'Supprimer un produit' },
    // Stock & Inventaire
    { module: 'stock',     action: 'voir',     description: 'Voir le niveau de stock' },
    { module: 'stock',     action: 'modifier', description: 'Modifier le niveau de stock' },
    { module: 'stock',     action: 'inventaire_complet', description: 'Accéder à l\'inventaire complet' },
    { module: 'stock',     action: 'ajustement', description: 'Faire un inventaire/ajustement de stock' },
    // Livraisons
    { module: 'livraisons',action: 'voir_toutes', description: 'Voir toutes les livraisons' },
    { module: 'livraisons',action: 'voir_siennes', description: 'Voir ses propres livraisons' },
    { module: 'livraisons',action: 'modifier_statut', description: 'Modifier le statut d\'une livraison' },
    { module: 'livraisons',action: 'affecter', description: 'Affecter un livreur' },
    // Comptabilité & Finances
    { module: 'finances',  action: 'voir_rapports', description: 'Voir les rapports financiers' },
    { module: 'finances',  action: 'voir_ca',  description: 'Voir le chiffre d\'affaires' },
    { module: 'finances',  action: 'modifier', description: 'Modifier des écritures comptables' },
    { module: 'finances',  action: 'voir_marges', description: 'Voir les marges et bénéfices' },
    // Clients
    { module: 'clients',   action: 'voir',     description: 'Voir la liste des clients' },
    { module: 'clients',   action: 'ajouter',  description: 'Ajouter/modifier un client' },
    { module: 'clients',   action: 'supprimer',description: 'Supprimer un client' },
    { module: 'clients',   action: 'historique', description: 'Voir l\'historique d\'achat d\'un client' },
    // Utilisateurs & Paramètres
    { module: 'admin',     action: 'gerer_utilisateurs', description: 'Gérer les utilisateurs' },
    { module: 'admin',     action: 'gerer_roles', description: 'Gérer les rôles et permissions' },
    { module: 'admin',     action: 'parametres', description: 'Accéder aux paramètres de l\'application' },
    { module: 'admin',     action: 'voir_journal', description: 'Voir le journal d\'activité' },
    // Analytique & Rapports
    { module: 'analytique',action: 'voir',     description: 'Accéder aux rapports analytiques' },
    { module: 'rapports',  action: 'voir',     description: 'Accéder aux rapports' },
    { module: 'rapports',  action: 'exporter', description: 'Exporter des rapports' },
  ];

  const insertPerm = db.prepare('INSERT INTO permissions (module, action, description) VALUES (?, ?, ?)');
  for (const p of permissions) insertPerm.run(p.module, p.action, p.description);

  // ─── Permissions par rôle ───────────────────────────────────────────────
  const getRoleId = db.prepare('SELECT id FROM roles WHERE nom = ?');
  const getPermId = db.prepare('SELECT id FROM permissions WHERE module = ? AND action = ?');
  const insertRP  = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');

  function grant(roleName, module, action) {
    const role = getRoleId.get(roleName);
    const perm = getPermId.get(module, action);
    if (role && perm) insertRP.run(role.id, perm.id);
  }

  // Admin : toutes les permissions
  const allPerms = db.prepare('SELECT id FROM permissions').all();
  const adminId  = getRoleId.get('admin').id;
  const insertAllPerms = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  for (const p of allPerms) insertAllPerms.run(adminId, p.id);

  // Commercial
  ['commandes:creer','commandes:voir','commandes:annuler','commandes:valider',
   'produits:voir','stock:voir','livraisons:voir_toutes','livraisons:affecter',
   'finances:voir_ca','clients:voir','clients:ajouter','clients:historique',
   'analytique:voir','rapports:voir'].forEach(s => {
    const [m, a] = s.split(':');
    grant('commercial', m, a);
  });

  // Gestionnaire de stock
  ['produits:voir','produits:ajouter','stock:voir','stock:modifier',
   'stock:inventaire_complet','stock:ajustement','livraisons:voir_toutes',
   'rapports:voir'].forEach(s => {
    const [m, a] = s.split(':');
    grant('stock', m, a);
  });

  // Livreur
  ['commandes:voir','produits:voir','livraisons:voir_siennes',
   'livraisons:modifier_statut'].forEach(s => {
    const [m, a] = s.split(':');
    grant('livreur', m, a);
  });

  // Technicien
  ['produits:voir','stock:voir'].forEach(s => {
    const [m, a] = s.split(':');
    grant('technicien', m, a);
  });

  // Comptable
  ['commandes:voir','produits:voir','stock:voir','livraisons:voir_toutes',
   'finances:voir_rapports','finances:voir_ca','finances:modifier',
   'clients:voir','clients:historique','analytique:voir','rapports:voir',
   'rapports:exporter'].forEach(s => {
    const [m, a] = s.split(':');
    grant('comptable', m, a);
  });

  // ─── Utilisateur Admin initial ──────────────────────────────────────────
  const hash = bcrypt.hashSync('Admin1234!', 12);
  const adminRoleId = getRoleId.get('admin').id;
  db.prepare(`
    INSERT INTO users (nom, email, password_hash, role_id, statut, must_change_password)
    VALUES (?, ?, ?, ?, 'actif', 0)
  `).run('Aissa Diop', 'admin@gestcopta.sn', hash, adminRoleId);

  // Utilisateurs de démonstration
  const demoUsers = [
    { nom: 'Mamadou Fall',   email: 'commercial@gestcopta.sn', role: 'commercial', pwd: 'Demo1234!' },
    { nom: 'Fatou Ndiaye',   email: 'stock@gestcopta.sn',      role: 'stock',      pwd: 'Demo1234!' },
    { nom: 'Ibrahima Diallo',email: 'livreur@gestcopta.sn',    role: 'livreur',    pwd: 'Demo1234!' },
    { nom: 'Aminata Sarr',   email: 'comptable@gestcopta.sn',  role: 'comptable',  pwd: 'Demo1234!' },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (nom, email, password_hash, role_id, statut, must_change_password)
    VALUES (?, ?, ?, ?, 'actif', 1)
  `);
  for (const u of demoUsers) {
    const h = bcrypt.hashSync(u.pwd, 12);
    const rid = getRoleId.get(u.role).id;
    insertUser.run(u.nom, u.email, h, rid);
  }

  console.log('[seed] Done. Admin: admin@gestcopta.sn / Admin1234!');
}
