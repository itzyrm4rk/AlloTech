/**
 * Calcul du MTTR (Mean Time To Resolution) - AlloTech
 * Logique metier centralisee, testable avec Vitest
 */

export interface MttrTicket {
  heureDemarrage: Date | null | undefined;
  heureFinale: Date | null | undefined;
  clotureAt: Date | null | undefined;
  createdAt: Date;
}

/**
 * Calcule la duree de resolution effective d un ticket (en minutes)
 * Retourne null si les donnees de timing sont insuffisantes
 */
export function getResolutionDuration(ticket: MttrTicket): number | null {
  const startAt = ticket.heureDemarrage ?? ticket.createdAt;
  const endAt = ticket.heureFinale ?? ticket.clotureAt;
  if (!endAt) return null;
  const diff = endAt.getTime() - startAt.getTime();
  if (diff <= 0) return null;
  return Math.floor(diff / 60000); // en minutes
}

/**
 * Calcule le MTTR moyen a partir d une liste de tickets
 * Retourne null si aucun ticket n a de donnees de resolution valides
 */
export function calculateMttr(tickets: MttrTicket[]): number | null {
  const durations = tickets.map(getResolutionDuration).filter((d): d is number => d !== null);
  if (durations.length === 0) return null;
  const totalMinutes = durations.reduce((acc, d) => acc + d, 0);
  return Math.round(totalMinutes / durations.length);
}

/**
 * Formate un MTTR en minutes en une chaine lisible (ex: "2h 45m")
 */
export function formatMttr(mttrMinutes: number | null): string {
  if (mttrMinutes === null) return 'N/A';
  const hours = Math.floor(mttrMinutes / 60);
  const minutes = mttrMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Calcul du MTTA (Mean Time To Acknowledge / Prise en charge initiale)
 */
export interface MttaTicket {
  createdAt: Date;
  assigneAt?: Date | null;
  heureDepart?: Date | null;
  heureDemarrage?: Date | null;
}

/**
 * Calcule la durée de prise en charge effective d'un ticket (en minutes)
 */
export function getAcknowledgeDuration(ticket: MttaTicket): number | null {
  const ackAt = ticket.assigneAt ?? ticket.heureDepart ?? ticket.heureDemarrage;
  if (!ackAt) return null;
  const diff = ackAt.getTime() - ticket.createdAt.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / 60000); // en minutes
}

/**
 * Calcule le MTTA moyen à partir d'une liste de tickets
 */
export function calculateMtta(tickets: MttaTicket[]): number | null {
  const durations = tickets.map(getAcknowledgeDuration).filter((d): d is number => d !== null);
  if (durations.length === 0) return null;
  const totalMinutes = durations.reduce((acc, d) => acc + d, 0);
  return Math.round(totalMinutes / durations.length);
}

/**
 * Formate un MTTA en minutes en une chaine lisible
 */
export function formatMtta(mttaMinutes: number | null): string {
  return formatMttr(mttaMinutes);
}

// ==============================================================================
// FIABILITÉ & SANTÉ DES ÉQUIPEMENTS (MTBF & SCORE DE FIABILITÉ)
// ==============================================================================

export interface HealthEquipmentInput {
  dateInstallation?: Date | string | null;
  createdAt?: Date | string | null;
  statut?: string | null;
  typeActif?: 'MATERIEL' | 'LOGICIEL' | string | null;
  tickets?: {
    typeDemande: string;
    urgence?: string | null;
    statutActuel?: string | null;
    createdAt: Date | string;
  }[];
}

export interface EquipmentHealthEvaluation {
  score: number; // 0 à 100
  level: 'EXCELLENT' | 'SURVEILLANCE' | 'CRITIQUE';
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  mtbfDays: number;
  totalPannes: number;
  pannesRecentes: number;
  pannesCritiques: number;
  isInstable: boolean;
  alerteMessage: string | null;
  recommandation: string | null;
}

/**
 * Calcule le MTBF (Mean Time Between Failures) en jours d'un équipement
 */
