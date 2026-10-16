'use client';

import { ExportActions } from '@/components/ExportActions';
import type { ExportColumn } from '@/lib/export-utils';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import type { EquipementDB } from './types';

interface EquipementsHeaderProps {
  totalCount: number;
  filteredCount: number;
  loading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  exportColumns: ExportColumn<EquipementDB>[];
  filteredData: EquipementDB[];
  search: string;
  statutFilter: string;
  typeFilter: string;
}

export function EquipementsHeader({
  totalCount,
  loading,
  onRefresh,
  onOpenAddModal,
  exportColumns,
  filteredData,
  search,
  statutFilter,
  typeFilter,
}: EquipementsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFA101]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#31525B]">
            Base CMDB & Gestion de Parc
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
          Équipements & QR Codes
        </h1>
        <p className="text-xs lg:text-sm text-slate-500 mt-1">
          {totalCount} équipement{totalCount > 1 ? 's' : ''} inventorié
          {totalCount > 1 ? 's' : ''} avec étiquetage QR Code pour interventions terrain.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <ExportActions
          title="Inventaire du Parc CMDB"
          filename="allotech-equipements"
          sheetName="Équipements"
          columns={exportColumns}
          data={filteredData}
          activeFilters={[
            { label: 'Recherche', value: search },
            { label: 'Statut', value: statutFilter },
            { label: 'Type', value: typeFilter },
          ]}
          itemLabel="équipements"
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          title="Actualiser la liste"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />
          ) : (
            <RefreshCw className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FFA101]" />
          <span>Ajouter un équipement</span>
        </button>
      </div>
    </div>
  );
}
