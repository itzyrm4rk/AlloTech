'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type GlobalStats,
  type Periode,
  type SortField,
  type TechnicienPerf,
  getPeriodeDates,
} from './types';

export function useStatistiques() {
  const [periode, setPeriode] = useState<Periode>('30j');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [techniciens, setTechniciens] = useState<TechnicienPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<SortField>('resolus');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodeDates(
        periode,
        customStart || undefined,
        customEnd || undefined,
      );
      const res = await fetch(
        `/api/statistiques?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      );
      if (!res.ok) throw new Error('Erreur chargement statistiques');
      const data = await res.json();
      setGlobalStats(data.globalStats || null);
      setTechniciens(Array.isArray(data.techniciens) ? data.techniciens : []);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [periode, customStart, customEnd]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleExport = useCallback(
    (format: 'pdf' | 'excel') => {
      const { startDate, endDate } = getPeriodeDates(
        periode,
        customStart || undefined,
        customEnd || undefined,
      );
      const ext = format === 'pdf' ? 'pdf' : 'excel';
      window.open(
        `/api/statistiques/${ext}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        '_blank',
      );
    },
    [periode, customStart, customEnd],
  );

  const sortedTech = useMemo(() => {
    return [...(techniciens || [])].sort((a, b) => {
      if (sortField === 'resolus') return b.resolus - a.resolus;
      if (sortField === 'sla') return (b.tauxSla ?? 0) - (a.tauxSla ?? 0);
      if (sortField === 'mttr')
        return (
          (a.mttrMinutes ?? Number.POSITIVE_INFINITY) - (b.mttrMinutes ?? Number.POSITIVE_INFINITY)
        );
      return 0;
    });
  }, [techniciens, sortField]);

  return {
    periode,
    setPeriode,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    globalStats,
    techniciens,
    sortedTech,
    loading,
    lastRefresh,
    sortField,
    setSortField,
    fetchStats,
    handleExport,
  };
}
