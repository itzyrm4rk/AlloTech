import { Activity, AlertTriangle } from 'lucide-react';
import type { TicketDetail } from './types';
import { formatDate } from './types';

export function TicketTimeline({ ticket }: { ticket: TicketDetail }) {
  const durationHours =
    ticket.urgence === 'CRITIQUE'
      ? 4
      : ticket.urgence === 'HAUTE'
        ? 8
        : ticket.urgence === 'NORMALE'
          ? 24
          : 48;
  const totalDurationMs = durationHours * 3600 * 1000;
  const createdAtMs = new Date(ticket.createdAt).getTime();
  const echeanceMs = ticket.slaEcheanceAt
    ? new Date(ticket.slaEcheanceAt).getTime()
    : createdAtMs + totalDurationMs;
  const now = Date.now();
  const remainingMs = echeanceMs - now;
  const isDepasse = remainingMs <= 0 && ticket.statutActuel !== 'CLOTUREE';
  const isImminent =
    !isDepasse && remainingMs <= 0.25 * totalDurationMs && ticket.statutActuel !== 'CLOTUREE';

  const steps = [
    {
      key: 'CREEE',
      label: 'Création',
      sublabel: 'Demande enregistrée',
      time: ticket.createdAt,
    },
    {
      key: 'ASSIGNEE',
      label: 'Assignation',
      sublabel:
        ticket.techniciens.length > 0
          ? `${ticket.techniciens[0].technicien.prenom} ${ticket.techniciens[0].technicien.nom}`
          : 'En attente',
      time: ticket.techniciens.length > 0 ? ticket.createdAt : null,
    },
    {
      key: 'EN_ROUTE',
      label: 'En route',
      sublabel: 'Départ vers site',
      time: ticket.heureDepart,
    },
    {
      key: 'EN_COURS',
      label: 'Sur site',
      sublabel: ticket.latitudeDemarrage
        ? `GPS ${ticket.latitudeDemarrage.slice(0, 6)}, ${ticket.longitudeDemarrage?.slice(0, 6)}`
        : 'Diagnostic & Travaux',
      time: ticket.heureDemarrage,
    },
    {
      key: 'TERMINEE',
      label: 'Terminée',
      sublabel: 'Travaux achevés',
      time: ticket.heureFinale,
    },
    {
      key: 'CLOTUREE',
      label: 'Clôture',
      sublabel: ticket.signature
        ? `Signé par ${ticket.signature.nomSignataire || 'Client'}`
        : 'Rapport & Visa',
      time: ticket.clotureAt,
    },
  ];

  const order = ['CREEE', 'ASSIGNEE', 'EN_ROUTE', 'EN_COURS', 'TERMINEE', 'CLOTUREE'];
  const currentIdx = order.indexOf(
    ticket.statutActuel === 'EN_PAUSE' ? 'EN_COURS' : ticket.statutActuel,
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#31525B]" />
            Progression de l'intervention en direct
          </h2>
          <p className="text-xs text-slate-500">
            Suivi chronologique des jalons terrain et respect des engagements SLA
          </p>
        </div>

        {/* Badge SLA */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Objectif SLA :</span>
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
              isDepasse
                ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                : isImminent
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {isDepasse ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>SLA Dépassé</span>
              </span>
            ) : ticket.statutActuel === 'CLOTUREE' ? (
              'Respecté'
            ) : (
              `${Math.round(remainingMs / 60000)} min restantes (${durationHours}h max)`
            )}
          </span>
        </div>
      </div>

      {/* Étapes horizontales */}
      <div className="pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative">
          {steps.map((step, idx) => {
            const isDone = currentIdx > idx || ticket.statutActuel === 'CLOTUREE';
            const isCurrent = currentIdx === idx && ticket.statutActuel !== 'CLOTUREE';

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  isDone
                    ? 'bg-[#31525B]/5 border-[#31525B]/30'
                    : isCurrent
                      ? 'bg-amber-50/50 border-[#FFA101] ring-2 ring-[#FFA101]/20'
                      : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        isDone
                          ? 'bg-[#31525B] text-white'
                          : isCurrent
                            ? 'bg-[#FFA101] text-white animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {isDone ? 'Validé' : isCurrent ? 'En cours' : 'À venir'}
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 mb-0.5">{step.label}</p>
                  <p className="text-[11px] text-slate-500 leading-tight mb-2">{step.sublabel}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {step.time ? formatDate(step.time) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ticket.statutActuel === 'EN_PAUSE' &&
        (() => {
          // Recherche du motif de mise en pause dans l'historique
          const pauseEntry = [...(ticket.statutsHistorique || [])]
            .reverse()
            .find((h) => h.statutNouvel === 'EN_PAUSE' && h.motif);

          return (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-xs text-orange-900 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-extrabold uppercase tracking-wide text-orange-950">
                    Intervention en pause
                  </span>
                  <span className="text-[10px] bg-orange-200/70 text-orange-900 font-bold px-1.5 py-0.5 rounded">
                    Chrono suspendu
                  </span>
                </div>
                {pauseEntry?.motif ? (
                  <p className="text-orange-900 text-xs font-medium mt-1">
                    <span className="font-bold text-orange-950">
                      Raison déclarée par le technicien :
                    </span>{' '}
                    « {pauseEntry.motif} »
                  </p>
                ) : (
                  <p className="text-orange-800 text-xs">
                    Le chronomètre terrain est temporairement figé jusqu&apos;à la reprise.
                  </p>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
