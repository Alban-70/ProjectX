🚀 Project X — Todo List

> Roadmap complète de développement de Project X.  
> Coche chaque tâche `- [ ]` quand elle est terminée.

---

# 🟢 PHASE 0 — Définition du projet

## Concept

- [X] Définir clairement le concept de Project X
- [X] Définir le public cible
- [X] Définir le problème que Project X résout
- [X] Définir le fonctionnement d'un Project X
- [X] Définir les catégories
- [X] Définir les durées disponibles
- [X] Définir le système de progression
- [X] Définir le système Minimum / Target / Bonus
- [X] Définir ce qu'est un projet terminé
- [X] Définir le MVP
- [X] Lister les fonctionnalités hors MVP

---

# 🟢 PHASE 1 — UX / UI

## Structure

- [ ] Faire le sitemap
- [ ] Faire les wireframes
- [ ] Définir la navigation
- [ ] Définir le dashboard
- [ ] Définir la page d'un projet
- [ ] Définir la page des objectifs
- [ ] Définir la page des habitudes
- [ ] Définir la page du journal
- [ ] Définir la page des statistiques
- [ ] Définir la page du profil
- [ ] Définir la page de création d'un Project X

## Design

- [ ] Choisir les couleurs
- [ ] Choisir les polices
- [ ] Créer le logo
- [ ] Définir les boutons
- [ ] Définir les cartes
- [ ] Définir les formulaires
- [ ] Définir les badges
- [ ] Définir les graphiques
- [ ] Définir les icônes
- [ ] Définir les états loading
- [ ] Définir les états error
- [ ] Définir les états empty
- [ ] Définir les états success
- [ ] Faire la version mobile
- [ ] Faire la version desktop

---

# 🟢 PHASE 2 — Architecture technique

## Frontend

- [X] Choisir le framework
- [X] Créer le projet frontend
- [X] Configurer TypeScript
- [X] Configurer le routing
- [X] Configurer le système de composants
- [X] Configurer le système de styles
- [X] Créer les composants réutilisables

## Backend / Supabase

- [X] Créer le projet Supabase
- [X] Configurer PostgreSQL
- [X] Créer les tables
- [X] Créer les relations
- [X] Ajouter les contraintes
- [X] Ajouter les indexes
- [X] Ajouter les triggers
- [X] Ajouter le RLS
- [X] Tester les policies RLS

## Infrastructure

- [ ] Créer le repository Git
- [ ] Créer la branche main
- [ ] Créer la branche develop
- [ ] Configurer les variables d'environnement
- [X] Créer le fichier .env
- [ ] Ajouter .env au .gitignore
- [ ] Préparer l'environnement de développement
- [ ] Préparer l'environnement de production

---

# 🟢 PHASE 3 — Base de données

## Tables

- [X] users
- [X] projects
- [X] categories
- [X] project_categories
- [X] goals
- [X] goal_logs
- [X] habits
- [X] habit_logs
- [X] milestones
- [X] journal_entries
- [X] project_checkins
- [X] media
- [X] achievements
- [X] user_achievements
- [X] project_templates
- [X] notifications

## Tests DB

- [ ] Tester les INSERT
- [ ] Tester les UPDATE
- [ ] Tester les DELETE
- [ ] Tester les relations
- [ ] Tester les contraintes
- [ ] Tester les indexes
- [ ] Tester les triggers
- [ ] Tester avec utilisateur A
- [ ] Tester avec utilisateur B
- [ ] Vérifier qu'A ne peut pas voir les données de B

---

# 🟢 PHASE 4 — Authentification

- [X] Inscription
- [X] Connexion
- [X] Déconnexion
- [X] Vérification email
- [X] Mot de passe oublié
- [X] Réinitialisation du mot de passe
- [X] Session persistante
- [X] Protection des routes privées
- [X] Création automatique du profil users
- [X] Gestion des erreurs d'authentification

## Pages

- [X] /login
- [X] /register
- [X] /forgot-password
- [X] /reset-password

---

# 🟢 PHASE 5 — Création d'un Project X

## Étape 1 — Informations

- [X] Nom du projet
- [X] Description
- [X] Phrase / motto

