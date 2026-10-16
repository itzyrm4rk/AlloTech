import { Calendar, Clock, MapPin } from 'lucide-react';
import type { TicketDetail } from './types';
import { STATUT_CONFIG, URGENCE_CONFIG, formatDate } from './types';

export function TicketHeader({ ticket }: { ticket: TicketDetail }) {
  const statCfg = STATUT_CONFIG[ticket.statutActuel];
  const urgCfg = URGENCE_CONFIG[ticket.urgence];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
          {ticket.reference}
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${statCfg.bg} ${statCfg.text}`}
        >
          <span className={`w-2 h-2 rounded-full ${statCfg.dot}`} />
          {statCfg.label}
        </span>
        <span
          className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border ${urgCfg.bg} ${urgCfg.text} ${urgCfg.border}`}
        >
          {urgCfg.label}
        </span>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          {ticket.typeDemande === 'PANNE' ? '⚡ Panne' : '🔧 Installation'}
        </span>
      </div>

      <h1 className="text-xl font-black text-slate-900 mb-1">
        {ticket.client?.nom ?? '—'}{' '}
        {ticket.client?.typeClient && (
          <span className="text-sm font-medium text-slate-400 ml-1">
            ({ticket.client.typeClient})
          </span>
        )}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          {ticket.adresseSite}
        </span>
        {ticket.dateSouhaitee && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formatDate(ticket.dateSouhaitee)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          Créé le {formatDate(ticket.createdAt)}
        </span>
      </div>
    </div>
  );
}
