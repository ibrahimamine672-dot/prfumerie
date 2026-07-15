# Architecture du Projet — Prfumerie (Parfum)

> **Date de l'audit** : 15 juillet 2026
> **Projet** : Parfum / Prfumerie — Boutique de parfums de luxe en ligne
> **Domaine** : bookingg.buzz (configuré dans le code)

---

## Table des Matières

1. [Vue générale de l'architecture](#1-vue-générale-de-larchitecture)
2. [Arborescence complète du projet](#2-arborescence-complète-du-projet)
3. [Architecture Frontend](#3-architecture-frontend)
4. [Architecture Backend](#4-architecture-backend)
5. [Base de données MongoDB](#5-base-de-données-mongodb)
6. [Flux de réservation complet](#6-flux-de-réservation-complet)
7. [Architecture Stripe](#7-architecture-stripe)
8. [Authentification et autorisation](#8-authentification-et-autorisation)
9. [Emails](#9-emails)
10. [Dashboard Admin](#10-dashboard-admin)
11. [Déploiement](#11-déploiement)
12. [Variables d'environnement](#12-variables-denvironnement)
13. [Endpoints API](#13-endpoints-api)
14. [Diagramme textuel de l'architecture](#14-diagramme-textuel-de-larchitecture)
15. [Diagramme du flux de commande](#15-diagramme-du-flux-de-commande)
16. [Qualité du code](#16-qualité-du-code)
17. [Problèmes détectés](#17-problèmes-détectés)
18. [Sécurité](#18-sécurité)
19. [Performance](#19-performance)
20. [Recommandations](#20-recommandations)
21. [Résumé final](#21-résumé-final)

---

## 1. Vue générale de l'architecture

### Rôle du Frontend

L'application frontend est une **Single Page Application (SPA)** React 19 qui présente une boutique de parfums de luxe fictive appelée **"Maison Dorée"**. Elle utilise Create React App (react-scripts 5.0.1) avec React Router v7 pour la navigation.

**Fonctionnalités exposées** :
- Page d'accueil luxueuse avec héros animé (framer-motion)
- Catalogue de 9 parfums avec filtres (catégorie, genre, prix, recherche textuelle)
- Pages de détail produit avec notes olfactives
- Panier latéral (slide-in) avec gestion des quantités
- Checkout multi-étapes avec informations de livraison
- Authentification (inscription/connexion)
- Profil utilisateur avec programme de fidélité
- Dashboard admin de gestion des commandes
- Export Excel des commandes
- Mode sombre

### Rôle du Backend

Le backend est une **API REST Express.js** (v4.21.2) qui sert :

- Les données des parfums (CRUD complet)
- L'authentification JWT (inscription, connexion, validation de code promo)
- La gestion des commandes (création, suivi, statuts)
- L'administration (listage utilisateurs, gestion des commandes, export Excel)
- L'envoi d'emails de confirmation (via Brevo SMTP)
- Un programme de fidélité (1 article gratuit tous les 10 achats)

### Rôle de MongoDB

MongoDB (via Mongoose v8) stocke :

- **Users** : comptes utilisateurs avec rôles, mots de passe hashés (bcrypt, 12 rounds), code promo et statut fidélité
- **Orders** : commandes complètes avec items, paiement, livraison, statuts et références utilisateur
- **Perfumes** : catalogue de produits avec stock, prix, catégories et notes

### Rôle de Stripe

**Aucune intégration Stripe réelle n'est présente dans le code.** Les méthodes de paiement sont simulées (*fake*) :

- `cash_on_delivery` : paiement à la livraison (statut "pending")
- `card_fake` : paiement fictif par carte (statut immédiat "paid")
- `paypal_fake` : paiement fictif PayPal (statut immédiat "paid")

Aucune clé Stripe, aucun webhook, aucune création de PaymentIntent ou Checkout Session n'existe.

### Rôle des Emails

Le service d'email utilise **Nodemailer v9** avec **Brevo SMTP** (ex Sendinblue) pour envoyer des confirmations de commande. L'envoi est en *fire-and-forget* : une erreur d'email ne bloque jamais la création de commande.

### Rôle du Dashboard Admin

Page frontend (`/admin/orders`) protégée par le rôle `admin` qui permet :
- Visualisation de toutes les commandes dans un tableau
- Statistiques (total, en attente, expédiées, livrées)
- Consultation détaillée d'une commande via un modal
- Mise à jour du statut de paiement et de livraison
- Saisie du numéro de suivi et date estimée
- Export Excel des commandes

### Communication entre les parties

```
Utilisateur (Browser)
    ↕ HTTPS
Frontend React (Vercel / Docker)
    ↕ API REST (JSON)
Backend Express (Vercel Serverless / Docker)
    ↕ Mongoose ODM
MongoDB Atlas (ou Docker)
    ↓ (fire-and-forget)
Service Email (Brevo SMTP via Nodemailer)
```

---

## 2. Arborescence complète du projet

```
parfum/
├── ARCHITECTURE.md                          ← Ce fichier
├── .gitignore
├── docker-compose.yml                       ← Production (frontend+backend+ mongodb)
├── docker-compose.dev.yml                   ← Développement (hot-reload)
├── zap.yaml                                 ← Config OWASP ZAP scan
├── zap-report.html                          ← Rapport de scan ZAP
│
├── frontend/                                ← Application React SPA
│   ├── package.json                         ← Dépendances React 19, CRA, framer-motion
│   ├── vercel.json                          ← Déploiement Vercel (rewrites SPA + proxy API)
│   ├── Dockerfile                           ← Build multi-stage (Nginx)
│   ├── Dockerfile.dev                       ← Dev container (hot-reload)
│   ├── nginx.conf                           ← Reverse proxy Nginx (gzip, cache, proxy API)
│   ├── .editorconfig
│   ├── .eslintrc.js
│   ├── .dockerignore
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── scripts/
│   │   └── generate-favicon.js              ← Script de génération de favicon
│   └── src/
│       ├── index.js                         ← Point d'entrée React
│       ├── App.js                           ← Composant racine (providers, routes)
│       ├── config.js                        ← Configuration API_URL + parseJSON helper
│       ├── setupTests.js
│       ├── styles/
│       │   └── global.css                   ← Variables CSS, reset, dark mode, utilitaires
│       ├── data/
│       │   └── perfumes.js                  ← Données statiques des 9 parfums (seed locale)
│       ├── lib/
│       │   └── auth.js                      ← Utilitaire getAuthToken()
│       ├── context/
│       │   ├── AuthContext.js               ← Contexte auth (login, logout, token, role)
│       │   ├── CartContext.js               ← Contexte panier (items, total, localStorage)
│       │   └── WishlistContext.js           ← Contexte wishlist (localStorage)
│       ├── components/
│       │   ├── Navbar.js                    ← Barre de navigation responsive + mobile menu
│       │   ├── Navbar.css
│       │   ├── Cart.js                      ← Panier slide-in (drawer latéral)
│       │   ├── Cart.css
│       │   ├── Footer.js                    ← Footer avec liens et réseaux sociaux
│       │   ├── Footer.css
│       │   ├── PerfumeCard.js               ← Carte produit avec wishlist
│       │   ├── PerfumeCard.css
│       │   ├── Logo.js                      ← Composant logo SVG
│       │   ├── LoadingScreen.js             ← Écran de chargement initial animé
│       │   ├── LoadingScreen.css
│       │   ├── ErrorBoundary.js             ← Capture d'erreurs React
│       │   ├── DarkModeToggle.js            ← Bascule mode sombre
│       │   └── __tests__/
│       │       └── Cart.test.js
│       └── pages/
│           ├── Home.js                      ← Page d'accueil (hero, featured, brand story, newsletter)
│           ├── Home.css
│           ├── Products.js                  ← Catalogue avec filtres et recherche
│           ├── Products.css
│           ├── ProductDetail.js             ← Détail produit avec notes olfactives
│           ├── ProductDetail.css
│           ├── Checkout.js                  ← Checkout (livraison, paiement, résumé)
│           ├── Checkout.css
│           ├── SignIn.js                    ← Connexion utilisateur
│           ├── SignIn.css
│           ├── SignUp.js                    ← Inscription avec code promo
│           ├── SignUp.css
│           ├── Orders.js                    ← Liste des commandes utilisateur
│           ├── Orders.css
│           ├── Profile.js                   ← Profil et programme de fidélité
│           ├── AdminOrders.js               ← Dashboard admin (commandes, export, modal)
│           ├── AdminOrders.css
│           ├── NotFound.js                  ← Page 404
│           └── __tests__/
│               ├── AdminOrders.test.js
│               └── Profile.test.js
│
├── backend/                                 ← API REST Express.js
│   ├── package.json                         ← Dépendances (express, mongoose, bcrypt, etc.)
│   ├── server.js                            ← Point d'entrée Express (middleware, routes, sécurité)
│   ├── vercel.json                          ← Déploiement Vercel serverless
│   ├── Dockerfile                           ← Production multi-stage (node:20-alpine)
│   ├── Dockerfile.dev                       ← Dev container (nodemon)
│   ├── .gitignore
│   ├── .dockerignore
│   ├── jest.config.js
│   ├── seed.js                              ← Script d'initialisation BDD (parfums + admin)
│   ├── seed-orders.js                       ← Script de seed de commandes de test
│   ├── api/
│   │   └── index.js                         ← Point d'entrée Vercel serverless (importe server.js)
│   ├── config/
│   │   ├── db.js                            ← Connexion MongoDB (avec cache de connexion)
│   │   └── admin.js                         ← Provisioning du compte admin (via variables env)
│   ├── models/
│   │   ├── User.js                          ← Modèle utilisateur (bcrypt, role, fidélité)
│   │   ├── Order.js                         ← Modèle commande (items, payment, delivery)
│   │   └── Perfume.js                       ← Modèle parfum (stock, catégories, index text)
│   ├── routes/
│   │   ├── auth.js                          ← Routes auth (/register, /login, /me, /validate-discount)
│   │   ├── orders.js                        ← Routes commandes (CRUD, statuts, optional auth)
│   │   ├── perfumes.js                      ← Routes parfums (public + admin CRUD)
│   │   └── admin.js                         ← Routes admin (/orders, /users, /export, /fulfillment)
│   ├── controllers/
│   │   ├── authController.js                ← Logique auth (register, login, validateDiscount, getMe)
│   │   ├── orderController.js               ← Logique commandes (create, get, update, export)
│   │   ├── perfumeController.js             ← Logique parfums (CRUD, bestsellers, filtres)
│   │   └── adminController.js               ← Logique admin (getUsers, getOrders)
│   ├── middleware/
│   │   ├── auth.js                          ← Middleware protect (JWT) + admin (role check)
│   │   ├── errorHandler.js                  ← Gestion centralisée des erreurs
│   │   └── validation.js                    ← Validation express-validator + XSS sanitize
│   ├── services/
│   │   └── emailService.js                  ← Service email (Nodemailer + Brevo SMTP, template HTML)
│   ├── lib/
│   │   └── kv-store.js                      ← Store distribué pour rate limiting (Vercel KV)
│   ├── scripts/
│   │   └── provision-admin.js               ← Script CLI pour créer le compte admin
│   └── tests/
│       ├── testUtils.js
│       ├── orderController.test.js
│       ├── paymentDelivery.integration.test.js
│       ├── exportOrders.integration.test.js
│       ├── xssSanitize.test.js
│       └── xssEndpoints.integration.test.js
```

---

## 3. Architecture Frontend

### Framework utilisé
- **React 19.2.7** via Create React App (react-scripts 5.0.1)
- Pas de Vite, pas de Next.js. CRA standard.

### Système de routing
- **react-router-dom v7.18.0** avec `BrowserRouter`
- Routes définies dans `App.js` :
  - `/` → Home
  - `/products` → Products (avec query params `?gender=Men|Women|Unisex`)
  - `/product/:id` → ProductDetail (id numérique de 1 à 9)
  - `/signup` → SignUp (inscription)
  - `/signin` → SignIn (connexion)
  - `/checkout` → Checkout
  - `/admin/orders` → AdminOrders (dashboard admin)
  - `/orders` → Orders (commandes utilisateur)
  - `/profile` → Profile
  - `*` → NotFound (404)

### Pages principales

| Page | Route | Fichier | Description |
|------|-------|---------|-------------|
| Accueil | `/` | `Home.js` | Hero animé, featured products, brand story, bestsellers, newsletter |
| Catalogue | `/products` | `Products.js` | Grille de produits avec filtres, recherche, tri |
| Détail produit | `/product/:id` | `ProductDetail.js` | Notes olfactives (tabs), quantité, add to cart |
| Inscription | `/signup` | `SignUp.js` | Formulaire 5 champs, offre -15%, écran de succès avec code promo |
| Connexion | `/signin` | `SignIn.js` | Formulaire email/password, lien inscription |
| Checkout | `/checkout` | `Checkout.js` | Livraison, mode livraison, paiement, code promo, résumé |
| Admin | `/admin/orders` | `AdminOrders.js` | Tableau, stats, modal détail, export Excel |
| Mes commandes | `/orders` | `Orders.js` | Liste des commandes du user connecté |
| Profil | `/profile` | `Profile.js` | Infos profil, fidélité (barre de progression), historique |
| 404 | `*` | `NotFound.js` | Page non trouvée |

### Composants réutilisables

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Navbar | `Navbar.js` | Navigation responsive, menu mobile, cart button, auth buttons |
| Cart | `Cart.js` | Panier latéral (drawer) avec gestion des quantités |
| Footer | `Footer.js` | Pied de page avec liens et réseaux sociaux |
| PerfumeCard | `PerfumeCard.js` | Carte produit avec wishlist, badge, overlay hover |
| Logo | `Logo.js` | Logo SVG Maison Dorée |
| LoadingScreen | `LoadingScreen.js` | Écran de chargement initial (barre de progression animée) |
| ErrorBoundary | `ErrorBoundary.js` | Capture d'erreurs React avec fallback UI |
| DarkModeToggle | `DarkModeToggle.js` | Bascule thème clair/sombre |

### Gestion de l'état

Trois Contextes React (pas de Redux, pas de Zustand) :

| Contexte | Fichier | État géré | Persistance |
|----------|---------|-----------|-------------|
| AuthContext | `AuthContext.js` | token, user, isAdmin, login, logout, updateUser | localStorage (token + user) |
| CartContext | `CartContext.js` | items, total, count, isOpen, CRUD | localStorage (parfum_cart) |
| WishlistContext | `WishlistContext.js` | wishlist (IDs), isWishlisted, toggleWishlist | localStorage (parfum_wishlist) |

### Appels API

Tous les appels backend passent par `fetch()` natif, en utilisant `API_URL` (configuré dans `config.js`) et `parseJSON()` (gestion sécurisée du parsing).

**Sources des appels API** :

| Page/Fonction | Endpoint | Méthode |
|---------------|----------|---------|
| SignIn | `POST /auth/login` | Connexion |
| SignUp | `POST /auth/register` | Inscription |
| Checkout (apply discount) | `POST /auth/validate-discount` | Validation code promo |
| Checkout (place order) | `POST /orders` | Création commande |
| Orders | `GET /orders/mine` | Mes commandes |
| AdminOrders | `GET /admin/orders` | Toutes les commandes |
| AdminOrders (fulfillment) | `PATCH /admin/orders/:id/fulfillment` | Mise à jour statut |
| AdminOrders (export) | `GET /admin/orders/export` | Export Excel |
| Profile | `GET /orders/mine` | Données commandes + fidélité |

### Authentification frontend

- Le **token JWT** est stocké dans `localStorage('token')`
- Les **données utilisateur** sont stockées dans `localStorage('user')` (JSON stringifié)
- Le token est envoyé via l'en-tête `Authorization: Bearer <token>`
- Le hook `useAuth()` expose `token`, `user`, `isAdmin`, `login()`, `logout()`, `updateUser()`
- Le helper `getAuthToken()` dans `lib/auth.js` est une alternative pour les appels hors cycle React

### Gestion des formulaires

- Pas de library de formulaire (Formik, React Hook Form). État local `useState`.
- Validation basique côté client (champs requis, email format).
- Les erreurs backend sont affichées via des messages d'erreur dans l'UI.
- L'inscription gère un écran de succès avec code promo affiché.

### Intégration Stripe frontend

**Aucune intégration Stripe.** Le frontend propose simplement un choix entre :
- `cash_on_delivery` (paiement à la livraison)
- `card_fake` (simulation de carte bancaire)
- `paypal_fake` (simulation PayPal)

Aucun élément `<StripeElements>`, `ElementsConsumer`, `CardElement`, ni `stripe.js` n'est importé.

### Responsive design

- Breakpoints : 768px (tablette) et 480px (mobile) dans `global.css`
- Navigation : menu hamburger sur mobile, desktop links sur écrans larges
- Grilles adaptatives : `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- Container max-width: 1240px avec padding responsive
- Variables CSS `var(--font-*)` pour une typographie cohérente
- Support `prefers-reduced-motion`

### Variables d'environnement Frontend

| Variable | Usage | Source |
|----------|-------|--------|
| `VITE_API_URL` | URL de l'API (override Vite) | `import.meta.env` |
| `REACT_APP_API_URL` | URL de l'API (override CRA) | `process.env` |
| Défaut production | `https://prfumerie-backend.vercel.app/api` | Hardcodé dans `config.js` |
| Défaut local | `http://localhost:5002/api` | Hardcodé dans `config.js` |

---

## 4. Architecture Backend

### Fichier principal du serveur

**Fichier** : `backend/server.js`

L'application Express est configurée avec :

1. **Security checks** au démarrage : validation de la longueur de JWT_SECRET (≥ 32 caractères)
2. **Request timeout** : 9 secondes sur les routes `/api/` (évite les timeouts Vercel)
3. **Helmet** : sécurité HTTP (CSP, HSTS, frameguard, noSniff, referrerPolicy)
4. **CORS** : origins autorisées (production + localhost)
5. **express.json** : body parser (limite 1MB)
6. **mongoSanitize** : prévention NoSQL injection
7. **xssSanitize** : middleware custom de sanitization XSS
8. **Morgan** : logging HTTP (format 'dev')
9. **Rate Limiting** : global + auth routes
10. **DB connection middleware** : connexion MongoDB avant chaque requête (pour Vercel)
11. **Route mounting** : double montage (`/api/name` + `/name`) pour compatibilité Vercel
12. **Catch-all 404** : routes non trouvées
13. **Error handler** : gestion centralisée des erreurs

### Routes Express

| Fichier | Base path | Routes |
|---------|-----------|--------|
| `routes/auth.js` | `/api/auth` | POST /register, POST /login, GET /me, POST /validate-discount |
| `routes/orders.js` | `/api/orders` | POST /, GET /, GET /mine, GET /:id, PUT /:id/status |
| `routes/perfumes.js` | `/api/perfumes` | GET /, GET /bestsellers, GET /:id, POST /, PUT /:id, DELETE /:id |
| `routes/admin.js` | `/api/admin` | GET /orders, GET /orders/export, PATCH /orders/:id/fulfillment, GET /users |

### Middlewares

| Middleware | Fichier | Rôle |
|------------|---------|------|
| `protect` | `middleware/auth.js` | Vérifie JWT, charge l'utilisateur (sans password) |
| `admin` | `middleware/auth.js` | Vérifie le rôle admin |
| `errorHandler` | `middleware/errorHandler.js` | Gestion centralisée (CastError, ValidationError, duplicate key) |
| `validate` | `middleware/validation.js` | Exécute les validations express-validator |
| `xssSanitize` | `middleware/validation.js` | Nettoie récursivement les strings (strip HTML, escape chars) |
| `registerValidation` | `middleware/validation.js` | Validation inscription (name, email, phone, location, password) |
| `loginValidation` | `middleware/validation.js` | Validation connexion (email, password) |
| `createOrderValidation` | `middleware/validation.js` | Validation création commande (19 règles) |
| `updateOrderStatusValidation` | `middleware/validation.js` | Validation mise à jour statut |
| `updateOrderFulfillmentValidation` | `middleware/validation.js` | Validation mise à jour fulfillment |
| `createPerfumeValidation` | `middleware/validation.js` | Validation création parfum (11 règles) |
| `updatePerfumeValidation` | `middleware/validation.js` | Validation mise à jour parfum |
| `deletePerfumeValidation` | `middleware/validation.js` | Validation suppression parfum |

### Controllers

| Controller | Fichier | Fonctions exportées |
|------------|---------|---------------------|
| **auth** | `controllers/authController.js` | `register`, `login`, `validateDiscount`, `getMe` |
| **order** | `controllers/orderController.js` | `createOrder`, `getOrders`, `getOrderById`, `getMyOrders`, `updateOrderStatus`, `updateOrderFulfillment`, `exportOrdersToExcel` |
| **perfume** | `controllers/perfumeController.js` | `getPerfumes`, `getPerfumeById`, `createPerfume`, `updatePerfume`, `deletePerfume`, `getBestsellers` |
| **admin** | `controllers/adminController.js` | `getUsers`, `getOrders` |

### Sécurité

- **CORS** : liste blanche d'origines (production + localhost), pas de wildcard `*`
- **Helmet** : CSP configurée, HSTS 1 an, frameguard deny, noSniff, referrerPolicy
- **Rate Limiting** : 
  - Global : 100 requêtes / 15 min (production)
  - Auth : 10 requêtes / 15 min
  - Login : 5 tentatives / heure
  - Orders : 20 créations / 15 min
  - Store distribué via Vercel KV (fallback mémoire)
- **express-mongo-sanitize** : prévention injection NoSQL ($ne, $gt, etc.)
- **XSS sanitize** : nettoyage récursif des body strings (strip HTML, escape chars spéciaux)
- **JWT_SECRET validation** au démarrage (≥ 32 caractères)
- **Password hashing** : bcrypt avec 12 rounds
- **Validation** : express-validator sur tous les endpoints critiques

---

## 5. Base de données MongoDB

### Modèle User (`backend/models/User.js`)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase, trim |
| `phone` | String | required, trim |
| `location` | String | required, trim |
| `password` | String | required, 8-128 chars, hashé bcrypt (12 rounds) via pre('save') |
| `role` | String | enum ['user', 'admin'], default 'user' |
| `discountCode` | String | default null |
| `completedOrders` | Number | default 0, min 0 |
| `freeItemAvailable` | Boolean | default false |
| `timestamps` | true | createdAt, updatedAt |

**Méthodes** :
- `comparePassword(candidatePassword)` : compare un mot de passe avec le hash bcrypt
- Pre-save hook : hash le mot de passe si modifié

### Modèle Order (`backend/models/Order.js`)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `name` | String | required, trim |
| `email` | String | required, lowercase, trim |
| `phone` | String | trim, default '' |
| `location` | String | required, trim |
| `items` | [orderItemSchema] | required, validate: min 1 item |
| `subtotal` | Number | required, min 0 |
| `shipping` | Number | default 0, min 0 |
| `discountCode` | String | default null |
| `discountPercent` | Number | default 0, 0-100 |
| `discountAmount` | Number | default 0, min 0 |
| `total` | Number | required, min 0 |
| `productsPrice` | Number | required, min 0 |
| `deliveryPrice` | Number | required, min 0 |
| `totalPrice` | Number | required, min 0 |
| `payment` | paymentSchema | required |
| `delivery` | deliverySchema | required |
| `freeItemApplied` | Boolean | default false |
| `freeItemDiscount` | Number | default 0, min 0 |
| `status` | String | enum ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default 'pending' |
| `user` | ObjectId (ref User) | default null |
| `timestamps` | true | createdAt, updatedAt |

**Sous-schémas** :

**orderItemSchema** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `perfumeId` | Mixed (Number ou String) | required |
| `name` | String | required |
| `price` | Number | required |
| `quantity` | Number | required, min 1 |
| `size` | String | default '' |
| `image` | String | default '' |

**paymentSchema** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `method` | String | enum ['cash_on_delivery', 'card_fake', 'paypal_fake'], default 'cash_on_delivery' |
| `status` | String | enum ['pending', 'paid', 'failed', 'refunded'], default 'pending' |
| `amount` | Number | required, min 0 |
| `transactionId` | String | default null |
| `paidAt` | Date | default null |

**deliverySchema** :
| Champ | Type | Contraintes |
|-------|------|-------------|
| `fullName` | String | required, trim |
| `phone` | String | required, trim |
| `address` | String | required, trim |
| `city` | String | required, trim |
| `postalCode` | String | required, trim |
| `deliveryMethod` | String | enum ['standard', 'express'] |
| `deliveryPrice` | Number | required, min 0 |
| `status` | String | enum ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] |
| `trackingNumber` | String | default null |
| `estimatedDeliveryDate` | Date | default null |
| `deliveredAt` | Date | default null |

**Indexes** :
```javascript
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'delivery.status': 1 });
orderSchema.index({ createdAt: -1 });
```

### Modèle Perfume (`backend/models/Perfume.js`)

| Champ | Type | Contraintes |
|-------|------|-------------|
| `name` | String | required, trim |
| `brand` | String | required, default 'MAISON DORÉE' |
| `price` | Number | required, min 0 |
| `category` | String | required, enum ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne'] |
| `gender` | String | required, enum ['Men', 'Women', 'Unisex'] |
| `image` | String | required |
| `description` | String | required |
| `notes.top` | [String] | Notes de tête |
| `notes.middle` | [String] | Notes de cœur |
| `notes.base` | [String] | Notes de fond |
| `size` | String | required |
| `bestseller` | Boolean | default false |
| `stock` | Number | required, default 0, min 0 |
| `active` | Boolean | default true |
| `timestamps` | true | createdAt, updatedAt |

**Indexes** :
```javascript
perfumeSchema.index({ name: 'text', brand: 'text', description: 'text' });  // Full-text search
perfumeSchema.index({ category: 1, gender: 1, price: 1 });                  // Filtres combinés
perfumeSchema.index({ bestseller: 1 });                                      // Bestsellers
```

---

## 6. Flux de réservation complet

### Étape 1 : Navigation et sélection

| Élément | Détail |
|---------|--------|
| **Page** | Home (`/`) → Products (`/products`) → ProductDetail (`/product/:id`) |
| **Action** | Ajout au panier via `addItem(perfume, quantity)` → CartContext → localStorage |
| **Données** | Les parfums viennent du fichier statique `data/perfumes.js` (pas d'appel API) |

### Étape 2 : Checkout

| Élément | Détail |
|---------|--------|
| **Page** | Checkout (`/checkout`) |
| **Action** | Remplissage formulaire livraison, choix mode livraison, méthode de paiement, code promo |

### Étape 3 : Création de la commande

| Élément | Détail |
|---------|--------|
| **Page/Fonction** | `Checkout.js` → `handlePlaceOrder()` |
| **Route API** | `POST /api/orders` |
| **Controller** | `orderController.createOrder` |
| **Logique** | Validation livraison → Calcul prix (produits + livraison - réduction - article gratuit) → Vérification stock → Création Order → Décrement stock → Mise à jour fidélité → Envoi email (fire-and-forget) |
| **Paramètres** | `{ name, email, phone, location, delivery: { fullName, phone, address, city, postalCode, deliveryMethod }, payment: { method }, items: [{ perfumeId, name, price, quantity, size, image }] }` |

### Étape 4 : Paiement

| Élément | Détail |
|---------|--------|
| **Méthode** | `cash_on_delivery` → status 'pending' / `card_fake` ou `paypal_fake` → status 'paid' immédiat |
| **Transaction ID** | Généré localement via `crypto.randomUUID()` avec préfixe CARD/PAYPAL |

### Étape 5 : Confirmation

| Élément | Détail |
|---------|--------|
| **Réponse** | `{ _id, name, email, location, productsPrice, deliveryPrice, total, payment, delivery, items, status, emailSent, freeItemApplied }` |
| **Affichage** | Écran de succès avec détails de la commande, statut paiement, confirmation email, article gratuit |

### Étape 6 : Email

| Élément | Détail |
|---------|--------|
| **Service** | `emailService.sendOrderConfirmationEmail(order)` |
| **Type** | Fire-and-forget (ne bloque pas la réponse) |
| **Template** | HTML complet avec logo, détails commande, adresse livraison, tableau produits, totaux |

### Étape 7 : Sauvegarde MongoDB

| Élément | Détail |
|---------|--------|
| **Modèle** | Order (créé via `Order.create()`) |
| **Collections touchées** | Orders (insert), Perfumes (decrement stock), Users (update fidelity) |

### Étape 8 : Dashboard Admin

| Élément | Détail |
|---------|--------|
| **Page** | `/admin/orders` |
| **Route API** | `GET /api/admin/orders` (protect + admin) |
| **Affichage** | Tableau paginé, stats, modal de détail, mise à jour fulfillment |

---

## 7. Architecture Stripe

**Aucune intégration Stripe réelle n'existe dans le code.**

Analyse exhaustive :

| Élément | Présent ? | Détail |
|---------|-----------|--------|
| Clé publique Stripe | ❌ Non | Aucune variable `STRIPE_PUBLISHABLE_KEY` |
| Clé secrète Stripe | ❌ Non | Aucune variable `STRIPE_SECRET_KEY` |
| Webhook secret | ❌ Non | Aucune variable `STRIPE_WEBHOOK_SECRET` |
| `@stripe/stripe-js` | ❌ Non | Non installé dans package.json frontend |
| `stripe` (npm) | ❌ Non | Non installé dans package.json backend |
| PaymentIntent | ❌ Non | Aucune création |
| Checkout Session | ❌ Non | Aucune utilisation |
| Webhook endpoint | ❌ Non | Aucune route de webhook |
| Signature verification | ❌ Non | Absente |
| Gestion des remboursements | ❌ Non | Absente |
| Double payment protection | ❌ Non | Non applicable |

**Ce qui existe à la place** : 3 méthodes de paiement simulées :
- `cash_on_delivery` : paiement à la livraison, statut "pending"
- `card_fake` : simulation carte, statut immédiat "paid" avec transaction ID factice
- `paypal_fake` : simulation PayPal, statut immédiat "paid" avec transaction ID factice

Le champ `payment` dans le modèle Order supporte les statuts `['pending', 'paid', 'failed', 'refunded']` mais aucune logique métier n'implémente réellement ces transitions (sauf `pending` → `paid` côté admin dashboard).

**Sécurité du paiement** : Non applicable car aucun paiement réel n'est traité.

---

## 8. Authentification et autorisation

### Inscription (`POST /api/auth/register`)

- **Validation** : `registerValidation` (name, email, phone, location, password avec express-validator)
- **Vérification** : email unique, phone + location requis
- **Hash** : bcrypt avec 12 rounds (via pre-save hook User)
- **Code promo** : généré automatiquement (format `WELCOME` + 4 caractères aléatoires)
- **Réponse** : `{ _id, name, email, phone, location, role, discountCode, discountPercent: 15, completedOrders, freeItemAvailable, token }`
- **Status** : 201 Created

### Connexion (`POST /api/auth/login`)

- **Rate limit** : 5 tentatives / heure (production), 500 (dev)
- **Validation** : `loginValidation` (email, password)
- **Vérification** : `user.comparePassword(password)` via bcrypt
- **Réponse** : `{ _id, name, email, role, completedOrders, freeItemAvailable, token }`
- **Status** : 200 OK / 401 Unauthorized

### JWT

- **Génération** : `jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })`
- **Vérification** : `jwt.verify(token, process.env.JWT_SECRET)` dans middleware `protect`
- **Durée** : 7 jours
- **Stockage côté frontend** : `localStorage('token')` + `localStorage('user')`

### Middleware `protect`

1. Extrait le token de l'en-tête `Authorization: Bearer <token>`
2. Vérifie le JWT avec `jwt.verify()`
3. Charge l'utilisateur avec `User.findById(decoded.id).select('-password')`
4. Retourne 401 si token manquant, invalide, ou utilisateur introuvable

### Middleware `admin`

1. Vérifie `req.user.role === 'admin'`
2. Retourne 403 si l'utilisateur n'est pas admin

### Routes protégées

| Route | Middleware | Accès |
|-------|-----------|-------|
| `GET /api/auth/me` | `protect` | Tout utilisateur connecté |
| `POST /api/auth/validate-discount` | `protect` | Tout utilisateur connecté |
| `POST /api/orders` | Optional auth (logique inline) | Tout le monde (avec ou sans token) |
| `GET /api/orders` | `protect` + `admin` | Admin seulement |
| `GET /api/orders/mine` | `protect` | Utilisateur connecté |
| `GET /api/orders/:id` | `protect` | Propriétaire ou admin |
| `PUT /api/orders/:id/status` | `protect` + `admin` | Admin seulement |
| `POST /api/perfumes` | `protect` + `admin` | Admin seulement |
| `PUT /api/perfumes/:id` | `protect` + `admin` | Admin seulement |
| `DELETE /api/perfumes/:id` | `protect` + `admin` | Admin seulement |
| `GET /api/admin/*` | `protect` + `admin` (via `router.use`) | Admin seulement |
| `PATCH /api/admin/orders/:id/fulfillment` | `protect` + `admin` | Admin seulement |

### Risques

| Risque | Niveau | Détail |
|--------|--------|--------|
| Stockage JWT dans localStorage | MOYEN | Vulnérable aux XSS (mais le projet a une sanitization XSS) |
| Token 7 jours sans refresh | MOYEN | Pas de mécanisme de refresh token |
| Pas de blacklist de tokens | FAIBLE | Impossible de révoquer un token avant expiration |
| Données user dans localStorage | FAIBLE | Informations non sensibles (nom, email, rôle) |

---

## 9. Emails

### Service d'email (`backend/services/emailService.js`)

| Élément | Détail |
|---------|--------|
| **Library** | Nodemailer v9 |
| **Provider SMTP** | Brevo (ex Sendinblue) |
| **Template** | HTML inline (pas de library de templating) |
| **Expéditeur** | Configurable via `SMTP_FROM` (défaut: mounadifibrahim1@gmail.com) |
| **Transporter** | Singleton avec cache |

### Config SMTP

| Variable | Rôle |
|----------|------|
| `SMTP_HOST` | Serveur SMTP |
| `SMTP_PORT` | Port SMTP |
| `SMTP_USER` | Utilisateur SMTP |
| `SMTP_PASS` | Mot de passe SMTP |
| `SMTP_SECURE` | TLS (true/false) |
| `SMTP_FROM` | Adresse expéditeur |
| `FRONTEND_URL` | URL frontend pour les liens/images |

### Template d'email

Le template HTML construit manuellement (template literals) inclut :
- En-tête avec logo "Prfumerie" (dégradé dark)
- Message de remerciement personnalisé
- Bloc d'informations commande (numéro, date, statut, mode de paiement)
- Adresse de livraison complète
- Tableau des produits avec image, nom, quantité, sous-total
- Totaux (sous-total, livraison, réduction, article gratuit, total)
- Bouton "Voir ma commande" (lien vers `/orders`)
- Pied de page

### Envoi

- **Fire-and-forget** : l'échec d'envoi n'annule jamais la commande
- **Timeouts courts** : connectionTimeout 6s, greetingTimeout 5s, socketTimeout 7s (évite les 504 sur Vercel)
- **Logging** : messageId loggé en cas de succès, message d'erreur loggé en cas d'échec (SMTP_PASS jamais exposé)

### Gestion des erreurs

- Si SMTP non configuré → `{ success: false, error: 'SMTP transporter not configured' }`
- Si destinataire manquant → `{ success: false, error: 'No recipient email address' }`
- Si échec d'envoi → `{ success: false, error: error.message }`
- Double try/catch : le controller `createOrder` englobe l'appel dans un try/catch supplémentaire

---

## 10. Dashboard Admin

### Fonctionnalités réelles

| Fonctionnalité | Statut | Détail |
|----------------|--------|--------|
| Liste des commandes | ✅ Complète | Tableau paginé avec toutes les commandes |
| Statistiques | ✅ Complète | Total, en attente, expédiées, livrées |
| Détail commande (modal) | ✅ Complète | Infos client, adresse, produits, paiement |
| Mise à jour statut paiement | ✅ Complète | Selecteur paymentStatus (pending/paid/failed/refunded) |
| Mise à jour statut livraison | ✅ Complète | Selecteur deliveryStatus (pending/processing/shipped/delivered/cancelled) |
| Numéro de suivi | ✅ Complète | Champ texte |
| Date estimée de livraison | ✅ Complète | Input date |
| Export Excel | ✅ Complète | Bouton → téléchargement commandes.xlsx |
| Filtres | ❌ Non trouvé | Pas de filtres dans le tableau admin |
| Recherche | ❌ Non trouvé | Pas de barre de recherche |
| Gestion des utilisateurs | ✅ Partielle | Route API `/api/admin/users` mais pas d'UI frontend |
| Gestion des parfums | ❌ Non trouvé | Pas d'interface admin pour gérer les parfums |

### Routes frontend et backend liées

| Fonctionnalité | Frontend | Backend |
|----------------|----------|---------|
| Liste commandes | `AdminOrders.js` → fetchOrders() | `GET /api/admin/orders` (adminController.getOrders) |
| Détail commande | `AdminOrders.js` → openOrder() | Données incluses dans le GET |
| Update fulfillment | `AdminOrders.js` → saveFulfillment() | `PATCH /api/admin/orders/:id/fulfillment` (orderController.updateOrderFulfillment) |
| Export Excel | `AdminOrders.js` → downloadOrdersExcel() | `GET /api/admin/orders/export` (orderController.exportOrdersToExcel) |
| Liste utilisateurs | Pas d'UI | `GET /api/admin/users` (adminController.getUsers) |

---

## 11. Déploiement

### Frontend

| Plateforme | URL / Config |
|------------|--------------|
| **Vercel** | `frontend/vercel.json` |
| **Framework** | Create React App |
| **Build** | `npm run build` → dossier `build/` |
| **Rewrites** | `/api/*` → `https://prfumerie-backend.vercel.app/api/*` + SPA fallback `/*` → `/index.html` |
| **Docker** | `Dockerfile` (multi-stage: node:20-alpine build → nginx:stable-alpine) |
| **Nginx** | `nginx.conf` (gzip, cache static, proxy `/api/` → backend) |

### Backend

| Plateforme | URL / Config |
|------------|--------------|
| **Vercel** | `backend/vercel.json` |
| **Entry point** | `api/index.js` (importe `server.js`) |
| **Runtime** | `@vercel/node` |
| **Docker** | `Dockerfile` (multi-stage, non-root user) |

### Docker Compose

| Environnement | Fichier | Services |
|---------------|---------|----------|
| **Production** | `docker-compose.yml` | frontend (Nginx:80), backend (Express:5000), MongoDB 7 |
| **Développement** | `docker-compose.dev.yml` | Override : hot-reload frontend (port 3000), backend avec nodemon |

### Docker Compose Dev

```yaml
services:
  frontend:
    build: ./frontend/Dockerfile.dev
    ports: ["3000:3000"]
    volumes: [./frontend/src:/app/src, ./frontend/public:/app/public]
    environment:
      REACT_APP_API_URL: http://localhost:5000/api

  backend:
    build: ./backend/Dockerfile.dev
    ports: ["5000:5000"]
    volumes: [./backend:/app, /app/node_modules]
    environment:
      JWT_SECRET: dev_secret_key_123

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongodb-data:/data/db]
```

### Domaine bookingg.buzz

Le domaine **bookingg.buzz** est mentionné par l'utilisateur comme nom de domaine supposé, mais **aucune configuration DNS, SSL ou déploiement lié à ce domaine n'a été trouvé dans le code.**

Les déploiements réels détectés dans le code :
- Frontend : `https://prfumerie.vercel.app` et `https://prfumerie-79sf.vercel.app`
- Backend : `https://prfumerie-backend.vercel.app/api`

### Configuration SSL/TLS

- **Helmet HSTS** : `maxAge: 31536000` (1 an), `includeSubDomains: true`, `preload: true`
- **Helmet CSP** : directives de sécurité (script-src, style-src, img-src, etc.)
- **Pas de certificat SSL configuré manuellement** — géré par Vercel automatiquement

### VPS

- **Pas de configuration VPS trouvée** (pas de Dockerfile VPS, pas de nginx global, pas de PM2)
- Le déploiement Docker Compose peut être utilisé sur un VPS avec Docker

---

## 12. Variables d'environnement

> Liste des noms de variables détectées dans le code, sans valeurs.

### Backend

```
MONGODB_URI
MONGODB_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_NAME
ADMIN_PHONE
ADMIN_LOCATION
ADMIN_LEGACY_EMAIL
CLIENT_URL
NODE_ENV
PORT
REQUEST_TIMEOUT_MS
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_SECURE
SMTP_FROM
FRONTEND_URL
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
VERCEL_ENV
```

### Frontend

```
REACT_APP_API_URL    (Create React App)
VITE_API_URL          (Vite — présente dans le code mais non utilisée car CRA)
```

### Detection notes

- `MONGODB_URI` et `MONGODB_URL` sont tous deux supportés pour la connexion MongoDB.
- `KV_URL` / `KV_REST_API_URL` + `KV_REST_API_TOKEN` sont pour Vercel KV (rate limiting distribué).
- `CLIENT_URL` peut contenir plusieurs origines séparées par des virgules pour CORS.
- Aucune variable Stripe n'est présente (ni attendue, vu l'absence d'intégration).

---

## 13. Endpoints API

### Tableau complet des endpoints

| Méthode | Endpoint | Auth | Rôle | Controller.Fonction |
|---------|----------|------|------|---------------------|
| `GET` | `/` | Public | Health check (API running) | Inline dans server.js |
| `GET` | `/api/health` | Public | Health check sécurisé | Inline dans server.js |
| `POST` | `/api/auth/register` | Public | Inscription utilisateur | `authController.register` |
| `POST` | `/api/auth/login` | Public (rate limit 5/h) | Connexion | `authController.login` |
| `GET` | `/api/auth/me` | `protect` | Profil utilisateur connecté | `authController.getMe` |
| `POST` | `/api/auth/validate-discount` | `protect` | Validation code promo | `authController.validateDiscount` |
| `GET` | `/api/perfumes` | Public | Liste parfums (filtres, pagination) | `perfumeController.getPerfumes` |
| `GET` | `/api/perfumes/bestsellers` | Public | Meilleures ventes | `perfumeController.getBestsellers` |
| `GET` | `/api/perfumes/:id` | Public | Détail parfum | `perfumeController.getPerfumeById` |
| `POST` | `/api/perfumes` | `protect` + `admin` | Création parfum | `perfumeController.createPerfume` |
| `PUT` | `/api/perfumes/:id` | `protect` + `admin` | Mise à jour parfum | `perfumeController.updatePerfume` |
| `DELETE` | `/api/perfumes/:id` | `protect` + `admin` | Suppression parfum | `perfumeController.deletePerfume` |
| `POST` | `/api/orders` | Optional auth (rate limit 20/15min) | Création commande | `orderController.createOrder` |
| `GET` | `/api/orders` | `protect` + `admin` | Liste toutes les commandes | `orderController.getOrders` |
| `GET` | `/api/orders/mine` | `protect` | Commandes de l'utilisateur | `orderController.getMyOrders` |
| `GET` | `/api/orders/:id` | `protect` | Détail commande (propriétaire ou admin) | `orderController.getOrderById` |
| `PUT` | `/api/orders/:id/status` | `protect` + `admin` | Mise à jour statut commande | `orderController.updateOrderStatus` |
| `GET` | `/api/admin/orders` | `protect` + `admin` | Liste commandes (admin) | `adminController.getOrders` |
| `GET` | `/api/admin/orders/export` | `protect` + `admin` | Export Excel commandes | `orderController.exportOrdersToExcel` |
| `PATCH` | `/api/admin/orders/:id/fulfillment` | `protect` + `admin` | Update fulfillment | `orderController.updateOrderFulfillment` |
| `GET` | `/api/admin/users` | `protect` + `admin` | Liste utilisateurs | `adminController.getUsers` |

---

## 14. Diagramme textuel de l'architecture

```
UTILISATEUR (Browser)
     │
     │ HTTPS
     ▼
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (React 19 CRA)            │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Home.js  │  │Products.│  │ ProductDetail.js  │   │
│  │ Hero     │  │ js      │  │ Notes olfactives  │   │
│  │ Featured │  │ Filtres │  │ Quantité          │   │
│  │ Brand    │  │Recherche│  │ → AddToCart       │   │
│  │ Story    │  │ Tri     │  │                   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │SignIn.js │  │SignUp.js │  │   Checkout.js    │   │
│  │Login     │  │Register  │  │ Livraison        │   │
│  │JWT       │  │Code promo│  │ Paiement (fake)  │   │
│  └──────────┘  │ -15%     │  │ Code promo       │   │
│                └──────────┘  │ Résumé           │   │
│                              └──────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │Orders.js │  │Profile.js│  │ AdminOrders.js   │   │
│  │Mes       │  │Fidélité  │  │ Tableau commandes│   │
│  │commandes │  │Barre     │  │ Stats · Modal    │   │
│  │          │  │progrès   │  │ Export Excel     │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  Contexte : AuthContext · CartContext · Wishlist     │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS (fetch API)
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                   │
│                                                          │
│  ┌─ Sécurité ──────────────────────────────────────┐     │
│  │ Helmet · CORS · Rate Limit · mongoSanitize      │     │
│  │ XSS Sanitize · JWT · bcrypt · express-validator │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌── Routes ───────────────────────────────────────┐     │
│  │                                                  │     │
│  │  /api/auth ────▶ authController                 │     │
│  │  ├─ POST /register                              │     │
│  │  ├─ POST /login                                 │     │
│  │  ├─ GET /me                                     │     │
│  │  └─ POST /validate-discount                     │     │
│  │                                                  │     │
│  │  /api/perfumes ──▶ perfumeController            │     │
│  │  ├─ GET /                                       │     │
│  │  ├─ GET /bestsellers                            │     │
│  │  ├─ GET /:id                                    │     │
│  │  ├─ POST /          (admin)                     │     │
│  │  ├─ PUT /:id        (admin)                     │     │
│  │  └─ DELETE /:id     (admin)                     │     │
│  │                                                  │     │
│  │  /api/orders ────▶ orderController              │     │
│  │  ├─ POST /          (optional auth)             │     │
│  │  ├─ GET /           (admin)                     │     │
│  │  ├─ GET /mine       (auth)                      │     │
│  │  ├─ GET /:id        (auth)                      │     │
│  │  └─ PUT /:id/status (admin)                     │     │
│  │                                                  │     │
│  │  /api/admin ────▶ adminController               │     │
│  │  ├─ GET /orders        (admin)                  │     │
│  │  ├─ GET /orders/export (admin)                  │     │
│  │  ├─ PATCH /:id/fulfill (admin)                  │     │
│  │  └─ GET /users         (admin)                  │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌── Services ─────────────────────────────────────┐     │
│  │  Email Service (Brevo SMTP / Nodemailer)        │     │
│  │  └─ Ordre confirmation (HTML template)          │     │
│  │                                                  │     │
│  │  Rate Limit Store (Vercel KV / In-Memory)       │     │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                 MONGODB (via Mongoose)                   │
│                                                          │
│  Collections :                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │    Users    │  │   Orders    │  │   Perfumes    │   │
│  │─────────────│  │─────────────│  │───────────────│   │
│  │ _id (OID)   │  │ _id (OID)   │  │ _id (OID)     │   │
│  │ name        │  │ name        │  │ name          │   │
│  │ email (uniq)│  │ email       │  │ brand         │   │
│  │ password    │  │ items[]     │  │ price         │   │
│  │ role        │  │ payment     │  │ category      │   │
│  │ discountCode│  │ delivery    │  │ gender        │   │
│  │ completedO. │  │ status      │  │ image         │   │
│  │ freeItem    │  │ user (ref)  │  │ notes         │   │
│  │ timestamps  │  │ timestamps  │  │ stock         │   │
│  └─────────────┘  └─────────────┘  │ active        │   │
│                          ↑         │ timestamps    │   │
│                          │         └───────────────┘   │
│                    ┌─────┴─────┐                        │
│                    │ ObjectId  │                        │
│                    └───────────┘                        │
└──────────────────────────────────────────────────────────┘
                              │ (fire-and-forget)
                              ▼
┌──────────────────────────────────────────────────────────┐
│              EMAIL SERVICE (Nodemailer)                  │
│                                                          │
│  Brevo SMTP ──▶ Confirmation de commande                │
│  Template HTML avec logo, détails, tableau produits     │
│  Timeouts: connection 6s, greeting 5s, socket 7s        │
└──────────────────────────────────────────────────────────┘
```

---

## 15. Diagramme du flux de commande

```
CLIENT (Browser)
  │
  │ 1. Parcourt /products → /product/:id
  │    Ajoute au panier (localStorage)
  ▼
CHECKOUT (/checkout)
  │
  │ 2. Remplit le formulaire de livraison
  │    Choisit mode livraison (standard/express)
  │    Choisit méthode paiement (cash/card_fake/paypal_fake)
  │    Optionnel : applique code promo WELCOME*
  ▼
fetch() POST /api/orders (avec ou sans token JWT)
  │
  ▼
BACKEND CONTROLLER (orderController.createOrder)
  │
  │ 3. Valide les données (express-validator + validation manuelle)
  │ 4. Calcule les prix :
  │    ├─ productsPrice = sum(items.price × items.quantity)
  │    ├─ deliveryPrice = (total ≥ 500 → 0) sinon (standard:20, express:40)
  │    ├─ discountAmount = produits × 15% (si code WELCOME valide)
  │    └─ freeItemDiscount = prix du item le moins cher (si fidélité)
  │ 5. Vérifie le stock (si ObjectId valide)
  │
  ▼
MONGODB
  │
  │ 6. Order.create({...}) → Sauvegarde dans collection 'orders'
  │ 7. Perfume.findByIdAndUpdate(...) → Décrémente le stock
  │ 8. User.findByIdAndUpdate(...) → Met à jour completedOrders / freeItemAvailable
  │
  ▼
FIRE-AND-FORGET EMAIL
  │
  │ 9. sendOrderConfirmationEmail(order)
  │    ├─ Si SMTP configuré → Email envoyé → emailSent = true
  │    └─ Si erreur → emailSent = false (commande non bloquée)
  │
  ▼
RÉPONSE API → FRONTEND
  │
  │ 10. { _id, name, email, total, payment, delivery, emailSent, freeItemApplied }
  │
  ▼
ÉCRAN DE SUCCÈS (Checkout.js → orderPlaced state)
  │
  │ 11. clearCart()
  │ 12. Affiche :
  │     ├─ ✓ Commande confirmée
  │     ├─ Adresse de livraison
  │     ├─ Statut paiement
  │     ├─ Statut email (✓ ou ⚠)
  │     └─ 🎁 Article gratuit (si applicable)
  │
  ▼
ADMIN DASHBOARD (/admin/orders)
  │
  │ 13. fetch() GET /api/admin/orders (token admin requis)
  │ 14. Tableau avec stats + modal de détail
  │ 15. Admin peut :
  │     ├─ Modifier paymentStatus
  │     ├─ Modifier deliveryStatus
  │     ├─ Ajouter trackingNumber
  │     └─ Définir estimatedDeliveryDate
  │ 16. Export Excel : GET /api/admin/orders/export
  │
  ▼
CLIENT REÇOIT EMAIL
  │
  │ 17. Email HTML avec récapitulatif complet
  │     Lien vers /orders pour suivi
```

---

## 16. Qualité du code

| Critère | Note (/10) | Commentaire |
|---------|:----------:|-------------|
| **Structure** | 8/10 | Bonne séparation frontend/backend, contextes bien organisés, dossiers clairs |
| **Lisibilité** | 7/10 | Code globalement lisible, noms de fonctions explicites, mais certains composants sont longs (Checkout.js > 400 lignes, AdminOrders.js > 300 lignes) |
| **Duplication** | 6/10 | Les données parfums sont dupliquées entre `data/perfumes.js` (frontend) et `seed.js` (backend) ; la logique `getOrders` est dupliquée dans `orderController` et `adminController` |
| **Séparation des responsabilités** | 7/10 | Bonne séparation models/routes/controllers/services, mais `orderController.js` fait trop de choses (création, logique métier, email, fidélité) |
| **Gestion des erreurs** | 8/10 | Error handler centralisé, try/catch partout, messages d'erreur appropriés, parsing JSON sécurisé |
| **Sécurité** | 8/10 | Helmet, CORS, rate limiting, sanitize, validation, bcrypt — solide. Manque Stripe (pas réel), pas de refresh token |
| **Performance** | 7/10 | Pagination présente, index MongoDB, lazy loading images. Pas de cache Redis applicatif, pas de CDN images |
| **Maintenabilité** | 7/10 | Bon dans l'ensemble, tests présents (backend), mais dépendance à CRA (legacy), pas de TypeScript |
| **Scalabilité** | 6/10 | Stateless (sessions JWT), store distribué KV, mais CRA n'est pas idéal pour scale ; pas de SSR, pas de streaming |
| **Tests** | 5/10 | Tests backend : controllers, intégration paiement/livraison, XSS, export. Tests frontend : 2 fichiers (Cart.test.js, AdminOrders.test.js, Profile.test.js). Couverture limitée. |

**Note globale : 6.9/10**

---

## 17. Problèmes détectés

### CRITIQUE

| # | Fichier | Zone | Problème | Impact | Solution |
|---|---------|------|----------|--------|----------|
| C1 | `backend/server.js` | L.169-170 | Fallback CORS : `callback(null, false)` rejette les origins non listées sans message d'erreur explicite | Les requêtes d'origines inconnues sont silencieusement bloquées | Remplacer par `callback(new Error('Not allowed by CORS'))` pour un message clair |
| C2 | `frontend/vercel.json` | Rewrites | Le proxy API `/api/*` → backend Vercel est hardcodé vers une URL spécifique | Si le backend est redéployé avec une nouvelle URL, le frontend ne fonctionnera plus | Utiliser une variable d'environnement Vercel |
| C3 | Frontend | `data/perfumes.js` | Les données des 9 parfums sont codées en dur dans le frontend | Incohérence possible avec les données backend (seed.js) ; les prix/IDs peuvent diverger | Supprimer les données statiques et utiliser l'API backend `/api/perfumes` |

### ÉLEVÉ

| # | Fichier | Zone | Problème | Impact | Solution |
|---|---------|------|----------|--------|----------|
| H1 | `backend/controllers/orderController.js` | L.89-120 | Logique discount + fidélité mélangée dans le createOrder | Controller trop complexe, difficile à tester | Extraire dans des services séparés (DiscountService, LoyaltyService) |
| H2 | `backend/config/admin.js` | Général | Compte admin provisionné via variables d'environnement | Si les variables changent après création, le mot de passe n'est mis à jour que si différent du hash actuel | Ajouter un mécanisme de force-update |
| H3 | `backend/lib/kv-store.js` | Général | Vercel KV (Upstash Redis) dépend de 3 variables d'environnement qui ne sont pas documentées | Le rate limiting distribué ne fonctionne pas sans KV | Documenter KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN |
| H4 | Frontend | `config.js` | L'URL API production `prfumerie-backend.vercel.app` est hardcodée | Si le backend est déployé ailleurs, le frontend ne fonctionne pas | Rendre l'URL configurable via variable d'environnement Vercel |

### MOYEN

| # | Fichier | Zone | Problème | Impact | Solution |
|---|---------|------|----------|--------|----------|
| M1 | `backend/controllers/orderController.js` | L.175-189 | La vérification de stock ne s'applique qu'aux ObjectId MongoDB valides, pas aux IDs numériques | Les commandes avec des parfums à ID numérique (comme dans data/perfumes.js) ne vérifient pas le stock | Uniformiser les IDs ou ignorer les IDs numériques (si ce sont des données statiques) |
| M2 | `backend/routes/orders.js` | L.22-40 | L'auth optionnelle utilise `jsonwebtoken.verify` directement avec `next()` en cas d'échec | Si un token invalide est fourni, l'erreur JWT est silencieusement ignorée mais l'utilisateur n'est pas attaché | Utiliser le middleware `protect` avec un flag `optional: true` |
| M3 | Frontend | `App.js` | Pas de lazy loading des pages (React.lazy + Suspense) | Le bundle initial inclut toutes les pages, même celles rarement utilisées (AdminOrders) | Ajouter React.lazy() pour les pages admin et secondaires |
| M4 | `backend/server.js` | L.155-187 | Les 404 handlers sont dupliqués pour chaque préfixe de route | Maintenance plus complexe si de nouvelles routes sont ajoutées | Utiliser une boucle ou un map pour générer les 404 |
| M5 | `docker-compose.yml` | L.20 | `JWT_SECRET` avec fallback `changeme_in_production` | Si déployé en production sans setter JWT_SECRET, le secret est faible | Supprimer le fallback, forcer la variable |
| M6 | `frontend/src/data/perfumes.js` | Général | Les prix sont en dollars ($) mais les commandes utilisent MAD | Incohérence d'affichage des prix | Uniformiser la devise |

### FAIBLE

| # | Fichier | Zone | Problème | Impact | Solution |
|---|---------|------|----------|--------|----------|
| F1 | `frontend/src/context/AuthContext.js` | L.9 | Le parse JSON du user stocké peut throw (try/catch présent) | Risque minime, déjà géré | Solution déjà acceptable |
| F2 | `backend/services/emailService.js` | L.264 | L'expéditeur par défaut est une adresse Gmail personnelle (`mounadifibrahim1@gmail.com`) | Non professionnel, peut finir en spam | Utiliser une adresse dédiée |
| F3 | `frontend/nginx.conf` | L.30 | Cache des assets statiques : 1 an | OK mais pas de cache-busting versionné | Déjà géré par CRA (hash dans les noms de fichiers) |
| F4 | `docker-compose.dev.yml` | L.14 | `REACT_APP_API_URL` pointe vers `localhost:5000` mais le serveur tourne sur le port `5002` | En développement hors Docker, l'URL est fausse si on utilise le port 5002 | Aligner les ports ou documenter |
| F5 | `backend/models/User.js` | L.18-22 | Validation password : `8 <= length <= 128` | Limite haute de 128 caractères, certains gestionnaires de mots de passe génèrent plus long | Augmenter à 256 |

---

## 18. Sécurité

### Points forts

| Mesure | Statut |
|--------|--------|
| Helmet (CSP, HSTS, frameguard, noSniff, referrerPolicy) | ✅ Actif |
| CORS avec liste blanche | ✅ Configuré |
| Rate limiting global + auth + login + orders | ✅ Actif |
| express-mongo-sanitize (NoSQL injection) | ✅ Actif |
| XSS sanitize middleware (strip HTML + escape chars) | ✅ Actif |
| bcrypt (12 rounds) pour les mots de passe | ✅ Actif |
| Validation express-validator sur tous les endpoints | ✅ Actif |
| JWT avec durée limitée (7 jours) | ✅ Actif |
| Gestion des erreurs sans leak d'infos (production) | ✅ Actif |
| Pas de secrets exposés dans le code | ✅ Confirmé |

### Points à vérifier/améliorer

| Problème | Niveau | Détail |
|----------|--------|--------|
| Images des parfums | MOYEN | Les URLs d'images sont stockées telles quelles, pas de validation de contenu |
| Pas de bcrypt cost configurable | FAIBLE | Le salt rounds (12) est hardcodé dans le pre-save hook |
| Pas de refresh token | MOYEN | Impossible de révoquer un token volé avant 7 jours |
| JWT stocké dans localStorage | MOYEN | Vulnérable XSS (mais sanitization XSS présente côté backend, pas côté frontend) |
| Aucun paiement réel (Stripe) | ÉLEVÉ | Pas de risque de fuite de données bancaires car pas de Stripe intégré |
| Fallback JWT_SECRET dans docker-compose | CRITIQUE | `changeme_in_production` est dangereux si déployé via Docker sans override |

### Secrets exposés

**Aucun secret exposé dans le code.** Toutes les variables sensibles sont chargées via `process.env` à l'exécution. Le docker-compose.dev.yml contient un JWT_SECRET de développement (`dev_secret_key_123`) qui est attendu.

---

## 19. Performance

### Requêtes MongoDB

| Aspect | Analyse |
|--------|---------|
| Population (populate) | ❌ Non utilisé. Les relations User→Order ne sont pas peuplées |
| Pagination | ✅ Toutes les listes (orders, perfumes, users) utilisent skip/limit |
| Indexes | ✅ 3 indexes sur Perfume, 5 indexes sur Order |
| N+1 queries | ⚠️ `createOrder` boucle sur les items pour vérifier le stock et décrémenter → 2 requêtes par item (mais nombre d'items généralement petit) |
| Lean() | ⚠️ Utilisé seulement dans `exportOrdersToExcel`, pas dans les autres lectures |

### Frontend

| Aspect | Analyse |
|--------|---------|
| Bundle size | CRA avec react-scripts 5 — pas d'analyse de bundle disponible |
| Lazy loading | ❌ Aucun `React.lazy()` utilisé |
| Images | ✅ `loading="lazy"` sur les cartes produits |
| Animations | Framer Motion — peut impacter les performances sur mobile si trop d'animations simultanées |
| Cache | Pas de cache API (React Query, SWR) — chaque navigation re-fetch |
| Dark mode | CSS variables uniquement, pas de re-rendu coûteux |

### Recommandations performance

1. Ajouter `React.lazy()` pour AdminOrders (page rarement visitée)
2. Considérer React Query ou SWR pour le caching des appels API
3. Ajouter `.lean()` sur les requêtes en lecture seule (getOrders, getPerfumes)
4. Optimiser les images (compression WebP via sharp — déjà présent dans devDependencies)

---

## 20. Recommandations

### Urgentes (à faire avant mise en production)

1. **🔴 Supprimer le fallback JWT_SECRET dans docker-compose.yml** (ligne `changeme_in_production`)
2. **🔴 Remplacer les données statiques des parfums** (`data/perfumes.js`) par des appels à l'API backend
3. **🔴 Corriger le fallback CORS silencieux** (`callback(null, false)` → `callback(new Error(...))`)
4. **🟡 Rendre l'URL API configurable via variable Vercel** plutôt que hardcodée

### Importantes

5. **🟡 Extraire la logique métier** du `orderController.createOrder` vers des services dédiés
6. **🟡 Ajouter des tests frontend** (seulement 3 fichiers de test pour tout le frontend)
7. **🟡 Ajouter Stripe réel** ou retirer complètement les références "fake" et clarifier que c'est un MVP
8. **🟡 Remplacer l'email expéditeur par défaut** par une adresse professionnelle

### Optionnelles

9. **🟢 Ajouter React.lazy()** pour les pages admin et secondaires
10. **🟢 Ajouter React Query / SWR** pour le caching des appels API
11. **🟢 Ajouter un refresh token** avec stockage httpOnly cookie
12. **🟢 Migrer vers Vite** (CRA est legacy, react-scripts n'est plus activement maintenu)
13. **🟢 Ajouter TypeScript** pour améliorer la maintenabilité
14. **🟢 Ajouter des meta tags SEO** et un sitemap
15. **🟢 Ajouter les pages de gestion des parfums** dans le dashboard admin
16. **🟢 Ajouter un système de notifications** pour les nouvelles commandes

### Ordre de priorité

```
1. Sécurité (CORS, JWT fallback)     [Semaine 1]
2. Données dynamiques (API perfumes)  [Semaine 1]
3. Services extraction                [Semaine 2]
4. Tests                              [Semaine 2]
5. Stripe réel                        [Semaine 3]
6. Performance optimisations          [Semaine 3]
7. Fonctionnalités avancées           [Semaine 4+]
```

---

## 21. Résumé final

### Architecture actuelle

Le projet **Prfumerie (Parfum)** est une **boutique e-commerce de parfums de luxe** complète avec :

- **Frontend** : React 19 SPA (Create React App) avec routing client-side, animations framer-motion, mode sombre
- **Backend** : Express.js API REST avec JWT auth, MongoDB, validation, sécurité
- **Base de données** : MongoDB (3 collections : Users, Orders, Perfumes)
- **Emails** : Brevo SMTP via Nodemailer pour les confirmations de commande
- **Déploiement** : Vercel (frontend + backend serverless) + Docker Compose (VPS/dédié)

### Technologies

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19.2.7 | UI Framework |
| react-router-dom | 7.18.0 | Routing |
| framer-motion | 12.40.0 | Animations |
| Node.js | 20 (Alpine) | Runtime |
| Express | 4.21.2 | API Framework |
| Mongoose | 8.9.5 | ODM MongoDB |
| bcryptjs | 2.4.3 | Password hashing |
| jsonwebtoken | 9.0.2 | JWT auth |
| Nodemailer | 9.0.3 | Email transport |
| Helmet | 8.0.0 | Security headers |
| express-rate-limit | 8.5.2 | Rate limiting |
| express-validator | 7.3.2 | Input validation |
| exceljs | 4.4.0 | Excel export |
| @vercel/kv | 3.0.0 | Distributed rate limiting |

### Fonctionnalités terminées

- ✅ Catalogue de 9 parfums avec filtres et recherche
- ✅ Pages de détail produit avec notes olfactives
- ✅ Panier et checkout (formulaire livraison, choix livraison, choix paiement)
- ✅ Authentification complète (inscription, connexion, JWT)
- ✅ Code promo automatique -15% (format WELCOME*)
- ✅ Programme de fidélité (1 article gratuit tous les 10 achats)
- ✅ Dashboard admin complet (liste, stats, modal, mise à jour)
- ✅ Export Excel des commandes
- ✅ Emails de confirmation (Brevo SMTP)
- ✅ Mode sombre
- ✅ Pagination API
- ✅ Rate limiting global et par route
- ✅ Validation des entrées (express-validator)
- ✅ Sécurité (Helmet, CORS, mongo-sanitize, XSS sanitize)
- ✅ Docker Compose (dev et production)
- ✅ Déploiement Vercel (frontend + backend)

### Fonctionnalités incomplètes

- ⚠️ **Paiement** : pas d'intégration Stripe réelle, méthodes simulées uniquement
- ⚠️ **Données parfums** : dupliquées entre frontend (statique) et backend (seed)
- ⚠️ **Gestion stock admin** : pas d'interface pour modifier le stock des parfums
- ⚠️ **Filtres admin** : pas de recherche/filtre dans le tableau des commandes
- ⚠️ **Gestion utilisateurs admin** : route API existe mais pas d'UI frontend
- ⚠️ **Tests frontend** : couverture minimale (seulement 3 fichiers)

### Risques

1. **🔴 Aucun paiement réel** : le site ne peut pas encaisser de paiement en l'état
2. **🟡 Discordance données** : les parfums affichés viennent du fichier statique, pas de l'API
3. **🟡 CORS silencieux** : les requêtes rejetées n'ont pas de message d'erreur clair
4. **🟡 JWT fallback Docker** : secret faible si pas surchargé en production
5. **🟢 Stockage localStorage** : token + user dans localStorage (vulnérable XSS côté client)

### Niveau général du projet

**7/10** — Projet fonctionnel et bien structuré. Le code est propre, les bonnes pratiques de sécurité sont en place, et l'architecture est cohérente. Les manques principaux sont l'absence de paiement réel (Stripe), la duplication des données de parfums, et la couverture de tests limitée.

### Valeur technique estimée

- Codebase : **~8 000 lignes de code** (frontend + backend)
- Tests : **6 fichiers de test** (backend surtout)
- Documentation : **ARCHITECTURE.md** (ce document)
- Temps estimé de reconstruction : **4-6 semaines** pour une équipe solo

### Ce qu'il faut faire avant de vendre le site

1. **Intégrer Stripe** (ou un processeur de paiement réel)
2. **Uniformiser les données** (supprimer le fichier statique frontend)
3. **Corriger les failles de sécurité** (CORS fallback, JWT fallback Docker)
4. **Améliorer la couverture de tests** (au moins 70% de coverage)
5. **Ajouter une gestion des utilisateurs** (UI admin pour lister/gérer)
6. **Remplacer l'email Gmail perso** par une adresse professionnelle
7. **Documenter le déploiement** (ce document sert de base)
8. **Auditer la performance** (Lighthouse, bundle analysis)
9. **Ajouter un sitemap et SEO** pour le référencement
10. **Considérer la migration de CRA vers Vite** pour les performances de build

---

*Document généré le 15 juillet 2026 par analyse statique du code source du projet.*

*Fichiers analysés : 45+ fichiers (frontend + backend + config + déploiement)*
