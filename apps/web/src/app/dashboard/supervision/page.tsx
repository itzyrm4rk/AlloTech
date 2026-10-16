'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { SupervisionHeader } from '@/components/supervision/SupervisionHeader';
import { SupervisionMap } from '@/components/supervision/SupervisionMap';
import { SupervisionSidebar } from '@/components/supervision/SupervisionSidebar';
import type { SupervisionTicket } from '@/components/supervision/types';
import { useSupervisionStream } from '@/hooks/useSupervisionStream';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useRef, useState } from 'react';

export default function SupervisionPage() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const { tickets, kpis, loading, refreshing, sseActive, fetchSupervisionData } =
    useSupervisionStream();

  const [search, setSearch] = useState('');
  const [filterUrgence, setFilterUrgence] = useState<string>('TOUTES');
  const [filterType, setFilterType] = useState<string>('TOUS');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const focusTicket = (t: SupervisionTicket) => {
    setSelectedTicketId(t.id);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [t.coords.lng, t.coords.lat],
        zoom: 14.5,
        essential: true,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden bg-[#F8FAFB]">
      <SupervisionHeader
        kpis={kpis}
        sseActive={sseActive}
        refreshing={refreshing}
        onRefresh={() => fetchSupervisionData(false)}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <SupervisionMap
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={setSelectedTicketId}
          mapRef={mapRef}
        />

        <SupervisionSidebar
          tickets={tickets}
          loading={loading}
          selectedTicketId={selectedTicketId}
          onSelectTicket={focusTicket}
          search={search}
          onSearchChange={setSearch}
          filterUrgence={filterUrgence}
          onFilterUrgenceChange={setFilterUrgence}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
        />
      </div>
    </div>
  );
}
