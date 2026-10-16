// ---------------------------------------------------------------------------
// Types partagés — Tickets AlloTech
// Source unique de vérité pour les types utilisés dans screens/ et modals/
// ---------------------------------------------------------------------------

export type Urgence = 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE';
export type Statut = 'ASSIGNEE' | 'EN_ROUTE' | 'EN_COURS' | 'EN_PAUSE' | 'TERMINEE' | 'CLOTUREE';

// Ticket "léger" utilisé dans les listes (MesTicketsScreen, CarteScreen)
export interface Ticket {
  id: string;
  reference: string;
  client: string;
  clientType?: 'ENTREPRISE' | 'PARTICULIER' | null;
  clientTelephone?: string | null;
  adresseSite: string;
  latitudeSite?: string | null;
  longitudeSite?: string | null;
  statut: Statut;
  urgence: Urgence;
  typeDemande: string;
  description: string;
  createdAt: string;
  techniciensCount?: number;
}

// Ticket "enrichi" chargé depuis le serveur dans DetailTicketScreen
export interface FullTicketData {
  id: string;
  reference: string;
  statutActuel: string;
  urgence: string;
  description: string;
  adresseSite: string;
  latitudeSite?: string | null;
  longitudeSite?: string | null;
  categoriePanne?: string | null;
  sousTypePanneMat?: string | null;
  sousTypePanneLog?: string | null;
  commentaire?: string | null;
  dateSouhaitee?: string | Date | null;
  slaEcheanceAt?: string | Date | null;
  typeDemande: string;
  equipementsDescription?: string | null;
  createdAt: string;
  heureDepart?: string | Date | null;
  heureDemarrage?: string | Date | null;
  heureFinale?: string | Date | null;
  clotureAt?: string | Date | null;
  statutsHistorique?: Array<{
    id: string;
    statutPrecedent?: string | null;
    statutNouvel: string;
    motif?: string | null;
    auteurTechId?: string | null;
    auteurAdminId?: string | null;
    changedAt: string | Date;
  }>;
  client?: {
    id: string;
    nom: string;
    typeClient?: 'ENTREPRISE' | 'PARTICULIER' | string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
  } | null;
  equipement?: {
    id: string;
    modele: string;
    numeroSerie: string;
    statut: string;
    siteAdresse?: string | null;
    typeActif?: string | null;
  } | null;
  medias?: Array<{
    id: string;
    fileUrl?: string;
    url?: string;
    fileName?: string;
    nomFichier?: string;
    typeMedia?: string;
    mimeType?: string;
    fileSizeBytes?: number;
  }>;
  rapport?: {
    contenu: string;
    pdfUrl?: string | null;
  } | null;
  signature?: {
    signatureUrl: string;
    nomSignataire?: string | null;
    signedAt?: string | null;
  } | null;
  techniciens?: Array<{
    technicien: {
      id: string;
      prenom: string;
      nom: string;
      matricule: string;
      telephone?: string | null;
      photoUrl?: string | null;
      isActif?: boolean;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Configurations d'affichage
// ---------------------------------------------------------------------------

export const URGENCE_CONFIG: Record<
  Urgence,
  { label: string; bg: string; text: string; dot: string; color: string }
> = {
  CRITIQUE: { label: 'CRITIQUE', bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444', color: '#DC2626' },
  HAUTE: { label: 'HAUTE', bg: '#FFEDD5', text: '#C2410C', dot: '#F97316', color: '#D97706' },
  NORMALE: { label: 'NORMALE', bg: '#E0F2FE', text: '#0369A1', dot: '#0284C7', color: '#2563EB' },
  BASSE: { label: 'BASSE', bg: '#F1F5F9', text: '#475569', dot: '#64748B', color: '#64748B' },
};

export const STATUT_CONFIG: Record<
  Statut,
  { label: string; text: string; dot: string; color: string; bg: string }
> = {
  ASSIGNEE: {
    label: 'Assigné — En attente',
    text: '#2563EB',
    dot: '#3B82F6',
    color: '#1D4ED8',
    bg: '#EFF6FF',
  },
  EN_ROUTE: {
    label: 'En route vers le site',
    text: '#0891B2',
    dot: '#06B6D4',
    color: '#0E7490',
    bg: '#ECFEFF',
  },
  EN_COURS: {
    label: 'Intervention en cours',
    text: '#D97706',
    dot: '#F59E0B',
    color: '#B45309',
    bg: '#FFFBEB',
  },
  EN_PAUSE: { label: 'En pause', text: '#EA580C', dot: '#F97316', color: '#C2410C', bg: '#FFF7ED' },
  TERMINEE: {
    label: 'Terminée (attente signature)',
    text: '#059669',
    dot: '#10B981',
    color: '#065F46',
    bg: '#ECFDF5',
  },
  CLOTUREE: {
    label: 'Clôturée & Signée',
    text: '#16A34A',
    dot: '#22C55E',
    color: '#15803D',
    bg: '#F0FDF4',
  },
};

export const TRANSITIONS: Partial<Record<Statut, Statut[]>> = {
  ASSIGNEE: ['EN_ROUTE', 'EN_COURS'],
  EN_ROUTE: ['EN_COURS'],
  EN_COURS: ['EN_PAUSE', 'TERMINEE', 'CLOTUREE'],
  EN_PAUSE: ['EN_COURS'],
  TERMINEE: ['CLOTUREE'],
  CLOTUREE: [],
};
