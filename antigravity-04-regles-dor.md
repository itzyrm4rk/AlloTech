# AlloTech — Règles d'or (Design & Bonnes pratiques)

> Ce fichier s'applique à **toute** tâche de code ou d'interface produite pour ce projet, sur tous les sprints. En cas de conflit entre une demande ponctuelle et une règle ci-dessous, signaler le conflit à l'utilisateur plutôt que de l'ignorer silencieusement.

---

## 1. Règles de design — Identité visuelle commune (Web + Mobile)

### 1.1 Palette de couleurs (obligatoire, ne jamais improviser d'autres couleurs)

| Rôle | Couleur | Code | Usage |
|---|---|---|---|
| Primaire | Bleu profond | `#1B3A5C` | En-têtes, navigation, boutons principaux |
| Secondaire / Accent | Orange terracotta | `#E07A3C` | Boutons d'action, éléments d'accent |
| Succès | Vert | `#2E8B57` | Intervention clôturée, SLA respecté |
| Avertissement | Jaune/ambre | `#E0A83C` | Intervention en pause, alerte SLA prédictive |
| Danger/Urgence | Rouge | `#C0392B` | Urgence critique, SLA dépassé |
| Neutre foncé | Gris anthracite | `#2C2C2E` | Texte principal |
| Neutre clair | Gris clair | `#F4F4F5` | Fonds, cartes, séparateurs |
| Fond principal | Blanc cassé | `#FAFAF8` | Fond général |

- Ces couleurs doivent être définies **une seule fois** (token Tailwind partagé) et jamais redéfinies localement dans un composant
- **Les codes couleur de statut sont universels** : le vert, l'orange/ambre et le rouge doivent toujours signifier la même chose partout dans l'app (web comme mobile) — ne jamais réutiliser le rouge pour autre chose que urgence/dépassement, par exemple

### 1.2 Typographie
- Police : **Inter**, **Poppins** ou **Work Sans** (choisir une seule police pour tout le projet, web et mobile)
- Taille de texte minimum **16px** sur mobile (lisibilité en conditions de terrain, parfois avec des gants, en extérieur)
- Hiérarchie : titres en gras (600-700), texte courant en régulier (400), libellés de statut en semi-gras (500) avec la couleur de statut associée

### 1.3 Composants & interactions
- **Web** : utiliser les composants shadcn/ui existants avant d'en créer un nouveau — ne pas dupliquer un composant qui existe déjà dans la librairie
- **Mobile** : utiliser React Native Reusables de la même façon
- **Icônes** : uniquement Lucide (`lucide-react` / `lucide-react-native`), jamais mélanger avec une autre librairie d'icônes
- **Boutons tactiles mobiles** : zone tactile minimum de 44×44px, avec un espacement suffisant entre boutons pour éviter les erreurs de clic sur le terrain
- **Mode hors-connexion visible** : le bandeau de signal réseau instable doit être discret mais clair (couleur ambre), jamais un blocage brutal de l'écran ou une modale qui empêche le travail
- Design **sobre et fonctionnel** : privilégier la rapidité d'usage sur le terrain à l'esthétique décorative

### 1.4 Accessibilité
- Contraste texte/fond suffisant partout (viser AA minimum), particulièrement important pour l'usage extérieur sous le soleil
- Tous les boutons/icônes cliquables doivent avoir un libellé accessible (`aria-label` web, `accessibilityLabel` mobile), pas seulement une icône seule
- Les formulaires doivent afficher des messages d'erreur clairs et associés au bon champ

---

## 2. Bonnes pratiques de programmation

### 2.1 TypeScript
- **Mode strict activé** partout (`strict: true` dans chaque `tsconfig.json`)
- **Jamais de `any`** sans justification explicite en commentaire ; préférer `unknown` + validation Zod si le type est réellement inconnu
- Tous les types partagés entre `apps/web` et `apps/mobile` doivent provenir de `packages/api` (inférés depuis le routeur tRPC) ou de `packages/db` (inférés depuis le schéma Drizzle) — ne jamais dupliquer un type métier à la main

### 2.2 Structure et organisation
- Respecter la structure du monorepo définie dans le fichier stack technique — ne pas créer de nouveau package sans nécessité claire
- Un composant = un fichier ; pas de fichiers de plus de ~300 lignes sans découpage en sous-composants
- Toute logique métier partagée (calcul de statut SLA, formatage, règles de validation) doit vivre dans `packages/` et être importée, jamais dupliquée entre web et mobile

