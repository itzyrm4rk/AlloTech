import {
  Building2,
  CheckCircle,
  Download,
  Printer,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import type { TicketDetail } from './types';

interface TicketSidebarProps {
  ticket: TicketDetail;
  onOpenReassign: () => void;
  onOpenEscalade: () => void;
  onValiderCloture: () => void;
  validatingCloture: boolean;
  onOpenPrintSticker?: () => void;
}

export function TicketSidebar({
  ticket,
  onOpenReassign,
  onOpenEscalade,
  onValiderCloture,
  validatingCloture,
  onOpenPrintSticker,
}: TicketSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Client */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Client
        </h2>
        <p className="text-sm font-bold text-slate-900">{ticket.client?.nom ?? '—'}</p>
        {ticket.client?.telephone && (
          <p className="text-xs text-slate-500 mt-1">{ticket.client.telephone}</p>
        )}
        {ticket.client?.email && <p className="text-xs text-slate-500">{ticket.client.email}</p>}
        {ticket.client?.adresse && (
          <p className="text-xs text-slate-400 mt-1 italic">{ticket.client.adresse}</p>
        )}
      </div>

      {/* Techniciens assignés */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Techniciens assignés
        </h2>
        {ticket.techniciens.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Non assigné</p>
        ) : (
          <div className="space-y-2.5">
            {ticket.techniciens.map((ta) => {
              const photo = ta.technicien.photoUrl || ta.technicien.user?.image;
              return (
                <div key={ta.technicien.id} className="flex items-center gap-3">
                  <div className="relative w-8 h-8 shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt={`${ta.technicien.prenom} ${ta.technicien.nom}`}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb =
                            e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                          if (fb) (fb as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-fallback w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#31525B] bg-[#31525B]/10 shrink-0 ${
                        photo ? 'hidden' : 'flex'
                      }`}
                    >
                      {ta.technicien.prenom[0]}
                      {ta.technicien.nom[0]}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {ta.technicien.prenom} {ta.technicien.nom}
                    </p>
                    <p className="text-xs font-mono text-slate-400">{ta.technicien.matricule}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions admin */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Actions administrateur
        </h2>

        <button
          type="button"
          onClick={onOpenReassign}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#31525B] text-white text-xs font-bold rounded-xl hover:bg-[#233b41] transition cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          Réaffecter les techniciens
        </button>

        <button
          type="button"
          onClick={onOpenEscalade}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          Escalader l'urgence
        </button>

        {ticket.statutActuel === 'TERMINEE' && (
          <button
            type="button"
            onClick={onValiderCloture}
            disabled={validatingCloture}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            {validatingCloture ? 'Validation en cours...' : 'Valider & Clôturer (Bureau)'}
          </button>
        )}

        {ticket.statutActuel === 'CLOTUREE' && (
          <a
            href={`/api/tickets/${ticket.id}/pdf`}
            download={`Rapport-Intervention-${ticket.reference}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Télécharger le Rapport (PDF)
          </a>
        )}

        {ticket.equipement && onOpenPrintSticker && (
          <button
            type="button"
            onClick={onOpenPrintSticker}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FFA101]" />
            Imprimer l'étiquette QR Code
          </button>
        )}
      </div>
    </div>
  );
}
