import { AlertTriangle, CheckCircle, ChevronDown, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { UrgenceTicket } from './types';
import { URGENCE_CONFIG } from './types';

interface EscaladeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrgence: UrgenceTicket;
  newUrgence: UrgenceTicket;
  setNewUrgence: Dispatch<SetStateAction<UrgenceTicket>>;
  escaladeMotif: string;
  setEscaladeMotif: Dispatch<SetStateAction<string>>;
  escaladeSuccess: string;
  escalading: boolean;
  onConfirm: () => void;
}

export function EscaladeModal({
  isOpen,
  onClose,
  currentUrgence,
  newUrgence,
  setNewUrgence,
  escaladeMotif,
  setEscaladeMotif,
  escaladeSuccess,
  escalading,
  onConfirm,
}: EscaladeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-900">Escalader l'urgence</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {escaladeSuccess ? (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {escaladeSuccess}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">
              Niveau actuel :{' '}
              <span className={`font-bold ${URGENCE_CONFIG[currentUrgence].text}`}>
                {currentUrgence}
              </span>
            </p>

            <div className="mb-4">
              <label
                htmlFor="escalade-urgence"
                className="block text-xs font-bold text-slate-600 mb-1.5"
              >
                Nouveau niveau d'urgence
              </label>
              <div className="relative">
                <select
                  id="escalade-urgence"
                  value={newUrgence}
                  onChange={(e) => setNewUrgence(e.target.value as UrgenceTicket)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition cursor-pointer"
                >
                  {(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'] as const).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="escalade-motif"
                className="block text-xs font-bold text-slate-600 mb-1.5"
              >
                Motif (optionnel)
              </label>
              <input
                id="escalade-motif"
                type="text"
                placeholder="Ex: Client relance pour intervention immédiate..."
                value={escaladeMotif}
                onChange={(e) => setEscaladeMotif(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={escalading || newUrgence === currentUrgence}
                onClick={onConfirm}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {escalading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    En cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Escalader
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
