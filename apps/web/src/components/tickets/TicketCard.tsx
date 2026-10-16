'use client';

import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { STATUT_CONFIG, type TicketItem, URGENCE_CONFIG } from './types';

interface TicketCardProps {
  ticket: TicketItem;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const urgCfg = URGENCE_CONFIG[ticket.urgence] || URGENCE_CONFIG.NORMALE;
  const statCfg = STATUT_CONFIG[ticket.statutActuel] || STATUT_CONFIG.CREEE;

  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-xl p-4 hover:border-[#31525B]/40 hover:shadow-md transition-all group shadow-xs"
    >
      {/* Urgence dot */}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${urgCfg.dot}`} />

      {/* Référence */}
      <span className="text-xs font-mono font-bold text-slate-500 shrink-0 w-28">
        {ticket.reference}
      </span>

      {/* Info principale */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#31525B] transition-colors">
            {ticket.client?.nom ?? '—'}
          </p>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${urgCfg.bg} ${urgCfg.text} ${urgCfg.border}`}
          >
            {urgCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{ticket.adresseSite}</span>
        </div>
      </div>

      {/* Statut */}
      <div className="shrink-0 hidden sm:flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statCfg.dot.replace('animate-pulse', '')}`} />
        <span className={`text-xs font-semibold ${statCfg.text}`}>{statCfg.label}</span>
      </div>

      {/* Type */}
      <span className="text-xs font-medium text-slate-500 shrink-0 hidden lg:block w-24 text-right">
        {ticket.typeDemande}
      </span>

      {/* Date */}
      <span className="text-xs text-slate-400 shrink-0 hidden sm:block w-20 text-right font-medium">
        {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </span>

      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FFA101] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
