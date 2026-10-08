# 🟢 Project X

> **Deviens la personne que tu veux être.**

Project X est une application web de développement personnel conçue pour transformer des intentions en actions concrètes.

L'utilisateur crée un projet personnel sur une durée définie, choisit ses domaines de progression, définit des objectifs et des habitudes, puis suit son évolution au quotidien.

---

## ✨ Concept

Project X repose sur une idée simple :

> **Un objectif devient plus puissant lorsqu'il est transformé en système.**

Chaque Project X permet de définir :

* une durée ;
* une vision ;
* une devise ;
* des catégories de progression ;
* des objectifs ;
* des habitudes ;
* des milestones ;
* des check-ins quotidiens ;
* une progression globale.

L'application accompagne ensuite l'utilisateur pendant toute la durée de son projet.

---

## 🎯 Fonctionnalités

### 🔐 Authentification

* Inscription
* Connexion
* Déconnexion
* Vérification de l'adresse email
* Mot de passe oublié
* Réinitialisation du mot de passe
* Session persistante
* Protection des routes privées
* Création automatique du profil utilisateur

### 🚀 Création d'un Project X

L'utilisateur peut définir :

* Nom du projet
* Description
* Devise
* Durée
* Date de début
* Date de fin

Durées disponibles :

* 1 mois
* 3 mois
* 6 mois
* 9 mois
* 12 mois
* durée personnalisée

### 🗂️ Catégories

Les catégories sont chargées depuis la base de données.

Catégories prévues :

* Create
* Learn
* Body
* Expression
* Experience
* Social
* X

L'utilisateur peut sélectionner les catégories qui correspondent à son projet.

### 🎯 Objectifs

Chaque objectif peut contenir :

* un titre ;
* une catégorie ;
* une valeur minimum ;
* une valeur cible ;
* une valeur bonus ;
* une unité ;
* une date limite.

Les objectifs sont suivis grâce aux `goal_logs`.

### 🔁 Habitudes

Chaque habitude peut définir :

* un nom ;
* une catégorie ;
* une fréquence ;
* un nombre de fois par période ;
* une date de début ;
* une date de fin.

Les habitudes sont suivies grâce aux `habit_logs`.

### 📊 Dashboard

Le dashboard affiche actuellement :

* le Project X actif ;
* le jour actuel ;
* le nombre de jours restants ;
* la progression temporelle ;
* la progression globale ;
* la progression par catégorie ;
* la progression des objectifs ;
* la progression des habitudes ;
* le streak actuel ;
* le meilleur streak ;
* les objectifs du jour ;
* les habitudes du jour ;
* les milestones ;
* les activités récentes ;
* le check-in quotidien.

### 🔥 Streak

Une journée est considérée comme active lorsqu'elle contient au moins une action positive :

* progression d'objectif ;
* validation d'habitude.

Le dashboard calcule :

* le streak actuel ;
* le meilleur streak.

### 🏁 Milestones

Les milestones représentent les étapes importantes d'un Project X.

Ils peuvent être :

* à faire ;
* terminés ;
* rouverts.

### 📝 Check-in quotidien

Chaque jour, l'utilisateur peut enregistrer :

* son humeur ;
* son énergie ;
* sa motivation ;
* une réflexion personnelle.

Les valeurs sont notées de 1 à 10.

---

## 🧱 Architecture

Project X est actuellement organisé autour de deux parties principales :

```text
Project X
│
├── Frontend
│   └── Vue 3 + Vite
│
├── Backend
│   └── Node.js + Express
│
└── Database
    └── PostgreSQL / Supabase
```

### Frontend

Le frontend est construit avec :

* Vue 3
* `<script setup>`
* Vue Router
* Vite
* CSS personnalisé

### Backend

L'API utilise :

* Node.js
* Express
* Supabase JS
* Middleware d'authentification
* API REST

### Database

La base de données utilise :

* PostgreSQL
* Supabase
* UUID
* contraintes SQL
* relations entre les tables
* Row Level Security selon les usages

---

## 🗄️ Base de données

Les principales tables sont :

```text
users
projects
categories
project_categories

goals
goal_logs

habits
habit_logs

milestones

journal_entries
project_checkins

media

achievements
user_achievements

project_templates
notifications
```

### Relations principales

```text
User
 │
 └── Projects
      │
      ├── Categories
      │    └── project_categories
      │
      ├── Goals
      │    └── goal_logs
      │
      ├── Habits
      │    └── habit_logs
      │
      ├── Milestones
      │
      ├── Check-ins
      │
      └── Journal entries
```

---

## 🔒 Sécurité

Les secrets ne doivent jamais être exposés dans le frontend.

Les variables d'environnement sont stockées dans :

```text
api/.env
```

Ce fichier est ignoré par Git.

Un fichier exemple est disponible ici :

```text
api/.env.example
```

Variables actuellement nécessaires :

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

### ⚠️ Important

La `SUPABASE_SECRET_KEY` est une clé serveur.

Elle ne doit :

* jamais être placée dans le frontend ;
* jamais être commitée ;
* jamais être envoyée sur GitHub ;
* jamais être exposée dans le navigateur.

L'API utilise cette clé côté serveur et vérifie explicitement l'utilisateur authentifié et la propriété des ressources.

---

## 📁 Structure du projet

Structure actuelle simplifiée :

