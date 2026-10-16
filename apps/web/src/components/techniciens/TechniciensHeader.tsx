'use client';

import { ExportActions } from '@/components/ExportActions';
import type { ExportColumn } from '@/lib/export-utils';
import { Plus, RefreshCw } from 'lucide-react';
import type { StatusFilter, TechnicienDB } from './types';

interface TechniciensHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenAddMatricule: () => void;
  exportColumns: ExportColumn<TechnicienDB>[];
  filteredTechniciens: TechnicienDB[];
  search: string;
  statusFilter: StatusFilter;
  competenceFilter: string;
}

export function TechniciensHeader({
  loading,
  onRefresh,
  onOpenAddMatricule,
  exportColumns,
  filteredTechniciens,
  search,
  statusFilter,
  competenceFilter,
}: TechniciensHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span>Ressources Humaines</span>
          <span>•</span>
          <span className="text-[#31525B]">Équipe Technique</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
          Techniciens &amp; Matricules
        </h1>
        <p className="text-xs lg:text-sm text-slate-500 mt-1">
          Autorisation des matricules, activation des accès mobiles et planification des
          disponibilités.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ExportActions
          title="Annuaire des Techniciens"
          filename="allotech-techniciens"
          sheetName="Techniciens"
          columns={exportColumns}
          data={filteredTechniciens}
          activeFilters={[
            { label: 'Recherche', value: search },
            { label: 'Filtre statut', value: statusFilter },
            { label: 'Compétence', value: competenceFilter },
          ]}
          itemLabel="techniciens"
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FFA101]' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onOpenAddMatricule}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FFA101]" />
          <span>Ajouter un matricule</span>
        </button>
      </div>
    </div>
  );
}
