# AlloTech — Gestion des Interventions Techniques en Mobilité

> Solution de gestion d'interventions techniques pour une entreprise de maintenance informatique basée à Douala, Cameroun.

---

## 1. Deux Acteurs Uniques

- **Administrateur** : Utilise le Dashboard Web (**Next.js 16**, App Router, Tailwind CSS, shadcn/ui). Reçoit les appels clients, saisit manuellement les tickets (Pannes & Installations), assigne les techniciens disponibles, supervise en temps réel (polling 10-15s), gère la CMDB des équipements et génère les rapports PDF officiels.
- **Technicien** : Utilise l'Application Mobile (**Expo Go** / React Native, NativeWind, SQLite, Drizzle). Consulte ses tâches du jour, consulte l'historique d'un équipement via scan QR Code, utilise l'assistant diagnostic IA Gemini, enregistre ses heures et géolocalisation, recueille la signature client et saisit le compte rendu d'intervention.

---

## 2. Stack Technique 100% Gratuite (Sans Carte Bancaire)

| Couche | Technologie | Justification & Quota |
|---|---|---|
| **Monorepo** | Turborepo + pnpm | Cache de build partagé et typage de bout en bout |
| **Dashboard Web** | Next.js 16 (App Router) | Version pérenne post-Next 15 |
| **Application Mobile** | Expo SDK 57 (Expo Go pur) | Aucune dépendance native nécessitant un build EAS payant |
| **Base de données** | Neon PostgreSQL Serverless | 0.5 Go gratuit, compatible Drizzle ORM |
| **API** | tRPC + Zod | Routeur typé partagé entre Web et Mobile |
| **Authentification** | Better Auth | Auto-hébergé sur Neon, gestion email/matricule |
| **Stockage Médias** | Backblaze B2 (API S3) | 10 Go gratuits sans carte bancaire |
| **Cartographie** | OpenFreeMap + OpenRouteService | Tuiles gratuites illimitées + 2000 calculs d'itinéraires/jour |
| **IA Diagnostic** | Google Gemini API (Flash-Lite) | ~1500 requêtes/jour gratuites via Google AI Studio |
| **Qualité de code** | Biome | Linting et formatage ultra-rapide unifié |

---

## 3. Structure du Monorepo

```
allotech/
├── apps/
│   ├── web/                     # Next.js 16 - Dashboard Administrateur
│   └── mobile/                  # Expo (SDK 57) - Application Technicien
├── packages/
│   ├── config/                  # Tokens de design system (couleurs, polices, tailwind)
│   ├── ui/                      # Statuts, niveaux d'urgence, badges et métadonnées
│   ├── db/                      # Schéma Drizzle ORM + driver Neon Serverless
│   ├── api/                     # Routeur tRPC partagé
│   └── auth/                    # Configuration Better Auth
├── .github/workflows/ci.yml     # Pipeline d'intégration continue
├── biome.json                   # Configuration Biome
├── turbo.json                   # Pipelines de build Turborepo
└── pnpm-workspace.yaml          # Workspaces monorepo
```

---

## 4. Démarrage Rapide

### Prérequis
- Node.js >= 22
- pnpm >= 10 (`npm install -g pnpm`)

### Installation
```bash
pnpm install
```

### Lancement des applications
```bash
# Lancer le dashboard web (http://localhost:3000)
pnpm --filter web dev

# Lancer l'application mobile Expo Go
pnpm --filter mobile start
```

### Qualité du code
```bash
# Vérifier le code avec Biome
pnpm run check:ci

# Formater et corriger automatiquement
pnpm run check
```
