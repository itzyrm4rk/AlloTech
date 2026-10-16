'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClientOption, KPI, Statut, TechOption, TicketItem, Urgence } from './types';

const PAGE_SIZE = 10;

export function useTickets() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [kpi, setKpi] = useState<KPI>({
    total: 0,
    creees: 0,
    enCours: 0,
    critiques: 0,
    terminees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<Statut | 'TOUS'>('TOUS');
  const [urgenceFilter, setUrgenceFilter] = useState<Urgence | 'TOUTES'>('TOUTES');
  const [clientFilter, setClientFilter] = useState<string>('TOUS');
  const [techFilter, setTechFilter] = useState<string>('TOUS');
  const [clientList, setClientList] = useState<ClientOption[]>([]);
  const [techList, setTechList] = useState<TechOption[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/tickets');
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setKpi(data.kpi ?? { total: 0, creees: 0, enCours: 0, critiques: 0, terminees: 0 });
    } catch (err: unknown) {
      console.error('Erreur chargement tickets:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger les tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Charger les clients et techniciens pour les filtres
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setClientList(d.clients ?? []))
      .catch(() => {});
    fetch('/api/techniciens')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTechList(d.techniciens ?? []))
      .catch(() => {});
  }, []);

  // Appliquer les filtres depuis l'URL (liens du dashboard)
  useEffect(() => {
    if (!searchParams) return;
    const s = searchParams.get('statut') as Statut | null;
    const u = searchParams.get('urgence') as Urgence | null;
    if (s) setStatutFilter(s);
    if (u) setUrgenceFilter(u);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const clientNom = t.client?.nom ?? '';
      const matchSearch =
        search.trim() === '' ||
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        clientNom.toLowerCase().includes(search.toLowerCase()) ||
        t.adresseSite.toLowerCase().includes(search.toLowerCase());
      const matchStatut = statutFilter === 'TOUS' || t.statutActuel === statutFilter;
      const matchUrgence = urgenceFilter === 'TOUTES' || t.urgence === urgenceFilter;
      const matchClient =
        clientFilter === 'TOUS' || t.clientId === clientFilter || t.client?.id === clientFilter;
      const matchTech =
        techFilter === 'TOUS' ||
        t.techniciens?.some(
          (tt) =>
            tt.technicienId === techFilter ||
            tt.technicien?.id === techFilter ||
            `${tt.technicien?.prenom} ${tt.technicien?.nom}` === techFilter,
        );

      return matchSearch && matchStatut && matchUrgence && matchClient && matchTech;
    });
  }, [tickets, search, statutFilter, urgenceFilter, clientFilter, techFilter]);

  // Remise à la page 1 si les filtres changent
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statutFilter, urgenceFilter, clientFilter, techFilter]);

  const paginatedTickets = useMemo(() => {
    return filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  return {
    tickets,
    kpi,
    loading,
    error,
    search,
    setSearch,
    statutFilter,
    setStatutFilter,
    urgenceFilter,
    setUrgenceFilter,
    clientFilter,
    setClientFilter,
    techFilter,
    setTechFilter,
    clientList,
    techList,
    refreshing,
    currentPage,
    setCurrentPage,
    pageSize: PAGE_SIZE,
    filtered,
    paginatedTickets,
    fetchTickets,
    handleRefresh,
  };
}
