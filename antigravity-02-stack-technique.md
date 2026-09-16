# AlloTech — Stack technique à utiliser

> Instructions strictes pour l'agent : n'utilise QUE les technologies listées ici. Ne propose pas d'alternative sans le signaler explicitement à l'utilisateur et attendre sa validation. Contrainte absolue : **aucun service utilisé ne doit exiger de carte bancaire, même sur son palier gratuit.**

---

## 1. Architecture générale

Monorepo **Turborepo**, organisé approximativement ainsi :

```
allotech/
├── apps/
│   ├── web/              # Next.js 16 (dashboard admin)
│   └── mobile/           # Expo (app technicien)
├── packages/
│   ├── api/               # Routeur tRPC partagé
│   ├── db/                 # Schéma Drizzle + client Neon
│   ├── auth/                # Configuration Better Auth
│   ├── ui/                   # Composants partagés / tokens du design system
│   └── config/                # Config Tailwind, Biome, tsconfig partagés
├── biome.json
├── turbo.json
└── package.json
```

---

## 2. Détail de la stack, couche par couche

### Monorepo
- **Turborepo** — gestion du monorepo, cache de build partagé entre `web` et `mobile`

### Web (dashboard administrateur)
- **Next.js 16** (App Router) — **ne pas utiliser Next.js 15**, qui atteint sa fin de support en octobre 2026
- **Tailwind CSS**
- **shadcn/ui** pour les composants (boutons, formulaires, tables, modales, etc.)
- **Lucide** (`lucide-react`) pour les icônes

### Mobile (application technicien)
- **Expo** (SDK 57 ou plus récent), **utilisation exclusive via Expo Go** — ne pas introduire de module nécessitant un development build/EAS Build sans validation explicite préalable
- **NativeWind** (Tailwind CSS pour React Native)
- **React Native Reusables** pour les composants (portage de shadcn/ui pour NativeWind)
- **Lucide** (`lucide-react-native`) pour les icônes — mêmes icônes que le web

### API
- **tRPC** — un seul routeur typé, partagé et consommé à la fois par `apps/web` et `apps/mobile`
- Validation des entrées avec **Zod**

### Base de données
- **Neon** (PostgreSQL serverless) — instance gratuite, pas de carte bancaire requise
- **Drizzle ORM** — TypeScript natif, compatible edge/serverless avec Neon, compatible `expo-sqlite` côté mobile pour la base locale

### Authentification
- **Better Auth** — auto-hébergé sur Neon, avec son plugin officiel **Expo** pour la gestion des sessions et du stockage sécurisé côté mobile
- `expo-local-authentication` pour la biométrie
- `expo-secure-store` pour le stockage sécurisé du token

### Cache
- **Upstash Redis** (serverless, gratuit sans carte bancaire) — utilisé pour :
  - la mise en cache de données fréquemment consultées (ex : liste des techniciens disponibles)
  - la limitation de débit (rate limiting) sur l'API
  - **PAS pour du temps réel type pub/sub WebSocket** (non nécessaire, voir section 4)

### Stockage de fichiers (photos, vidéos, documents)
- **Backblaze B2** (compatible API S3, 10 Go gratuits, sans carte bancaire)
- Upload depuis le mobile : `expo-image-picker` (photos) + `expo-camera` (scan QR + capture)
- Génération d'URLs présignées côté API (tRPC) pour l'upload direct depuis le client

### Cartographie & itinéraires
- **OpenFreeMap** — service de tuiles cartographiques gratuit et illimité, sans clé API, sans inscription
- **Web** : MapLibre GL JS (compatible avec les tuiles OpenFreeMap)
- **Mobile** : affichage de la carte dans une **WebView** (`react-native-webview`, inclus nativement dans Expo Go) chargeant une page Leaflet/MapLibre + OpenFreeMap, avec transmission de la position GPS via un pont JavaScript (`postMessage`)
- **Ne pas utiliser Mapbox ni `react-native-maps` avec Google Maps** (les deux exigent une carte bancaire à un moment donné)
- **OpenRouteService** pour le calcul d'itinéraire (clé API gratuite par email, sans carte bancaire, quota 2 000 requêtes/jour)

