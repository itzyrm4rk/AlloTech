'use client';

import { CalendarPlanning } from '@/components/CalendarPlanning';
import { AbsencesModal } from '@/components/techniciens/AbsencesModal';
import { AddMatriculeModal } from '@/components/techniciens/AddMatriculeModal';
import { MatriculesTab } from '@/components/techniciens/MatriculesTab';
import { TechniciensHeader } from '@/components/techniciens/TechniciensHeader';
import { TechniciensListTab } from '@/components/techniciens/TechniciensListTab';
import { TechniciensStatsCards } from '@/components/techniciens/TechniciensStatsCards';
import { TechniciensTabsAndSearch } from '@/components/techniciens/TechniciensTabsAndSearch';
import { useAbsences } from '@/components/techniciens/useAbsences';
import { useTechniciens } from '@/components/techniciens/useTechniciens';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TechniciensPage() {
  const {
    techniciens,
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
    pageSize,
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
  } = useTechniciens();

  const {
    selectedTechForAbsence,
    absenceForm,
    setAbsenceForm,
    isMotifDropdownOpen,
    setIsMotifDropdownOpen,
    savingAbsence,
    absenceError,
    deletingAbsenceId,
    openAbsenceModal,
    closeAbsenceModal,
    handleSaveAbsence,
    handleDeleteAbsence,
  } = useAbsences();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast de notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* En-tête RH */}
      <TechniciensHeader
        loading={loading}
        onRefresh={() => void refreshAll()}
        onOpenAddMatricule={() => setShowAddMatriculeModal(true)}
        exportColumns={exportColumns}
        filteredTechniciens={filteredTechniciens}
        search={search}
        statusFilter={statusFilter}
        competenceFilter={competenceFilter}
      />

      {/* Cartes de statistiques en direct */}
      <TechniciensStatsCards stats={stats} />

      {/* Onglets et champ de recherche */}
      <TechniciensTabsAndSearch
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        techniciensCount={techniciens.length}
        matriculesCount={matricules.length}
        matriculesEnAttente={stats.matriculesEnAttente}
        enCongeCount={stats.enConge}
        search={search}
        setSearch={setSearch}
      />

      {/* VUE 1 : TECHNICIENS INSCRITS */}
      {activeTab === 'TECHNICIENS' && (
        <TechniciensListTab
          loading={loading}
          error={error}
          techniciensCount={techniciens.length}
          stats={stats}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          competenceFilter={competenceFilter}
          setCompetenceFilter={setCompetenceFilter}
          allAvailableCompetences={allAvailableCompetences}
          search={search}
          setSearch={setSearch}
          filteredTechniciens={filteredTechniciens}
          paginatedTechniciens={paginatedTechniciens}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          activatingId={activating}
          onToggleActivation={(tech) => void handleToggleActivation(tech)}
          onOpenAbsences={(tech) => openAbsenceModal(tech)}
        />
      )}

      {/* VUE 2 : MATRICULES AUTORISÉS */}
      {activeTab === 'MATRICULES' && (
        <MatriculesTab
          loading={loading}
          filteredMatricules={filteredMatricules}
          suggestedMatricule={suggestedMatricule}
          deletingMatriculeId={deletingMatriculeId}
          onOpenAddMatricule={() => setShowAddMatriculeModal(true)}
          onDeleteMatricule={(id, mat) => void handleDeleteMatricule(id, mat)}
        />
      )}

      {/* VUE 3 : PLANNING MENSUEL DES CONGÉS */}
      {activeTab === 'PLANNING' && (
        <CalendarPlanning
          techniciens={techniciens}
          onOpenAddAbsence={(tech, defaultDate) => {
            const found = techniciens.find((t) => t.id === tech.id);
            if (found) {
              openAbsenceModal(found, defaultDate);
            }
          }}
          onDeleteAbsence={async (techId, absenceId) => {
            const tech = techniciens.find((t) => t.id === techId);
            if (tech) {
              openAbsenceModal(tech);
              await handleDeleteAbsence(absenceId, loadTechniciens, showNotif);
            }
          }}
        />
      )}

      {/* MODALE : AUTORISER UN MATRICULE */}
      <AddMatriculeModal
        isOpen={showAddMatriculeModal}
        onClose={() => setShowAddMatriculeModal(false)}
        suggestedMatricule={suggestedMatricule}
        onSuccess={loadMatricules}
      />

      {/* MODALE : CONGÉS & ABSENCES */}
      <AbsencesModal
        tech={selectedTechForAbsence}
        onClose={closeAbsenceModal}
        absenceForm={absenceForm}
        setAbsenceForm={setAbsenceForm}
        isMotifDropdownOpen={isMotifDropdownOpen}
        setIsMotifDropdownOpen={setIsMotifDropdownOpen}
        savingAbsence={savingAbsence}
        absenceError={absenceError}
        deletingAbsenceId={deletingAbsenceId}
        onSaveAbsence={(e) => void handleSaveAbsence(e, loadTechniciens, showNotif)}
        onDeleteAbsence={(absenceId) =>
          void handleDeleteAbsence(absenceId, loadTechniciens, showNotif)
        }
      />
    </div>
  );
}
