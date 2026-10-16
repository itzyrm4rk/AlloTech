# AlloTech — Gestion des Interventions Techniques en Mobilité

> Plateforme complète de gestion, supervision et exécution d'interventions techniques pour entreprise de maintenance informatique.

---

## 1. Deux Acteurs Métier Dédiés

### 🖥️ Administrateur — Dashboard Web (`apps/web`)
- **Création de tickets :** Enregistrement des pannes et des nouvelles installations d'équipements avec sélection du client et calcul automatique des SLA.
- **Supervision en temps réel :** Visualisation cartographique interactive, flux continu Server-Sent Events (SSE) avec repli automatique en polling (15s).
- **Gestion des techniciens & des congés :** Suivi des statuts (disponible, en intervention, en congé), validation des comptes techniciens et planning hebdomadaire.
- **Inventaire CMDB des équipements :** Traçabilité complète du cycle de vie du matériel (mise en service, historique des pannes, génération et impression de QR Codes).
- **Statistiques & Reporting officiel :** Calcul automatisé du MTTR, MTTA, taux de respect SLA, export de rapports PDF certifiés d'intervention (`@react-pdf/renderer`) et fichiers Excel multi-onglets (`exceljs`).

### 📱 Technicien — Application Mobile (`apps/mobile`)
- **Tâches du jour :** Consultation des tickets assignés avec badge d'équipe visible dès la liste (binôme, équipe de N techniciens).
- **Coordinations équipe :** Visualisation de l'équipe d'intervention complète sur chaque ticket.
- **Cartographie & Iténéraire :** Localisation GPS, calcul du temps de trajet et distance via OSRM, affichage sur carte intégrée et lancement du guidage GPS externe (Google Maps, Waze).
- **Scan QR Code CMDB :** Identification instantanée de l'équipement via la caméra du smartphone et consultation de l'historique des dernières pannes.
- **Assistant de Diagnostic IA Interactif :** Discussion technique multi-tours avec l'IA Google Gemini (ou moteur local intelligent de secours) ; diagnostic initial automatique généré avant le premier message du technicien.
- **Clôture d'intervention sur site :** Prise de photos et vidéos (quota 5 médias par ticket), saisie du rapport d'intervention et recueil de la signature tactile du client sur l'écran.
- **Pause & Reprise :** L'intervention peut être suspendue (motif obligatoire) et reprise avec préservation de l'heure de démarrage initiale pour un calcul MTTR correct.
- **Résilience hors-ligne :** Synchronisation locale avec Expo SQLite pour continuer à travailler même en zone blanche sans réseau internet.

---

## 2. Stack Technique Réellement Utilisée (100% Gratuite & Sans Carte Bancaire)

