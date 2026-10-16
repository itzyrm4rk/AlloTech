import { Award, CheckCircle, Download } from 'lucide-react';
import type { TicketDetail } from './types';
import { formatDate } from './types';

export function TicketReportCard({ ticket }: { ticket: TicketDetail }) {
  if (ticket.statutActuel !== 'CLOTUREE' && !ticket.rapport && !ticket.signature) {
    return null;
  }

  return (
    <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rapport Officiel de Clôture</h2>
            <p className="text-xs text-emerald-700">
              Intervention clôturée et validée sur le terrain
            </p>
          </div>
        </div>

        <a
          href={`/api/tickets/${ticket.id}/pdf`}
          download={`Rapport-Intervention-${ticket.reference}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Télécharger PDF
        </a>
      </div>

      {ticket.rapport && (
        <div className="bg-white rounded-xl p-4 border border-emerald-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Compte-rendu technique rédigé par le technicien
          </p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {ticket.rapport.contenu}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ticket.signature && (
          <div className="bg-white rounded-xl p-4 border border-emerald-100 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Signature numérique du client
              </p>
              <p className="text-xs text-slate-500">
                Signataire :{' '}
                <strong className="text-slate-900">
                  {ticket.signature.nomSignataire || ticket.client?.nom}
                </strong>
              </p>
            </div>
            <div className="mt-2 h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden p-1">
              {ticket.signature.signatureUrl?.startsWith('data:image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ticket.signature.signatureUrl}
                  alt="Signature client"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">Signature certifiée</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              Signé le {formatDate(ticket.signature.signedAt)}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-emerald-100 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Certification & Traçabilité
            </p>
            <p className="text-xs text-slate-600">
              Rapport d'intervention horodaté avec signature tactile client, conforme aux règles
              d'audit AlloTech.
            </p>
          </div>
          <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-800 font-semibold">
              Document PDF certifié disponible pour le client
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