## Étape 2 — Durée

- [X] 1 mois
- [X] 3 mois
- [X] 6 mois
- [X] 9 mois
- [X] 12 mois
- [X] Durée personnalisée

## Étape 3 — Catégories

- [X] Create
- [X] Learn
- [X] Body
- [X] Expression
- [X] Experience
- [X] Social
- [X] X

## Étape 4 — Objectifs

- [X] Ajouter un objectif
- [X] Définir le minimum
- [X] Définir le target
- [X] Définir le bonus
- [X] Définir l'unité
- [X] Définir une deadline

## Étape 5 — Habitudes

- [X] Ajouter une habitude
- [X] Définir la fréquence
- [X] Définir le nombre de fois
- [X] Définir la date de début
- [X] Définir la date de fin

## Étape 6 — Confirmation

- [X] Afficher le résumé
- [X] Calculer la durée
- [X] Afficher le nombre d'objectifs
- [X] Afficher le nombre d'habitudes
- [X] Confirmer
- [X] Créer le projet

---

# 🟢 PHASE 6 — Dashboard

- [X] Créer le dashboard
- [X] Afficher le projet actif
- [X] Afficher le jour actuel
- [X] Afficher les jours restants
- [X] Afficher la progression globale
- [X] Afficher la progression par catégorie
- [X] Afficher le streak
- [X] Afficher les objectifs du jour
- [X] Afficher les habitudes du jour
- [X] Afficher les milestones
- [X] Afficher les dernières activités
- [X] Ajouter le check-in quotidien

---

# 🟢 PHASE 7 — Objectifs

- [X] Liste des objectifs
- [X] Créer un objectif
- [X] Modifier un objectif
- [X] Supprimer un objectif
- [X] Ajouter une progression
- [X] Voir l'historique
- [X] Calculer automatiquement le pourcentage
- [X] Détecter le Minimum atteint
- [X] Détecter le Target atteint
- [X] Détecter le Bonus atteint
- [X] Afficher une barre de progression
- [X] Ajouter des graphiques

---

# 🟢 PHASE 8 — Habitudes

- [X] Liste des habitudes
- [X] Créer une habitude
- [X] Modifier une habitude
- [X] Supprimer une habitude
- [X] Marquer une habitude comme accomplie
- [X] Voir l'historique
- [X] Calculer le streak
- [X] Ajouter un calendrier
- [X] Ajouter les statistiques
- [X] Gérer les habitudes quotidiennes
- [X] Gérer les habitudes hebdomadaires
- [X] Gérer les habitudes mensuelles

---

# 🟢 PHASE 9 — Journal

- [X] Créer une entrée
- [X] Modifier une entrée
- [X] Supprimer une entrée
- [X] Ajouter un titre
- [X] Ajouter du texte
- [X] Ajouter une humeur
- [X] Afficher l'historique
- [X] Ajouter la recherche
- [X] Ajouter le filtre par date

## Plus tard

- [ ] Ajouter des photos
- [ ] Ajouter des vidéos
- [ ] Ajouter des fichiers

---

# 🟢 PHASE 10 — Check-in quotidien

- [ ] Créer le formulaire de check-in
- [ ] Ajouter le mood
- [ ] Ajouter l'énergie
- [ ] Ajouter la motivation
- [ ] Ajouter une réflexion
- [ ] Sauvegarder le check-in
- [ ] Afficher l'historique
- [ ] Ajouter les graphiques

---

# 🟢 PHASE 11 — Progression / Statistiques

- [ ] Progression globale
- [ ] Progression par catégorie
- [ ] Progression quotidienne
- [ ] Progression hebdomadaire
- [ ] Progression mensuelle
- [ ] Streak
- [ ] Nombre d'habitudes complétées
- [ ] Nombre d'objectifs complétés
- [ ] Temps restant
- [ ] Milestones atteints

## Plus tard

- [ ] Graphiques avancés
- [ ] Heatmap
- [ ] Comparaison début / fin
- [ ] Analyse automatique

---

# 🟢 PHASE 12 — Achievements

