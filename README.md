# Project X — squelette

Squelette minimal : un **front Vue 3** qui appelle une **API Node.js (Express)**, le tout en **JavaScript**, elle-même reliée à une base **PostgreSQL hébergée sur Supabase**.

La page d'accueil affiche « Hello Project X » et une donnée lue en base : si tu la vois, toute la chaîne fonctionne.

```
Navigateur ──► Front Vue (Vite, :5173) ──/api──► API Express (:3000) ──► Supabase (PostgreSQL)
```

> Le front ne parle **jamais** directement à Supabase : tout passe par l'API, qui est la seule à connaître la clé secrète.

## Structure

```
project-x/
├── api/                    # API Node.js + Express (JavaScript, ES modules)
│   ├── src/
│   │   ├── index.js        # point d'entrée (charge .env, lance le serveur)
│   │   ├── app.js          # configuration Express (CORS, routes)
│   │   ├── lib/supabase.js # client Supabase (côté serveur)
│   │   └── routes/
│   │       ├── health.js   # GET /api/health
│   │       └── hello.js    # GET /api/hello (lit la table de test)
│   └── .env.example
├── web/                    # Front Vue 3 + Vite (JavaScript)
│   ├── src/
│   │   ├── api.js          # petit client pour appeler l'API
│   │   ├── App.vue
│   │   └── views/HomeView.vue
│   ├── vite.config.js      # proxy /api -> http://localhost:3000
│   └── .env.example
└── supabase/
    └── schema.sql          # table de test `hello_test`
```

## Prérequis

- **Node.js 20 ou plus** (`node -v` pour vérifier) : l'API se relance automatiquement grâce à `node --watch`, sans outil supplémentaire
- Un compte gratuit sur [supabase.com](https://supabase.com)

---

## Étape 1 — Créer le projet Supabase

1. Connecte-toi sur [supabase.com](https://supabase.com) → **New project**.
2. Choisis un nom (ex. `project-x`), une région proche de toi (ex. *West EU*) et le plan **Free**.
3. Définis un **mot de passe de base de données** et garde-le dans un gestionnaire de mots de passe (il ne sert pas pour ce squelette, mais tu en auras besoin plus tard). **onrT3e0neSb4JBLY**
4. Attends 1 à 2 minutes que le projet soit prêt.

## Étape 2 — Créer la table de test

1. Dans le dashboard : **SQL Editor** → **New query**.
2. Copie-colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et clique sur **Run**.
3. Vérifie dans **Table Editor** : la table `hello_test` existe et contient une ligne.

## Étape 3 — Récupérer l'URL et la clé secrète

1. Clique sur le bouton **Connect** en haut du dashboard (ou va dans **Project Settings**) pour copier l'**URL du projet** : `https://xxxxxxxx.supabase.co`.
2. Va dans **Project Settings → API Keys**.
   - Onglet **Publishable and secret API keys** → section **Secret keys** → copie la clé `sb_secret_...` (clique sur **Create new API Keys** si tu n'en as pas encore).
   - Si ton projet n'affiche que les anciennes clés, utilise la clé `service_role` de l'onglet **Legacy API Keys** : ça fonctionne aussi.

> ⚠️ La clé secrète donne un accès total à ta base. Elle va **uniquement** dans `api/.env`, jamais dans le front, jamais sur Git.

## Étape 4 — Lancer l'API

```bash
cd api
cp .env.example .env        # Windows PowerShell : copy .env.example .env
```

Ouvre `api/.env` et remplis :

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Puis :

```bash
npm install
npm run dev
```

Tu dois voir : `API Project X démarrée sur http://localhost:3000`.

Teste l'API dans un autre terminal (ou dans ton navigateur) :

```bash
curl http://localhost:3000/api/health
# {"status":"ok","time":"..."}

curl http://localhost:3000/api/hello
# {"id":1,"message":"Hello depuis Supabase 🎉","created_at":"..."}
```

Si `/api/hello` renvoie la ligne de la base, l'API et Supabase sont bien reliés ✅

## Étape 5 — Lancer le front

Dans un **nouveau terminal** (laisse l'API tourner) :

```bash
cd web
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173). Tu dois voir :

- **Hello Project X 👋**
- Front Vue ✅, API Node ✅, Base Supabase ✅
- Un encadré avec le message lu dans Supabase

C'est terminé : le squelette fonctionne.

---

## Comment ça marche

- **Dev** : le front appelle `/api/...` sur son propre port (5173). Vite redirige ces appels vers `http://localhost:3000` grâce au proxy de `web/vite.config.js`, donc pas de problème de CORS.
- **API** : Express expose `/api/health` et `/api/hello`. `/api/hello` interroge la table `hello_test` avec le client Supabase de `api/src/lib/supabase.js`.
- **Sécurité** : la table a la RLS activée sans policy, donc elle est fermée à la clé publique ; seule l'API (clé secrète) peut la lire.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Le front affiche « L'API ne répond pas » | L'API n'est pas lancée, ou pas sur le port 3000 (vérifie `PORT` dans `api/.env`) |
| L'API plante au démarrage avec « SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définies » | `api/.env` absent ou incomplet |
| `/api/hello` → `fetch failed` | URL Supabase mal copiée (pas de slash final, pas d'espace), ou projet en pause |
| `/api/hello` → `Invalid API key` | Mauvaise clé : utilise la clé **secrète** (`sb_secret_...`) ou `service_role`, pas la publishable/anon |
| `/api/hello` → `Could not find the table 'public.hello_test'` | `schema.sql` n'a pas été exécuté (étape 2) |
| `/api/hello` → 404 « Aucune ligne » | La table est vide : relance le `insert` de `schema.sql` |
| Le projet Supabase est en pause | Les projets gratuits se mettent en pause après environ 1 semaine d'inactivité : clique sur **Restore** dans le dashboard |

## Pour la suite

- **Nouvelle table** : ajoute ton SQL dans `supabase/` et exécute-le dans le SQL Editor. Active toujours la RLS sur les nouvelles tables.
- **Nouvelle route** : crée un fichier dans `api/src/routes/` puis branche-le dans `api/src/app.js` avec `app.use('/api/...', monRouter)`.
- **Nouvel appel côté front** : ajoute une fonction dans `web/src/api.js`.
- **Routeur / store** : `npm install vue-router pinia` dans `web/` quand tu en as besoin (volontairement absents du squelette).
- **Nettoyage** : une fois ta vraie base en place, supprime `hello_test`, `api/src/routes/hello.js` et son `app.use` dans `app.js`.

## Build de production

```bash
# API (pas d'étape de build en JavaScript)
cd api && npm start

# Front (génère web/dist/)
cd web && npm run build
```

En production, renseigne `VITE_API_URL` (URL publique de l'API) dans l'environnement du build du front, et `CLIENT_URL` (URL publique du front) dans l'environnement de l'API pour autoriser le CORS. Si tu déploies l'API sur Vercel, Express devra être adapté aux fonctions serverless : à traiter le moment venu.

## Notes

- Les ports par défaut sont 3000 (API) et 5173 (front).
