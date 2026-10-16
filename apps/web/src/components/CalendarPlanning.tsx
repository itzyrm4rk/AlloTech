'use client';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type Disponibilite = {
  id: string;
  technicienId: string;
  motif: string | null;
  dateDebut: string;
  dateFin: string;
  createdAt: string;
};

export type TechnicienForCalendar = {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  telephone: string;
  isActif: boolean;
  photoUrl?: string | null;
  disponibilites?: Disponibilite[];
};

interface CalendarPlanningProps {
  techniciens: TechnicienForCalendar[];
  onOpenAddAbsence: (tech: TechnicienForCalendar, defaultDate?: string) => void;
  onDeleteAbsence: (techId: string, absenceId: string) => Promise<void>;
}

export function CalendarPlanning({
  techniciens,
  onOpenAddAbsence,
  onDeleteAbsence,
}: CalendarPlanningProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedTechId, setSelectedTechId] = useState<string>('TOUS');
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    absences: { tech: TechnicienForCalendar; dispo: Disponibilite }[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDetail(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayDetail(null);
  };

  // Techniciens filtrés
  const filteredTechniciens = useMemo(() => {
    if (selectedTechId === 'TOUS') return techniciens;
    return techniciens.filter((t) => t.id === selectedTechId);
  }, [techniciens, selectedTechId]);

  // Liste plate de toutes les absences enrichies
  const allAbsences = useMemo(() => {
    const list: { tech: TechnicienForCalendar; dispo: Disponibilite }[] = [];
    for (const tech of filteredTechniciens) {
      if (tech.disponibilites) {
        for (const dispo of tech.disponibilites) {
          list.push({ tech, dispo });
        }
      }
    }
    return list;
  }, [filteredTechniciens]);

  // Génération des cellules de la grille du mois
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Jour de la semaine (0 = Dimanche, 1 = Lundi, etc.) -> Converti en Lundi = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells: {
      date: Date;
      isCurrentMonth: boolean;
      dateStr: string;
      absences: { tech: TechnicienForCalendar; dispo: Disponibilite }[];
    }[] = [];

    // Jours du mois précédent pour combler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr,
        absences: allAbsences.filter((item) => {
          const s = item.dispo.dateDebut.split('T')[0];
          const e = item.dispo.dateFin.split('T')[0];
          return dateStr >= s && dateStr <= e;
        }),
      });
    }

    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        isCurrentMonth: true,
        dateStr,
        absences: allAbsences.filter((item) => {
          const s = item.dispo.dateDebut.split('T')[0];
          const e = item.dispo.dateFin.split('T')[0];
          return dateStr >= s && dateStr <= e;
        }),
      });
    }

    // Jours du mois suivant pour compléter à 35 ou 42 cellules
    const remainingCells = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateStr,
        absences: allAbsences.filter((item) => {
          const s = item.dispo.dateDebut.split('T')[0];
          const e = item.dispo.dateFin.split('T')[0];
          return dateStr >= s && dateStr <= e;
        }),
      });
    }

    return cells;
  }, [year, month, allAbsences]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calcul des statistiques du mois
  const monthStats = useMemo(() => {
    const currentMonthCells = calendarCells.filter((c) => c.isCurrentMonth);
    let totalAbsentDays = 0;
    const absentTechIds = new Set<string>();

    for (const cell of currentMonthCells) {
      totalAbsentDays += cell.absences.length;
      for (const a of cell.absences) {
        absentTechIds.add(a.tech.id);
      }
    }

    const currentlyOnLeaveToday =
      calendarCells.find((c) => c.dateStr === todayStr)?.absences.length || 0;

    return {
      totalAbsentDays,
      distinctTechsAbsent: absentTechIds.size,
      currentlyOnLeaveToday,
    };
  }, [calendarCells, todayStr]);

  return (
    <div className="space-y-6">
      {/* Barre d'outils du calendrier */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation mois */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white text-slate-700 rounded-xl transition cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 hover:bg-white text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white text-slate-700 rounded-xl transition cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#31525B] tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Planning mensuel des congés et des disponibilités
            </p>
          </div>
        </div>

        {/* Filtre technicien & Action rapide */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedTechId}
              onChange={(e) => {
                setSelectedTechId(e.target.value);
                setSelectedDayDetail(null);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="TOUS">Tous les techniciens ({techniciens.length})</option>
              {techniciens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom} ({t.matricule})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (techniciens.length > 0) {
                onOpenAddAbsence(techniciens[0]);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FFA101] hover:bg-[#e59100] text-slate-950 rounded-2xl text-xs font-black transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Poser un congé</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI du planning mensuel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-[#31525B]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{filteredTechniciens.length}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Techniciens suivis
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6 text-[#FFA101]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{monthStats.totalAbsentDays}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jours d'absence cumulés ce mois
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#2E8B57]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {monthStats.currentlyOnLeaveToday}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              En congé aujourd'hui
            </div>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-black text-slate-600 py-3 uppercase tracking-wider">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mer</div>
          <div>Jeu</div>
          <div>Ven</div>
          <div className="text-[#31525B]">Sam</div>
          <div className="text-[#C0392B]">Dim</div>
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/50">
          {calendarCells.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const hasAbsence = cell.absences.length > 0;
            const isSelected = selectedDayDetail?.dateStr === cell.dateStr;

            return (
              <button
                type="button"
                key={cell.dateStr}
                onClick={() => setSelectedDayDetail(cell)}
                className={`min-h-[105px] p-2 transition flex flex-col justify-between cursor-pointer text-left w-full ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/60 opacity-40 hover:opacity-80'
                    : 'bg-white hover:bg-slate-50/80'
                } ${isSelected ? 'ring-2 ring-inset ring-[#FFA101]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-xs font-black rounded-full ${
                      isToday ? 'bg-[#FFA101] text-slate-950 shadow-xs' : 'text-slate-800'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {hasAbsence && <span className="w-2 h-2 rounded-full bg-[#FFA101]" />}
                </div>

                {/* Badges des techniciens en congé ce jour */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[68px]">
                  {cell.absences.slice(0, 2).map(({ tech, dispo }) => (
                    <div
                      key={`${tech.id}-${dispo.id}`}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold truncate bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1"
                      title={`${tech.prenom} ${tech.nom} (${dispo.motif || 'Absence'})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFA101] shrink-0" />
                      <span className="truncate">
                        {tech.prenom} {tech.nom.slice(0, 1)}.
                      </span>
                    </div>
                  ))}
                  {cell.absences.length > 2 && (
                    <div className="text-[10px] font-black text-slate-500 pl-1">
                      +{cell.absences.length - 2} autre(s)
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-semibold text-right">
                  {hasAbsence ? `${cell.absences.length} absent(s)` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Volet détail du jour sélectionné */}
      {selectedDayDetail && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#31525B] text-[#FFA101] flex items-center justify-center font-black text-sm">
                {new Date(selectedDayDetail.dateStr).getDate()}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Détail du{' '}
                  {new Date(selectedDayDetail.dateStr).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayDetail.absences.length === 0
                    ? 'Aucun technicien en congé ce jour-ci. Effectif complet disponible.'
                    : `${selectedDayDetail.absences.length} technicien(s) absent(s) sur cette date.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedDayDetail.absences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDayDetail.absences.map(({ tech, dispo }) => (
                <div
                  key={dispo.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#31525B]/10 flex items-center justify-center font-bold text-[#31525B]">
                      {tech.prenom[0]}
                      {tech.nom[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {tech.prenom} {tech.nom}
                      </div>
                      <div className="text-xs font-semibold text-[#FFA101]">
                        {dispo.motif || 'Congé'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Du {new Date(dispo.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                        {new Date(dispo.dateFin).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteAbsence(tech.id, dispo.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Supprimer cette période d'absence"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <User className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-bold text-slate-800">
                Tous les techniciens sont opérationnels
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Vous pouvez affecter des interventions sans risque de conflit d'agenda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
