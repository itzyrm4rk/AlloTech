'use client';

import { BarChart3, Download, FileText, RefreshCw } from 'lucide-react';

interface StatsHeaderProps {
  lastRefresh: Date | null;
  loading: boolean;
  onRefresh: () => void;
  onExport: (format: 'pdf' | 'excel') => void;
}

export function StatsHeader({ lastRefresh, loading, onRefresh, onExport }: StatsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-[#31525B]" />
          Statistiques &amp; Reporting
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lastRefresh
            ? `Mis à jour : ${lastRefresh.toLocaleTimeString('fr-FR')}`
            : 'Chargement...'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#31525B] hover:border-[#31525B] transition"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          id="btn-export-pdf"
          onClick={() => onExport('pdf')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-[#31525B] hover:text-[#31525B] transition"
        >
          <FileText className="w-4 h-4" /> Exporter PDF
        </button>
        <button
          type="button"
          id="btn-export-excel"
          onClick={() => onExport('excel')}
          className="flex items-center gap-2 px-4 py-2 bg-[#31525B] text-white rounded-xl text-sm font-bold hover:bg-[#263f46] transition"
        >
          <Download className="w-4 h-4" /> Exporter Excel
        </button>
      </div>
    </div>
  );
}
