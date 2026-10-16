import type { HistoriqueEntry } from './types';
import { STATUT_CONFIG, formatDate } from './types';

export function TicketHistoryCard({
  statutsHistorique,
}: {
  statutsHistorique: HistoriqueEntry[];
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <h2 className="text-sm font-bold text-slate-900 mb-4">Historique des statuts</h2>
      {statutsHistorique.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Aucun historique disponible.</p>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-5">
            {statutsHistorique.map((entry, i) => {
              const cfg = STATUT_CONFIG[entry.statutNouvel] ?? STATUT_CONFIG.CREEE;
              const isLast = i === statutsHistorique.length - 1;
              return (
                <div key={entry.id} className="flex gap-4">
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isLast ? 'bg-[#31525B] border-[#31525B]' : 'bg-white border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isLast ? 'bg-white' : cfg.dot.split(' ')[0]}`}
                    />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(entry.changedAt)}</span>
                    </div>
                    {entry.auteurAdmin && (
                      <p className="text-xs text-slate-500">
                        Par : {entry.auteurAdmin.prenom} {entry.auteurAdmin.nom} (Admin)
                      </p>
                    )}
                    {entry.auteurTech && (
                      <p className="text-xs text-slate-500">
                        Par : {entry.auteurTech.prenom} {entry.auteurTech.nom} (Technicien)
                      </p>
                    )}
                    {entry.motif && (
                      <div
                        className={`mt-1.5 text-xs rounded-lg p-2.5 ${
                          entry.statutNouvel === 'EN_PAUSE'
                            ? 'bg-orange-50 border border-orange-200 text-orange-900'
                            : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold">
                          {entry.statutNouvel === 'EN_PAUSE' ? 'Raison de la pause :' : 'Motif :'}
                        </span>{' '}
                        {entry.motif}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
