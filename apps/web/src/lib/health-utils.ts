/**
 * Module d'évaluation de la santé et fiabilité des équipements CMDB (MTBF & Santé)
 */

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
  badgeDotColor: string;
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
  let badgeDotColor = 'bg-emerald-500';
  let alerteMessage: string | null = null;
  let recommandation: string | null = null;

  if (score < 50) {
    level = 'CRITIQUE';
    badgeBg = 'bg-rose-50';
    badgeText = 'text-rose-700';
    badgeBorder = 'border-rose-200';
    badgeDotColor = 'bg-rose-500';

    const isRecurrente = pannes.length >= 2 || pannesRecentes.length >= 2;

    if (isRecurrente) {
      label = 'Pannes récurrentes';
      alerteMessage = isLogiciel
        ? `Logiciel instable : ${pannes.length} incident(s) répertorié(s) (MTBF: ${mtbfDays}j). Risque élevé d'interruption de service.`
        : `Équipement matériel instable : ${pannes.length} pannes répertoriées (MTBF: ${mtbfDays}j). Révision d'atelier ou remplacement suggéré.`;
      recommandation = isLogiciel
        ? 'Réinstallation complète, audit des dépendances/base de données ou mise à niveau vers une version stable fortement recommandée.'
        : "Remplacement préventif de l'actif ou révision complète d'atelier suggéré pour éviter tout blocage d'activité.";
    } else {
      // Panne ponctuelle active (1 seule panne ou déclarée sans ticket)
      label = 'Panne en cours';
      if (pannes.length === 1) {
        alerteMessage = isLogiciel
          ? `Incident logiciel en cours de traitement (1 ticket actif, MTBF: ${mtbfDays}j).`
          : `Panne matérielle en cours de traitement (1 ticket actif, MTBF: ${mtbfDays}j).`;
        recommandation =
          "Intervention de maintenance requise pour diagnostiquer et rétablir la disponibilité de l'équipement.";
      } else {
        alerteMessage =
          "Équipement signalé hors service (aucun ticket d'intervention ouvert pour l'instant).";
        recommandation =
          'Créer un ticket de maintenance pour planifier le diagnostic et la remise en service.';
      }
    }
  } else if (score < 80) {
    level = 'SURVEILLANCE';
    label = 'Surveillance conseillée';
    badgeBg = 'bg-amber-50';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-200';
    badgeDotColor = 'bg-amber-500';
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
    badgeDotColor,
    mtbfDays,
    totalPannes: pannes.length,
    pannesRecentes: pannesRecentes.length,
    pannesCritiques: pannesCritiques.length,
    isInstable: level === 'CRITIQUE',
    alerteMessage,
    recommandation,
  };
}