```text
project-x/
│
├── api/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── dashboard.js
│   │   └── projects.js
│   │
│   ├── middlewares/
│   │   └── auth.js
│   │
│   ├── lib/
│   │   └── supabase.js
│   │
│   ├── .env
│   ├── .env.example
│   └── server.js
│
├── src/
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── DashboardView.vue
│   │   └── ...
│   │
│   ├── stores/
│   │   └── projectCreation.js
│   │
│   ├── router/
│   │   └── index.js
│   │
│   ├── api.js
│   ├── auth.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
│
├── .gitignore
├── package.json
└── README.md
```

> La structure peut évoluer au fur et à mesure du développement.

---

## ⚙️ Installation

### 1. Cloner le projet

```bash
git clone <URL_DU_REPOSITORY>
cd project-x
```

### 2. Installer les dépendances

Pour le frontend :

```bash
npm install
```

Pour l'API :

```bash
cd api
npm install
```

Puis revenir à la racine :

```bash
cd ..
```

### 3. Configurer les variables d'environnement

Créer :

```text
api/.env
```

à partir de :

```text
api/.env.example
```

Puis renseigner les variables Supabase :

```env
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

---

## ▶️ Lancer le projet

### API

Depuis `api/` :

```bash
npm run dev
```

L'API fonctionne sur :

```text
http://localhost:3000
```

### Frontend

Depuis la racine du projet :

```bash
npm run dev
```

Le frontend fonctionne généralement sur :

```text
http://localhost:5173
```

---

## 🩺 Vérifier l'API

Endpoint de santé :

```text
GET /health
```

Réponse attendue :

```json
{
  "ok": true
}
```

---

## 🔌 Principales routes API

### Authentification

```text
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/refresh
```

### Catégories

```text
GET /categories
```

### Projects

```text
POST /projects
```

### Dashboard

```text
GET /dashboard
```

### Objectifs

```text
POST /dashboard/goals/:goalId/log
```

### Habitudes

```text
POST /dashboard/habits/:habitId/log
```

### Milestones

```text
PATCH /dashboard/milestones/:milestoneId/complete
PATCH /dashboard/milestones/:milestoneId/reopen
```

### Check-in

```text
POST /dashboard/checkin
```

---

## 🎨 Direction artistique

Project X utilise actuellement une direction **Soft Zen**.

### Palette

```text
Background   #F3F5EF
Sage         #7FA88A
Sand         #E8C9A0
Text         #2F3B33
```

### Principes

* Interface calme
* Beaucoup d'espace
* Coins arrondis
* Animations lentes
* Feedback rassurant
* Couleurs peu agressives
* Typographie arrondie
* Expérience pensée pour éviter la culpabilisation

L'objectif est de créer une interface qui donne envie de revenir, même après avoir raté plusieurs jours.

---

## 🧭 Progression du développement

### Phase 1 — Fondations

* [x] Initialiser le frontend
* [x] Initialiser l'API
* [x] Connecter Supabase
* [x] Mettre en place la base de données
* [x] Configurer Git

### Phase 2 — Authentification

* [x] Inscription
* [x] Connexion
* [x] Déconnexion
* [x] Vérification email
* [x] Mot de passe oublié
* [x] Réinitialisation
* [x] Session persistante
* [x] Protection des routes

### Phase 3 — Création du Project X

* [x] Nom
* [x] Description
* [x] Devise
* [x] Durée
* [x] Dates
* [x] Catégories dynamiques
* [x] Objectifs
* [x] Habitudes
* [x] Sauvegarde du brouillon

### Phase 4 — Dashboard

* [x] Dashboard de base
* [x] Project actif
* [x] Jour actuel
* [x] Jours restants
* [x] Progression
* [x] Progression par catégorie
* [x] Objectifs
* [x] Habitudes
* [x] Streak
* [x] Milestones
* [x] Activité récente
* [x] Check-in quotidien

### 🚧 Prochaines étapes

* [ ] Création des milestones depuis le wizard
* [ ] Améliorer les calculs de progression des habitudes
* [ ] Ajouter le journal personnel
* [ ] Ajouter les preuves de progression
* [ ] Ajouter photos / vidéos / fichiers
* [ ] Ajouter les achievements
* [ ] Ajouter les notifications
* [ ] Ajouter les templates de Project X
* [ ] Améliorer les statistiques
* [ ] Ajouter les paramètres utilisateur
* [ ] Améliorer l'expérience mobile
* [ ] Tests frontend
* [ ] Tests API
* [ ] Déploiement

---

## 🧠 Philosophie du projet

Project X n'a pas pour objectif de transformer la vie de l'utilisateur en une liste infinie de tâches.

L'idée est de créer un cadre suffisamment structuré pour progresser, mais suffisamment flexible pour rester humain.

Les principes fondamentaux sont :

```text
Clarté
   ↓
Action
   ↓
Régularité
   ↓
Progression
   ↓
Transformation
```

Un jour raté ne signifie pas que le projet est raté.

**On reprend simplement le lendemain.**

---

## 🚀 Vision

À terme, Project X doit devenir un véritable système personnel de progression.

L'utilisateur ne vient pas simplement consulter des statistiques.

Il vient pour :

* décider ce qu'il veut devenir ;
* construire un plan ;
* agir chaque jour ;
* constater ses progrès ;
* garder une trace de son évolution ;
* terminer son Project X avec une transformation concrète.

---

## 📌 Statut

**Projet en développement actif.**

La structure fondamentale de l'application est en place :

```text
Authentication
      ↓
Project creation
      ↓
Database
      ↓
API
      ↓
Dashboard
      ↓
Daily tracking
```

Les prochaines itérations se concentreront sur l'enrichissement du système de progression et l'expérience utilisateur.
