'use client';

import { Pagination } from '@/components/Pagination';
import { EquipementCard } from '@/components/equipements/EquipementCard';
import { EquipementCreateModal } from '@/components/equipements/EquipementCreateModal';
import { EquipementDetailModal } from '@/components/equipements/EquipementDetailModal';
import { EquipementEditModal } from '@/components/equipements/EquipementEditModal';
import { EquipementPrintStickerModal } from '@/components/equipements/EquipementPrintStickerModal';
import { EquipementsFilterBar } from '@/components/equipements/EquipementsFilterBar';
import { EquipementsHeader } from '@/components/equipements/EquipementsHeader';
import { EquipementsStatsCards } from '@/components/equipements/EquipementsStatsCards';
import type { ClientSimple, EquipementDB } from '@/components/equipements/types';
import { type ExportColumn, exportCarnetEntretienPdf } from '@/lib/export-utils';
import { calculateEquipmentHealth } from '@/lib/health-utils';
import { AlertCircle, CheckCircle2, Cpu, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<EquipementDB[]>([]);
  const [clients, setClients] = useState<ClientSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres & recherche
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<
    'TOUS' | 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME'
  >('TOUS');
  const [typeFilter, setTypeFilter] = useState<'TOUS' | 'MATERIEL' | 'LOGICIEL'>('TOUS');
  const [healthFilter, setHealthFilter] = useState<
    'TOUS' | 'EXCELLENT' | 'SURVEILLANCE' | 'CRITIQUE'
  >('TOUS');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Modales
  const [selectedEqForDetail, setSelectedEqForDetail] = useState<EquipementDB | null>(null);
  const [selectedEqForPrint, setSelectedEqForPrint] = useState<EquipementDB | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipement, setEditingEquipement] = useState<EquipementDB | null>(null);

  // États de chargement des actions
  const [updatingStatutId, setUpdatingStatutId] = useState<string | null>(null);
  const [downloadingCarnetId, setDownloadingCarnetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification globale
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Chargement des données
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resEq, resCl] = await Promise.all([fetch('/api/equipements'), fetch('/api/clients')]);

      const dataEq = await resEq.json();
      const dataCl = await resCl.json();

      if (!resEq.ok) throw new Error(dataEq.error || 'Erreur chargement équipements');

      setEquipements(dataEq.equipements || []);
      setClients(
        (dataCl.clients || []).map(
          (c: {
            id: string;
            nom: string;
            typeClient?: 'ENTREPRISE' | 'PARTICULIER' | null;
            adresse?: string | null;
          }) => ({
            id: c.id,
            nom: c.nom,
            typeClient: c.typeClient || null,
            adresse: c.adresse || null,
          }),
        ),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Réinitialisation de la pagination lors du changement de filtre
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statutFilter, typeFilter, healthFilter]);

  // Actions CRUD
  const handleUpdateStatus = async (
    id: string,
    statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME',
  ) => {
    setUpdatingStatutId(id);
    try {
      const res = await fetch(`/api/equipements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour statut');

      setEquipements((prev) => prev.map((e) => (e.id === id ? { ...e, statut } : e)));
      if (selectedEqForDetail?.id === id) {
        setSelectedEqForDetail((prev) => (prev ? { ...prev, statut } : null));
      }
      showNotif('success', 'Statut mis à jour avec succès.');
    } catch (err: unknown) {
      showNotif('error', err instanceof Error ? err.message : 'Erreur mise à jour');
    } finally {
      setUpdatingStatutId(null);
    }
  };

  const handleDelete = async (id: string, modele: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de l'équipement "${modele}" ?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/equipements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');

      setEquipements((prev) => prev.filter((e) => e.id !== id));
      if (selectedEqForDetail?.id === id) setSelectedEqForDetail(null);
      showNotif('success', `"${modele}" a été supprimé de la CMDB.`);
    } catch (err: unknown) {
      showNotif('error', err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadCarnetPdf = async (equip: EquipementDB) => {
    setDownloadingCarnetId(equip.id);
    try {
      const res = await fetch(`/api/equipements/${equip.id}/carnet-pdf`);
      if (!res.ok) throw new Error('Échec de génération du PDF côté serveur.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanModele = equip.modele.replace(/[^a-zA-Z0-9-_]/g, '_');
      const cleanSn = equip.numeroSerie.replace(/[^a-zA-Z0-9-_]/g, '_');
      a.download = `Carnet-Entretien-${cleanModele}-${cleanSn}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement carnet PDF:', err);
      exportCarnetEntretienPdf(equip);
    } finally {
      setDownloadingCarnetId(null);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = equipements.length;
    const materiels = equipements.filter((e) => e.typeActif !== 'LOGICIEL').length;
    const logiciels = equipements.filter((e) => e.typeActif === 'LOGICIEL').length;
    const enService = equipements.filter((e) => e.statut === 'EN_SERVICE').length;
    const enPanne = equipements.filter((e) => e.statut === 'EN_PANNE').length;
    const enReforme = equipements.filter((e) => e.statut === 'EN_REFORME').length;

    const healthStats = equipements.reduce(
      (acc, e) => {
        const h = calculateEquipmentHealth(e);
        if (h.level === 'EXCELLENT') acc.excellent += 1;
        else if (h.level === 'SURVEILLANCE') acc.surveillance += 1;
        else if (h.level === 'CRITIQUE') acc.critique += 1;
        return acc;
      },
      { excellent: 0, surveillance: 0, critique: 0 },
    );

    return { total, materiels, logiciels, enService, enPanne, enReforme, health: healthStats };
  }, [equipements]);

  // Filtrage
  const filtered = useMemo(() => {
    return equipements.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        e.modele.toLowerCase().includes(q) ||
        e.numeroSerie.toLowerCase().includes(q) ||
        Boolean(e.client?.nom?.toLowerCase().includes(q)) ||
        Boolean(e.siteAdresse?.toLowerCase().includes(q)) ||
        Boolean(e.editeur?.toLowerCase().includes(q)) ||
        Boolean(e.version?.toLowerCase().includes(q));

      const matchStatut = statutFilter === 'TOUS' || e.statut === statutFilter;
      const matchType =
        typeFilter === 'TOUS' ||
        (typeFilter === 'MATERIEL' && e.typeActif !== 'LOGICIEL') ||
        (typeFilter === 'LOGICIEL' && e.typeActif === 'LOGICIEL');

      const health = calculateEquipmentHealth(e);
      const matchHealth =
        healthFilter === 'TOUS' ||
        (healthFilter === 'EXCELLENT' && health.level === 'EXCELLENT') ||
        (healthFilter === 'SURVEILLANCE' && health.level === 'SURVEILLANCE') ||
        (healthFilter === 'CRITIQUE' && health.level === 'CRITIQUE');

      return matchSearch && matchStatut && matchType && matchHealth;
    });
  }, [equipements, search, statutFilter, typeFilter, healthFilter]);

  const paginatedEquipements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const exportColumns: ExportColumn<EquipementDB>[] = [
    { header: 'Modèle / Libellé', key: 'modele', width: 28 },
    {
      header: "Type d'actif",
      key: 'typeActif',
      width: 16,
      format: (v) => (v === 'LOGICIEL' ? 'Logiciel' : 'Matériel'),
    },
    { header: 'N° Série / Licence', key: 'numeroSerie', width: 22 },
    {
      header: 'Client associé',
      key: 'client',
      width: 26,
      format: (_, row) => row.client?.nom || 'Non rattaché',
    },
    {
      header: 'Statut',
      key: 'statut',
      width: 18,
      format: (v) =>
        v === 'EN_SERVICE'
          ? 'En service'
          : v === 'EN_PANNE'
            ? 'En panne'
            : 'Mis au rebut / Réforme',
    },
    {
      header: 'Adresse du site',
      key: 'siteAdresse',
      width: 30,
      format: (v) => (typeof v === 'string' && v.trim() ? v : 'Non spécifiée'),
    },
    {
      header: "Date d'installation",
      key: 'dateInstallation',
      width: 20,
      format: (v) =>
        typeof v === 'string' && v.trim() ? new Date(v).toLocaleDateString('fr-FR') : '—',
    },
    { header: 'Code QR CMDB', key: 'qrCodeData', width: 24 },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* En-tête avec export et création */}
      <EquipementsHeader
        totalCount={kpis.total}
        filteredCount={filtered.length}
        loading={loading}
        onRefresh={() => void loadData()}
        onOpenAddModal={() => setShowAddModal(true)}
        exportColumns={exportColumns}
        filteredData={filtered}
        search={search}
        statutFilter={statutFilter}
        typeFilter={typeFilter}
      />

      {/* Cartes KPI interactives */}
      <EquipementsStatsCards
        kpis={kpis}
        statutFilter={statutFilter}
        onSelectStatut={setStatutFilter}
      />

      {/* Barre de filtres et recherche */}
      <EquipementsFilterBar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        healthFilter={healthFilter}
        setHealthFilter={setHealthFilter}
        search={search}
        setSearch={setSearch}
        counts={{
          total: kpis.total,
          materiels: kpis.materiels,
          logiciels: kpis.logiciels,
          health: kpis.health,
        }}
      />

      {/* Grille des équipements */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFA101] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Chargement de la base CMDB réelle...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-xs font-bold">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">Aucun actif trouvé</p>
          <p className="text-slate-400 text-xs mt-1 mb-4">
            {search
              ? 'Aucun résultat ne correspond à votre filtre.'
              : 'Enregistrez votre premier actif CMDB (matériel ou logiciel).'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#31525B] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            + Enregistrer un actif
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedEquipements.map((equip) => (
              <EquipementCard
                key={equip.id}
                equipement={equip}
                onSelectDetail={setSelectedEqForDetail}
                onEdit={setEditingEquipement}
                onDownloadCarnet={handleDownloadCarnetPdf}
                onPrintSticker={setSelectedEqForPrint}
                onDelete={handleDelete}
                downloadingCarnetId={downloadingCarnetId}
                deletingId={deletingId}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="équipements"
          />
        </>
      )}

      {/* Modale : Impression étiquette QR Code */}
      <EquipementPrintStickerModal
        equipement={selectedEqForPrint}
        onClose={() => setSelectedEqForPrint(null)}
      />

      {/* Modale : Créer un équipement / logiciel */}
      <EquipementCreateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        clients={clients}
        onSuccess={(newEq) => {
          setEquipements((prev) => [newEq as EquipementDB, ...prev]);
          void loadData();
          showNotif('success', `Actif "${newEq.modele}" enregistré avec succès dans la CMDB.`);
        }}
      />

      {/* Modale : Modifier un équipement */}
      <EquipementEditModal
        equipement={editingEquipement}
        onClose={() => setEditingEquipement(null)}
        clients={clients}
        onSuccess={(updatedEq) => {
          const eqItem = updatedEq as EquipementDB;
          setEquipements((prev) => prev.map((e) => (e.id === eqItem.id ? { ...e, ...eqItem } : e)));
          if (selectedEqForDetail?.id === eqItem.id) {
            setSelectedEqForDetail((prev) => (prev ? { ...prev, ...eqItem } : null));
          }
          void loadData();
          showNotif('success', `Actif "${updatedEq.modele}" mis à jour avec succès.`);
        }}
      />

      {/* Modale : Fiche complète de vie de l'actif */}
      <EquipementDetailModal
        equipement={selectedEqForDetail}
        onClose={() => setSelectedEqForDetail(null)}
        onEdit={(eq) => {
          setSelectedEqForDetail(null);
          setEditingEquipement(eq);
        }}
        onDownloadCarnetPdf={handleDownloadCarnetPdf}
        onOpenPrintSticker={(eq) => {
          setSelectedEqForDetail(null);
          setSelectedEqForPrint(eq);
        }}
        onUpdateStatus={handleUpdateStatus}
        updatingStatutId={updatingStatutId}
        downloadingCarnetId={downloadingCarnetId}
      />
    </div>
  );
}