- [ ] Créer les achievements
- [ ] Définir les conditions
- [ ] Détecter automatiquement les achievements
- [ ] Débloquer un achievement
- [ ] Afficher une notification
- [ ] Créer la page achievements
- [ ] Afficher les badges

## Achievements de base

- [ ] First Step
- [ ] On Fire — 7 jours
- [ ] Consistent — 30 jours
- [ ] Knowledge
- [ ] Explorer
- [ ] Finisher

---

# 🟡 PHASE 13 — Media

- [ ] Upload image
- [ ] Upload vidéo
- [ ] Upload audio
- [ ] Upload document
- [ ] Associer un média à un projet
- [ ] Associer un média à un objectif
- [ ] Créer la galerie
- [ ] Supprimer un média
- [ ] Configurer Supabase Storage
- [ ] Configurer les policies Storage

---

# 🟡 PHASE 14 — Profil

- [ ] Créer la page profil
- [ ] Modifier le username
- [ ] Modifier le display name
- [ ] Modifier la photo
- [ ] Ajouter une bio
- [ ] Afficher les projets terminés
- [ ] Afficher les projets actifs
- [ ] Afficher les achievements
- [ ] Afficher les statistiques

## Plus tard

- [ ] Profil public
- [ ] Suivre des utilisateurs
- [ ] Likes
- [ ] Commentaires
- [ ] Feed

---

# 🟡 PHASE 15 — Templates

- [ ] Créer le système de templates
- [ ] Créer des templates par défaut
- [ ] Afficher les templates publics
- [ ] Créer son propre template
- [ ] Modifier un template
- [ ] Supprimer un template
- [ ] Démarrer un Project X depuis un template

## Templates de départ

- [ ] The Student
- [ ] The Athlete
- [ ] The Creator
- [ ] The Explorer
- [ ] Custom

---

# 🟡 PHASE 16 — Notifications

- [ ] Notification objectif
- [ ] Notification habit
- [ ] Rappel quotidien
- [ ] Notification milestone
- [ ] Notification achievement
- [ ] Notification fin prochaine du projet
- [ ] Page des notifications
- [ ] Marquer comme lu
- [ ] Supprimer une notification

## Plus tard

- [ ] Push notifications
- [ ] Notifications email
- [ ] Préférences de notification

---

# 🟡 PHASE 17 — Fin du Project X

## Bilan

- [ ] Détecter la fin du projet
- [ ] Afficher le nombre de jours
- [ ] Afficher les objectifs complétés
- [ ] Afficher les objectifs non complétés
- [ ] Afficher la progression globale
- [ ] Afficher la progression par catégorie
- [ ] Afficher la régularité des habitudes
- [ ] Afficher les achievements
- [ ] Afficher les milestones

## Avant / Après

- [ ] Comparer le début et la fin
- [ ] Afficher les photos avant/après
- [ ] Afficher les statistiques
- [ ] Afficher les meilleures performances
- [ ] Afficher les apprentissages

## Résumé

- [ ] Générer un résumé du Project X
- [ ] Permettre de consulter le journal
- [ ] Permettre de partager le bilan

---

# 🟡 PHASE 18 — Social

> À faire uniquement après avoir terminé le MVP.

- [ ] Profil public
- [ ] Partager son Project X
- [ ] Feed
- [ ] Follow
- [ ] Unfollow
- [ ] Likes
- [ ] Commentaires
- [ ] Challenges communautaires
- [ ] Classements
- [ ] Groupes
- [ ] Project X publics
- [ ] Recherche d'utilisateurs

---

# 🔴 PHASE 19 — Sécurité

- [ ] Activer le RLS sur toutes les tables privées
- [ ] Tester chaque policy RLS
- [ ] Vérifier les permissions Storage
- [ ] Valider les données côté serveur
- [ ] Valider les données côté frontend
- [ ] Empêcher les accès cross-user
- [ ] Protéger les routes privées
- [ ] Vérifier les secrets
- [ ] Ne jamais exposer les clés secrètes
- [ ] Vérifier les uploads
- [ ] Limiter la taille des fichiers
- [ ] Ajouter la gestion des erreurs
- [ ] Configurer les backups
- [ ] Vérifier les données exposées par l'API

---

# 🔵 PHASE 20 — Tests

