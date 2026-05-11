# Salih Holding — Guide démarrage équipe

## URL Production
**https://niansbusiness.netlify.app**

## Comptes
- **Admin** : `elsalih2018@gmail.com` / `Admin1234!`
- Nouveaux comptes : créés par admin via module **Utilisateurs & Rôles**

## Démarrage rapide (admin)

1. **Connexion** → URL ci-dessus
2. **Créer les boutiques** → Module *Boutiques* → Nouvelle boutique
3. **Ajouter les points de stock** → *Point de stock* → Ajouter
4. **Enregistrer les produits** → *Produits & Stock* → Nouveau produit (assigner stock initial à un point)
5. **Ajouter les clients** → *Clients* → Nouveau client
6. **Créer comptes équipe** → *Utilisateurs & Rôles* → Nouvel utilisateur
   - Choisir rôle (commercial, stock, livreur, comptable…)
   - Restreindre accès boutiques si besoin

## Workflow commande → facture

1. *Commandes* → Nouvelle commande
2. Choisir client + boutique
3. Sélectionner produits depuis dropdown (par point de stock)
4. Ajouter frais (livraison/installation/service +/−)
5. Statut `attente` → `préparée` → `livrée`
   - Stock auto-déduit du point dès `préparée`
6. *Factures* → Nouvelle facture → bouton "Générer depuis commande"
7. Bouton **PDF** = télécharge facture
8. Bouton **Partager** = WhatsApp / Email / SMS

## Rôles disponibles

| Rôle | Permissions principales |
|---|---|
| **admin** | Accès complet, gestion utilisateurs |
| **commercial** | Commandes, clients, voir CA |
| **stock** | Produits, inventaire, transferts |
| **livreur** | Voir ses livraisons, modifier statut |
| **comptable** | Lecture finances, factures, rapports |

## Accès multi-boutiques

Admin → Modifier utilisateur → Section **Accès boutiques** :
- **Toutes les boutiques** : voit tout
- **Boutiques spécifiques** : cocher les boutiques autorisées
- L'utilisateur ne verra que les données (commandes, clients, factures, stock) des boutiques autorisées

## Points clés

- **Stock auto-synchronisé** : commande livrée → quantités déduites des points
- **Données persistées** localement (localStorage) — survit aux rechargements
- **Mode sombre** : icône en haut/sidebar
- **Mot de passe oublié** : lien sur écran login → admin réinitialise

## Support technique

- **Rollback version** : `git checkout v1.1.1` (ou autre tag)
- **Supabase** : dashboard https://supabase.com/dashboard/project/egouynritrnzsmhfzwhh
- **Netlify** : dashboard https://app.netlify.com/projects/niansbusiness

---
**Version actuelle : v1.2.0** — Déployée le 2026-05-06
