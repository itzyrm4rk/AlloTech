'use client';

import { Pagination } from '@/components/Pagination';
import { AlerteRow } from '@/components/alertes/AlerteRow';
import { AlertesFilterBar } from '@/components/alertes/AlertesFilterBar';
import { AlertesHeader } from '@/components/alertes/AlertesHeader';
import { AlertesStatsCards } from '@/components/alertes/AlertesStatsCards';
import { useAlertes } from '@/components/alertes/useAlertes';
import { CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function AlertesDashboardPage() {
  const {
    alertes,
    unreadCount,
    totalCount,
    loading,
    refreshing,
    fetchAlertes,
    markAllAsRead,
    markOneAsRead,
  } = useAlertes();

  const [filterType, setFilterType] = useState<string>('TOUS');
  const [nonLuesOnly, setNonLuesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, nonLuesOnly]);

  const filtered = useMemo(() => {
    return alertes.filter((a) => {
      if (nonLuesOnly && a.isLue) return false;
      if (filterType !== 'TOUS' && a.typeAlerte !== filterType) return false;
      return true;
    });
  }, [alertes, nonLuesOnly, filterType]);

  const paginatedAlertes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête avec compteurs et actions */}
      <AlertesHeader
        unreadCount={unreadCount}
        refreshing={refreshing}
        onRefresh={() => void fetchAlertes(false)}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Cartes KPI récapitulatives */}
      <AlertesStatsCards alertes={alertes} totalCount={totalCount} unreadCount={unreadCount} />

      {/* Liste filtrable & paginée */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <AlertesFilterBar
          filterType={filterType}
          setFilterType={setFilterType}
          nonLuesOnly={nonLuesOnly}
          setNonLuesOnly={setNonLuesOnly}
        />

        {/* Lignes d'alertes */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-[#FFA101] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Chargement des alertes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Aucune alerte à afficher</p>
              <p className="text-xs text-slate-400 mt-1">Tous les indicateurs sont au vert.</p>
            </div>
          ) : (
            paginatedAlertes.map((alerte) => (
              <AlerteRow key={alerte.id} alerte={alerte} onMarkRead={markOneAsRead} />
            ))
          )}
        </div>

        {/* Pagination */}
        {filtered.length > pageSize && (
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="alertes"
            />
          </div>
        )}
      </div>
    </div>
  );
}
