# AlloTech — Plan de sprints détaillé

> Ce document découpe le développement en sprints exécutables. Chaque sprint a un objectif clair, des tâches précises et des critères d'acceptation. L'agent doit traiter les sprints dans l'ordre, ne pas anticiper les tâches d'un sprint futur, et demander validation à l'utilisateur à la fin de chaque sprint avant de passer au suivant.

**Durée indicative :** 1 sprint ≈ 3 à 5 jours de développement (à ajuster selon le rythme réel). 8 sprints au total.

---

## Sprint 0 — Initialisation du monorepo

**Objectif :** avoir un monorepo Turborepo fonctionnel, vide mais correctement configuré, avec tous les outils de base opérationnels.

**Tâches :**
- [ ] Initialiser le monorepo Turborepo (`apps/web`, `apps/mobile`, `packages/api`, `packages/db`, `packages/auth`, `packages/ui`, `packages/config`)
- [ ] Créer `apps/web` avec Next.js 16 (App Router, TypeScript)
- [ ] Créer `apps/mobile` avec Expo (dernier SDK stable), vérifier le lancement via Expo Go
- [ ] Configurer Biome à la racine (lint + format), l'appliquer aux deux apps
- [ ] Configurer Tailwind CSS dans `apps/web` avec la palette de couleurs du design system (voir fichier stack technique / règles d'or)
- [ ] Configurer NativeWind dans `apps/mobile` avec la même palette
- [ ] Installer et configurer shadcn/ui dans `apps/web`
- [ ] Installer et configurer React Native Reusables dans `apps/mobile`
- [ ] Créer un compte Neon, une base de données vide, connecter Drizzle ORM
- [ ] Créer un dépôt GitHub, premier commit, configurer une pipeline GitHub Actions basique (install + lint + build)

**Critères d'acceptation :**
- `apps/web` démarre sans erreur (`next dev`) et affiche une page d'accueil stylée avec la palette du design system
- `apps/mobile` démarre sans erreur et s'ouvre correctement dans Expo Go
- Biome ne remonte aucune erreur sur le projet vide
- La connexion à Neon fonctionne (une requête de test simple passe)

---

## Sprint 1 — Modèle de données & Authentification

**Objectif :** avoir le schéma de base de données complet et l'authentification fonctionnelle des deux acteurs.

**Tâches :**
- [ ] Modéliser le schéma Drizzle complet à partir des cardinalités du fichier de contexte (tables : `administrateurs`, `techniciens`, `competences`, `techniciens_competences`, `disponibilites`, `clients`, `equipements`, `tickets`, `tickets_techniciens`, `statuts_historique`, `medias`, `rapports`, `signatures`, `alertes`)
- [ ] Générer et exécuter les migrations Drizzle sur Neon
- [ ] Configurer Better Auth (schéma, adaptateur Drizzle) pour les deux types de comptes (administrateur, technicien)
- [ ] Web : page de création de compte administrateur (nom, prénom, email, téléphone, mot de passe)
- [ ] Web : page de connexion administrateur + réinitialisation de mot de passe oublié (email via Resend)
- [ ] Mobile : écran de création de compte technicien (matricule, nom, prénom, téléphone, email, mot de passe, compétences, photo optionnelle)
- [ ] Mobile : écran de connexion technicien (matricule + mot de passe) + réinitialisation de mot de passe oublié
- [ ] Mobile : activation de l'authentification biométrique après la première connexion (`expo-local-authentication` + `expo-secure-store`)
- [ ] Routeur tRPC : procédures d'authentification protégées, middleware de session

**Critères d'acceptation :**
- Un administrateur peut créer un compte, se déconnecter, se reconnecter, et réinitialiser son mot de passe
- Un technicien peut créer un compte depuis le mobile, se connecter, activer la biométrie, et se reconnecter avec la biométrie
- Les routes protégées côté web et mobile rejettent un utilisateur non authentifié

---

## Sprint 2 — Gestion des techniciens & disponibilité (côté admin)

**Objectif :** l'administrateur peut consulter et gérer les comptes techniciens et leur disponibilité.

**Tâches :**
- [ ] Web : page liste des techniciens (nom, matricule, téléphone, compétences, statut)
- [ ] Web : action activer/désactiver un compte technicien
- [ ] Web : fiche détaillée d'un technicien (historique de ses interventions — placeholder pour l'instant, sera rempli au sprint 4)
- [ ] Web : formulaire de gestion de la disponibilité (ajouter une période de congé/absence pour un technicien)
- [ ] tRPC : procédures CRUD associées (`technicien.list`, `technicien.toggleActive`, `disponibilite.create`, `disponibilite.list`)