| Couche / Domaine | Technologie Réellement Utilisée | Rôle & Modalité d'accès gratuit |
|---|---|---|
| **Monorepo** | Turborepo + pnpm (v12.4.2) | Cache de compilation partagé, exécution parallèle et typage strict |
| **Dashboard Web** | Next.js 16.3.5 (Turbopack, App Router, React 19) | Interface réactive, SSR haute performance|
| **Application Mobile** | Expo SDK 57 (Expo Go pur, NativeWind v4, React Native 0.86) | Aucune dépendance native compilée, testable directement sur smartphone Android/iOS via Expo Go |
| **Base de données Cloud** | Neon PostgreSQL Serverless (Drizzle ORM) | 0.5 Go gratuit, schéma relationnel de 11 tables avec migrations automatisées |
| **Base de données Mobile** | Expo SQLite | Cache local embarqué sur smartphone pour le support hors-ligne |
| **API & Contrat Typé** | tRPC v10 + Zod | [Documentation complète de l'API (API_DOCUMENTATION.md)](API_DOCUMENTATION.md) |
| **Supervision Live** | Server-Sent Events (SSE) + Repli Polling | Émission continue des mises à jour vers le dashboard web sans coût de broker WebSocket |
| **Authentification** | Better Auth | Double authentification email (admin) et matricule/email avec bearer token (mobile) |
| **Stockage Fichiers & Médias** | Backblaze B2 (API AWS S3 v3) + Repli local | 10 Go gratuits, URLs pré-signées sécurisées pour photos et signatures |
| **Cartographie Web** | MapLibre GL JS + OpenFreeMap | **0 clé d'API requise** — Tuiles vectorielles gratuites et illimitées |
| **Cartographie Mobile** | Leaflet dans WebView + OpenStreetMap + OSRM | **0 clé d'API requise** — Tuiles OSM gratuites + routage OSRM public |
| **IA Diagnostic Technique** | Google Gemini 3.5 Flash-Lite (AI Studio Gratuit) + Moteur Local | 1500 requêtes/jour 100% gratuites sans carte bancaire + moteur local autonome |
| **Génération PDF** | `@react-pdf/renderer` | Génération de documents PDF binaires certifiés (fiches d'intervention & statistiques) |
| **Génération Excel** | `exceljs` | Tableaux de bord multi-onglets structurés et stylisés |
| **QR Code CMDB** | `qrcode` | Encodage SVG / DataURL pour l'étiquetage des actifs |
| **Qualité & Formatage** | Biome 1.9.4 | Linter et formateur ultra-rapide unifié sur 260+ fichiers |
| **Tests Unitaires & E2E** | Vitest (30+ tests) + Playwright | Tests automatisés SLA, MTTR, Chat IA et scénarios navigateur complets |

---

## 3. Structure du Monorepo

```
allotech/
├── API_DOCUMENTATION.md         # Documentation exhaustive de l'API (tRPC & REST)
├── apps/
│   ├── web/                     # Next.js 16 - Dashboard Administrateur
│   │   ├── Dockerfile           # Image Docker multi-stage + volume uploads persistant
│   │   ├── playwright.config.ts # Config Playwright (baseURL, screenshots, reporter HTML)
│   │   ├── e2e/
│   │   │   └── scenario-demo.spec.ts  # 11 scénarios E2E : auth, SSE, CMDB, PDF, uploads, stats
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/
│   │       │   │   ├── alertes/               # Alertes SLA dépassées
│   │       │   │   ├── auth/                  # Better Auth (login, changement MDP, reset)
│   │       │   │   ├── clients/[id]/          # CRUD Clients
│   │       │   │   ├── competences/[id]/      # Gestion compétences techniciens
│   │       │   │   ├── equipements/[id]/
│   │       │   │   │   └── carnet-pdf/        # Export PDF carnet de maintenance + QR Code
│   │       │   │   ├── export/pdf/            # Export PDF statistiques managériales
│   │       │   │   ├── statistiques/          # KPIs, MTTR, SLA → Excel & PDF
│   │       │   │   ├── supervision/sse/       # Flux temps réel Server-Sent Events
│   │       │   │   ├── techniciens/[id]/      # Activation, disponibilités, planning congés
│   │       │   │   ├── tickets/[id]/          # PDF intervention, médias, escalade, réassign
│   │       │   │   ├── trpc/[trpc]/           # Point d'entrée tRPC unifié
│   │       │   │   └── upload/                # Upload direct & URLs pré-signées Backblaze B2 / S3
│   │       │   └── dashboard/                 # Pages App Router Admin (tickets, clients, équipements, stats...)
│   │       ├── components/                    # Architecture modulaire par domaine
│   │       │   ├── tickets/                   # Liste tickets : useTickets, TicketsHeader, KpiBar, Filters, Card
│   │       │   ├── ticket-nouveau/            # Création ticket : useNouveauTicket, ClientSelect, Fields, TechGrid
│   │       │   ├── ticket-detail/             # Détail ticket : useTicketDetail, Header, Timeline, CMDB, Modales
│   │       │   ├── techniciens/               # RH techniciens : useTechniciens, useAbsences, Tabs, Modales, Cards
│   │       │   ├── supervision/               # MapLibre GL temps réel : Map, KPIs, Sidebar, Modales clustering
│   │       │   ├── profil/                    # Profil admin : useProfile, usePasswordChange, AvatarCard, Forms
│   │       │   ├── clients/                   # Gestion clients & fiches détails
│   │       │   ├── equipements/               # CMDB & carnet de vie équipements
│   │       │   ├── competences/               # Référentiel des compétences techniques
│   │       │   ├── alertes/                   # Monitoring des alertes & dépassements SLA
│   │       │   ├── statistiques/              # Rapports graphiques & exports managériaux
│   │       │   ├── AddressAutocomplete.tsx    # Autocomplétion d'adresses & géocodage GPS
│   │       │   ├── CalendarPlanning.tsx       # Calendrier interactif des disponibilités
│   │       │   ├── MediaUploader.tsx          # Gestionnaire d'upload médias avec prévisualisation
│   │       │   └── Pagination.tsx             # Composant de pagination unifié
│   │       └── hooks/                         # useSupervisionStream (SSE continu + fallback polling 12s)
│   │
│   └── mobile/                  # Expo SDK 57 - Application Technicien Terrain
│       └── src/
│           ├── screens/          # Écrans orchestrateurs (~160-180 lignes chacun)
│           │   ├── MesTicketsScreen.tsx     # Liste tickets + badge équipe multi-techniciens
│           │   ├── DetailTicketScreen.tsx   # Fiche intervention (orchestrateur pur)
│           │   ├── ProfilScreen.tsx         # Profil technicien (orchestrateur pur)
│           │   ├── InscriptionScreen.tsx    # Wizard 2 étapes (orchestrateur pur)
│           │   ├── ConnexionScreen.tsx      # Login matricule + biométrie Face ID / Empreinte
│           │   └── CarteScreen.tsx          # Carte Leaflet OSM + routage OSRM
│           │
│           ├── modals/           # Toutes les modales indépendantes (cycle de vie isolé)
│           │   ├── ClotureModal.tsx         # Signature tactile + rapport d'intervention
│           │   ├── DiagnosticIaModal.tsx    # Chat IA multi-tours Gemini + moteur local secours
│           │   ├── ForgotPasswordModal.tsx  # Réinitialisation mot de passe
│           │   ├── MapRouteModal.tsx        # Itinéraire + lancement GPS externe
│           │   ├── NotificationsModal.tsx   # Centre de notifications
│           │   ├── PannesRecentesModal.tsx  # Historique 5 dernières pannes équipement
│           │   ├── PhotoCaptureModal.tsx    # Capture photo/vidéo (quota 5 médias par ticket)
│           │   └── QrScanModal.tsx          # Scan QR Code CMDB (identification équipement)
│           │
│           ├── components/       # Composants réutilisables atomiques par domaine
│           │   ├── auth/
│           │   │   ├── InscriptionStep1.tsx        # Formulaire identité (matricule, nom, email, tél)
│           │   │   ├── InscriptionStep2.tsx        # Sécurité (MDP, compétences) + boutons action
│           │   │   └── CompetencesSelectModal.tsx  # Modal multi-sélection compétences
│           │   ├── profil/
│           │   │   ├── ProfilHero.tsx              # Avatar + nom + matricule + bouton édition
│           │   │   ├── CoordonneesCard.tsx         # Carte coordonnées professionnelles
│           │   │   ├── CompetencesCard.tsx         # Badges compétences techniques
│           │   │   ├── CompetencesModal.tsx        # Modal sélection/mise à jour compétences
│           │   │   ├── SecurityCard.tsx            # Biométrie (Face ID / Empreinte) + MDP
│           │   │   ├── EditProfileModal.tsx        # Modale édition prénom/nom/tel/avatar
│           │   │   └── PasswordModal.tsx           # Modale changement mot de passe
│           │   ├── ticket/
│           │   │   ├── TicketChronoCard.tsx        # Chronomètre temps actif réel
│           │   │   ├── TicketClientCard.tsx        # Informations client + téléphone
│           │   │   ├── TicketEquipeCard.tsx        # Équipe d'intervention multi-techniciens
│           │   │   ├── TicketEquipementCard.tsx    # Carte équipement CMDB
│           │   │   ├── TicketDescriptionCard.tsx   # Description + SLA + pièces jointes
│           │   │   ├── TicketQuickActions.tsx      # Actions rapides (IA, GPS, QR, Photo)
│           │   │   ├── TicketActionButtons.tsx     # Boutons de changement de statut
│           │   │   ├── TicketClotureCard.tsx       # Résumé achèvement + signature
│           │   │   ├── TicketModales.tsx           # Orchestrateur des 6 modales terrain
│           │   │   ├── TicketListItem.tsx          # Carte ticket dans la liste
│           │   │   └── TicketFilterBar.tsx         # Barre de filtres (statut, urgence)
│           │   ├── AlloTechLogo.tsx                # Logo SVG vectoriel
│           │   └── NetworkBanner.tsx               # Bannière alerte hors-ligne
│           │
│           ├── hooks/            # Custom hooks (logique métier isolée des écrans)
│           │   ├── useDetailTicket.ts    # Statuts, GPS, offline queue, médias
│           │   ├── useProfilScreen.ts   # Profil, biométrie, compétences, avatar
│           │   ├── useInscription.ts    # Wizard inscription, validations, compétences
│           │   └── useTicketChrono.ts   # Chronomètre temps actif (pauses déduites)
│           │
│           └── lib/              # Infrastructure partagée
│               ├── auth-storage.ts    # Session, biométrie, cache compétences (SecureStore)
│               ├── offlineDb.ts       # SQLite : cache tickets, sync queue offline
│               ├── syncQueue.ts       # File d'attente synchronisation réseau différée
│               ├── trpc.ts            # Client tRPC mobile avec bearer token
│               └── uploadMedia.ts     # Upload médias (presign B2 + fallback serveur)
│
├── packages/
│   ├── api/                     # Couche Backend tRPC & Logique Métier
│   │   ├── src/services/        # Services métier isolés (WorkflowService, DiagnosticService, CmdbProvisioningService)
│   │   ├── src/routers/         # Procédures tRPC (tickets, techniciens, clients, équipements, alertes)
│   │   └── src/lib/             # Moteurs de calcul SLA contractuels et métriques MTTR (Vitest 100%)
│   ├── auth/                    # Configuration Better Auth & Drizzle Adapter
│   ├── config/                  # Tokens de design system (couleurs Deep Teal #31525B, Amber #FFA101, Tailwind)
│   ├── db/                      # Schéma Drizzle ORM PostgreSQL (Neon), migrations & seeders de démonstration
│   └── ui/                      # Constantes de statuts, urgences, badges et composants d'interface partagés
│
├── .github/workflows/ci.yml     # Pipeline GitHub Actions (Biome Lint, Typecheck 7 packages, Tests, Build)
├── docker-compose.yml           # Déploiement conteneurisé : Web + PostgreSQL + volume uploads persistant
├── biome.json                   # Configuration Biome Linter & Formatter (0 erreur CI)
├── turbo.json                   # Configuration du pipeline de cache Turborepo
└── vercel.json                  # Déploiement Vercel optimisé (Région CDG Paris, headers de sécurité)
```

---

## 5. Démarrage Rapide

### Prérequis
- Node.js >= 22
- pnpm >= 10 (`npm install -g pnpm`)

### Installation des dépendances
```bash
pnpm install
```

### Configuration des variables d'environnement
Créez un fichier `.env` à la racine (ou copiez `.env.example`) :
```env
DATABASE_URL=postgresql://user:password@ep-allotech-neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=une_cle_secrete_d_au_moins_32_caracteres_aleatoires
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GEMINI_API_KEY=AQ.Ab8RN...
```

### Lancement en développement
```bash
# Dashboard Web Administrateur (http://localhost:3000)
pnpm --filter web dev

# Application Mobile Expo Go
pnpm --filter mobile start
```

---

## 6. Qualité de Code, Typage & Tests

```bash
# 1. Vérification du formatage et linting avec Biome (260+ fichiers)
pnpm run check:ci

# 2. Correction automatique du style
pnpm run check

# 3. Vérification stricte des types TypeScript (Web & Mobile)
pnpm run check-types

# 4. Exécution de la suite de tests unitaires (Vitest)
pnpm test

# 5. Exécution des tests End-to-End (Playwright)
pnpm --filter web run test:e2e
```

---
