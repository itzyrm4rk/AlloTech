'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AvailTech, TechnicienAssigne, TicketDetail, UrgenceTicket } from './types';

export function useTicketDetail(id: string) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modales
  const [showReassign, setShowReassign] = useState(false);
  const [showEscalade, setShowEscalade] = useState(false);
  const [showPrintSticker, setShowPrintSticker] = useState(false);

  // Réaffectation
  const [allTechs, setAllTechs] = useState<AvailTech[]>([]);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState('');

  // Escalade
  const [newUrgence, setNewUrgence] = useState<UrgenceTicket>('HAUTE');
  const [escaladeMotif, setEscaladeMotif] = useState('');
  const [escalading, setEscalading] = useState(false);
  const [escaladeSuccess, setEscaladeSuccess] = useState('');
  const [validatingCloture, setValidatingCloture] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setTicket(data.ticket ?? null);
      setSelectedTechIds(
        (data.ticket?.techniciens ?? []).map((t: TechnicienAssigne) => t.technicien.id),
      );
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTechs = useCallback(async () => {
    try {
      const res = await fetch('/api/techniciens');
      const data = await res.json();
      setAllTechs(data.techniciens ?? []);
    } catch {
      // Échec silencieux
    }
  }, []);

  useEffect(() => {
    fetchTicket();
    fetchTechs();
  }, [fetchTicket, fetchTechs]);

  const handleReassign = async () => {
    setReassigning(true);
    try {
      const res = await fetch(`/api/tickets/${id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicienIds: selectedTechIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setReassignSuccess(data.message);
        await fetchTicket();
        setTimeout(() => {
          setShowReassign(false);
          setReassignSuccess('');
        }, 1500);
      }
    } finally {
      setReassigning(false);
    }
  };

  const handleEscalade = async () => {
    setEscalading(true);
    try {
      const res = await fetch(`/api/tickets/${id}/escalade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgence: newUrgence, motif: escaladeMotif }),
      });
      const data = await res.json();
      if (res.ok) {
        setEscaladeSuccess(data.message);
        await fetchTicket();
        setTimeout(() => {
          setShowEscalade(false);
          setEscaladeSuccess('');
          setEscaladeMotif('');
        }, 1500);
      }
    } finally {
      setEscalading(false);
    }
  };

  const handleValiderCloture = async () => {
    if (
      !window.confirm(
        'Confirmez-vous la validation administrative et la clôture définitive de cette intervention ?',
      )
    ) {
      return;
    }
    setValidatingCloture(true);
    try {
      const res = await fetch(`/api/tickets/${id}/valider-cloture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentaire: 'Validation administrative au bureau et clôture officielle des livrables.',
        }),
      });
      if (res.ok) {
        await fetchTicket();
      }
    } finally {
      setValidatingCloture(false);
    }
  };

  return {
    ticket,
    loading,
    notFound,
    fetchTicket,
    showReassign,
    setShowReassign,
    showEscalade,
    setShowEscalade,
    showPrintSticker,
    setShowPrintSticker,
    allTechs,
    selectedTechIds,
    setSelectedTechIds,
    reassigning,
    reassignSuccess,
    handleReassign,
    newUrgence,
    setNewUrgence,
    escaladeMotif,
    setEscaladeMotif,
    escalading,
    escaladeSuccess,
    handleEscalade,
    validatingCloture,
    handleValiderCloture,
  };
}
