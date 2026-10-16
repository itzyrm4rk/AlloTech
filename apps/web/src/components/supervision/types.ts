export interface TechnicianItem {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  telephone?: string;
}

export interface SupervisionTicket {
  id: string;
  reference: string;
  typeDemande: 'PANNE' | 'INSTALLATION';
  statutActuel: string;
  urgence: 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE';
  description: string;
  adresseSite: string;
  coords: { lat: number; lng: number };
  dateSouhaitee?: string | null;
  heureDepart?: string | null;
  heureDemarrage?: string | null;
  latitudeDemarrage?: string | null;
  longitudeDemarrage?: string | null;
  clotureAt?: string | null;
  createdAt: string;
  client: {
    id: string;
    nom: string;
    telephone: string;
    adresse?: string | null;
  } | null;
  equipement?: {
    id: string;
    modele: string;
    numeroSerie: string;
    statut: string;
  } | null;
  techniciens: TechnicianItem[];
  sla: {
    durationHours: number;
    totalDurationMs: number;
    echeanceAt: string;
    remainingMinutes: number;
    progressPct: number;
    isDepasse: boolean;
    isImminent: boolean;
  };
}

export interface SupervisionKPIs {
  totalActifs: number;
  enRoute: number;
  enCours: number;
  enPause: number;
  critiques: number;
  slaDepasses: number;
  slaImminents: number;
}

export const URGENCE_COLORS = {
  CRITIQUE: {
    label: 'CRITIQUE',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hex: '#C0392B',
  },
  HAUTE: {
    label: 'HAUTE',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    hex: '#FFA101',
  },
  NORMALE: {
    label: 'NORMALE',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    hex: '#31525B',
  },
  BASSE: {
    label: 'BASSE',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    hex: '#64748B',
  },
};

export const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  CREEE: { label: 'Créée', color: '#64748B' },
  ASSIGNEE: { label: 'Assignée', color: '#0284C7' },
  EN_ROUTE: { label: 'En route', color: '#06B6D4' },
  EN_COURS: { label: 'En cours', color: '#FFA101' },
  EN_PAUSE: { label: 'En pause', color: '#EA580C' },
  TERMINEE: { label: 'Terminée', color: '#16A34A' },
  CLOTUREE: { label: 'Clôturée', color: '#2E8B57' },
  ANNULEE: { label: 'Annulée', color: '#DC2626' },
};
