import { AlertTriangle, CheckCircle, Clock, ShieldAlert, UserCheck } from 'lucide-react';
import type { ElementType } from 'react';

export type TypeAlerte =
  | 'SLA_DEPASSE'
  | 'SLA_PREDICTIF'
  | 'PAUSE_PROLONGEE'
  | 'CLOTURE'
  | 'NOUVELLE_INSCRIPTION';

export interface AlerteItem {
  id: string;
  ticketId?: string | null;
  typeAlerte: TypeAlerte;
  message: string;
  isLue: boolean;
  createdAt: string;
  ticket?: {
    id: string;
    reference: string;
    urgence: string;
    statutActuel: string;
    client?: {
      nom: string;
    } | null;
  } | null;
}

export interface AlerteCategoryConfig {
  label: string;
  icon: ElementType;
  bg: string;
  text: string;
  border: string;
}

export const ALERTE_CONFIG: Record<TypeAlerte, AlerteCategoryConfig> = {
  SLA_DEPASSE: {
    label: 'SLA Dépassé',
    icon: ShieldAlert,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  SLA_PREDICTIF: {
    label: 'Risque SLA',
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  CLOTURE: {
    label: 'Clôture Ticket',
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  PAUSE_PROLONGEE: {
    label: 'Pause / Congé',
    icon: AlertTriangle,
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  NOUVELLE_INSCRIPTION: {
    label: 'Compte Technicien',
    icon: UserCheck,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

export const ALERTE_TABS = [
  { id: 'TOUS', label: 'Toutes les alertes' },
  { id: 'SLA_DEPASSE', label: 'SLA Dépassés' },
  { id: 'SLA_PREDICTIF', label: 'Risque SLA' },
  { id: 'CLOTURE', label: 'Clôtures de tickets' },
  { id: 'NOUVELLE_INSCRIPTION', label: 'Comptes Techniciens' },
  { id: 'PAUSE_PROLONGEE', label: 'Pauses & Absences' },
] as const;

/**
 * Détermine la cible de redirection et le label d'action pour une alerte donnée
 */
export function getAlerteAction(alerte: AlerteItem): {
  targetUrl: string | null;
  actionLabel: string | null;
  isTechAlert: boolean;
} {
  const ticketId = alerte.ticket?.id || alerte.ticketId;
  const isTechAlert =
    alerte.typeAlerte === 'NOUVELLE_INSCRIPTION' ||
    alerte.typeAlerte === 'PAUSE_PROLONGEE' ||
    (!ticketId && alerte.message.toLowerCase().includes('technicien'));

  const targetUrl = ticketId
    ? `/dashboard/tickets/${ticketId}`
    : isTechAlert
      ? '/dashboard/techniciens'
      : null;

  const actionLabel = ticketId ? 'Intervenir' : isTechAlert ? 'Gérer technicien' : null;

  return { targetUrl, actionLabel, isTechAlert };
}
