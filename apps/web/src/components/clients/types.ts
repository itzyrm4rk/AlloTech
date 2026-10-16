import { Building2, User } from 'lucide-react';
import type { ElementType } from 'react';

export type ClientType = 'ENTREPRISE' | 'PARTICULIER';

export type EquipementDB = {
  id: string;
  clientId: string;
  modele: string;
  numeroSerie: string;
  typeActif?: 'MATERIEL' | 'LOGICIEL';
  editeur?: string | null;
  version?: string | null;
  dateInstallation?: string | Date | null;
  siteAdresse?: string | null;
  statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME';
  qrCodeData: string;
  createdAt: string;
};

export type TicketDB = {
  id: string;
  reference: string;
  typeDemande: 'PANNE' | 'INSTALLATION';
  statutActuel: string;
  urgence: string;
  description: string;
  createdAt: string;
  techniciens?: {
    technicien: {
      prenom: string;
      nom: string;
      matricule: string;
    };
  }[];
};

export type ClientDB = {
  id: string;
  nom: string;
  typeClient: ClientType;
  telephone: string;
  email: string | null;
  adresse: string | null;
  createdAt: string;
  equipements?: EquipementDB[];
  tickets?: TicketDB[];
};

export interface ClientFormData {
  nom: string;
  typeClient: ClientType;
  telephone: string;
  email: string;
  adresse: string;
}

export const TYPE_CONFIG: Record<
  ClientType,
  {
    label: string;
    icon: ElementType;
    bg: string;
    text: string;
    border: string;
  }
> = {
  ENTREPRISE: {
    label: 'Entreprise',
    icon: Building2,
    bg: 'bg-blue-50',
    text: 'text-[#31525B]',
    border: 'border-blue-200',
  },
  PARTICULIER: {
    label: 'Particulier',
    icon: User,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
};

export const STATUT_EQUIPEMENT_CONFIG = {
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
};

/**
 * Validation unifiée du formulaire client
 */
export function validateClientForm(form: ClientFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.nom.trim() || form.nom.trim().length < 2) {
    errors.nom = 'Le nom du client ou de l’entreprise est requis (2 caractères minimum).';
  }

  if (!form.telephone.trim() || form.telephone.trim().length < 6) {
    errors.telephone = 'Un numéro de téléphone valide est requis (6 chiffres minimum).';
  }

  if (!form.adresse.trim() || form.adresse.trim().length < 3) {
    errors.adresse =
      "L'adresse géographique / site du client est obligatoire (3 caractères minimum).";
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "L'adresse email saisie n'est pas valide.";
  }

  return errors;
}
