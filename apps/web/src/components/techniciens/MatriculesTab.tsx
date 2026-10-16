'use client';

import { CheckCircle2, Clock, KeyRound, Loader2, Sparkles } from 'lucide-react';
import type { MatriculeAutorise } from './types';

interface MatriculesTabProps {
  loading: boolean;
  filteredMatricules: MatriculeAutorise[];
  suggestedMatricule: string;
  deletingMatriculeId: string | null;
  onOpenAddMatricule: () => void;
  onDeleteMatricule: (id: string, mat: string) => void;
}

export function MatriculesTab({
  loading,
  filteredMatricules,
  suggestedMatricule,
  deletingMatriculeId,
  onOpenAddMatricule,
  onDeleteMatricule,
}: MatriculesTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Sparkles className="w-5 h-5 text-[#FFA101] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Comment fonctionne l'attribution des matricules ?</p>
          <p className="mt-0.5 text-amber-800">
            L'administrateur autorise uniquement des codes matricules (ex : TEC-001). Le technicien
            installe ensuite l'application mobile AlloTech et finalise son inscription personnelle
            avec ce matricule. Vous pourrez ensuite activer son compte.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFA101] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Chargement des matricules...</p>
        </div>
      ) : filteredMatricules.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">Aucun matricule trouvé</p>
          <button
            type="button"
            onClick={onOpenAddMatricule}
            className="mt-3 px-4 py-2 bg-[#31525B] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Autoriser le matricule {suggestedMatricule}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Matricule</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Date d'autorisation</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatricules.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-mono font-black text-sm text-[#31525B]">
                      {m.matricule}
                    </td>
                    <td className="px-5 py-4">
                      {m.isUtilise ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Compte créé sur mobile
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          En attente d'inscription
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!m.isUtilise ? (
                        <button
                          type="button"
                          onClick={() => onDeleteMatricule(m.id, m.matricule)}
                          disabled={deletingMatriculeId === m.id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {deletingMatriculeId === m.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Révoquer'
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Non révocable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
