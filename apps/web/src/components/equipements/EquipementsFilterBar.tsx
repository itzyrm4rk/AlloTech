'use client';

import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Cpu,
  Layers,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

interface FilterCounts {
  total: number;
  materiels: number;
  logiciels: number;
  health: {
    excellent: number;
    surveillance: number;
    critique: number;
  };
}

interface EquipementsFilterBarProps {
  typeFilter: 'TOUS' | 'MATERIEL' | 'LOGICIEL';
  setTypeFilter: (type: 'TOUS' | 'MATERIEL' | 'LOGICIEL') => void;
  healthFilter: 'TOUS' | 'EXCELLENT' | 'SURVEILLANCE' | 'CRITIQUE';
  setHealthFilter: (health: 'TOUS' | 'EXCELLENT' | 'SURVEILLANCE' | 'CRITIQUE') => void;
  search: string;
  setSearch: (s: string) => void;
  counts: FilterCounts;
}

export function EquipementsFilterBar({
  typeFilter,
  setTypeFilter,
  healthFilter,
  setHealthFilter,
  search,
  setSearch,
  counts,
}: EquipementsFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Onglets par type d'actif CMDB */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTypeFilter('TOUS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'TOUS'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Tous les actifs ({counts.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('MATERIEL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'MATERIEL'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Matériels physiques ({counts.materiels})</span>
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('LOGICIEL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'LOGICIEL'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Logiciels & Licences ({counts.logiciels})</span>
        </button>
      </div>

      {/* Barre de filtrage par état de santé & fiabilité */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#31525B]" />
          <span className="text-xs font-black text-slate-800 tracking-tight">
            Santé & Fiabilité :
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHealthFilter('TOUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              healthFilter === 'TOUS'
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Tous ({counts.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setHealthFilter(healthFilter === 'EXCELLENT' ? 'TOUS' : 'EXCELLENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              healthFilter === 'EXCELLENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excellente fiabilité ({counts.health.excellent})</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setHealthFilter(healthFilter === 'SURVEILLANCE' ? 'TOUS' : 'SURVEILLANCE')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              healthFilter === 'SURVEILLANCE'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Surveillance conseillée ({counts.health.surveillance})</span>
          </button>

          <button
            type="button"
            onClick={() => setHealthFilter(healthFilter === 'CRITIQUE' ? 'TOUS' : 'CRITIQUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              healthFilter === 'CRITIQUE'
                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Pannes en cours / Instable ({counts.health.critique})</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <label htmlFor="equipements-search" className="sr-only">
            Rechercher un équipement ou logiciel
          </label>
          <input
            id="equipements-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par modèle/logiciel, n° de série/licence, éditeur, client, adresse..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#FFA101] transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
