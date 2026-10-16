'use client';

import { StatsBreakdown } from '@/components/statistiques/StatsBreakdown';
import { StatsHeader } from '@/components/statistiques/StatsHeader';
import { StatsKpis } from '@/components/statistiques/StatsKpis';
import { StatsPeriodFilter } from '@/components/statistiques/StatsPeriodFilter';
import { TechnicienPerfTable } from '@/components/statistiques/TechnicienPerfTable';
import { useStatistiques } from '@/components/statistiques/useStatistiques';

export default function StatistiquesPage() {
  const {
    periode,
    setPeriode,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    globalStats,
    sortedTech,
    loading,
    lastRefresh,
    sortField,
    setSortField,
    fetchStats,
    handleExport,
  } = useStatistiques();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <StatsHeader
          lastRefresh={lastRefresh}
          loading={loading}
          onRefresh={() => void fetchStats()}
          onExport={handleExport}
        />

        <StatsPeriodFilter
          periode={periode}
          setPeriode={setPeriode}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />

        {loading && !globalStats ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#31525B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : globalStats ? (
          <>
            <StatsKpis stats={globalStats} />
            <StatsBreakdown stats={globalStats} />
            <TechnicienPerfTable
              techniciens={sortedTech}
              sortField={sortField}
              onSortChange={setSortField}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
