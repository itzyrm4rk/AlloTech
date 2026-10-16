'use client';

import {
  Calendar,
  CalendarOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { useState } from 'react';
import { type TechnicienDB, isTechCurrentlyOnLeave } from './types';

interface TechnicienCardProps {
  tech: TechnicienDB;
  activating: boolean;
  onToggleActivation: (tech: TechnicienDB) => void;
  onOpenAbsences: (tech: TechnicienDB) => void;
}

export function TechnicienCard({
  tech,
  activating,
  onToggleActivation,
  onOpenAbsences,
}: TechnicienCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const onLeave = isTechCurrentlyOnLeave(tech);
  const avatarSrc = tech.photoUrl || tech.user?.image;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-[#31525B]/40 transition flex flex-col justify-between">
      <div>
        {/* Ligne 1 : Header avec Avatar dédié, Nom, Matricule, Statut et Action activation */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Espace dédié pour l'avatar du technicien */}
            <div className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${tech.prenom} ${tech.nom}`}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs bg-slate-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#31525B] to-[#1e343a] text-white flex items-center justify-center font-black text-sm shadow-xs border border-slate-200/60 tracking-wider">
                  <span className="text-[#FFA101]">{tech.prenom?.charAt(0)?.toUpperCase()}</span>
                  <span>{tech.nom?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              {/* Pastille de statut en superposition */}
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                  onLeave ? 'bg-rose-500' : tech.isActif ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={onLeave ? 'En congé' : tech.isActif ? 'Actif' : "En attente d'activation"}
              />
            </div>

            {/* Nom & Matricule */}
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">
                {tech.prenom} {tech.nom}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="font-mono text-xs font-black text-[#31525B] bg-[#B3DEE5]/30 px-2 py-0.5 rounded-md border border-[#B3DEE5]">
                  {tech.matricule}
                </span>
                {tech.isActif ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Actif
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5" />
                    En attente
                  </span>
                )}
                {onLeave && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full">
                    <CalendarOff className="w-2.5 h-2.5" />
                    En congé
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton Activation / Désactivation instantanée */}
          <button
            type="button"
            onClick={() => onToggleActivation(tech)}
            disabled={activating}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
              tech.isActif
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {activating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : tech.isActif ? (
              <>
                <ShieldOff className="w-3.5 h-3.5" />
                <span>Désactiver</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activer</span>
              </>
            )}
          </button>
        </div>

        {/* Coordonnées : Téléphone & Email */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {tech.telephone && (
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {tech.telephone}
            </span>
          )}
          {tech.user?.email && (
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {tech.user.email}
            </span>
          )}
        </div>

        {/* Compétences avec déroulage et troncature */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Compétences ({tech.competences?.length || 0})
            </span>
            {tech.competences && tech.competences.length > 3 && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-[10px] font-bold text-[#31525B] hover:text-[#FFA101] flex items-center gap-1 transition cursor-pointer"
              >
                <span>{isExpanded ? 'Réduire' : `+${tech.competences.length - 3} voir plus`}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tech.competences && tech.competences.length > 0 ? (
              (isExpanded ? tech.competences : tech.competences.slice(0, 3)).map(
                ({ competence }) => (
                  <span
                    key={competence.id}
                    className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition"
                  >
                    {competence?.libelle || 'Compétence'}
                  </span>
                ),
              )
            ) : (
              <span className="text-[11px] text-slate-400 italic">Aucune compétence déclarée</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions de bas de carte : Congés & Absences */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          Inscrit le {new Date(tech.createdAt).toLocaleDateString('fr-FR')}
        </div>

        <button
          type="button"
          onClick={() => onOpenAbsences(tech)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#31525B]" />
          <span>Congés ({tech.disponibilites?.length || 0})</span>
        </button>
      </div>
    </div>
  );
}
