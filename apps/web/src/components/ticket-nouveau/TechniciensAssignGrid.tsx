'use client';

import { Check, ChevronDown, ChevronUp, UserCheck, Users } from 'lucide-react';
import type React from 'react';
import { type Technicien, isEnConge } from './types';

interface TechniciensAssignGridProps {
  techniciens: Technicien[];
  loadingTechs: boolean;
  selectedTechIds: string[];
  onToggleTech: (id: string) => void;
  dateSouhaitee: string;
  expandedTechSkills: Record<string, boolean>;
  onToggleTechSkills: (id: string, e: React.MouseEvent) => void;
  technicienError?: string;
}

export function TechniciensAssignGrid({
  techniciens,
  loadingTechs,
  selectedTechIds,
  onToggleTech,
  dateSouhaitee,
  expandedTechSkills,
  onToggleTechSkills,
  technicienError,
}: TechniciensAssignGridProps) {
  const activeTechs = techniciens.filter((t) => t.isActif);
  const inactiveCount = techniciens.length - activeTechs.length;

  return (
    <div
      className={`bg-white border ${
        technicienError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200/80'
      } rounded-2xl p-6 shadow-xs space-y-4`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <Users className="w-4 h-4 text-[#FFA101]" />
        <h2 className="text-sm font-bold text-slate-900">
          Assignation des Techniciens <span className="text-red-500">*</span>
        </h2>
        <span
          className={`text-xs ml-auto font-semibold ${
            selectedTechIds.length === 0 ? 'text-red-600' : 'text-emerald-700'
          }`}
        >
          {selectedTechIds.length > 0
            ? `${selectedTechIds.length} technicien(s) sélectionné(s)`
            : 'Au moins 1 technicien requis *'}
        </span>
      </div>

      {technicienError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
          {technicienError}
        </div>
      )}

      {loadingTechs ? (
        <div className="space-y-2">
          {(['skel-tech-1', 'skel-tech-2', 'skel-tech-3'] as const).map((k) => (
            <div key={k} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : techniciens.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          Aucun technicien enregistré dans le système.
        </p>
      ) : (
        <div className="space-y-2.5">
          {activeTechs.map((tech) => {
            const enConge = isEnConge(tech, dateSouhaitee);
            const isSelected = selectedTechIds.includes(tech.id);
            const photo = tech.photoUrl || tech.user?.image;
            const allSkills =
              tech.competences?.map((c) => c.competence?.libelle).filter(Boolean) ?? [];
            const isSkillsExpanded = Boolean(expandedTechSkills[tech.id]);
            const visibleSkills = isSkillsExpanded ? allSkills : allSkills.slice(0, 2);
            const hasMoreSkills = allSkills.length > 2;

            return (
              <div
                key={tech.id}
                className={`w-full flex flex-col p-3.5 rounded-xl border text-left transition ${
                  enConge
                    ? 'bg-slate-50 border-slate-200 opacity-50'
                    : isSelected
                      ? 'bg-[#31525B]/5 border-[#31525B] ring-1 ring-[#31525B]/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <button
                  type="button"
                  disabled={enConge}
                  onClick={() => !enConge && onToggleTech(tech.id)}
                  className="w-full flex items-center gap-3 text-left focus:outline-none disabled:cursor-not-allowed cursor-pointer"
                >
                  {/* Photo ou avatar initiales */}
                  <div className="relative shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt={`${tech.prenom} ${tech.nom}`}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb =
                            e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                          if (fb) (fb as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-fallback w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                        photo ? 'hidden' : 'flex'
                      } ${
                        isSelected
                          ? 'bg-[#31525B] text-white'
                          : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700'
                      }`}
                    >
                      {tech.prenom[0]}
                      {tech.nom[0]}
                    </div>
                    {isSelected && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFA101] text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Nom, matricule, email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {tech.prenom} {tech.nom}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {tech.matricule}
                      </span>
                    </div>
                    {tech.user?.email && (
                      <p className="text-xs text-slate-400 truncate">{tech.user.email}</p>
                    )}
                  </div>

                  {/* Statut ou coche d'assignation */}
                  <div className="shrink-0 flex items-center gap-2">
                    {enConge ? (
                      <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                        En congé
                      </span>
                    ) : isSelected ? (
                      <span className="text-xs font-bold text-[#31525B] bg-[#31525B]/10 border border-[#31525B]/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#31525B]" />
                        Assigné
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 border border-slate-200 bg-white px-2 py-0.5 rounded-lg hover:border-slate-300">
                        Assigner
                      </span>
                    )}
                  </div>
                </button>

                {/* Compétences avec bouton dépliant "Voir plus" / "Voir moins" */}
                {allSkills.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                      Compétences :
                    </span>
                    {visibleSkills.map((libelle) => (
                      <span
                        key={libelle}
                        className="text-[11px] font-medium bg-[#31525B]/8 text-[#31525B] px-2 py-0.5 rounded-md border border-[#31525B]/15"
                      >
                        {libelle}
                      </span>
                    ))}
                    {hasMoreSkills && (
                      <button
                        type="button"
                        onClick={(e) => onToggleTechSkills(tech.id, e)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#FFA101] hover:text-[#d88700] hover:underline px-1.5 py-0.5 rounded transition cursor-pointer"
                      >
                        {isSkillsExpanded ? (
                          <>
                            Voir moins <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            +{allSkills.length - 2} de plus <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {inactiveCount > 0 && (
            <p className="text-xs text-slate-400 text-center pt-1">
              {inactiveCount} technicien(s) inactif(s) masqué(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