**Critères d'acceptation :**
- La liste des techniciens se met à jour en temps réel (polling) après une inscription mobile
- Un technicien désactivé ne peut plus se connecter
- Une période d'absence renseignée exclut bien le technicien de la liste des assignables sur cette période (utilisé au sprint 3)

---

## Sprint 3 — CMDB (équipements) & QR Code

**Objectif :** la base de la CMDB est en place, avec génération et impression de QR code.

**Tâches :**
- [ ] Web : gestion des clients (création manuelle : entreprise ou particulier)
- [ ] Web : catalogue équipements regroupé par client
- [ ] Web : fiche équipement (modèle, n° de série, date d'installation, statut)
- [ ] Génération automatique d'un QR code unique à la création d'une fiche équipement (librairie `qrcode`)
- [ ] Web : bouton d'impression de l'étiquette QR code (mise en page imprimable simple)
- [ ] tRPC : procédures CRUD `client.*` et `equipement.*`

**Critères d'acceptation :**
- Un client peut être créé avec un ou plusieurs équipements associés
- Chaque équipement affiche son QR code, imprimable proprement (format étiquette)
- Le catalogue est filtrable/consultable par client

---

## Sprint 4 — Création de tickets & assignation (côté admin)

**Objectif :** l'administrateur peut créer un ticket complet (panne ou installation) et l'assigner.

**Tâches :**
- [ ] Web : formulaire de création de ticket avec logique conditionnelle (Panne vs Installation, voir fichier contexte pour les champs exacts)
- [ ] Web : upload de photo/vidéo (panne) ou cahier des charges (installation) vers Backblaze B2, avec génération d'URL présignée côté tRPC
- [ ] Web : sélection manuelle d'un ou plusieurs techniciens parmi les disponibles
- [ ] Web : liste des tickets avec filtres (statut, urgence, technicien)
- [ ] Web : action de réaffectation manuelle d'un ticket
- [ ] Web : action d'escalade manuelle (changement de niveau d'urgence)
- [ ] tRPC : procédures `ticket.create`, `ticket.list`, `ticket.reassign`, `ticket.escalate`

**Critères d'acceptation :**
- Un ticket "Panne" et un ticket "Installation" peuvent tous deux être créés avec succès, avec upload de fichier fonctionnel
- Un ticket peut être assigné à plusieurs techniciens simultanément
- La réaffectation ne supprime aucune donnée déjà saisie sur le ticket

---

## Sprint 5 — Application mobile : consultation & outils d'intervention

**Objectif :** le technicien peut consulter ses interventions et utiliser les outils de terrain (hors clôture).

**Tâches :**
- [ ] Mobile : écran "Mes tâches du jour", triées par priorité, avec statut visible
- [ ] Mobile : écran détail d'un ticket (description, médias envoyés par le client, historique de l'équipement)
- [ ] Mobile : carte/itinéraire (WebView Leaflet + OpenFreeMap + OpenRouteService)
- [ ] Mobile : scan de QR code (`expo-camera`) → ouverture de la fiche équipement + historique
- [ ] Mobile : bouton "Démarrer l'intervention" → enregistrement heure + position GPS (`expo-location`)
- [ ] Mobile : prise de photos/vidéos (`expo-image-picker` / `expo-camera`) avec upload vers Backblaze B2
- [ ] Mobile : gestion du statut (passer "En pause" avec motif optionnel, "Reprendre")
- [ ] Mobile : intégration de l'assistant de diagnostic IA (appel à une procédure tRPC qui interroge Gemini avec l'historique de l'équipement)

