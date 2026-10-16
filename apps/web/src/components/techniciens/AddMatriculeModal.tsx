'use client';

import { AlertCircle, CheckCircle2, Info, KeyRound, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AddMatriculeModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedMatricule: string;
  onSuccess: () => Promise<void>;
}

export function AddMatriculeModal({
  isOpen,
  onClose,
  suggestedMatricule,
  onSuccess,
}: AddMatriculeModalProps) {
  const [newMatriculeInput, setNewMatriculeInput] = useState(suggestedMatricule);
  const [submittingMatricule, setSubmittingMatricule] = useState(false);
  const [matriculeError, setMatriculeError] = useState<string | null>(null);
  const [matriculeSuccess, setMatriculeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewMatriculeInput(suggestedMatricule);
      setMatriculeError(null);
      setMatriculeSuccess(null);
    }
  }, [isOpen, suggestedMatricule]);

  if (!isOpen) return null;

  const handleSubmitMatricule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatriculeError(null);
    setMatriculeSuccess(null);

    const formatted = newMatriculeInput.trim().toUpperCase();
    if (!formatted || formatted.length < 2) {
      setMatriculeError('Veuillez renseigner un matricule valide (ex: TEC-001).');
      return;
    }

    setSubmittingMatricule(true);
    try {
      const res = await fetch('/api/techniciens/matricules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule: formatted }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’autorisation du matricule.');
      }

      setMatriculeSuccess(
        `Matricule ${formatted} autorisé avec succès ! Le technicien peut maintenant s’inscrire depuis son application mobile.`,
      );
      await onSuccess();
    } catch (err: unknown) {
      setMatriculeError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmittingMatricule(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#31525B] flex items-center justify-center text-white">
            <KeyRound className="w-5 h-5 text-[#FFA101]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Autoriser un matricule</h2>
            <p className="text-xs text-slate-500">
              Prépare l'accès d'un technicien sur l'application mobile
            </p>
          </div>
        </div>

        {matriculeError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{matriculeError}</span>
          </div>
        )}

        {matriculeSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{matriculeSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmitMatricule} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-matricule" className="block text-xs font-bold text-slate-700">
                Code matricule officiel *
              </label>
              <button
                type="button"
                onClick={() => setNewMatriculeInput(suggestedMatricule)}
                className="text-[11px] text-[#31525B] hover:text-[#FFA101] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#FFA101]" />
                Suggérer ({suggestedMatricule})
              </button>
            </div>

            <input
              id="input-matricule"
              type="text"
              required
              value={newMatriculeInput}
              onChange={(e) => setNewMatriculeInput(e.target.value.toUpperCase())}
              placeholder="ex: TEC-001"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-black text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#31525B]">
              <Info className="w-4 h-4 text-[#FFA101] shrink-0" />
              <span>Règle de conformité</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-5.5 leading-relaxed">
              L'administrateur autorise le matricule. Le technicien créera son compte lui-même (mot
              de passe, photo, compétences) via son application mobile.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={submittingMatricule}
              className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submittingMatricule && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA101]" />
              )}
              <span>Valider l'autorisation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
