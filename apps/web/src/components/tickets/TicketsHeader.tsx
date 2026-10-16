'use client';

import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface TicketsHeaderProps {
  totalCount: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function TicketsHeader({ totalCount, refreshing, onRefresh }: TicketsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Tickets d'intervention
        </h1>
        <p className="text-sm text-slate-500 mt-1">{totalCount} tickets au total dans la base</p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          id="btn-refresh-tickets"
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs transition cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <Link
          href="/dashboard/tickets/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFA101] hover:bg-[#e69100] text-white text-sm font-bold rounded-xl transition shadow-md shadow-[#FFA101]/25 hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </Link>
      </div>
    </div>
  );
}
