'use client';

import { AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import type { SupervisionKPIs } from './types';

interface SupervisionHeaderProps {
  kpis: SupervisionKPIs;
  sseActive: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function SupervisionHeader({
  kpis,
  sseActive,
  refreshing,
  onRefresh,
}: SupervisionHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#31525B]/10 flex items-center justify-center text-[#31525B]">
          <Radio className="w-5 h-5 animate-pulse text-[#31525B]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Supervision Terrain en Temps Réel
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                sseActive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  sseActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {sseActive ? 'Flux SSE Continu (4s)' : 'Repli Polling (12s)'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Actifs :</span>
          <span className="text-xs font-black text-slate-900">{kpis.totalActifs}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
          <span className="text-xs font-bold text-amber-700">En cours :</span>
          <span className="text-xs font-black text-amber-800">{kpis.enCours}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <span className="text-xs font-bold text-red-700">Critiques :</span>
          <span className="text-xs font-black text-red-800">{kpis.critiques}</span>
        </div>
        {kpis.slaDepasses > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-300 flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span className="text-xs font-black text-rose-800">{kpis.slaDepasses} SLA dépassé</span>
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition disabled:opacity-50"
          title="Rafraîchir les positions"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FFA101]' : ''}`} />
        </button>
      </div>
    </div>
  );
}
