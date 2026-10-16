'use client';

import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

interface AlertesHeaderProps {
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
}

export function AlertesHeader({
  unreadCount,
  refreshing,
  onRefresh,
  onMarkAllAsRead,
}: AlertesHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FFA101]/15 flex items-center justify-center text-[#FFA101] shadow-xs">
          <Bell className="w-5 h-5 text-[#FFA101]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Centre d'Alertes & SLA
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black animate-pulse">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance proactive des délais d'intervention et événements critiques
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            Tout marquer comme lu
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Vérifier SLA</span>
        </button>
      </div>
    </div>
  );
}
