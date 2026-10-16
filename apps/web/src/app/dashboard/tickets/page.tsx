'use client';

import { Pagination } from '@/components/Pagination';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketsFilters } from '@/components/tickets/TicketsFilters';
import { TicketsHeader } from '@/components/tickets/TicketsHeader';
import { TicketsKpiBar } from '@/components/tickets/TicketsKpiBar';
import { useTickets } from '@/components/tickets/useTickets';
import { AlertCircle, Loader2, Ticket as TicketIcon, Zap } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function TicketsContent() {
  const {
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
    pageSize,
    filtered,
    paginatedTickets,
    fetchTickets,
    handleRefresh,
  } = useTickets();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <TicketsHeader
        totalCount={kpi.total}
        refreshing={loading || refreshing}
        onRefresh={() => void handleRefresh()}
      />

      {/* Message d'erreur éventuel avec bouton de réessai */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm flex items-center justify-between gap-3 text-red-700 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchTickets()}
            className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition shrink-0 cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* KPI bar (StatCards) */}
      <TicketsKpiBar
        kpi={kpi}
        statutFilter={statutFilter}
        onFilterChange={setStatutFilter}
        urgenceFilter={urgenceFilter}
        onUrgenceChange={setUrgenceFilter}
      />

      {/* Barre de filtres & recherche */}
      <TicketsFilters
        search={search}
        setSearch={setSearch}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
        urgenceFilter={urgenceFilter}
        setUrgenceFilter={setUrgenceFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        techFilter={techFilter}
        setTechFilter={setTechFilter}
        clientList={clientList}
        techList={techList}
      />

      {/* Liste des tickets ou Spinner de chargement */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFA101] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">
            Chargement des tickets depuis la base de données...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">
            {tickets.length === 0 ? 'Aucun ticket dans la base' : 'Aucun ticket trouvé'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {tickets.length === 0
              ? 'Créez votre premier ticket pour commencer.'
              : 'Essayez de modifier vos filtres ou effectuez une autre recherche.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {paginatedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
          />
        </>
      )}

      {/* CTA si aucun ticket */}
      {tickets.length === 0 && !loading && (
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/tickets/nouveau"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFA101] text-white font-bold rounded-xl hover:bg-[#e69100] transition shadow-md shadow-[#FFA101]/25"
          >
            <Zap className="w-4 h-4" />
            Créer le premier ticket
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense>
      <TicketsContent />
    </Suspense>
  );
}
