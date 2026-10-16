import type { LucideIcon } from 'lucide-react';
import { Activity, Briefcase, Calendar, GraduationCap, Heart, HelpCircle, Sun } from 'lucide-react';

export type Competence = { id: string; libelle: string };

export type Disponibilite = {
  id: string;
  technicienId: string;
  motif: string | null;
  dateDebut: string;
  dateFin: string;
  createdAt: string;
};

export type TechnicienDB = {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  telephone: string;
  isActif: boolean;
  createdAt: string;
  photoUrl: string | null;
  competences: { competence: Competence }[];
  user: { email: string; image: string | null } | null;
  disponibilites?: Disponibilite[];
};

export type MatriculeAutorise = {
  id: string;
  matricule: string;
  isUtilise: boolean;
  createdAt: string;
};

export type ActiveTab = 'TECHNICIENS' | 'MATRICULES' | 'PLANNING';
export type StatusFilter = 'TOUS' | 'ACTIF' | 'INACTIF' | 'CONGE';

export interface MotifAbsence {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

export const MOTIFS_ABSENCE: readonly MotifAbsence[] = [
  {
    id: 'Congé annuel',
    label: 'Congé annuel',
    desc: 'Repos légal et vacances annuelles',
    icon: Calendar,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'Congé maladie',
    label: 'Congé maladie',
    desc: 'Arrêt médical et convalescence',
    icon: Activity,
    color: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  {
    id: 'Congé maternité / paternité',
    label: 'Congé parental',
    desc: 'Maternité, paternité ou adoption',
    icon: Heart,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  {
    id: 'Formation professionnelle',
    label: 'Formation',
    desc: 'Montée en compétences certifiante',
    icon: GraduationCap,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    id: 'Mission externe',
    label: 'Mission externe',
    desc: 'Détachement ou intervention déportée',
    icon: Briefcase,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 'Jour férié',
    label: 'Jour férié / Récupération',
    desc: 'Jour férié chômé ou RTT',
    icon: Sun,
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  {
    id: 'Autre',
    label: 'Autre motif',
    desc: 'Absence exceptionnelle justifiée',
    icon: HelpCircle,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
  },
] as const;

export function isTechCurrentlyOnLeave(tech: TechnicienDB): boolean {
  if (!tech.disponibilites || tech.disponibilites.length === 0) return false;
  const now = new Date();
  return tech.disponibilites.some((d) => {
    const start = new Date(d.dateDebut);
    const end = new Date(d.dateFin);
    return now >= start && now <= end;
  });
}

export interface TechnicienStats {
  total: number;
  actifs: number;
  enAttente: number;
  enConge: number;
  matriculesEnAttente: number;
}
