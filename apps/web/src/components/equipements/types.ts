export type TicketHistorique = {
  id: string;
  reference: string;
  typeDemande: 'PANNE' | 'INSTALLATION' | 'MAINTENANCE';
  statutActuel: string;
  urgence: string;
  description: string;
  createdAt: string;
  dateSouhaitee?: string | null;
  categoriePanne?: string | null;
  sousTypePanneMat?: string | null;
  sousTypePanneLog?: string | null;
  heureDemarrage?: string | null;
  heureFinale?: string | null;
  clotureAt?: string | null;
  techniciens?: {
    technicien: {
      id: string;
      matricule: string;
      prenom: string;
      nom: string;
      telephone?: string | null;
      photoUrl?: string | null;
    };
  }[];
  rapport?: {
    id: string;
    contenu?: string | null;
    resolution?: string | null;
    observations?: string | null;
    piecesChangees?: string | null;
    tempsPasseMinutes?: number | null;
    createdAt?: string;
    technicien?: {
      id: string;
      matricule: string;
      prenom: string;
      nom: string;
    } | null;
  } | null;
};

export type EquipementDB = {
  id: string;
  clientId: string;
  typeActif?: 'MATERIEL' | 'LOGICIEL';
  modele: string;
  numeroSerie: string;
  editeur?: string | null;
  version?: string | null;
  siteAdresse: string | null;
  dateInstallation: string | null;
  statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME';
  qrCodeData: string;
  createdAt: string;
  client?: {
    id: string;
    nom: string;
    typeClient?: 'ENTREPRISE' | 'PARTICULIER' | string | null;
    telephone: string;
    adresse?: string | null;
  };
  tickets?: TicketHistorique[];
};

export type ClientSimple = {
  id: string;
  nom: string;
  typeClient?: 'ENTREPRISE' | 'PARTICULIER' | string | null;
  adresse: string | null;
};

export const STATUT_CONFIG = {
  EN_SERVICE: {
    label: 'En service',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  EN_PANNE: {
    label: 'En panne',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  EN_REFORME: {
    label: 'Mis au rebut',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
} as const;

export const URGENCE_BADGES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  CRITIQUE: {
    label: 'Critique',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  HAUTE: {
    label: 'Haute',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  NORMALE: {
    label: 'Normale',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  BASSE: {
    label: 'Basse',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};
