'use client';

import { Calendar, KeyRound, Search, Users, X } from 'lucide-react';
import type { ActiveTab } from './types';

interface TechniciensTabsAndSearchProps {
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  techniciensCount: number;
  matriculesCount: number;
  matriculesEnAttente: number;
  enCongeCount: number;
  search: string;
  setSearch: (s: string) => void;
}

export function TechniciensTabsAndSearch({
  activeTab,
  setActiveTab,
  techniciensCount,
  matriculesCount,
  matriculesEnAttente,
  enCongeCount,
  search,
  setSearch,
}: TechniciensTabsAndSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('TECHNICIENS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'TECHNICIENS'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Techniciens inscrits ({techniciensCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MATRICULES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'MATRICULES'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Matricules autorisés ({matriculesCount})</span>
          {matriculesEnAttente > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#FFA101] text-white text-[10px] font-black">
              {matriculesEnAttente} libres
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PLANNING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'PLANNING'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#FFA101]" />
          <span>Planning des congés</span>
          {enCongeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              {enCongeCount} absent(s)
            </span>
          )}
        </button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === 'TECHNICIENS'
              ? 'Nom, matricule, compétence, tél...'
              : 'Rechercher un matricule...'
          }
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#FFA101] focus:ring-1 focus:ring-[#FFA101]"
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
  );
}
