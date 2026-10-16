'use client';

import { Pagination } from '@/components/Pagination';
import { ChevronDown, Filter, Loader2, User, X } from 'lucide-react';
import { TechnicienCard } from './TechnicienCard';
import type { StatusFilter, TechnicienDB, TechnicienStats } from './types';

interface TechniciensListTabProps {
  loading: boolean;
  error: string | null;
  techniciensCount: number;
  stats: TechnicienStats;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  competenceFilter: string;
  setCompetenceFilter: (c: string) => void;
  allAvailableCompetences: string[];
  search: string;
  setSearch: (s: string) => void;
  filteredTechniciens: TechnicienDB[];
  paginatedTechniciens: TechnicienDB[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  pageSize: number;
  activatingId: string | null;
  onToggleActivation: (tech: TechnicienDB) => void;
  onOpenAbsences: (tech: TechnicienDB) => void;
}

export function TechniciensListTab({
  loading,
  error,
  techniciensCount,
  stats,
  statusFilter,
  setStatusFilter,
  competenceFilter,
  setCompetenceFilter,
  allAvailableCompetences,
  search,
  setSearch,
  filteredTechniciens,
  paginatedTechniciens,
  currentPage,
  setCurrentPage,
  pageSize,
  activatingId,
  onToggleActivation,
  onOpenAbsences,
}: TechniciensListTabProps) {
  const statusLabels: Record<StatusFilter, string> = {
    TOUS: `Tous (${techniciensCount})`,
    ACTIF: `Actifs (${stats.actifs})`,
    INACTIF: `En attente (${stats.enAttente})`,
    CONGE: `En congé (${stats.enConge})`,
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtrage avec entonnoir & sélecteurs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFA101]/10 text-[#FFA101] rounded-xl text-xs font-black border border-[#FFA101]/20 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres</span>
          </div>

          {/* Sélecteur de statut par puces */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['TOUS', 'ACTIF', 'INACTIF', 'CONGE'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setStatusFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === filterKey
                    ? 'bg-[#31525B] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {statusLabels[filterKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur de Compétence avec l'entonnoir / icône */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <select
              id="competence-filter"
              value={competenceFilter}
              onChange={(e) => setCompetenceFilter(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#FFA101] focus:bg-white transition cursor-pointer"
            >
              <option value="TOUTES">
                Toutes les compétences ({allAvailableCompetences.length})
              </option>
              {allAvailableCompetences.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-[#FFA101] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(statusFilter !== 'TOUS' || competenceFilter !== 'TOUTES' || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('TOUS');
                setCompetenceFilter('TOUTES');
                setSearch('');
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1"
              title="Réinitialiser tous les filtres"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des techniciens */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFA101] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">
            Chargement des techniciens depuis la base de données...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-xs font-bold">
          {error}
        </div>
      ) : filteredTechniciens.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">Aucun technicien trouvé</p>
          <p className="text-slate-500 text-xs mt-1">
            {search
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Aucun compte technicien n’a encore été créé. Cliquez sur "Ajouter un matricule" pour pré-enregistrer un code.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedTechniciens.map((tech) => (
              <TechnicienCard
                key={tech.id}
                tech={tech}
                activating={activatingId === tech.id}
                onToggleActivation={onToggleActivation}
                onOpenAbsences={onOpenAbsences}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredTechniciens.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="techniciens"
          />
        </>
      )}
    </div>
  );
}
