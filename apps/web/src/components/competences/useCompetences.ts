'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Competence, NotificationState } from './types';

export function useCompetences() {
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadCompetences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/competences');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement.');
      setCompetences(data.competences || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les compétences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompetences();
  }, [loadCompetences]);

  const createCompetence = async (libelle: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/competences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libelle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création.');

      setCompetences((prev) =>
        [...prev, data.competence].sort((a, b) => a.libelle.localeCompare(b.libelle)),
      );
      showNotif('success', `Compétence "${libelle}" ajoutée avec succès.`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création.';
      showNotif('error', msg);
      throw new Error(msg);
    }
  };

  const updateCompetence = async (id: string, libelle: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/competences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libelle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour.');

      setCompetences((prev) =>
        prev
          .map((c) => (c.id === id ? data.competence : c))
          .sort((a, b) => a.libelle.localeCompare(b.libelle)),
      );
      showNotif('success', 'Compétence mise à jour avec succès.');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
      showNotif('error', msg);
      throw new Error(msg);
    }
  };

  const deleteCompetence = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/competences/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');

      setCompetences((prev) => prev.filter((c) => c.id !== id));
      showNotif('success', 'Compétence supprimée.');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de supprimer cette compétence.';
      showNotif('error', msg);
      throw new Error(msg);
    }
  };

  return {
    competences,
    loading,
    error,
    notification,
    loadCompetences,
    createCompetence,
    updateCompetence,
    deleteCompetence,
  };
}
