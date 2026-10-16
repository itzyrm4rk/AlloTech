import { CheckCircle, UserCheck, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { AvailTech } from './types';
import { isEnConge } from './types';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTechs: AvailTech[];
  selectedTechIds: string[];
  setSelectedTechIds: Dispatch<SetStateAction<string[]>>;
  ticketDateSouhaitee?: string | null;
  reassignSuccess: string;
  reassigning: boolean;
  onConfirm: () => void;
}

export function ReassignModal({
  isOpen,
  onClose,
  allTechs,
  selectedTechIds,
  setSelectedTechIds,
  ticketDateSouhaitee,
  reassignSuccess,
  reassigning,
  onConfirm,
}: ReassignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-900">Réaffecter les techniciens</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {reassignSuccess ? (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {reassignSuccess}
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allTechs
                .filter((t) => t.isActif)
                .map((tech) => {
                  const enConge = isEnConge(tech, ticketDateSouhaitee);
                  const isSelected = selectedTechIds.includes(tech.id);
                  const photo = tech.photoUrl || tech.user?.image;
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      disabled={enConge}
                      onClick={() => {
                        if (!enConge) {
                          setSelectedTechIds((prev) =>
                            prev.includes(tech.id)
                              ? prev.filter((t) => t !== tech.id)
                              : [...prev, tech.id],
                          );
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                        enConge
                          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-[#31525B]/5 border-[#31525B] ring-1 ring-[#31525B]/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="relative w-8 h-8 shrink-0">
                        {photo ? (
                          <img
                            src={photo}
                            alt={`${tech.prenom} ${tech.nom}`}
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
                          className={`avatar-fallback w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            photo ? 'hidden' : 'flex'
                          } ${
                            isSelected ? 'bg-[#31525B] text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tech.prenom[0]}
                          {tech.nom[0]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {tech.prenom} {tech.nom}
                        </p>
                        <p className="text-xs font-mono text-slate-400">{tech.matricule}</p>
                      </div>
                      {enConge ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 shrink-0">
                          En congé
                        </span>
                      ) : isSelected ? (
                        <UserCheck className="w-4 h-4 text-[#31525B] shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={reassigning}
                onClick={onConfirm}
                className="flex-1 py-2.5 bg-[#31525B] text-white text-sm font-bold rounded-xl hover:bg-[#233b41] transition disabled:opacity-50 cursor-pointer"
              >
                {reassigning ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    En cours...
                  </span>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
