# ROLES.md — gestCopta · Matrice des permissions

> Généré automatiquement. Dernière mise à jour : Avril 2026.

---

## Comptes de démonstration

| Utilisateur        | Email                        | Mot de passe | Rôle              |
|--------------------|------------------------------|--------------|-------------------|
| Aissa Diop         | admin@gestcopta.sn           | Admin1234!   | Admin             |
| Mamadou Fall       | commercial@gestcopta.sn      | Demo1234!    | Commercial        |
| Fatou Ndiaye       | stock@gestcopta.sn           | Demo1234!    | Gestionnaire stock|
| Ibrahima Diallo    | livreur@gestcopta.sn         | Demo1234!    | Livreur           |
| Aminata Sarr       | comptable@gestcopta.sn       | Demo1234!    | Comptable         |

> Les utilisateurs demo ont `must_change_password = 1` — ils devront changer leur mot de passe à la première connexion.

---

## Rôles disponibles

| ID    | Nom          | Description                                          |
|-------|--------------|------------------------------------------------------|
| admin      | Admin / Gérant         | Accès total à toutes les fonctionnalités    |
| commercial | Commercial             | Gestion des clients et commandes            |
| stock      | Gestionnaire de stock  | Gestion de l'inventaire et des produits     |
| livreur    | Livreur                | Suivi de ses propres livraisons uniquement  |
| technicien | Technicien             | Fiches techniques et bons d'intervention    |
| comptable  | Comptable              | Lecture des données financières             |

---

## Matrice des permissions

`✅` = accordé par défaut · `❌` = refusé · `👤` = ses données uniquement

### COMMANDES

| Permission              | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|-------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Créer une commande      |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ❌     |
| Voir les commandes      |  ✅   |    ✅      |     ❌      |  👤     |     ❌     |    ✅     |
| Modifier prix commande  |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ❌     |
| Annuler une commande    |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ❌     |
| Valider une commande    |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ❌     |

### PRODUITS & PRIX

| Permission              | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|-------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir la liste produits  |  ✅   |    ✅      |     ✅      |   ✅    |     ✅     |    ✅     |
| Modifier prix produit   |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ❌     |
| Ajouter un produit      |  ✅   |    ❌      |     ✅      |   ❌    |     ❌     |    ❌     |
| Supprimer un produit    |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ❌     |

### STOCK & INVENTAIRE

| Permission                | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|---------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir le niveau de stock   |  ✅   |    ✅      |     ✅      |   ❌    |     ✅     |    ✅     |
| Modifier le stock         |  ✅   |    ❌      |     ✅      |   ❌    |     ❌     |    ❌     |
| Accéder inventaire complet|  ✅   |    ❌      |     ✅      |   ❌    |     ❌     |    ❌     |
| Faire un ajustement       |  ✅   |    ❌      |     ✅      |   ❌    |     ❌     |    ❌     |

### LIVRAISONS

| Permission                | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|---------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir toutes les livraisons|  ✅   |    ✅      |     ✅      |   ❌    |     ❌     |    ❌     |
| Voir ses livraisons       |  ✅   |    ✅      |     ✅      |  ✅     |     ❌     |    ❌     |
| Modifier statut livraison |  ✅   |    ❌      |     ❌      |  ✅     |     ❌     |    ❌     |
| Affecter un livreur       |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ❌     |

### FINANCES & COMPTABILITÉ

| Permission                | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|---------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir rapports financiers  |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ✅     |
| Voir chiffre d'affaires   |  ✅   |   👤       |     ❌      |   ❌    |     ❌     |    ✅     |
| Modifier écritures compta |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ✅     |
| Voir marges & bénéfices   |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ❌     |

### CLIENTS

| Permission                  | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|-----------------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir la liste clients       |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ✅     |
| Ajouter / modifier client   |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ❌     |
| Supprimer un client         |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ❌     |
| Voir historique d'achat     |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ✅     |

### ANALYTIQUE & RAPPORTS

| Permission        | Admin | Commercial | Gest. stock | Livreur | Technicien | Comptable |
|-------------------|:-----:|:----------:|:-----------:|:-------:|:----------:|:---------:|
| Voir les analyses |  ✅   |    ✅      |     ❌      |   ❌    |     ❌     |    ✅     |
| Voir les rapports |  ✅   |    ✅      |     ✅      |   ❌    |     ❌     |    ✅     |
| Exporter rapports |  ✅   |    ❌      |     ❌      |   ❌    |     ❌     |    ✅     |

### ADMINISTRATION

| Permission                      | Admin | Tous les autres |
|---------------------------------|:-----:|:---------------:|
| Gérer les utilisateurs          |  ✅   |      ❌         |
| Gérer les rôles & permissions   |  ✅   |      ❌         |
| Accéder aux paramètres          |  ✅   |      ❌         |
| Voir le journal d'activité      |  ✅   |      ❌         |

---

## Personnalisation par utilisateur

L'Admin peut **cocher/décocher chaque permission individuellement** pour n'importe quel utilisateur.  
Les overrides sont stockés dans la table `user_permissions` et prennent priorité sur les droits du rôle.

**Logique de résolution :**
```
1. Vérifier user_permissions → Si présent → utiliser cette valeur (granted=1 ou 0)
2. Sinon → vérifier role_permissions → Si présent → accordé
3. Sinon → refusé
```

---

## Journal d'activité

Toutes les actions suivantes sont tracées automatiquement :

| Événement                          | Module         |
|------------------------------------|----------------|
| Connexion / déconnexion            | auth           |
| Connexion échouée (mauvais mdp)    | auth           |
| Compte inactif — tentative accès   | auth           |
| Session expirée (inactivité)       | auth           |
| Tentative d'accès refusée (403)    | module concerné|
| Création d'un utilisateur          | admin          |
| Modification d'un utilisateur      | admin          |
| Activation / désactivation compte  | admin          |
| Changement de mot de passe         | auth           |

---

## Démarrage du système RBAC

```bash
# Terminal 1 — API backend (port 3001)
npm run server

# Terminal 2 — Frontend Vite (port 5173)
npm run dev
```

L'API démarre en premier et crée automatiquement `gestcopta.db` avec les rôles,
permissions et l'utilisateur admin si la base est vide.

---

## Structure des tables

```sql
roles              → id, nom, description
permissions        → id, module, action, description
role_permissions   → role_id, permission_id (droits par défaut du rôle)
users              → id, nom, email, password_hash, role_id, statut,
                     must_change_password, derniere_connexion, session_timeout
user_permissions   → user_id, permission_id, granted (overrides individuels)
activity_logs      → id, user_id, user_nom, user_email, action, module,
                     ancienne_valeur, nouvelle_valeur, resultat, raison_echec, created_at
```

---

*Ce fichier est généré automatiquement et sert de référence. Ne pas modifier manuellement.*
