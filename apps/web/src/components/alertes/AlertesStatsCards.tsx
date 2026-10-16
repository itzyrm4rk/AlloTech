'use client';

import { CheckCircle, Clock, ShieldAlert, UserCheck } from 'lucide-react';
import type { AlerteItem } from './types';

interface AlertesStatsCardsProps {
  alertes: AlerteItem[];
  totalCount: number;
  unreadCount: number;
}

export function AlertesStatsCards({ alertes, totalCount, unreadCount }: AlertesStatsCardsProps) {
  const slaDepassesCount = alertes.filter((a) => a.typeAlerte === 'SLA_DEPASSE').length;
  const slaPredictifCount = alertes.filter((a) => a.typeAlerte === 'SLA_PREDICTIF').length;
  const clotureCount = alertes.filter((a) => a.typeAlerte === 'CLOTURE').length;
  const techCount = alertes.filter(
    (a) => a.typeAlerte === 'NOUVELLE_INSCRIPTION' || a.typeAlerte === 'PAUSE_PROLONGEE',
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total alertes */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-400 mb-1">Total alertes</p>
        <p className="text-2xl font-black text-slate-900">{totalCount}</p>
      </div>

      {/* Non lues */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-400 mb-1">Non lues</p>
        <p className="text-2xl font-black text-rose-600">{unreadCount}</p>
      </div>

      {/* SLA Dépassés */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> SLA Dépassés
        </p>
        <p className="text-2xl font-black text-red-700">{slaDepassesCount}</p>
      </div>

      {/* Risques SLA */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Risques SLA
        </p>
        <p className="text-2xl font-black text-amber-700">{slaPredictifCount}</p>
      </div>

      {/* Clôtures */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Clôtures
        </p>
        <p className="text-2xl font-black text-emerald-700">{clotureCount}</p>
      </div>

      {/* Techniciens & RH */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> Techniciens
        </p>
        <p className="text-2xl font-black text-blue-700">{techCount}</p>
      </div>
    </div>
  );
}
