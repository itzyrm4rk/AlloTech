'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SupervisionKPIs, SupervisionTicket } from '../components/supervision/types';

export function useSupervisionStream() {
  const [tickets, setTickets] = useState<SupervisionTicket[]>([]);
  const [kpis, setKpis] = useState<SupervisionKPIs>({
    totalActifs: 0,
    enRoute: 0,
    enCours: 0,
    enPause: 0,
    critiques: 0,
    slaDepasses: 0,
    slaImminents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sseActive, setSseActive] = useState(false);

  // Charger les données de supervision (Fallback Polling ou Manuel)
  const fetchSupervisionData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/supervision?inclureClotures=false');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      console.error('Erreur récupération supervision:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Connexion SSE en temps réel avec repli automatique (fallback) vers le polling 12s
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      setSseActive(false);
      if (!fallbackInterval) {
        fetchSupervisionData(true);
        fallbackInterval = setInterval(() => {
          fetchSupervisionData(true);
        }, 12000);
      }
    };

    // Chargement initial immédiat via REST pour un affichage instantané (évite l'attente du SSE)
    fetchSupervisionData(true);

    try {
      eventSource = new EventSource('/api/supervision/sse?inclureClotures=false');

      eventSource.onopen = () => {
        setSseActive(true);
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tickets) setTickets(data.tickets);
          if (data.kpis) setKpis(data.kpis);
          setLoading(false);
          setSseActive(true);
        } catch (parseErr) {
          console.error('[SSE] Erreur parsing données reçues:', parseErr);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [fetchSupervisionData]);

  return {
    tickets,
    kpis,
    loading,
    refreshing,
    sseActive,
    fetchSupervisionData,
  };
}