### QR Code
- Génération (dashboard) : librairie `qrcode` (Node.js)
- Scan (mobile) : `expo-camera` (scanner de code-barres/QR intégré, compatible Expo Go)

### Signature numérique
- `react-native-signature-canvas` (basé WebView, compatible Expo Go)

### Génération de rapports PDF
- `@react-pdf/renderer` — génération PDF en JavaScript pur côté serveur, sans navigateur headless

### Assistant de diagnostic IA
- **Google Gemini API** (modèles Flash / Flash-Lite) — gratuit sans carte bancaire via une clé Google AI Studio, quota d'environ 1 500 requêtes/jour
- Appel effectué côté API (tRPC procedure dédiée), jamais directement depuis le client mobile (protéger la clé API)

### Mode hors ligne / résilience réseau
- `expo-sqlite` + **Drizzle ORM** pour la base locale sur le téléphone
- `@react-native-community/netinfo` pour la détection de l'état réseau
- File de synchronisation custom (table `sync_queue` locale), rejouée via des mutations tRPC dès le retour de connexion

### Notifications
- **Aucune notification push** (contrainte Expo Go)
- **Email** (réinitialisation de mot de passe) : **Resend** (gratuit, sans carte bancaire)

### Temps réel côté dashboard
- **Pas de WebSocket.** Utiliser le **polling** via `refetchInterval` de TanStack Query (inclus avec tRPC), toutes les 10 à 15 secondes, pour simuler la supervision "temps réel"

### Qualité de code
- **Biome** — lint + format, remplace ESLint/Prettier

### Tests
- **Vitest** (tests unitaires)
- **Playwright** (tests end-to-end web)
- **Maestro** (tests end-to-end mobile)

### CI/CD
- **GitHub Actions**
- Turborepo Remote Cache (gratuit via Vercel)
- Biome exécuté à chaque pull request

### Hébergement / déploiement
- **Vercel** (Hobby, gratuit) — dashboard web + API tRPC
- **Neon** — base de données
- **Upstash** — Redis
- **Backblaze B2** — fichiers
- **EAS Build** (palier gratuit, nombre de builds/mois limité) — build de l'app mobile si besoin de sortir d'Expo Go plus tard

### Monitoring
- **Sentry** (plan Developer gratuit) — web + mobile

---

## 3. Interdictions explicites

L'agent ne doit **jamais** introduire, même temporairement ou "pour tester" :
- Cloudflare R2 (carte bancaire requise)
- Mapbox (carte bancaire requise)
- `react-native-maps` avec provider Google Maps (nécessite une clé Google Cloud avec facturation)
- Tout service de notification push (hors périmètre Expo Go)
- Un serveur WebSocket ou une dépendance de type Socket.io/Pusher/Ably
- Next.js 15 (préférer directement la version 16)
- Tout module nécessitant un `expo prebuild` ou un development build EAS sans validation explicite préalable de l'utilisateur

---

## 4. Design system (couleurs & typographie à respecter)

Voir le fichier "Règles d'or" pour le détail complet du design system. En résumé, la palette de couleurs Tailwind à configurer dans `packages/config` :

| Rôle | Couleur | Code |
|---|---|---|
| Primaire | Bleu profond | `#1B3A5C` |
| Secondaire/Accent | Orange terracotta | `#E07A3C` |
| Succès | Vert | `#2E8B57` |
| Avertissement | Jaune/ambre | `#E0A83C` |
| Danger/Urgence | Rouge | `#C0392B` |
| Neutre foncé | Gris anthracite | `#2C2C2E` |
| Neutre clair | Gris clair | `#F4F4F5` |
| Fond principal | Blanc cassé | `#FAFAF8` |

Police recommandée : **Inter**, **Poppins** ou **Work Sans**.

Cette palette doit être définie **une seule fois** dans `packages/config/tailwind` (ou équivalent) et importée à la fois par `apps/web` et `apps/mobile`, pour garantir une cohérence visuelle totale entre le dashboard et l'application mobile.
