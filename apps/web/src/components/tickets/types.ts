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

export type Urgence = keyof typeof URGENCE_CONFIG;
export type Statut = keyof typeof STATUT_CONFIG;

export interface TicketItem {
  id: string;
  reference: string;
  clientId?: string;
  client: { id?: string; nom: string } | null;
  adresseSite: string;
  statutActuel: Statut;
  urgence: Urgence;
  typeDemande: string;
  techniciens?: Array<{
    technicienId?: string;
    technicien: { id?: string; prenom: string; nom: string; matricule?: string };
  }>;
  medias?: Array<{ id: string; typeMedia: string }>;
  createdAt: string;
}

export interface ClientOption {
  id: string;
  nom: string;
}

export interface TechOption {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
}

export interface KPI {
  total: number;
  creees: number;
  enCours: number;
  critiques: number;
  terminees: number;
}