export function calculateMtbf(
  startDate: Date | string | null | undefined,
  tickets: { typeDemande: string; createdAt: Date | string }[],
  referenceDate: Date = new Date(),
): number {
  const pannes = tickets.filter((t) => t.typeDemande === 'PANNE');
  const start = startDate ? new Date(startDate) : new Date(referenceDate.getTime() - 90 * 86400000);
  const now = referenceDate;
  const elapsedMs = Math.max(86400000, now.getTime() - start.getTime());
  const elapsedDays = Math.max(1, Math.round(elapsedMs / 86400000));

  if (pannes.length === 0) {
    return elapsedDays;
  }
  return Math.max(1, Math.round(elapsedDays / pannes.length));
}

/**
 * Évalue la santé et la fiabilité globale d'un équipement CMDB
 */
export function calculateEquipmentHealth(
  equipement: HealthEquipmentInput,
  referenceDate: Date = new Date(),
): EquipmentHealthEvaluation {
  const tickets = equipement.tickets || [];
  const pannes = tickets.filter((t) => t.typeDemande === 'PANNE');
  const isLogiciel = equipement.typeActif === 'LOGICIEL';

  const startDate = equipement.dateInstallation || equipement.createdAt || new Date();
  const mtbfDays = calculateMtbf(startDate, tickets, referenceDate);

  const ninetyDaysAgo = new Date(referenceDate.getTime() - 90 * 86400000);
  const pannesRecentes = pannes.filter((t) => new Date(t.createdAt) >= ninetyDaysAgo);
  const pannesCritiques = pannes.filter((t) => t.urgence === 'CRITIQUE');

  let score = 100;

  // Pénalité par panne récente (< 90j)
  score -= pannesRecentes.length * 20;

  // Pénalité par panne plus ancienne (> 90j)
  const pannesAnciennes = pannes.length - pannesRecentes.length;
  if (pannesAnciennes > 0) {
    score -= pannesAnciennes * 10;
  }

  // Pénalité pour urgence critique
  score -= pannesCritiques.length * 15;

  // Si actuellement en panne
  if (equipement.statut === 'EN_PANNE') {
    score = Math.min(score, 40);
  }

  // Si 3 pannes ou plus au total, ou 2 pannes récentes : plafonner dans la zone critique/instable
  if (pannes.length >= 3 || pannesRecentes.length >= 2) {
    score = Math.min(score, 45);
  }

  // Borner entre 5 et 100
  score = Math.max(5, Math.min(100, Math.round(score)));

  let level: 'EXCELLENT' | 'SURVEILLANCE' | 'CRITIQUE' = 'EXCELLENT';
  let label = 'Excellente fiabilité';
  let badgeBg = 'bg-emerald-50';
  let badgeText = 'text-emerald-700';
  let badgeBorder = 'border-emerald-200';
  let alerteMessage: string | null = null;
  let recommandation: string | null = null;

  if (score < 50) {
    level = 'CRITIQUE';
    label = 'Pannes récurrentes';
    badgeBg = 'bg-rose-50';
    badgeText = 'text-rose-700';
    badgeBorder = 'border-rose-200';
    alerteMessage = isLogiciel
      ? `Logiciel instable : ${pannes.length} incident(s) répertorié(s) (MTBF: ${mtbfDays}j). Risque élevé d'interruption de service.`
      : `Équipement matériel instable : ${pannes.length} panne(s) répertoriée(s) (MTBF: ${mtbfDays}j). Risque d'arrêt critique.`;
    recommandation = isLogiciel
      ? 'Réinstallation complète, audit des dépendances/base de données ou mise à niveau vers une version stable fortement recommandée.'
      : "Remplacement préventif de l'actif ou révision complète d'atelier suggéré pour éviter tout blocage d'activité.";
  } else if (score < 80) {
    level = 'SURVEILLANCE';
    label = 'Surveillance conseillée';
    badgeBg = 'bg-amber-50';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-200';
    alerteMessage = `Stabilité sous surveillance : ${pannes.length} incident(s) enregistré(s) (MTBF: ${mtbfDays}j).`;
    recommandation =
      "Planifier une maintenance préventive pour contrôler les points d'usure et fiabiliser l'équipement.";
  }

  return {
    score,
    level,
    label,
    badgeBg,
    badgeText,
    badgeBorder,
    mtbfDays,
    totalPannes: pannes.length,
    pannesRecentes: pannesRecentes.length,
    pannesCritiques: pannesCritiques.length,
    isInstable: level === 'CRITIQUE',
    alerteMessage,
    recommandation,
  };
}
