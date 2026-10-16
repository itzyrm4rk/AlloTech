'use client';

import type { ExportColumn } from '@/lib/export-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ActiveTab,
  type MatriculeAutorise,
  type StatusFilter,
  type TechnicienDB,
  type TechnicienStats,
  isTechCurrentlyOnLeave,
} from './types';

const PAGE_SIZE = 8;

export function useTechniciens() {
  const [techniciens, setTechniciens] = useState<TechnicienDB[]>([]);
  const [matricules, setMatricules] = useState<MatriculeAutorise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('TECHNICIENS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TOUS');
  const [competenceFilter, setCompetenceFilter] = useState<string>('TOUTES');
  const [currentPage, setCurrentPage] = useState(1);

  const [activating, setActivating] = useState<string | null>(null);
  const [deletingMatriculeId, setDeletingMatriculeId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [showAddMatriculeModal, setShowAddMatriculeModal] = useState(false);

  const showNotif = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const loadTechniciens = useCallback(async () => {
    try {
      const res = await fetch('/api/techniciens');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement des techniciens.');
      setTechniciens(data.techniciens || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les techniciens.');
    }
  }, []);

  const loadMatricules = useCallback(async () => {
    try {
      const res = await fetch('/api/techniciens/matricules');
      const data = await res.json();
      if (res.ok) {
        setMatricules(data.matricules || []);
      }
    } catch {
      // Échec silencieux
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadTechniciens(), loadMatricules()]);
    setLoading(false);
  }, [loadTechniciens, loadMatricules]);

  // Synchronisation initiale et actualisation automatique toutes les 15s
  useEffect(() => {
    void refreshAll();
    const interval = setInterval(() => {
      void Promise.all([loadTechniciens(), loadMatricules()]);
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshAll, loadTechniciens, loadMatricules]);

  // Réinitialiser la page quand les filtres changent
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, competenceFilter]);

  const suggestedMatricule = useMemo(() => {
    const allKnown = [
      ...techniciens.map((t) => t.matricule),
      ...matricules.map((m) => m.matricule),
    ];
    const nums = allKnown
      .map((mat) => {
        const match = mat.match(/TEC-(\d+)/i);
        return match ? Number.parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n) && n > 0);

    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `TEC-${String(maxNum + 1).padStart(3, '0')}`;
  }, [techniciens, matricules]);

  const handleDeleteMatricule = useCallback(
    async (id: string, mat: string) => {
      if (!confirm(`Voulez-vous révoquer l'autorisation du matricule ${mat} ?`)) return;

      setDeletingMatriculeId(id);
      try {
        const res = await fetch(`/api/techniciens/matricules?id=${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');

        showNotif('success', `Matricule ${mat} révoqué.`);
        await loadMatricules();
      } catch (err: unknown) {
        showNotif('error', err instanceof Error ? err.message : 'Erreur serveur.');
      } finally {
        setDeletingMatriculeId(null);
      }
    },
    [loadMatricules, showNotif],
  );

  const handleToggleActivation = useCallback(
    async (tech: TechnicienDB) => {
      setActivating(tech.id);
      const newStatus = !tech.isActif;

      try {
        const res = await fetch(`/api/techniciens/${tech.id}/activation`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActif: newStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du changement d'état.");
        }

        setTechniciens((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, isActif: newStatus } : t)),
        );

        showNotif(
          'success',
          newStatus
            ? `Compte de ${tech.prenom} ${tech.nom} (${tech.matricule}) activé. Notification envoyée.`
            : `Compte de ${tech.prenom} ${tech.nom} (${tech.matricule}) désactivé.`,
        );
      } catch (err: unknown) {
        showNotif(
          'error',
          err instanceof Error ? err.message : 'Impossible de modifier le compte.',
        );
      } finally {
        setActivating(null);
      }
    },
    [showNotif],
  );

  const allAvailableCompetences = useMemo(() => {
    const set = new Set<string>();
    for (const t of techniciens) {
      for (const c of t.competences || []) {
        if (c.competence?.libelle) {
          set.add(c.competence.libelle);
        }
      }
    }
    return Array.from(set).sort();
  }, [techniciens]);

  const filteredTechniciens = useMemo(() => {
    return techniciens.filter((tech) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const fullName = `${tech.prenom} ${tech.nom}`.toLowerCase();
        const mat = tech.matricule.toLowerCase();
        const phone = (tech.telephone || '').toLowerCase();
        const email = (tech.user?.email || '').toLowerCase();
        const comp = (tech.competences || [])
          .map((c) => c.competence?.libelle?.toLowerCase() || '')
          .join(' ');

        const match =
          fullName.includes(q) ||
          mat.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          comp.includes(q);

        if (!match) return false;
      }

      const onLeave = isTechCurrentlyOnLeave(tech);
      if (statusFilter === 'ACTIF' && (!tech.isActif || onLeave)) return false;
      if (statusFilter === 'INACTIF' && tech.isActif) return false;
      if (statusFilter === 'CONGE' && !onLeave) return false;

      if (competenceFilter !== 'TOUTES') {
        const hasComp = (tech.competences || []).some(
          (c) => c.competence?.libelle?.toLowerCase() === competenceFilter.toLowerCase(),
        );
        if (!hasComp) return false;
      }

      return true;
    });
  }, [techniciens, search, statusFilter, competenceFilter]);

  const paginatedTechniciens = useMemo(() => {
    return filteredTechniciens.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredTechniciens, currentPage]);

  const filteredMatricules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matricules;
    return matricules.filter((m) => m.matricule.toLowerCase().includes(q));
  }, [matricules, search]);

  const stats: TechnicienStats = useMemo(() => {
    const total = techniciens.length;
    const actifs = techniciens.filter((t) => t.isActif).length;
    const enAttente = techniciens.filter((t) => !t.isActif).length;
    const enConge = techniciens.filter(isTechCurrentlyOnLeave).length;
    const matriculesEnAttente = matricules.filter((m) => !m.isUtilise).length;
    return { total, actifs, enAttente, enConge, matriculesEnAttente };
  }, [techniciens, matricules]);

  const exportColumns: ExportColumn<TechnicienDB>[] = useMemo(
    () => [
      { header: 'Matricule', key: 'matricule', width: 16 },
      {
        header: 'Nom complet',
        key: 'nom',
        width: 26,
        format: (_, row) => `${row.prenom} ${row.nom}`.trim(),
      },
      { header: 'Téléphone', key: 'telephone', width: 18 },
      {
        header: 'Email',
        key: 'user',
        width: 26,
        format: (_, row) => row.user?.email || 'Non renseigné',
      },
      {
        header: 'Statut compte',
        key: 'isActif',
        width: 16,
        format: (v) => (v ? 'Actif' : 'En attente'),
      },
      {
        header: 'Disponibilité',
        key: 'disponibilites',
        width: 18,
        format: (_, row) => (isTechCurrentlyOnLeave(row) ? 'En congé' : 'En service'),
      },
      {
        header: 'Compétences',
        key: 'competences',
        width: 32,
        format: (_, row) =>
          row.competences && row.competences.length > 0
            ? row.competences.map((c) => c.competence?.libelle || 'Compétence').join(', ')
            : 'Généraliste',
      },
    ],
    [],
  );

  return {
    techniciens,
    setTechniciens,
    matricules,
    loading,
    error,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    competenceFilter,
    setCompetenceFilter,
    currentPage,
    setCurrentPage,
    pageSize: PAGE_SIZE,
    activating,
    deletingMatriculeId,
    notification,
    showNotif,
    showAddMatriculeModal,
    setShowAddMatriculeModal,
    suggestedMatricule,
    allAvailableCompetences,
    filteredTechniciens,
    paginatedTechniciens,
    filteredMatricules,
    stats,
    exportColumns,
    refreshAll,
    loadTechniciens,
    loadMatricules,
    handleToggleActivation,
    handleDeleteMatricule,
  };
}
