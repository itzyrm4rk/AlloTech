'use client';

import { ArrowRight, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALERTE_CONFIG, type AlerteItem, getAlerteAction } from './types';

interface AlerteRowProps {
  alerte: AlerteItem;
  onMarkRead: (id: string) => void;
}

const STATUT_LABELS: Record<string, string> = {
  CREEE: 'Créée',
  ASSIGNEE: 'Assignée',
  EN_ROUTE: 'En route',
  EN_COURS: 'En cours',
  EN_PAUSE: 'En pause',
  TERMINEE: 'Terminée',
  CLOTUREE: 'Clôturée',
  ANNULEE: 'Annulée',
};

export function AlerteRow({ alerte, onMarkRead }: AlerteRowProps) {
  const router = useRouter();
  const cfg = ALERTE_CONFIG[alerte.typeAlerte] ?? ALERTE_CONFIG.CLOTURE;
  const Icon = cfg.icon;

  const { targetUrl, actionLabel, isTechAlert } = getAlerteAction(alerte);

  // Suppression de tout emoji (ex: ⚠️) sans ajouter d'icône de remplacement
  const cleanMessage = alerte.message
    .replace(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\uFE0F)/gu, '')
    .trim();

  const statutActuel = alerte.ticket?.statutActuel;
  const statutFormate = statutActuel ? (STATUT_LABELS[statutActuel] ?? statutActuel) : '';

  return (
    <div
      role={targetUrl ? 'button' : undefined}
      tabIndex={targetUrl ? 0 : undefined}
      onKeyDown={(e) => {
        if (targetUrl && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          router.push(targetUrl);
        }
      }}
      onClick={() => {
        if (targetUrl) {
          router.push(targetUrl);
        }
      }}
      className={`group p-4 sm:p-5 flex items-start gap-4 transition ${
        targetUrl
          ? 'cursor-pointer hover:bg-slate-50/90 hover:border-l-4 hover:border-l-[#FFA101]'
          : ''
      } ${!alerte.isLue ? 'bg-amber-50/20' : 'hover:bg-slate-50/60'}`}
    >
      {/* Icône de catégorie */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.text} group-hover:scale-105 transition`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {cfg.label}
          </span>
          {!alerte.isLue && <span className="w-2 h-2 rounded-full bg-rose-500" title="Non lue" />}
          <span className="text-xs text-slate-400">
            {new Date(alerte.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-[#31525B] transition">
          {cleanMessage}
        </p>

        {alerte.ticket ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#31525B]">Intervention {alerte.ticket.reference}</span>
            {alerte.ticket.client?.nom && (
              <span className="text-slate-400">• Client : {alerte.ticket.client.nom}</span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                statutActuel === 'CLOTUREE' || statutActuel === 'TERMINEE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : statutActuel === 'EN_COURS'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Statut : {statutFormate}
            </span>
          </div>
        ) : isTechAlert ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 font-semibold">
            <span>Gestion des techniciens &amp; disponibilités</span>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 self-center">
        {targetUrl && (
          <Link
            href={targetUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#31525B] hover:bg-[#FFA101] hover:text-slate-900 text-white transition shadow-xs shrink-0"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {!alerte.isLue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(alerte.id);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition shrink-0 cursor-pointer"
            title="Marquer comme lu"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
