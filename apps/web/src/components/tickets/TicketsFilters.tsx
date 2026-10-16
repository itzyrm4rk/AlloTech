'use client';

import { Building2, Search, UserCheck, X } from 'lucide-react';
import {
  type ClientOption,
  STATUT_CONFIG,
  type Statut,
  type TechOption,
  URGENCE_CONFIG,
  type Urgence,
} from './types';

interface TicketsFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  statutFilter: Statut | 'TOUS';
  setStatutFilter: (s: Statut | 'TOUS') => void;
  urgenceFilter: Urgence | 'TOUTES';
  setUrgenceFilter: (u: Urgence | 'TOUTES') => void;
  clientFilter: string;
  setClientFilter: (c: string) => void;
  techFilter: string;
  setTechFilter: (t: string) => void;
  clientList: ClientOption[];
  techList: TechOption[];
}

export function TicketsFilters({
  search,
  setSearch,
  statutFilter,
  setStatutFilter,
  urgenceFilter,
  setUrgenceFilter,
  clientFilter,
  setClientFilter,
  techFilter,
  setTechFilter,
  clientList,
  techList,
}: TicketsFiltersProps) {
  const urgenceOptions = ['TOUTES', 'CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'] as const;
  const statutOptions = [
    'TOUS',
    'CREEE',
    'ASSIGNEE',
    'EN_ROUTE',
    'EN_COURS',
    'EN_PAUSE',
    'TERMINEE',
    'CLOTUREE',
  ] as const;

  const hasActiveFilters =
    clientFilter !== 'TOUS' ||
    techFilter !== 'TOUS' ||
    statutFilter !== 'TOUS' ||
    urgenceFilter !== 'TOUTES' ||
    Boolean(search);

  const handleResetFilters = () => {
    setClientFilter('TOUS');
    setTechFilter('TOUS');
    setStatutFilter('TOUS');
    setUrgenceFilter('TOUTES');
    setSearch('');
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="tickets-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, client, site..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition"
          />
        </div>

        {/* Urgence filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {urgenceOptions.map((u) => (
            <button
              type="button"
              key={u}
              id={`urgence-${u}`}
              onClick={() => setUrgenceFilter(u)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border shrink-0 cursor-pointer ${
                urgenceFilter === u
                  ? u === 'TOUTES'
                    ? 'bg-[#31525B] text-white border-[#31525B]'
                    : `${URGENCE_CONFIG[u as Urgence]?.bg} ${URGENCE_CONFIG[u as Urgence]?.text} ${URGENCE_CONFIG[u as Urgence]?.border}`
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {u === 'TOUTES' ? 'Toutes urgences' : u.charAt(0) + u.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Statut filter row */}
      <div className="flex gap-1.5 flex-wrap pt-2 border-t border-slate-100">
        {statutOptions.map((s) => (
          <button
            type="button"
            key={s}
            id={`statut-${s}`}
            onClick={() => setStatutFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              statutFilter === s
                ? s === 'TOUS'
                  ? 'bg-[#31525B] text-white border-[#31525B]'
                  : `${STATUT_CONFIG[s as Statut].bg} ${STATUT_CONFIG[s as Statut].text} border-slate-300 font-bold`
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                s === 'TOUS'
                  ? 'bg-white'
                  : STATUT_CONFIG[s as Statut].dot.replace('animate-pulse', '')
              }`}
            />
            {s === 'TOUS' ? 'Tous les statuts' : STATUT_CONFIG[s as Statut].label}
          </button>
        ))}
      </div>

      {/* Client & Technicien filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
        {/* Filtre Client */}
        <div className="relative flex-1 sm:max-w-xs">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="filter-client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
          >
            <option value="TOUS">Tous les clients ({clientList.length})</option>
            {clientList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Technicien */}
        <div className="relative flex-1 sm:max-w-xs">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="filter-technicien"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
          >
            <option value="TOUS">Tous les techniciens ({techList.length})</option>
            {techList.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.prenom} {tech.nom} ({tech.matricule})
              </option>
            ))}
          </select>
        </div>

        {/* Réinitialiser si filtres actifs */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors sm:ml-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser filtres
          </button>
        )}
      </div>
    </div>
  );
}
