export interface GlobalStats {
  total: number;
  pannes: number;
  installations: number;
  resolus: number;
  mttrMinutes: number | null;
  mttrFormate: string;
  mttaMinutes?: number | null;
  mttaFormate?: string;
  tauxSla: number;
  slaRespected: number;
  parUrgence: { CRITIQUE: number; HAUTE: number; NORMALE: number; BASSE: number };
  parCategorie: { MATERIEL: number; LOGICIEL: number };
  parStatut: Record<string, number>;
}

export interface TechnicienPerf {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  photoUrl?: string | null;
  isActif: boolean;
  totalAssignes: number;
  resolus: number;
  mttrMinutes: number | null;
  mttrFormate: string;
  tauxSla: number | null;
  tempsTotalMinutes: number;
}

export type Periode = '7j' | '30j' | 'mois' | 'annee' | 'custom';
export type SortField = 'resolus' | 'mttr' | 'sla';

export const PERIODE_OPTIONS: { id: Periode; label: string }[] = [
  { id: '7j', label: '7 derniers jours' },
  { id: '30j', label: '30 derniers jours' },
  { id: 'mois', label: 'Ce mois' },
  { id: 'annee', label: 'Cette année' },
];

export function getPeriodeDates(
  p: Periode,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  switch (p) {
    case '7j':
      return { startDate: new Date(Date.now() - 7 * 86400000).toISOString(), endDate };
    case '30j':
      return { startDate: new Date(Date.now() - 30 * 86400000).toISOString(), endDate };
    case 'mois':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate };
    case 'annee':
      return { startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate };
    case 'custom':
      return {
        startDate: customStart ?? new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: customEnd ?? endDate,
      };
  }
}