### 2.3 API (tRPC)
- Une procédure tRPC = une responsabilité claire (éviter les procédures "fourre-tout")
- Toute entrée utilisateur est validée avec **Zod** avant traitement, sans exception
- Les procédures qui modifient des données sensibles (comptes, tickets, statuts) doivent vérifier explicitement l'authentification et le bon acteur (admin vs technicien) via le middleware de session
- Ne jamais exposer une clé API (Gemini, Backblaze, OpenRouteService) côté client — tout appel à un service tiers sensible passe par une procédure tRPC serveur

### 2.4 Base de données
- Toute modification de schéma passe par une migration Drizzle versionnée, jamais une modification manuelle en base
- Les relations doivent respecter strictement les cardinalités définies dans le fichier de contexte fonctionnel (ex : un ticket "Panne" pointe vers un équipement existant, un ticket "Installation" n'en a pas au départ)
- Prévoir des contraintes de clé étrangère en base (pas seulement une vérification côté applicatif)

### 2.5 Gestion des erreurs
- Ne jamais avaler une erreur silencieusement (`catch {}` vide interdit)
- Toute erreur réseau côté mobile doit être gérée gracieusement (voir section résilience réseau du fichier stack technique) — jamais de crash ou d'écran bloquant
- Les messages d'erreur affichés à l'utilisateur doivent être clairs et en français, sans exposer de détail technique interne (stack trace, nom de table, etc.)

### 2.6 Sécurité
- Aucune clé API, secret ou mot de passe en dur dans le code — toujours via variables d'environnement (`.env`, jamais commité)
- Fournir systématiquement un `.env.example` à jour listant les variables nécessaires, sans valeurs réelles
- Les mots de passe ne sont jamais stockés en clair (délégué à Better Auth, qui gère le hachage)
- Les URLs d'upload vers Backblaze B2 sont toujours présignées côté serveur, jamais de clé d'accès stockage exposée côté client

### 2.7 Tests
- Toute règle métier critique (calcul de SLA, transitions de statut, logique de synchronisation hors-ligne) doit avoir un test unitaire associé (Vitest)
- Ne pas viser une couverture de test à 100 % ; prioriser les chemins critiques du scénario de démonstration (création de ticket → assignation → intervention → clôture → PDF)

### 2.8 Git & commits
- Un commit = un changement logique cohérent, avec un message clair en français décrivant *quoi* et *pourquoi*
- Ne jamais committer de fichier `.env`, de `node_modules`, ou de build généré
- Une branche par sprint ou par fonctionnalité majeure, fusionnée après validation

### 2.9 Performance
- Le dashboard web ne doit pas recharger inutilement des données déjà en cache (utiliser correctement les capacités de cache de TanStack Query/tRPC)
- Le polling de supervision temps réel (10-15 secondes) ne doit interroger que les données nécessaires, pas l'intégralité de la base à chaque appel
- Les photos/vidéos uploadées depuis le mobile doivent être compressées raisonnablement avant envoi (éviter d'envoyer un fichier brut de plusieurs dizaines de Mo sur un réseau instable)

### 2.10 Cohérence avec le contexte fonctionnel
- Avant d'implémenter une fonctionnalité, vérifier qu'elle correspond bien à ce qui est décrit dans le fichier de contexte — ne pas ajouter de fonctionnalité "utile" non demandée (ex : ne pas réintroduire un dispatching automatique, des notifications push, ou une interface client) sans validation explicite de l'utilisateur
- En cas d'ambiguïté entre deux documents (contexte, stack, sprints), signaler la contradiction à l'utilisateur plutôt que de trancher seul

---

## 3. Checklist rapide avant de considérer une tâche "terminée"

- [ ] Le code respecte la palette de couleurs et la typographie définies
- [ ] Aucun `any` non justifié, aucun secret en dur
- [ ] Les entrées sont validées avec Zod
- [ ] Les erreurs sont gérées proprement, avec un message clair en français
- [ ] Le composant est accessible (labels, contraste)
- [ ] Un test existe si la logique est critique pour le scénario de démonstration
- [ ] Le code est formatté/lint avec Biome sans erreur
- [ ] Le commit est clair et ne contient aucun fichier sensible
