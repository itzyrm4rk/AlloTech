'use client';

import { TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { SortField, TechnicienPerf } from './types';

interface TechnicienPerfTableProps {
  techniciens: TechnicienPerf[];
  sortField: SortField;
  onSortChange: (field: SortField) => void;
}

const SORT_OPTIONS: { id: SortField; label: string }[] = [
  { id: 'resolus', label: 'Résolutions' },
  { id: 'sla', label: 'SLA' },
  { id: 'mttr', label: 'MTTR' },
];

export function TechnicienPerfTable({
  techniciens,
  sortField,
  onSortChange,
}: TechnicienPerfTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#31525B]" />
          Performance des Techniciens
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Trier par :</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSortChange(s.id)}
              className={`px-2 py-1 rounded-md font-bold transition ${
                sortField === s.id
                  ? 'bg-[#31525B] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Technicien
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assignés
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Résolus
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                MTTR
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Taux SLA
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {techniciens.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                  Aucun technicien actif sur cette période.
                </td>
              </tr>
            ) : (
              techniciens.map((tech) => {
                const tauxColor =
                  tech.tauxSla === null
                    ? '#94A3B8'
                    : tech.tauxSla >= 80
                      ? '#2E8B57'
                      : tech.tauxSla >= 60
                        ? '#FFA101'
                        : '#C0392B';

                return (
                  <tr
                    key={tech.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#31525B]/10 flex items-center justify-center text-[#31525B] font-black text-sm shrink-0">
                          {tech.photoUrl ? (
                            <img
                              src={tech.photoUrl}
                              alt={tech.nom}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            `${tech.prenom[0]}${tech.nom[0]}`
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {tech.prenom} {tech.nom}
                          </p>
                          <p className="text-xs text-slate-400">{tech.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-bold text-slate-700">
                      {tech.totalAssignes}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-extrabold text-[#2E8B57]">{tech.resolus}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-medium text-slate-600">
                      {tech.mttrFormate}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {tech.tauxSla !== null ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {tech.tauxSla >= 80 ? (
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: tauxColor }} />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" style={{ color: tauxColor }} />
                          )}
                          <span className="text-sm font-extrabold" style={{ color: tauxColor }}>
                            {tech.tauxSla}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tech.isActif
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tech.isActif ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {tech.isActif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
