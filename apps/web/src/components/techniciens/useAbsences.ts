'use client';

import { useCallback, useState } from 'react';
import type { TechnicienDB } from './types';

export function useAbsences() {
  const [selectedTechForAbsence, setSelectedTechForAbsence] = useState<TechnicienDB | null>(null);
  const [absenceForm, setAbsenceForm] = useState({
    motif: 'Congé annuel',
    dateDebut: '',
    dateFin: '',
  });
  const [isMotifDropdownOpen, setIsMotifDropdownOpen] = useState(false);
  const [savingAbsence, setSavingAbsence] = useState(false);
  const [absenceError, setAbsenceError] = useState<string | null>(null);
  const [deletingAbsenceId, setDeletingAbsenceId] = useState<string | null>(null);

  const openAbsenceModal = useCallback((tech: TechnicienDB, defaultDate?: string) => {
    setSelectedTechForAbsence(tech);
    setAbsenceError(null);
    setIsMotifDropdownOpen(false);
    const start = defaultDate || new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setAbsenceForm({
      motif: 'Congé annuel',
      dateDebut: start,
      dateFin: nextWeek,
    });
  }, []);

  const closeAbsenceModal = useCallback(() => {
    setSelectedTechForAbsence(null);
    setIsMotifDropdownOpen(false);
    setAbsenceError(null);
  }, []);

  const handleSaveAbsence = useCallback(
    async (
      e: React.FormEvent,
      onReload: () => Promise<void>,
      showNotif: (type: 'success' | 'error', msg: string) => void,
    ) => {
      e.preventDefault();
      if (!selectedTechForAbsence) return;
      setAbsenceError(null);

      if (!absenceForm.dateDebut || !absenceForm.dateFin) {
        setAbsenceError('Les dates de début et de fin sont obligatoires.');
        return;
      }

      if (new Date(absenceForm.dateDebut) >= new Date(absenceForm.dateFin)) {
        setAbsenceError('La date de début doit être antérieure à la date de fin.');
        return;
      }

      setSavingAbsence(true);
      try {
        const res = await fetch(`/api/techniciens/${selectedTechForAbsence.id}/disponibilites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(absenceForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement de l'absence.");

        showNotif('success', data.message || 'Période d’absence enregistrée.');
        await onReload();

        setAbsenceForm({ motif: 'Congé annuel', dateDebut: '', dateFin: '' });
        setSelectedTechForAbsence((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            disponibilites: [data.disponibilite, ...(prev.disponibilites || [])],
          };
        });
      } catch (err: unknown) {
        setAbsenceError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setSavingAbsence(false);
      }
    },
    [selectedTechForAbsence, absenceForm],
  );

  const handleDeleteAbsence = useCallback(
    async (
      absenceId: string,
      onReload: () => Promise<void>,
      showNotif: (type: 'success' | 'error', msg: string) => void,
    ) => {
      if (!selectedTechForAbsence) return;
      setDeletingAbsenceId(absenceId);

      try {
        const res = await fetch(
          `/api/techniciens/${selectedTechForAbsence.id}/disponibilites?disponibiliteId=${absenceId}`,
          { method: 'DELETE' },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression de l'absence.");

        showNotif('success', 'Période d’absence supprimée.');
        await onReload();

        setSelectedTechForAbsence((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            disponibilites: (prev.disponibilites || []).filter((d) => d.id !== absenceId),
          };
        });
      } catch (err: unknown) {
        showNotif('error', err instanceof Error ? err.message : 'Erreur serveur');
      } finally {
        setDeletingAbsenceId(null);
      }
    },
    [selectedTechForAbsence],
  );

  return {
    selectedTechForAbsence,
    setSelectedTechForAbsence,
    absenceForm,
    setAbsenceForm,
    isMotifDropdownOpen,
    setIsMotifDropdownOpen,
    savingAbsence,
    absenceError,
    setAbsenceError,
    deletingAbsenceId,
    openAbsenceModal,
    closeAbsenceModal,
    handleSaveAbsence,
    handleDeleteAbsence,
  };
}
