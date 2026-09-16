import { allotechColors } from '@allotech/config';

/**
 * Cycle de vie officiel d'un ticket AlloTech
 * Source : antigravity-01-contexte-fonctionnalites.md
 */
export const TICKET_STATUSES = [
  'CREEE',
  'ASSIGNEE',
  'EN_ROUTE',
  'EN_COURS',
  'EN_PAUSE',
  'TERMINEE',
  'CLOTUREE',
  'ANNULEE',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface StatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const TICKET_STATUS_MAP: Record<TicketStatus, StatusMeta> = {
  CREEE: {
    label: 'Créée',
    badgeBg: allotechColors.neutral.light,
    badgeText: allotechColors.neutral.dark,
    description: 'Demande saisie suite à l’appel client, en attente d’assignation',
  },
  ASSIGNEE: {
    label: 'Assignée',
    badgeBg: '#E3F2FD',
    badgeText: allotechColors.primary.DEFAULT,
    description: 'Technicien(s) assigné(s) manuellement par l’administrateur',
  },
  EN_ROUTE: {
    label: 'En route',
    badgeBg: '#FFF3E0',
    badgeText: allotechColors.secondary.DEFAULT,
    description: 'Technicien en déplacement vers le site d’intervention',
  },
  EN_COURS: {
    label: 'En cours',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    description: 'Intervention démarrée sur site (heure et GPS enregistrés)',
  },
  EN_PAUSE: {
    label: 'En pause',
    badgeBg: allotechColors.warning.light,
    badgeText: '#B45309',
    description: 'Intervention suspendue temporairement (attente pièce, fin de journée)',
  },
  TERMINEE: {
    label: 'Terminée',
    badgeBg: '#ECFDF5',
    badgeText: '#047857',
    description: 'Travail terminé, rapport et signature client recueillis',
  },
  CLOTUREE: {
    label: 'Clôturée',
    badgeBg: allotechColors.success.light,
    badgeText: allotechColors.success.DEFAULT,
    description: 'Rapport PDF officiel généré, équipement mis à jour dans la CMDB',
  },
  ANNULEE: {
    label: 'Annulée',
    badgeBg: allotechColors.danger.light,
    badgeText: allotechColors.danger.DEFAULT,
    description: 'Intervention annulée par l’administrateur',
  },
};

/**
 * Niveaux d'urgence
 */
export const URGENCY_LEVELS = ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string; badgeBg: string }> =
  {
    CRITIQUE: {
      label: 'Critique',
      color: allotechColors.danger.DEFAULT,
      badgeBg: allotechColors.danger.light,
    },
    HAUTE: {
      label: 'Haute',
      color: allotechColors.secondary.DEFAULT,
      badgeBg: '#FFF3E0',
    },
    NORMALE: {
      label: 'Normale',
      color: allotechColors.primary.DEFAULT,
      badgeBg: '#E0F2FE',
    },
    BASSE: {
      label: 'Basse',
      color: '#6B7280',
      badgeBg: allotechColors.neutral.light,
    },
  };
