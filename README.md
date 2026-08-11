# Application Hub

Portail interne listant les applications accessibles à l'équipe, sous forme de tuiles. Stack 100% JavaScript : backend Node.js/Express servant des pages HTML/CSS/JS vanilla (pas de framework front, pas de build step) + API REST, PostgreSQL, authentification via OpenID Connect contre une instance Authentik existante.

## Fonctionnalités

- Page d'accueil : grille de tuiles vers les applications configurées (nom, description, icône), regroupées par catégorie si des catégories sont définies.
- Chaque application peut être restreinte à un groupe Authentik (`groups` claim) ; sans groupe requis, elle est visible par tous les utilisateurs connectés.
- Logo de chaque application : soit une URL d'image externe (ou un simple emoji), soit une image téléversée depuis l'admin et stockée dans **Garage** (stockage objet compatible S3, auto-hébergé, voir plus bas).
- Catégories : regroupent les tuiles par thème sur la page d'accueil (ex: "DevOps", "Communication") — indépendantes des groupes Authentik, purement pour l'affichage.
- Page `/admin.html` (réservée aux admins) : ajouter/modifier/supprimer les applications et les catégories, définir l'ordre d'affichage, le groupe requis et le logo.
- Page `/profile.html` : identité issue d'Authentik (nom, avatar, groupes), lien vers la gestion de compte Authentik si configuré.
- Thème clair/sombre, mémorisé par navigateur.

## Démarrage rapide (serveur avec Traefik)

```bash
git clone <repo-url> application-hub
cd application-hub
cp .env.example .env
```

Éditer `.env` (au minimum) :

```
POSTGRES_PASSWORD=changeme
SESSION_SECRET=une-longue-chaine-aleatoire

AUTHENTIK_ISSUER_URL=http://authentik-server:9000/application/o/application-hub/
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
OIDC_REDIRECT_URI=https://hub.dandrove.com/auth/callback
ADMIN_GROUP_NAME=hub-admins

TRAEFIK_NETWORK_NAME=traefik-proxy
APP_DOMAIN=hub.dandrove.com
```

Pour générer `POSTGRES_PASSWORD` et `SESSION_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"   # POSTGRES_PASSWORD
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # SESSION_SECRET
```

Puis démarrer :

```bash
docker network create traefik-proxy   # si le réseau n'existe pas déjà
docker compose up -d --build
```

Pas de port publié sur l'hôte : Traefik parle directement au conteneur `application-hub` sur le réseau `traefik-proxy`, port 3000.

## CI/CD

`.github/workflows/ci.yml` (sur chaque push sur `main`) : lance `npm test`, puis build et pousse l'image sur `ghcr.io/<owner>/application-hub:latest` (aucun secret à configurer, utilise le `GITHUB_TOKEN` par défaut). `docker-compose.yml` référence cette image via `${APP_IMAGE:-ghcr.io/nfonteyne/application-hub:latest}` — adapter le nom d'utilisateur/organisation GitHub si besoin (variable `APP_IMAGE` dans `.env`, ou modifier directement le compose). Si un Watchtower tourne déjà sur le serveur (comme pour octane-website), il détecte automatiquement les nouvelles images poussées sur ce tag.

Pour builder l'image en local sans passer par CI (ex: avant le premier push) :

```bash
docker build -t application-hub .
```

## Configuration Authentik

1. Créer un **Provider** OAuth2/OIDC dans Authentik, avec comme redirect URI la valeur à utiliser dans `OIDC_REDIRECT_URI` (ex: `https://hub.dandrove.com/auth/callback`).
2. Créer une **Application** Authentik pointant vers ce provider.
3. S'assurer qu'un **scope mapping** expose un claim `groups` dans l'ID token (Authentik a un mapping `groups` intégré dans les versions récentes, sinon créer un mapping personnalisé renvoyant `request.user.ak_groups.all()`).
4. Créer un **groupe** Authentik (ex: `hub-admins`) et y ajouter les membres qui doivent pouvoir gérer les tuiles de la page `/admin.html`.
5. Pour restreindre une tuile à un groupe donné, utiliser le nom exact de ce groupe Authentik dans le champ "Groupe Authentik requis" du formulaire d'ajout/modification.
6. Noter le Client ID / Client Secret du provider.
7. Optionnel — pour afficher l'avatar sur `/profile.html` : le scope `profile` doit renvoyer un claim `picture`. Sans ce claim, un avatar généré à partir des initiales est affiché à la place.

