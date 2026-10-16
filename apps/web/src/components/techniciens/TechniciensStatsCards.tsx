'use client';

import { Clock, KeyRound, ShieldCheck, Users } from 'lucide-react';
import type { TechnicienStats } from './types';

interface TechniciensStatsCardsProps {
  stats: TechnicienStats;
}

export function TechniciensStatsCards({ stats }: TechniciensStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Comptes Inscrits
          </span>
          <Users className="w-4 h-4 text-[#31525B]" />
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
        <span className="text-[11px] text-slate-500 font-medium">Techniciens dans le système</span>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Actifs &amp; Prêts
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{stats.actifs}</p>
        <span className="text-[11px] text-emerald-600 font-medium">Assignables sur tickets</span>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            En attente d'activation
          </span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{stats.enAttente}</p>
        <span className="text-[11px] text-amber-600 font-medium">Inscrits à valider</span>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#FFA101] uppercase tracking-wider">
            Matricules Prêts
          </span>
          <KeyRound className="w-4 h-4 text-[#FFA101]" />
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">{stats.matriculesEnAttente}</p>
        <span className="text-[11px] text-slate-500 font-medium">En attente d'inscription</span>
      </div>
    </div>
  );
}
