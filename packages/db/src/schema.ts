import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ==============================================================================
// ENUMERATIONS MÉTIER
// Source : antigravity-01-contexte-fonctionnalites.md
// ==============================================================================

export const typeClientEnum = pgEnum('type_client', ['ENTREPRISE', 'PARTICULIER']);

export const typeDemandeEnum = pgEnum('type_demande', ['PANNE', 'INSTALLATION']);

export const urgenceEnum = pgEnum('urgence', ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE']);

export const ticketStatutEnum = pgEnum('ticket_statut', [
  'CREEE',
  'ASSIGNEE',
  'EN_ROUTE',
  'EN_COURS',
  'EN_PAUSE',
  'TERMINEE',
  'CLOTUREE',
  'ANNULEE',
]);

export const categorieEquipementEnum = pgEnum('categorie_panne', ['MATERIEL', 'LOGICIEL']);

export const sousTypePanneMatEnum = pgEnum('sous_type_panne_materiel', [
  'RESEAU',
  'IMPRIMANTE',
  'ELECTRIQUE',
  'AUTRE_MATERIEL',
]);

export const sousTypePanneLogEnum = pgEnum('sous_type_panne_logiciel', [
  'SYSTEME_EXPLOITATION',
  'APPLICATION',
  'SECURITE_VIRUS',
  'AUTRE_LOGICIEL',
]);

export const statutEquipementEnum = pgEnum('statut_equipement', [
  'EN_SERVICE',
  'EN_PANNE',
  'EN_REFORME',
]);

export const typeAlerteEnum = pgEnum('type_alerte', [
  'SLA_DEPASSE',
  'SLA_PREDICTIF',
  'PAUSE_PROLONGEE',
  'CLOTURE',
  'NOUVELLE_INSCRIPTION',
]);

export const roleUtilisateurEnum = pgEnum('role_utilisateur', ['ADMIN', 'TECHNICIEN']);

// ==============================================================================
// TABLES BETTER AUTH (requises par le framework d'authentification)
// ==============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// ADMINISTRATEUR
// Se connecte avec email + mot de passe
// ==============================================================================

export const administrateurs = pgTable('administrateurs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  prenom: text('prenom').notNull(),
  nom: text('nom').notNull(),
  telephone: text('telephone').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// TECHNICIEN
// Se connecte avec matricule + mot de passe (+ biométrie optionnelle)
// Un administrateur peut activer/désactiver son compte (isActif)
// ==============================================================================

export const techniciens = pgTable('techniciens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  matricule: text('matricule').notNull().unique(),
  prenom: text('prenom').notNull(),
  nom: text('nom').notNull(),
  telephone: text('telephone').notNull(),
  // Photo de profil (URL vers Backblaze B2) — optionnel
  photoUrl: text('photo_url'),
  // Contrôle par l'administrateur (activation/désactivation du compte)
  isActif: boolean('is_actif').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// COMPÉTENCES & LIAISON TECHNICIEN <-> COMPÉTENCES (N-N)
// ==============================================================================

export const competences = pgTable('competences', {
  id: uuid('id').primaryKey().defaultRandom(),
  libelle: text('libelle').notNull().unique(),
});

export const technicienCompetences = pgTable(
  'technicien_competences',
  {
    technicienId: uuid('technicien_id')
      .notNull()
      .references(() => techniciens.id, { onDelete: 'cascade' }),
    competenceId: uuid('competence_id')
      .notNull()
      .references(() => competences.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.technicienId, table.competenceId)],
);

// ==============================================================================
// DISPONIBILITÉS DES TECHNICIENS (congés, absences)
// Un technicien absent n'est pas proposé comme assignable sur la période
// ==============================================================================

export const disponibilites = pgTable('disponibilites', {
  id: uuid('id').primaryKey().defaultRandom(),
  technicienId: uuid('technicien_id')
    .notNull()
    .references(() => techniciens.id, { onDelete: 'cascade' }),
  motif: text('motif'),
  dateDebut: timestamp('date_debut').notNull(),
  dateFin: timestamp('date_fin').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==============================================================================
// CLIENTS (Entreprise ou Particulier — PAS d'interface client)
// L'administrateur saisit manuellement les informations du client
// ==============================================================================

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  nom: text('nom').notNull(),
  typeClient: typeClientEnum('type_client').notNull(),
  telephone: text('telephone').notNull(),
  email: text('email'),
  adresse: text('adresse'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// ÉQUIPEMENTS / CMDB
// Regroupés par client. Un QR code unique est généré à la création.
// Pour un ticket INSTALLATION clôturé → nouvel équipement créé automatiquement.
// ==============================================================================

export const equipements = pgTable('equipements', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  modele: text('modele').notNull(),
  numeroSerie: text('numero_serie').notNull().unique(),
  dateInstallation: timestamp('date_installation'),
  siteAdresse: text('site_adresse'),
  statut: statutEquipementEnum('statut').notNull().default('EN_SERVICE'),
  // Le QR code est stocké comme une chaîne unique (UUID ou URL encodée)
  qrCodeData: text('qr_code_data').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// TICKETS (cœur du système)
// Panne → pointe vers un équipement EXISTANT
// Installation → équipement = null au départ, créé à la clôture
// ==============================================================================

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull().unique(), // ex: TCK-2026-001
  administrateurId: uuid('administrateur_id')
    .notNull()
    .references(() => administrateurs.id, { onDelete: 'restrict' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  // null pour INSTALLATION (équipement créé à la clôture), obligatoire pour PANNE
  equipementId: uuid('equipement_id').references(() => equipements.id, { onDelete: 'set null' }),
  typeDemande: typeDemandeEnum('type_demande').notNull(),
  statutActuel: ticketStatutEnum('statut_actuel').notNull().default('CREEE'),
  urgence: urgenceEnum('urgence').notNull().default('NORMALE'),
  adresseSite: text('adresse_site').notNull(),
  description: text('description').notNull(),
  dateSouhaitee: timestamp('date_souhaitee'),
  commentaire: text('commentaire'),
  // Champs spécifiques aux PANNES
  categoriePanne: categorieEquipementEnum('categorie_panne'),
  sousTypePanneMat: sousTypePanneMatEnum('sous_type_panne_mat'),
  sousTypePanneLog: sousTypePanneLogEnum('sous_type_panne_log'),
  // Champs spécifiques aux INSTALLATIONS
  equipementsDescription: text('equipements_description'),
  // Horodatages terrain
  heureDepart: timestamp('heure_depart'), // En route
  heureDemarrage: timestamp('heure_demarrage'), // En cours
  latitudeDemarrage: text('latitude_demarrage'),
  longitudeDemarrage: text('longitude_demarrage'),
  heureFinale: timestamp('heure_finale'), // Terminée
  clotureAt: timestamp('cloture_at'), // Clôturée
  // SLA
  slaEcheanceAt: timestamp('sla_echeance_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// ASSIGNATION TECHNICIENS <-> TICKETS (N-N)
// L'administrateur assigne manuellement un ou plusieurs techniciens
// ==============================================================================

export const ticketTechniciens = pgTable(
  'ticket_techniciens',
  {
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    technicienId: uuid('technicien_id')
      .notNull()
      .references(() => techniciens.id, { onDelete: 'cascade' }),
    assigneAt: timestamp('assigne_at').notNull().defaultNow(),
  },
  (table) => [unique().on(table.ticketId, table.technicienId)],
);

// ==============================================================================
// HISTORIQUE DES STATUTS (traçabilité complète de chaque transition)
// ==============================================================================

export const statutsHistorique = pgTable('statuts_historique', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  statutPrecedent: ticketStatutEnum('statut_precedent'),
  statutNouvel: ticketStatutEnum('statut_nouvel').notNull(),
  // L'auteur peut être un admin ou un technicien
  auteurAdminId: uuid('auteur_admin_id').references(() => administrateurs.id, {
    onDelete: 'set null',
  }),
  auteurTechId: uuid('auteur_tech_id').references(() => techniciens.id, {
    onDelete: 'set null',
  }),
  motif: text('motif'), // motif de pause, annulation, etc.
  changedAt: timestamp('changed_at').notNull().defaultNow(),
});

// ==============================================================================
// MÉDIAS (photos, vidéos, documents)
// Stockés sur Backblaze B2 — l'URL est présignée côté serveur (tRPC)
// ==============================================================================

export const typeMediaEnum = pgEnum('type_media', [
  'PHOTO_PANNE_CLIENT', // Envoyée par le client lors de l'appel
  'DOC_CAHIER_CHARGES', // Cahier des charges pour installation
  'PHOTO_INTERVENTION_TECH', // Prise par le technicien sur le terrain
  'VIDEO_INTERVENTION_TECH',
]);

export const medias = pgTable('medias', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  typeMedia: typeMediaEnum('type_media').notNull(),
  // URL du fichier stocké sur Backblaze B2 (générée par URL présignée)
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: text('mime_type'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

// ==============================================================================
// RAPPORT D'INTERVENTION (rédigé par le technicien — texte libre uniquement)
// La mise en forme PDF officielle est générée côté administrateur
// ==============================================================================

export const rapports = pgTable('rapports', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .unique() // 1 ticket = 1 seul rapport
    .references(() => tickets.id, { onDelete: 'cascade' }),
  technicienId: uuid('technicien_id')
    .notNull()
    .references(() => techniciens.id, { onDelete: 'restrict' }),
  contenu: text('contenu').notNull(),
  // URL du PDF généré sur Backblaze B2
  pdfUrl: text('pdf_url'),
  pdfGenereAt: timestamp('pdf_genere_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==============================================================================
// SIGNATURES CLIENTS (capturées sur l'écran du technicien)
// Stockées en format SVG/base64 sur Backblaze B2
// ==============================================================================

export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .unique() // 1 ticket = 1 seule signature
    .references(() => tickets.id, { onDelete: 'cascade' }),
  signatureUrl: text('signature_url').notNull(), // URL sur Backblaze B2
  nomSignataire: text('nom_signataire'),
  signedAt: timestamp('signed_at').notNull().defaultNow(),
});

// ==============================================================================
// ALERTES (panneau centralisé pour les administrateurs)
// ==============================================================================

export const alertes = pgTable('alertes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }),
  typeAlerte: typeAlerteEnum('type_alerte').notNull(),
  message: text('message').notNull(),
  isLue: boolean('is_lue').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==============================================================================
// RELATIONS DRIZZLE (pour les requêtes avec jointures)
// ==============================================================================

export const usersRelations = relations(users, ({ one }) => ({
  administrateur: one(administrateurs, {
    fields: [users.id],
    references: [administrateurs.userId],
  }),
  technicien: one(techniciens, {
    fields: [users.id],
    references: [techniciens.userId],
  }),
}));

export const administrateursRelations = relations(administrateurs, ({ one, many }) => ({
  user: one(users, { fields: [administrateurs.userId], references: [users.id] }),
  tickets: many(tickets),
}));

export const techniciensRelations = relations(techniciens, ({ one, many }) => ({
  user: one(users, { fields: [techniciens.userId], references: [users.id] }),
  competences: many(technicienCompetences),
  disponibilites: many(disponibilites),
  ticketAssignations: many(ticketTechniciens),
  rapports: many(rapports),
}));

export const competencesRelations = relations(competences, ({ many }) => ({
  techniciens: many(technicienCompetences),
}));

export const technicienCompetencesRelations = relations(technicienCompetences, ({ one }) => ({
  technicien: one(techniciens, {
    fields: [technicienCompetences.technicienId],
    references: [techniciens.id],
  }),
  competence: one(competences, {
    fields: [technicienCompetences.competenceId],
    references: [competences.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  equipements: many(equipements),
  tickets: many(tickets),
}));

export const equipementsRelations = relations(equipements, ({ one, many }) => ({
  client: one(clients, { fields: [equipements.clientId], references: [clients.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  administrateur: one(administrateurs, {
    fields: [tickets.administrateurId],
    references: [administrateurs.id],
  }),
  client: one(clients, { fields: [tickets.clientId], references: [clients.id] }),
  equipement: one(equipements, { fields: [tickets.equipementId], references: [equipements.id] }),
  techniciens: many(ticketTechniciens),
  statutsHistorique: many(statutsHistorique),
  medias: many(medias),
  rapport: one(rapports, { fields: [tickets.id], references: [rapports.ticketId] }),
  signature: one(signatures, { fields: [tickets.id], references: [signatures.ticketId] }),
  alertes: many(alertes),
}));

export const ticketTechniciensRelations = relations(ticketTechniciens, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketTechniciens.ticketId], references: [tickets.id] }),
  technicien: one(techniciens, {
    fields: [ticketTechniciens.technicienId],
    references: [techniciens.id],
  }),
}));

export const rapportsRelations = relations(rapports, ({ one }) => ({
  ticket: one(tickets, { fields: [rapports.ticketId], references: [tickets.id] }),
  technicien: one(techniciens, { fields: [rapports.technicienId], references: [techniciens.id] }),
}));

export const alertesRelations = relations(alertes, ({ one }) => ({
  ticket: one(tickets, { fields: [alertes.ticketId], references: [tickets.id] }),
}));