## Stockage des logos (Garage)

Les logos téléversés depuis `/admin.html` sont stockés dans [Garage](https://garagehq.deuxfleurs.fr/), un stockage objet compatible S3, auto-hébergé, ajouté au `docker-compose.yml`. Il n'est jamais exposé publiquement : l'app y accède uniquement sur le réseau Docker interne, et sert elle-même les images aux navigateurs via `GET /api/apps/:id/logo`. Sans configuration Garage, l'application fonctionne quand même — le champ "Icône (emoji) ou URL d'image externe" reste utilisable, seul le téléversement de fichier renvoie une erreur claire.

Configuration initiale (une seule fois) :

1. Copier le modèle de config et générer les deux secrets :

   ```bash
   cp garage/garage.toml.example garage/garage.toml
   openssl rand -hex 32      # à coller dans rpc_secret
   openssl rand -base64 32   # à coller dans admin_token (et une autre valeur dans metrics_token)
   ```

   Éditer `garage/garage.toml` (gitignored) avec ces valeurs.

2. Démarrer la stack (`docker compose up -d` ou `docker compose -f docker-compose.dev.yml up -d`) — le service `garage` démarre mais n'a encore ni layout, ni bucket, ni clé.

3. Assigner ce nœud unique au cluster (capacité arbitraire, ex. 100 Go — ajuster selon l'espace disque réellement disponible pour les logos, qui restent de toute façon de très petits fichiers) :

   ```bash
   docker compose exec garage /garage status
   # noter l'ID du nœud affiché (colonne "ID"), puis :
   docker compose exec garage /garage layout assign -z dc1 -c 100G <ID_DU_NOEUD>
   docker compose exec garage /garage layout apply --version 1
   ```

4. Créer le bucket et une clé d'API dédiés à l'app :

   ```bash
   docker compose exec garage /garage bucket create app-logos
   docker compose exec garage /garage key create application-hub
   docker compose exec garage /garage bucket allow --read --write --key application-hub app-logos
   docker compose exec garage /garage key info application-hub --show-secret
   ```

5. Copier le "Key ID" et le "Secret key" affichés par la dernière commande dans `.env` :

   ```
   GARAGE_ACCESS_KEY_ID=...
   GARAGE_SECRET_ACCESS_KEY=...
   ```

6. Redémarrer l'app (`docker compose restart app`) — le téléversement de logo est alors actif.

`GARAGE_BUCKET` doit correspondre au nom du bucket créé à l'étape 4 (`app-logos` par défaut). Les autres variables (`GARAGE_S3_ENDPOINT`, `GARAGE_REGION`) n'ont normalement pas besoin d'être changées avec la configuration par défaut de `docker-compose.yml`.

## Variables d'environnement (référence complète)

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe Postgres, utilisé par le service `postgres` et par l'app (connexion par champs séparés, pas d'URL) |
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` | Optionnels, déjà cohérents par défaut avec le service `postgres` du compose (`postgres`/`5432`/`application_hub`/`application_hub`) |
| `SESSION_SECRET` | Chaîne aléatoire longue pour signer les cookies de session |
| `AUTHENTIK_ISSUER_URL` | URL d'issuer OIDC de l'application Authentik (interne, ex: `http://authentik-server:9000/application/o/application-hub/`, ou publique) |
| `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | Identifiants du provider Authentik |
| `OIDC_REDIRECT_URI` | URL publique de callback, doit correspondre à celle configurée dans Authentik |
| `ADMIN_GROUP_NAME` | Nom du groupe Authentik dont les membres deviennent admins (accès à `/admin.html`) |
| `AUTHENTIK_PUBLIC_URL` | Optionnel — URL publique d'Authentik, pour afficher un lien "Mon compte" (nav + page profil). Masqué si absent |
| `TRAEFIK_NETWORK_NAME` | Nom du réseau Docker externe partagé avec Traefik et Authentik (défaut `traefik-proxy`) |
| `APP_DOMAIN` | Nom de domaine public utilisé par Traefik pour router vers l'app |
| `APP_PORT` | Port hôte utilisé uniquement par `docker-compose.dev.yml` (test local sans Traefik) |
| `GARAGE_S3_ENDPOINT` | Optionnel — endpoint S3 interne de Garage (défaut `http://garage:3900`, cohérent avec le nom de service du compose) |
| `GARAGE_REGION` | Optionnel — région S3 utilisée par Garage (défaut `garage`, doit correspondre à `s3_region` dans `garage/garage.toml`) |
| `GARAGE_BUCKET` | Optionnel — nom du bucket contenant les logos (défaut `app-logos`) |
| `GARAGE_ACCESS_KEY_ID` / `GARAGE_SECRET_ACCESS_KEY` | Identifiants de la clé d'API Garage créée lors de la configuration initiale (voir [Stockage des logos](#stockage-des-logos-garage)). Sans eux, le téléversement de logo est désactivé (erreur claire), le reste de l'app fonctionne normalement |

Les migrations SQL (`src/db/migrations/*.sql`) sont exécutées automatiquement au démarrage du conteneur, de façon idempotente.

## Tester en local sans Authentik

Un mode `DEV_BYPASS_AUTH` remplace la redirection OIDC par un simple formulaire "choisissez un nom" — **à n'utiliser qu'en local, jamais en production**.

```bash
cp .env.example .env
```

Dans `.env` :

```
DEV_BYPASS_AUTH=true
POSTGRES_PASSWORD=changeme
SESSION_SECRET=une-longue-chaine-aleatoire
```

Puis, avec Docker Compose :

```bash
docker compose -f docker-compose.dev.yml up --build
```

Ou sans Docker, avec un Postgres local :

```bash
npm install
# démarrer un Postgres local, puis dans .env : PGHOST=localhost + POSTGRES_PASSWORD assorti
npm run migrate
npm start
```

Ouvrir `http://localhost:3000` redirige vers `/auth/login`, qui affiche un formulaire pour choisir un nom (et cocher "Compte admin" pour tester `/admin.html`).

## Rôles

- **Membre** : voit toutes les applications visibles par tous, plus celles associées à ses groupes Authentik.
- **Admin** (membre du groupe `ADMIN_GROUP_NAME`) : en plus, accède à `/admin.html` pour gérer les applications listées sur le hub.

Il n'y a pas de gestion des comptes utilisateurs dans l'application elle-même — Authentik reste la seule source de vérité pour qui a accès et qui est admin (claim `groups`, recalculé à chaque connexion).

## Structure du projet

```
application-hub/
├── Dockerfile, docker-compose.yml, docker-compose.dev.yml
├── garage/garage.toml.example   # modèle de config Garage (garage.toml réel gitignored)
├── src/
│   ├── server.js, app.js, config.js
│   ├── db/            # pool Postgres, migration runner, migrations SQL
│   ├── auth/          # OIDC (Authentik), session, middleware, routes /auth
│   ├── routes/        # routes API /api/*
│   ├── repositories/  # accès SQL (users, apps, catégories)
│   └── lib/           # helpers (asyncHandler, client S3 Garage)
└── public/
    ├── *.html          # une page par fonctionnalité
    ├── css/style.css
    └── js/             # fetch wrapper, rendu, logique par page
```
