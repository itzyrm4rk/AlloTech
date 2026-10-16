'use client';

import { Calendar, CheckCircle2, ChevronDown, Loader2, Trash2, X } from 'lucide-react';
import type React from 'react';
import { MOTIFS_ABSENCE, type TechnicienDB } from './types';

interface AbsencesModalProps {
  tech: TechnicienDB | null;
  onClose: () => void;
  absenceForm: { motif: string; dateDebut: string; dateFin: string };
  setAbsenceForm: React.Dispatch<
    React.SetStateAction<{ motif: string; dateDebut: string; dateFin: string }>
  >;
  isMotifDropdownOpen: boolean;
  setIsMotifDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  savingAbsence: boolean;
  absenceError: string | null;
  deletingAbsenceId: string | null;
  onSaveAbsence: (e: React.FormEvent) => void;
  onDeleteAbsence: (absenceId: string) => void;
}

export function AbsencesModal({
  tech,
  onClose,
  absenceForm,
  setAbsenceForm,
  isMotifDropdownOpen,
  setIsMotifDropdownOpen,
  savingAbsence,
  absenceError,
  deletingAbsenceId,
  onSaveAbsence,
  onDeleteAbsence,
}: AbsencesModalProps) {
  if (!tech) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#B3DEE5]/30 border border-[#B3DEE5] flex items-center justify-center text-[#31525B]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Congés &amp; Absences</h2>
            <p className="text-xs text-slate-500 font-semibold">
              {tech.prenom} {tech.nom} ({tech.matricule})
            </p>
          </div>
        </div>

        {/* Périodes existantes */}
        <div className="mb-6 space-y-3">
          <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            Périodes enregistrées ({tech.disponibilites?.length || 0})
          </span>

          {tech.disponibilites && tech.disponibilites.length > 0 ? (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {tech.disponibilites.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{d.motif || 'Absence'}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Du {new Date(d.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(d.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteAbsence(d.id)}
                    disabled={deletingAbsenceId === d.id}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Supprimer la période"
                  >
                    {deletingAbsenceId === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              Aucune absence planifiée pour ce technicien.
            </p>
          )}
        </div>

        {/* Formulaire d'ajout */}
        <form onSubmit={onSaveAbsence} className="space-y-3 pt-4 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Déclarer une nouvelle absence
          </span>

          {absenceError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              {absenceError}
            </div>
          )}

          <div className="relative">
            <label
              htmlFor="absence-motif-btn"
              className="block text-xs font-bold text-slate-600 mb-1"
            >
              Motif de l'absence *
            </label>

            <button
              id="absence-motif-btn"
              type="button"
              onClick={() => setIsMotifDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-left text-xs font-bold transition focus:outline-hidden focus:border-[#FFA101] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {(() => {
                  const current =
                    MOTIFS_ABSENCE.find((m) => m.id === absenceForm.motif) || MOTIFS_ABSENCE[0];
                  const Icon = current.icon;
                  return (
                    <>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${current.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-black">{current.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{current.desc}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                  isMotifDropdownOpen ? 'rotate-180 text-[#FFA101]' : ''
                }`}
              />
            </button>

            {isMotifDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                {MOTIFS_ABSENCE.map((m) => {
                  const Icon = m.icon;
                  const isSelected = absenceForm.motif === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAbsenceForm((prev) => ({ ...prev, motif: m.id }));
                        setIsMotifDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 font-black text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${m.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">{m.label}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{m.desc}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FFA101] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="absence-dateDebut"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Date de début
              </label>
              <input
                id="absence-dateDebut"
                type="date"
                required
                value={absenceForm.dateDebut}
                onChange={(e) => setAbsenceForm((prev) => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
              />
            </div>
            <div>
              <label
                htmlFor="absence-dateFin"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Date de fin
              </label>
              <input
                id="absence-dateFin"
                type="date"
                required
                value={absenceForm.dateFin}
                onChange={(e) => setAbsenceForm((prev) => ({ ...prev, dateFin: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#FFA101]"
              />
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900">
            Un email et une alerte système seront envoyés automatiquement pour informer le
            technicien de cette période.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={savingAbsence}
              className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingAbsence && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA101]" />}
              <span>Enregistrer l'absence</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
