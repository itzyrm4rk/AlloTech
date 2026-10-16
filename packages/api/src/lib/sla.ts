/**
 * Bibliotheque de calcul SLA - AlloTech
 * Logique metier centralisee, testable avec Vitest
 */

export type UrgenceLevel = 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE';

/** Fenetres SLA contractuelles par niveau d urgence (en heures) */
export const SLA_DURATIONS_HOURS: Record<UrgenceLevel, number> = {
  CRITIQUE: 4,
  HAUTE: 8,
  NORMALE: 24,
  BASSE: 48,
};

/** Seuil predictif : alerte si < 25% du temps restant */
export const SLA_PREDICTIF_THRESHOLD_PCT = 0.25;

export interface SlaResult {
  durationHours: number;
  totalDurationMs: number;
  echeanceAt: Date;
  remainingMs: number;
  remainingMinutes: number;
  progressPct: number;
  isDepasse: boolean;
  isImminent: boolean;
}

/**
 * Calcule l etat SLA complet pour un ticket
 * @param urgence - Niveau d urgence du ticket
 * @param createdAt - Date de creation du ticket
 * @param now - Date actuelle (injectee pour faciliter les tests)
 */
export function calculateSla(
  urgence: UrgenceLevel,
  createdAt: Date,
  now: Date = new Date(),
): SlaResult {
  const durationHours = SLA_DURATIONS_HOURS[urgence];
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const echeanceAt = new Date(createdAt.getTime() + totalDurationMs);

  const remainingMs = Math.max(0, echeanceAt.getTime() - now.getTime());
  const remainingMinutes = Math.floor(remainingMs / 60000);

  const elapsedMs = now.getTime() - createdAt.getTime();
  const rawProgressPct = (elapsedMs / totalDurationMs) * 100;
  const progressPct = Math.min(100, Math.max(0, Math.round(rawProgressPct)));

  const isDepasse = now.getTime() > echeanceAt.getTime();
  const isImminent = !isDepasse && remainingMs / totalDurationMs < SLA_PREDICTIF_THRESHOLD_PCT;

  return {
    durationHours,
    totalDurationMs,
    echeanceAt,
    remainingMs,
    remainingMinutes,
    progressPct,
    isDepasse,
    isImminent,
  };
}

/**
 * Verifie si un ticket a respecte son SLA a la cloture
 * @param urgence - Niveau d urgence du ticket
 * @param createdAt - Date de creation du ticket
 * @param resolvedAt - Date de resolution (clotureAt ou heureFinale)
 */
export function isSlaRespected(urgence: UrgenceLevel, createdAt: Date, resolvedAt: Date): boolean {
  const durationHours = SLA_DURATIONS_HOURS[urgence];
  const echeanceAt = new Date(createdAt.getTime() + durationHours * 3600 * 1000);
  return resolvedAt.getTime() <= echeanceAt.getTime();
}
