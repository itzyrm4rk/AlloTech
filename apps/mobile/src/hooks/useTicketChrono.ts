import { useCallback, useEffect, useRef, useState } from 'react';
import type { Statut } from '../types/ticket.types';

// ---------------------------------------------------------------------------
// useTicketChrono
//
// Encapsule toute la logique mathématique et temps-réel du chronomètre
// d'intervention : calcul du temps actif net (pauses soustraites), timer
// d'incrémentation par seconde, et formatage HH:MM:SS.
//
// Entrées:
//   - statut         : statut courant du ticket
//   - heureDemarrage : instant de début d'intervention (null si non démarrée)
//   - history        : historique des transitions de statut (pour calculer les pauses)
//   - heureFinale    : instant de fin (pour TERMINEE/CLOTUREE)
//
// Sorties:
//   - elapsedSeconds : nombre de secondes actives écoulées (en temps réel)
//   - formattedTime  : chaîne formatée "MM:SS" ou "HH:MM:SS"
// ---------------------------------------------------------------------------

interface ChronoHistory {
  statutPrecedent?: string | null;
  statutNouvel: string;
  changedAt: string | Date;
}

interface UseTicketChronoOptions {
  statut: Statut;
  heureDemarrage: Date | null;
  history?: ChronoHistory[];
  heureFinale?: Date | null;
}

interface UseTicketChronoReturn {
  elapsedSeconds: number;
  formattedTime: string;
}

/**
 * Calcule le nombre de secondes actives réelles en soustrayant les périodes
 * de pause de l'historique de transitions.
 */
function computeActiveSeconds(
  currentStatut: Statut,
  demarrageDate: Date | null,
  history?: ChronoHistory[],
  finaleDate?: Date | null,
): number {
  if (!demarrageDate) return 0;
  const startMs = demarrageDate.getTime();
  const endMs =
    finaleDate && (currentStatut === 'TERMINEE' || currentStatut === 'CLOTUREE')
      ? new Date(finaleDate).getTime()
      : Date.now();

  if (endMs <= startMs) return 0;

  // Sans historique : chronomètre simple depuis le démarrage
  if (!history || history.length === 0) {
    return Math.floor((endMs - startMs) / 1000);
  }

  // Trier les transitions par date chronologique ascendante (à partir du démarrage)
  const sorted = [...history]
    .filter((h) => new Date(h.changedAt).getTime() >= startMs)
    .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());

  let pauseTotalMs = 0;
  let pauseStartMs: number | null = null;

  for (const h of sorted) {
    const t = new Date(h.changedAt).getTime();
    if (h.statutNouvel === 'EN_PAUSE' && pauseStartMs === null) {
      pauseStartMs = t;
    } else if (
      (h.statutNouvel === 'EN_COURS' ||
        h.statutNouvel === 'TERMINEE' ||
        h.statutNouvel === 'CLOTUREE') &&
      pauseStartMs !== null
    ) {
      pauseTotalMs += Math.max(0, t - pauseStartMs);
      pauseStartMs = null;
    }
  }

  // Si le statut actuel est EN_PAUSE, la pause court jusqu'à maintenant
  if (pauseStartMs !== null) {
    pauseTotalMs += Math.max(0, endMs - pauseStartMs);
  }

  const activeMs = Math.max(0, endMs - startMs - pauseTotalMs);
  return Math.floor(activeMs / 1000);
}

/**
 * Formate un nombre de secondes en "MM:SS" (pendant l'intervention)
 * ou en format explicite "X min Y s" (lorsque l'intervention est terminée ou clôturée).
 */
function formatChrono(totalSec: number, isFinished = false): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (isFinished) {
    if (hours > 0) {
      return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${minutes} min ${pad(seconds)} s`;
  }

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function useTicketChrono({
  statut,
  heureDemarrage,
  history,
  heureFinale,
}: UseTicketChronoOptions): UseTicketChronoReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const computeRef = useCallback(
    () => computeActiveSeconds(statut, heureDemarrage, history, heureFinale),
    [statut, heureDemarrage, history, heureFinale],
  );

  useEffect(() => {
    // Calcul initial (synchrone au premier rendu et à chaque changement de statut)
    if (heureDemarrage) {
      setElapsedSeconds(computeRef());
    }

    // Nettoyage de l'ancien intervalle
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Le chrono ne tourne en continu QUE lorsque l'intervention est activement EN_COURS
    if (statut === 'EN_COURS' && heureDemarrage) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [statut, heureDemarrage, computeRef]);

  const isFinished = statut === 'TERMINEE' || statut === 'CLOTUREE';

  return {
    elapsedSeconds,
    formattedTime: formatChrono(elapsedSeconds, isFinished),
  };
}
