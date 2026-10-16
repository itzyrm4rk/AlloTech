export const STATUT_CONFIG = {
  CREEE: { label: 'Créée', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  ASSIGNEE: { label: 'Assignée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  EN_ROUTE: { label: 'En route', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  EN_COURS: {
    label: 'En cours',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500 animate-pulse',
  },
  EN_PAUSE: {
    label: 'En pause',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  TERMINEE: {
    label: 'Terminée',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  CLOTUREE: {
    label: 'Clôturée',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
  },
  ANNULEE: { label: 'Annulée', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
} as const;

export const URGENCE_CONFIG = {
  CRITIQUE: {
    label: 'CRITIQUE',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  HAUTE: {
    label: 'HAUTE',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  NORMALE: {
    label: 'NORMALE',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  BASSE: {
    label: 'BASSE',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
} as const;

export type StatutTicket = keyof typeof STATUT_CONFIG;
export type UrgenceTicket = keyof typeof URGENCE_CONFIG;

export interface HistoriqueEntry {
  id: string;
  statutNouvel: StatutTicket;
  statutPrecedent: StatutTicket | null;
  motif: string | null;
  changedAt: string;
  auteurAdmin?: { prenom: string; nom: string } | null;
  auteurTech?: { prenom: string; nom: string } | null;
}

export interface TechnicienAssigne {
  technicien: {
    id: string;
    prenom: string;
    nom: string;
    matricule: string;
    isActif: boolean;
    photoUrl?: string | null;
    user?: {
      id?: string;
      image?: string | null;
      email?: string | null;
      name?: string | null;
    } | null;
    disponibilites?: Array<{ dateDebut: string; dateFin: string }>;
  };
}

export interface TicketDetail {
  id: string;
  reference: string;
  statutActuel: StatutTicket;
  urgence: UrgenceTicket;
  typeDemande: string;
  client: {
    nom: string;
    telephone: string;
    typeClient: string;
    email?: string | null;
    adresse?: string | null;
  } | null;
  equipement?: {
    id: string;
    modele: string;
    typeActif: 'MATERIEL' | 'LOGICIEL';
    numeroSerie: string;
    editeur?: string | null;
    version?: string | null;
    qrCodeData?: string | null;
    dateInstallation?: string | Date | null;
  } | null;
  adresseSite: string;
  description: string;
  categoriePanne?: string | null;
  sousTypePanneMat?: string | null;
  sousTypePanneLog?: string | null;
  equipementsDescription?: string | null;
  commentaire?: string | null;
  dateSouhaitee?: string | null;
  createdAt: string;
  updatedAt: string;
  techniciens: TechnicienAssigne[];
  statutsHistorique: HistoriqueEntry[];
  heureDepart?: string | null;
  heureDemarrage?: string | null;
  latitudeDemarrage?: string | null;
  longitudeDemarrage?: string | null;
  heureFinale?: string | null;
  slaEcheanceAt?: string | null;
  clotureAt?: string | null;
  rapport?: {
    id: string;
    contenu: string;
    pdfUrl?: string | null;
    createdAt: string;
  } | null;
  signature?: {
    id: string;
    signatureUrl: string;
    nomSignataire?: string | null;
    signedAt: string;
  } | null;
  medias?: Array<{
    id: string;
    typeMedia:
      | 'PHOTO_PANNE_CLIENT'
      | 'DOC_CAHIER_CHARGES'
      | 'PHOTO_INTERVENTION_TECH'
      | 'VIDEO_INTERVENTION_TECH';
    fileUrl: string;
    downloadUrl?: string;
    fileName: string;
    fileSizeBytes?: number | null;
    mimeType?: string | null;
    uploadedAt: string;
  }>;
}

export interface AvailTech {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
  isActif: boolean;
  photoUrl?: string | null;
  user?: {
    id?: string;
    image?: string | null;
    email?: string | null;
    name?: string | null;
  } | null;
  disponibilites?: Array<{ dateDebut: string; dateFin: string }>;
}

export function isEnConge(tech: AvailTech, dateSouhaitee: string | null | undefined): boolean {
  if (!dateSouhaitee || !tech.disponibilites?.length) return false;
  const d = new Date(dateSouhaitee);
  return tech.disponibilites.some((abs) => {
    const debut = new Date(abs.dateDebut);
    const fin = new Date(abs.dateFin);
    return d >= debut && d <= fin;
  });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
