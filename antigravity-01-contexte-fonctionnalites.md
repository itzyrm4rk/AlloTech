# AlloTech — Contexte du projet & Fonctionnalités complètes

> Ce document est la source de vérité fonctionnelle du projet. À lire en entier avant toute tâche de planification ou d'implémentation.

---

## 1. Contexte

**AlloTech** est une application de gestion des interventions techniques en mobilité, destinée à une petite entreprise de maintenance informatique basée à Douala, Cameroun.

Le système comprend deux applications qui communiquent avec la même API :
1. **Un dashboard web** pour l'administrateur (pilotage, création des tickets, supervision)
2. **Une application mobile** pour les techniciens (Expo/React Native, utilisée avec **Expo Go uniquement**)

**Règle fondamentale du projet : il n'y a que 2 acteurs.**
- **Administrateur** — utilise le dashboard web
- **Technicien** — utilise l'application mobile

**Le client final (entreprise ou particulier) n'a AUCUNE interface.** Il appelle l'administrateur par téléphone pour signaler une panne ou demander une installation ; c'est l'administrateur qui saisit manuellement la demande dans son dashboard.

**Contexte réseau :** l'application mobile fonctionne **principalement en ligne** (bonne couverture réseau à Douala dans la majorité des cas), mais doit gérer proprement les **coupures ponctuelles** de connexion (et non un vrai mode hors-ligne permanent en zone blanche).

**Contrainte de coût :** toute la stack technique doit rester sur des paliers **100 % gratuits, sans carte bancaire requise** (voir le fichier stack technique dédié).

---

## 2. Acteurs et authentification

- **L'administrateur crée son propre compte** et se connecte au dashboard (email + mot de passe).
- **Le technicien crée son propre compte** depuis l'application mobile (matricule fourni par l'entreprise + informations personnelles), et se connecte (matricule + mot de passe).
- Les deux disposent d'une option **"mot de passe oublié"** (réinitialisation par lien/code envoyé par email).
- Le technicien peut activer l'**authentification biométrique** (empreinte/FaceID) après sa première connexion, pour un accès rapide.
- Il n'y a **pas de système d'habilitations/rôles multiples** : un seul type de compte administrateur, un seul type de compte technicien.

---

## 3. Fonctionnalités — Dashboard Web (Administrateur)

### 3.1 Authentification administrateur
- Création de compte : nom, prénom, email professionnel, numéro de téléphone, mot de passe
- Connexion : email + mot de passe
- Réinitialisation de mot de passe oublié

### 3.2 Gestion des comptes et disponibilité des techniciens
- Consultation de la liste des techniciens inscrits (nom, matricule, téléphone, compétences déclarées, statut du compte)
- Activation ou désactivation d'un compte technicien (ex : départ de l'entreprise)
- **L'administrateur ne crée PAS les comptes techniciens** (auto-inscription côté mobile) et **ne valide/modifie PAS leurs compétences déclarées**
- **Gestion de la disponibilité** : renseigner les congés/absences d'un technicien sur une période donnée. Un technicien marqué absent n'est pas proposé comme assignable sur cette période.

### 3.3 Création et gestion des tickets

Création **manuelle uniquement**, suite à un appel client.

**Champs communs du formulaire de ticket :**
- Nom du client
- Type de client (Entreprise / Particulier)
- Téléphone du contact (obligatoire)
- Email du contact (optionnel)
- Adresse du site d'intervention
- Type de demande : **Panne** ou **Installation**
- Description détaillée
- Niveau d'urgence (Critique / Haute / Normale / Basse)
- Date/heure souhaitée d'intervention
- Technicien(s) assigné(s) — sélection manuelle, un ou plusieurs, **choisie librement par l'administrateur** (pas de dispatching automatique)
- Commentaire additionnel (optionnel)

**Si type de demande = Panne, champs additionnels :**
- Équipement concerné (recherche dans la CMDB par n° de série ou QR code)
- Catégorie de panne : **Matériel** ou **Logiciel**
- Sous-type (si Matériel) : Réseau / Imprimante / Électrique / Autre matériel
- Sous-type (si Logiciel) : Système d'exploitation / Application / Sécurité-virus / Autre logiciel
- **Photo/vidéo de la panne** : upload d'un fichier image/vidéo envoyé par le client par téléphone (aide le technicien à se préparer avant le déplacement)

