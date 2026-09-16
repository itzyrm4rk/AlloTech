CREATE TYPE "public"."categorie_panne" AS ENUM('MATERIEL', 'LOGICIEL');--> statement-breakpoint
CREATE TYPE "public"."role_utilisateur" AS ENUM('ADMIN', 'TECHNICIEN');--> statement-breakpoint
CREATE TYPE "public"."sous_type_panne_logiciel" AS ENUM('SYSTEME_EXPLOITATION', 'APPLICATION', 'SECURITE_VIRUS', 'AUTRE_LOGICIEL');--> statement-breakpoint
CREATE TYPE "public"."sous_type_panne_materiel" AS ENUM('RESEAU', 'IMPRIMANTE', 'ELECTRIQUE', 'AUTRE_MATERIEL');--> statement-breakpoint
CREATE TYPE "public"."statut_equipement" AS ENUM('EN_SERVICE', 'EN_PANNE', 'EN_REFORME');--> statement-breakpoint
CREATE TYPE "public"."ticket_statut" AS ENUM('CREEE', 'ASSIGNEE', 'EN_ROUTE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'CLOTUREE', 'ANNULEE');--> statement-breakpoint
CREATE TYPE "public"."type_alerte" AS ENUM('SLA_DEPASSE', 'SLA_PREDICTIF', 'PAUSE_PROLONGEE', 'CLOTURE', 'NOUVELLE_INSCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."type_client" AS ENUM('ENTREPRISE', 'PARTICULIER');--> statement-breakpoint
CREATE TYPE "public"."type_demande" AS ENUM('PANNE', 'INSTALLATION');--> statement-breakpoint
CREATE TYPE "public"."type_media" AS ENUM('PHOTO_PANNE_CLIENT', 'DOC_CAHIER_CHARGES', 'PHOTO_INTERVENTION_TECH', 'VIDEO_INTERVENTION_TECH');--> statement-breakpoint
CREATE TYPE "public"."urgence" AS ENUM('CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administrateurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"prenom" text NOT NULL,
	"nom" text NOT NULL,
	"telephone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "administrateurs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "alertes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid,
	"type_alerte" "type_alerte" NOT NULL,
	"message" text NOT NULL,
	"is_lue" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"type_client" "type_client" NOT NULL,
	"telephone" text NOT NULL,
	"email" text,
	"adresse" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"libelle" text NOT NULL,
	CONSTRAINT "competences_libelle_unique" UNIQUE("libelle")
);
--> statement-breakpoint
CREATE TABLE "disponibilites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technicien_id" uuid NOT NULL,
	"motif" text,
	"date_debut" timestamp NOT NULL,
	"date_fin" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"modele" text NOT NULL,
	"numero_serie" text NOT NULL,
	"date_installation" timestamp,
	"site_adresse" text,
	"statut" "statut_equipement" DEFAULT 'EN_SERVICE' NOT NULL,
	"qr_code_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipements_numero_serie_unique" UNIQUE("numero_serie"),
	CONSTRAINT "equipements_qr_code_data_unique" UNIQUE("qr_code_data")
);
--> statement-breakpoint
CREATE TABLE "medias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"type_media" "type_media" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size_bytes" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rapports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"technicien_id" uuid NOT NULL,
	"contenu" text NOT NULL,
	"pdf_url" text,
	"pdf_genere_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rapports_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"signature_url" text NOT NULL,
	"nom_signataire" text,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signatures_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "statuts_historique" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"statut_precedent" "ticket_statut",
	"statut_nouvel" "ticket_statut" NOT NULL,
	"auteur_admin_id" uuid,
	"auteur_tech_id" uuid,
	"motif" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicien_competences" (
	"technicien_id" uuid NOT NULL,
	"competence_id" uuid NOT NULL,
	CONSTRAINT "technicien_competences_technicien_id_competence_id_unique" UNIQUE("technicien_id","competence_id")
);
--> statement-breakpoint
CREATE TABLE "techniciens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"matricule" text NOT NULL,
	"prenom" text NOT NULL,
	"nom" text NOT NULL,
	"telephone" text NOT NULL,
	"photo_url" text,
	"is_actif" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "techniciens_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "techniciens_matricule_unique" UNIQUE("matricule")
);
--> statement-breakpoint
CREATE TABLE "ticket_techniciens" (
	"ticket_id" uuid NOT NULL,
	"technicien_id" uuid NOT NULL,
	"assigne_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_techniciens_ticket_id_technicien_id_unique" UNIQUE("ticket_id","technicien_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"administrateur_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"equipement_id" uuid,
	"type_demande" "type_demande" NOT NULL,
	"statut_actuel" "ticket_statut" DEFAULT 'CREEE' NOT NULL,
	"urgence" "urgence" DEFAULT 'NORMALE' NOT NULL,
	"adresse_site" text NOT NULL,
	"description" text NOT NULL,
	"date_souhaitee" timestamp,
	"commentaire" text,
	"categorie_panne" "categorie_panne",
	"sous_type_panne_mat" "sous_type_panne_materiel",
	"sous_type_panne_log" "sous_type_panne_logiciel",
	"equipements_description" text,
	"heure_depart" timestamp,
	"heure_demarrage" timestamp,
	"latitude_demarrage" text,
	"longitude_demarrage" text,
	"heure_finale" timestamp,
	"cloture_at" timestamp,
	"sla_echeance_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administrateurs" ADD CONSTRAINT "administrateurs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilites" ADD CONSTRAINT "disponibilites_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipements" ADD CONSTRAINT "equipements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medias" ADD CONSTRAINT "medias_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statuts_historique" ADD CONSTRAINT "statuts_historique_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statuts_historique" ADD CONSTRAINT "statuts_historique_auteur_admin_id_administrateurs_id_fk" FOREIGN KEY ("auteur_admin_id") REFERENCES "public"."administrateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statuts_historique" ADD CONSTRAINT "statuts_historique_auteur_tech_id_techniciens_id_fk" FOREIGN KEY ("auteur_tech_id") REFERENCES "public"."techniciens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicien_competences" ADD CONSTRAINT "technicien_competences_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicien_competences" ADD CONSTRAINT "technicien_competences_competence_id_competences_id_fk" FOREIGN KEY ("competence_id") REFERENCES "public"."competences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "techniciens" ADD CONSTRAINT "techniciens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_techniciens" ADD CONSTRAINT "ticket_techniciens_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_techniciens" ADD CONSTRAINT "ticket_techniciens_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_administrateur_id_administrateurs_id_fk" FOREIGN KEY ("administrateur_id") REFERENCES "public"."administrateurs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_equipement_id_equipements_id_fk" FOREIGN KEY ("equipement_id") REFERENCES "public"."equipements"("id") ON DELETE set null ON UPDATE no action;