'use client';

import { Loader2, RefreshCw } from 'lucide-react';

interface CompetencesHeaderProps {
  total: number;
  loading: boolean;
  onRefresh: () => void;
}

export function CompetencesHeader({ total, loading, onRefresh }: CompetencesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Référentiel Compétences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {total} compétence{total > 1 ? 's' : ''} active
          {total > 1 ? 's' : ''} — synchronisées pour la sélection mobile des techniciens
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />
        ) : (
          <RefreshCw className="w-4 h-4 text-slate-500" />
        )}
        <span>Actualiser</span>
      </button>
    </div>
  );
}