**Si type de demande = Installation, champs additionnels :**
- Équipement(s) à installer (description libre)
- **Cahier des charges / images** : upload de document(s)/image(s) fournis par le client pour cadrer l'installation

**Assignation des techniciens :**
- Pas de dispatching automatique par GPS/charge de travail — l'administrateur choisit lui-même le ou les techniciens dans la liste des disponibles (filtrée par les congés/absences en cours)
- **Réaffectation manuelle** : possibilité de retirer un ticket à un technicien et de le réassigner à un autre, sans perte des données déjà saisies
- **Escalade manuelle** : possibilité de changer à tout moment le niveau d'urgence d'un ticket en cours, déclenchant une alerte prioritaire

**Statuts du ticket** (une intervention peut s'étaler sur plusieurs jours) :

```
Créée → Assignée → En route → En cours → En pause ⇄ En cours (reprise) → Terminée → Clôturée
(statut "Annulée" disponible à tout moment)
```

Le technicien peut mettre une intervention en pause (fin de journée, attente de pièce, etc.) et la reprendre plus tard.

### 3.4 Supervision en temps réel
- Vue cartographique et vue liste interactive du statut de chaque intervention (y compris "en pause")
- Timeline d'avancement par ticket
- Alertes de dépassement de délai SLA
- Alertes SLA prédictives (avertissement avant le dépassement)
- Rafraîchissement automatique par intervalle (pas de WebSocket nécessaire — voir stack technique)

### 3.5 Gestion des alertes
Panneau centralisé de notifications pour l'administrateur :
- Alerte de dépassement (ou risque de dépassement) de SLA
- Alerte ticket "en pause" depuis une durée anormalement longue
- Notification de clôture d'un ticket
- Notification de nouvelle inscription d'un technicien
- Historique des alertes (lues / non lues)

### 3.6 Catalogue équipements / CMDB
- **Catalogue regroupé par client** (entreprise ou particulier) : chaque client a sa propre liste d'équipements
- Fiche équipement : modèle, n° de série, date d'installation, site, statut (en service / en panne / en réforme)
- Historique complet des interventions (pannes et installations) sur chaque équipement
- Pour une installation, une nouvelle fiche équipement est **automatiquement créée** dans la CMDB à la clôture du ticket
- **Génération automatique d'un QR code** à la création d'une fiche équipement
- **Impression du QR code** directement depuis le dashboard (format étiquette autocollante)

### 3.7 Reporting & Statistiques
- Nombre d'interventions résolues par technicien / période (pannes et installations)
- Temps moyen de résolution (MTTR), taux de respect des SLA
- **Génération automatique du rapport d'intervention en PDF côté administrateur**, à partir des données envoyées par le technicien (rapport texte + photos + signature)
- Export des statistiques en PDF/Excel

---

## 4. Fonctionnalités — Application Mobile (Technicien, via Expo Go)

### 4.1 Authentification
- Création de compte par le technicien : matricule (fourni par l'entreprise), nom, prénom, numéro de téléphone, email professionnel, mot de passe, compétences techniques (sélection multiple), photo de profil (optionnel)
- Connexion : matricule + mot de passe
- Activation de l'authentification biométrique après la première connexion
- Réinitialisation de mot de passe oublié

### 4.2 Consultation des interventions assignées
- Liste des tâches du jour (pannes et installations), triée par priorité, avec statut affiché
- Itinéraire vers le site d'intervention
- Détails complets : description, photo/vidéo envoyée par le client (si panne) ou cahier des charges (si installation), coordonnées du contact
- **Consultation de l'historique complet de l'équipement avant même d'être sur site**, directement depuis les détails du ticket

### 4.3 Outils d'intervention rapide
- Scan du QR code de l'étiquette de l'équipement → fiche technique + historique complet
- **Assistant de diagnostic IA** (Google Gemini API) : suggère des causes probables à partir de l'historique de l'équipement
- Prise de photos/vidéos (état du matériel, preuve d'installation)
- Saisie du rapport d'intervention (texte libre uniquement — pas de checklist ni de liste de pièces ; la mise en forme PDF officielle est générée plus tard côté administrateur)
- **Gestion du statut** : mettre l'intervention "En pause" (avec motif optionnel) et la reprendre plus tard

### 4.4 Validation client & clôture
- Signature numérique du client directement sur l'écran du technicien
- Notification/mise à jour automatique visible au bureau dès la clôture

### 4.5 Connectivité et résilience réseau
- Au démarrage d'une intervention : heure + position GPS enregistrées automatiquement
- **Bandeau d'indicateur de signal** affiché quand le réseau devient instable ou indisponible
- Conservation locale des données en cas de coupure (photos, rapport, signature, changement de statut)
- Synchronisation automatique dès le retour de connexion, sans perte de données
- **Pas de notifications push** (contrainte Expo Go uniquement)

---

## 5. Cardinalités du modèle de données (description textuelle)

### Administrateur ↔ Technicien
- Un administrateur peut consulter et gérer plusieurs comptes techniciens
- Un compte technicien est visible par tous les administrateurs
- Un technicien crée lui-même son compte ; un administrateur peut ensuite l'activer/désactiver

### Administrateur ↔ Ticket
- Un administrateur peut créer plusieurs tickets
- Un ticket est créé par un seul administrateur
- Un administrateur peut réaffecter ou escalader plusieurs tickets au fil du temps

### Technicien ↔ Compétence
- Un technicien peut posséder une ou plusieurs compétences (relation plusieurs-à-plusieurs)
- Une compétence peut être partagée par plusieurs techniciens

### Administrateur ↔ Disponibilité
- Un administrateur peut renseigner plusieurs périodes de disponibilité/indisponibilité
- Une période de disponibilité est associée à un seul technicien
- Un technicien peut avoir plusieurs périodes au fil du temps

### Client ↔ Équipement
- Un client peut posséder un ou plusieurs équipements (CMDB)
- Un équipement appartient à un seul client

### Client ↔ Ticket
- Un client peut être à l'origine de plusieurs tickets
- Un ticket est associé à un seul client

### Ticket ↔ Équipement
- Un ticket "Panne" concerne exactement un équipement existant
- Un équipement peut faire l'objet de plusieurs tickets "Panne" au fil du temps
- Un ticket "Installation" génère un **nouvel** équipement à sa clôture

### Ticket ↔ Technicien (assignation)
- **Un administrateur peut associer un ou plusieurs techniciens à un même ticket**
- Un technicien peut être assigné à plusieurs tickets
- (relation plusieurs-à-plusieurs, via une table d'assignation)

### Ticket ↔ Statut
- Un ticket a un seul statut actif à un instant T
- Un ticket passe par plusieurs statuts successifs, chaque changement est historisé (date, heure, auteur)

### Ticket ↔ Médias
- Un ticket peut contenir plusieurs photos/vidéos envoyées par le client (panne)
- Un ticket peut contenir plusieurs documents/images de cahier des charges (installation)
- Un ticket peut contenir plusieurs photos/vidéos prises par le technicien
- Chaque média est associé à un seul ticket

### Ticket ↔ Rapport d'intervention
- Un ticket donne lieu à un seul rapport final (texte du technicien)
- Un rapport, complété par la signature client, permet la génération d'un seul PDF officiel

### Ticket ↔ Signature
- Un ticket génère une seule signature numérique à sa clôture

### Équipement ↔ QR Code
- Un équipement possède un seul QR code unique ; un QR code identifie un seul équipement

### Ticket ↔ Alerte
- Un ticket peut générer plusieurs alertes au cours de sa vie
- Une alerte est associée à un seul ticket, visible par tous les administrateurs

---

## 6. Ce qui est explicitement HORS scope

- Pas d'interface client (entreprise ou particulier)
- Pas de gestion des habilitations/rôles multiples
- Pas de dispatching automatique par proximité GPS ou charge de travail
- Pas de notifications push (Expo Go uniquement)
- Pas de WebSocket (polling suffit à l'échelle du projet)
- Pas de mode hors-ligne complet type "zone blanche permanente" — seulement résilience aux coupures ponctuelles

---

## 7. Nom du projet
**AlloTech** — le nom fait référence à l'appel téléphonique du client vers l'administrateur, point de départ de tout le processus.
