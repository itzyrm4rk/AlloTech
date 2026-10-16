'use client';

import { EscaladeModal } from '@/components/ticket-detail/EscaladeModal';
import { ReassignModal } from '@/components/ticket-detail/ReassignModal';
import { TicketCmdbCard } from '@/components/ticket-detail/TicketCmdbCard';
import { TicketHeader } from '@/components/ticket-detail/TicketHeader';
import { TicketHistoryCard } from '@/components/ticket-detail/TicketHistoryCard';
import { TicketMediaGallery } from '@/components/ticket-detail/TicketMediaGallery';
import { TicketPrintStickerModal } from '@/components/ticket-detail/TicketPrintStickerModal';
import { TicketReportCard } from '@/components/ticket-detail/TicketReportCard';
import { TicketSidebar } from '@/components/ticket-detail/TicketSidebar';
import { TicketTimeline } from '@/components/ticket-detail/TicketTimeline';
import { useTicketDetail } from '@/components/ticket-detail/useTicketDetail';
import { AlertTriangle, ArrowLeft, Cpu, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function DetailTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    ticket,
    loading,
    notFound,
    fetchTicket,
    showReassign,
    setShowReassign,
    showEscalade,
    setShowEscalade,
    showPrintSticker,
    setShowPrintSticker,
    allTechs,
    selectedTechIds,
    setSelectedTechIds,
    reassigning,
    reassignSuccess,
    handleReassign,
    newUrgence,
    setNewUrgence,
    escaladeMotif,
    setEscaladeMotif,
    escalading,
    escaladeSuccess,
    handleEscalade,
    validatingCloture,
    handleValiderCloture,
  } = useTicketDetail(id);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
        <div className="h-6 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#31525B] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux tickets
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-700 font-bold">Ticket introuvable</p>
          <p className="text-slate-400 text-sm mt-1">Ce ticket n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#31525B] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Tickets
        </Link>
        <button
          type="button"
          onClick={() => void fetchTicket()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition shadow-xs cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* En-tête Ticket */}
      <TicketHeader ticket={ticket} />

      {/* Timeline Interactive d'Avancement */}
      <TicketTimeline ticket={ticket} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Description de la demande</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>

            {ticket.commentaire && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">Commentaire interne</p>
                <p className="text-sm text-slate-600 italic">{ticket.commentaire}</p>
              </div>
            )}

            {/* Badges catégorie panne */}
            {ticket.typeDemande === 'PANNE' &&
              (ticket.categoriePanne || ticket.sousTypePanneMat || ticket.sousTypePanneLog) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-slate-400 mr-1">Classification :</span>
                  {ticket.categoriePanne && (
                    <span className="text-xs font-bold bg-[#31525B]/10 text-[#31525B] px-2.5 py-1 rounded-lg flex items-center gap-1">
                      {ticket.categoriePanne === 'MATERIEL' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Cpu className="w-3 h-3" />
                      )}
                      Panne {ticket.categoriePanne.toLowerCase()}
                    </span>
                  )}
                  {ticket.sousTypePanneMat && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                      {ticket.sousTypePanneMat.replace('_', ' ')}
                    </span>
                  )}
                  {ticket.sousTypePanneLog && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                      {ticket.sousTypePanneLog.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

            {/* Infos installation */}
            {ticket.typeDemande === 'INSTALLATION' && ticket.equipementsDescription && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">Équipements à déployer</p>
                <p className="text-sm text-slate-700">{ticket.equipementsDescription}</p>
              </div>
            )}
          </div>

          {/* Actif CMDB concerné */}
          {ticket.equipement && (
            <TicketCmdbCard
              equipement={ticket.equipement}
              onOpenPrintSticker={() => setShowPrintSticker(true)}
            />
          )}

          {/* Section Rapport Technique & Signature de clôture */}
          <TicketReportCard ticket={ticket} />

          {/* Médias & Documents joints */}
          <TicketMediaGallery medias={ticket.medias} />

          {/* Timeline historique */}
          <TicketHistoryCard statutsHistorique={ticket.statutsHistorique} />
        </div>

        {/* Colonne latérale */}
        <TicketSidebar
          ticket={ticket}
          onOpenReassign={() => setShowReassign(true)}
          onOpenEscalade={() => {
            if (ticket) setNewUrgence(ticket.urgence);
            setShowEscalade(true);
          }}
          onValiderCloture={handleValiderCloture}
          validatingCloture={validatingCloture}
          onOpenPrintSticker={() => setShowPrintSticker(true)}
        />
      </div>

      {/* Modale Réaffectation */}
      <ReassignModal
        isOpen={showReassign}
        onClose={() => setShowReassign(false)}
        allTechs={allTechs}
        selectedTechIds={selectedTechIds}
        setSelectedTechIds={setSelectedTechIds}
        ticketDateSouhaitee={ticket.dateSouhaitee}
        reassignSuccess={reassignSuccess}
        reassigning={reassigning}
        onConfirm={handleReassign}
      />

      {/* Modale Escalade */}
      <EscaladeModal
        isOpen={showEscalade}
        onClose={() => setShowEscalade(false)}
        currentUrgence={ticket.urgence}
        newUrgence={newUrgence}
        setNewUrgence={setNewUrgence}
        escaladeMotif={escaladeMotif}
        setEscaladeMotif={setEscaladeMotif}
        escaladeSuccess={escaladeSuccess}
        escalading={escalading}
        onConfirm={handleEscalade}
      />

      {/* Modale Impression Étiquette QR Code CMDB */}
      <TicketPrintStickerModal
        isOpen={showPrintSticker}
        onClose={() => setShowPrintSticker(false)}
        ticket={ticket}
      />
    </div>
  );
}
