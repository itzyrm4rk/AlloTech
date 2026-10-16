'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AlerteItem } from './types';

export function useAlertes() {
  const [alertes, setAlertes] = useState<AlerteItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlertes = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/alertes');
      if (res.ok) {
        const data = await res.json();
        setAlertes(data.alertes ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlertes();
    const interval = setInterval(() => {
      void fetchAlertes(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAlertes]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        setAlertes((prev) => prev.map((a) => ({ ...a, isLue: true })));
        setUnreadCount(0);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('allotech:alertes-updated'));
        }
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', alerteId: id }),
      });
      if (res.ok) {
        setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, isLue: true } : a)));
        setUnreadCount((c) => Math.max(0, c - 1));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('allotech:alertes-updated'));
        }
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  return {
    alertes,
    unreadCount,
    totalCount,
    loading,
    refreshing,
    fetchAlertes,
    markAllAsRead,
    markOneAsRead,
  };
}