**Critères d'acceptation :**
- Un technicien voit sa liste du jour triée correctement
- Le scan QR ouvre bien la fiche du bon équipement avec son historique
- Démarrer une intervention enregistre heure + GPS, visibles côté admin (même en polling)
- L'assistant IA renvoie une suggestion cohérente à partir de l'historique

---

## Sprint 6 — Clôture, signature, rapport PDF

**Objectif :** le cycle complet d'une intervention peut être mené jusqu'à la clôture.

**Tâches :**
- [ ] Mobile : écran de saisie du rapport d'intervention (texte libre)
- [ ] Mobile : capture de signature numérique (`react-native-signature-canvas`)
- [ ] Mobile : action de clôture du ticket (passage au statut "Clôturée")
- [ ] Web : génération automatique du PDF de rapport (`@react-pdf/renderer`) à la clôture, incluant texte + photos + signature
- [ ] Web : téléchargement du PDF depuis la fiche du ticket
- [ ] tRPC : procédures `ticket.submitReport`, `ticket.close`, `ticket.generatePdf`

**Critères d'acceptation :**
- Un ticket complet (panne ou installation) peut être mené de la création à la clôture, de bout en bout, entre le web et le mobile
- Le PDF généré contient bien le texte du rapport, les photos, et la signature
- Pour un ticket "Installation" clôturé, une nouvelle fiche équipement est bien créée automatiquement dans la CMDB

---

## Sprint 7 — Supervision temps réel, alertes SLA, résilience réseau

**Objectif :** le dashboard offre une vraie supervision, et le mobile résiste aux coupures réseau.

**Tâches :**
- [ ] Web : vue cartographique + vue liste de supervision avec polling automatique (`refetchInterval`)
- [ ] Web : timeline d'avancement par ticket
- [ ] Web : calcul et affichage des alertes SLA (dépassement + prédictif)
- [ ] Web : panneau centralisé de notifications/alertes
- [ ] Mobile : intégration `expo-sqlite` + Drizzle pour la base locale
- [ ] Mobile : intégration `@react-native-community/netinfo` + bandeau de signal réseau
- [ ] Mobile : file de synchronisation (`sync_queue`) rejouée automatiquement au retour du réseau
- [ ] Tests manuels de coupure réseau simulée (mode avion) pendant une intervention complète

**Critères d'acceptation :**
- Une intervention complète peut être réalisée en coupant le réseau à mi-parcours, sans perte de données, avec synchronisation automatique au retour
- Le bandeau de signal s'affiche/se masque correctement selon l'état réseau
- Les alertes SLA se déclenchent correctement sur des tickets de test proches ou dépassant leur délai

---

## Sprint 8 — Reporting, statistiques, polish & déploiement

**Objectif :** finaliser les fonctionnalités de reporting, la qualité générale, et déployer.

**Tâches :**
- [ ] Web : tableau de statistiques (interventions par technicien, MTTR, taux SLA)
- [ ] Web : export PDF/Excel des statistiques
- [ ] Passage complet de l'UI (web + mobile) en revue par rapport au design system (voir fichier "Règles d'or")
- [ ] Écriture des tests principaux (Vitest pour la logique métier critique, Playwright pour le parcours admin principal, Maestro pour le parcours technicien principal)
- [ ] Configuration Sentry (web + mobile)
- [ ] Déploiement du web sur Vercel
- [ ] Vérification finale de tous les comptes de service (aucune carte bancaire ajoutée nulle part)
- [ ] Rédaction du support de présentation (captures d'écran, scénario de démonstration basé sur le scénario du document de contexte)

**Critères d'acceptation :**
- Le dashboard est accessible en ligne via Vercel
- Le scénario de démonstration complet (panne + installation, multi-jours avec pause) peut être rejoué sans erreur
- Tous les tests principaux passent en CI

---

## Notes pour l'agent

- Toujours committer à la fin de chaque tâche cochée, avec un message clair
- Ne jamais passer au sprint suivant sans confirmation explicite de l'utilisateur
- En cas de doute sur un choix technique, se référer au fichier stack technique — ne jamais improviser un service tiers non listé
- En cas de doute sur une règle métier, se référer au fichier de contexte et fonctionnalités
- Respecter systématiquement le fichier "Règles d'or" pour tout code ou interface produit