## Backend

- [ ] Tester les tables
- [ ] Tester les contraintes
- [ ] Tester les relations
- [ ] Tester les policies RLS
- [ ] Tester l'authentification
- [ ] Tester les API

## Frontend

- [ ] Tester les composants
- [ ] Tester les formulaires
- [ ] Tester la navigation
- [ ] Tester le responsive
- [ ] Tester les erreurs
- [ ] Tester les états loading
- [ ] Tester les états empty
- [ ] Tester les états success
- [ ] Tester sur mobile
- [ ] Tester sur desktop

## Tests utilisateurs

- [ ] Faire tester par 3 à 5 personnes
- [ ] Observer leurs difficultés
- [ ] Noter les bugs
- [ ] Corriger les problèmes UX
- [ ] Faire un deuxième test utilisateur

---

# 🔵 PHASE 21 — Performance

- [ ] Optimiser les requêtes SQL
- [ ] Vérifier les indexes
- [ ] Ajouter la pagination
- [ ] Ajouter le lazy loading
- [ ] Optimiser les images
- [ ] Compresser les ressources
- [ ] Ajouter du cache si nécessaire
- [ ] Tester les performances
- [ ] Tester Lighthouse
- [ ] Tester sur mobile avec une connexion lente

---

# 🔵 PHASE 22 — Landing Page

- [ ] Hero section
- [ ] Présentation de Project X
- [ ] Présenter le fonctionnement
- [ ] Montrer un exemple de Project X
- [ ] Présenter les catégories
- [ ] Présenter les statistiques
- [ ] Ajouter le CTA "Start your Project X"
- [ ] Ajouter une FAQ
- [ ] Ajouter le footer
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Page Contact

---

# 🔵 PHASE 23 — Déploiement

- [ ] Choisir le nom de domaine
- [ ] Configurer le domaine
- [ ] Déployer le frontend
- [ ] Configurer Supabase production
- [ ] Configurer les variables d'environnement
- [ ] Configurer OAuth si nécessaire
- [ ] Configurer les emails
- [ ] Configurer Supabase Storage
- [ ] Configurer le domaine Supabase
- [ ] Vérifier HTTPS
- [ ] Ajouter Analytics
- [ ] Ajouter Error Tracking
- [ ] Faire un dernier test complet
- [ ] Mettre le site en production 🚀

---

# 🏆 MVP — VERSION À TERMINER EN PREMIER

> Ne développe pas tout le reste avant d'avoir terminé cette section.

## Foundation

- [ ] Concept défini
- [ ] Design défini
- [ ] Repository Git
- [ ] Frontend configuré
- [ ] Supabase configuré
- [ ] Database créée
- [ ] RLS configuré

## Auth

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Session
- [ ] Routes protégées

## Project X

- [ ] Créer un projet
- [ ] Choisir la durée
- [ ] Choisir les catégories
- [ ] Créer des objectifs
- [ ] Créer des habitudes

## Daily

- [ ] Dashboard
- [ ] Valider une habitude
- [ ] Ajouter une progression
- [ ] Faire un check-in
- [ ] Voir le streak

## Journal

- [ ] Créer une entrée
- [ ] Modifier une entrée
- [ ] Supprimer une entrée
- [ ] Voir l'historique

## Progression

- [ ] Progression globale
- [ ] Progression par catégorie
- [ ] Objectifs
- [ ] Habitudes
- [ ] Statistiques

## Fin

- [ ] Détecter la fin du projet
- [ ] Afficher le bilan
- [ ] Afficher les statistiques finales
- [ ] Afficher les objectifs accomplis

## Production

- [ ] Tests
- [ ] Security check
- [ ] Responsive
- [ ] Performance
- [ ] Déploiement

---

# 🎯 ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

```text
01 → Concept
02 → UX / UI
03 → Architecture
04 → Supabase
05 → Database
06 → RLS
07 → Auth
08 → Création Project X
09 → Dashboard
10 → Goals
11 → Habits
12 → Daily Check-in
13 → Journal
14 → Progression
15 → Fin du Project X
16 → Tests
17 → Security
18 → Performance
19 → Landing Page
20 → Production