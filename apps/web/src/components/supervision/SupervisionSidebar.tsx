'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Flame,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { STATUT_LABELS, type SupervisionTicket, URGENCE_COLORS } from './types';

interface SupervisionSidebarProps {
  tickets: SupervisionTicket[];
  loading: boolean;
  selectedTicketId: string | null;
  onSelectTicket: (ticket: SupervisionTicket) => void;
  search: string;
  onSearchChange: (search: string) => void;
  filterUrgence: string;
  onFilterUrgenceChange: (urgence: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
}

const URGENCE_OPTIONS = [
  { id: 'TOUTES', label: 'Toutes urgences', icon: Layers, color: 'text-slate-500' },
  { id: 'CRITIQUE', label: 'Critique', icon: Zap, color: 'text-red-600' },
  { id: 'HAUTE', label: 'Haute', icon: Flame, color: 'text-orange-600' },
  { id: 'NORMALE', label: 'Normale', icon: Clock, color: 'text-[#31525B]' },
  { id: 'BASSE', label: 'Basse', icon: ShieldCheck, color: 'text-slate-500' },
];

const TYPE_OPTIONS = [
  { id: 'TOUS', label: 'Tous types', icon: Filter, color: 'text-slate-500' },
  { id: 'PANNE', label: 'Pannes', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'INSTALLATION', label: 'Installations', icon: Wrench, color: 'text-[#31525B]' },
];

export function SupervisionSidebar({
  tickets,
  loading,
  selectedTicketId,
  onSelectTicket,
  search,
  onSearchChange,
  filterUrgence,
  onFilterUrgenceChange,
  filterType,
  onFilterTypeChange,
}: SupervisionSidebarProps) {
  const [urgenceDropdownOpen, setUrgenceDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const urgenceRef = useRef<HTMLDivElement | null>(null);
  const typeRef = useRef<HTMLDivElement | null>(null);

  // Fermer les dropdowns lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (urgenceRef.current && !urgenceRef.current.contains(event.target as Node)) {
        setUrgenceDropdownOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeUrgence =
    URGENCE_OPTIONS.find((opt) => opt.id === filterUrgence) || URGENCE_OPTIONS[0];
  const activeType = TYPE_OPTIONS.find((opt) => opt.id === filterType) || TYPE_OPTIONS[0];

  const filteredTickets = tickets.filter((t) => {
    if (filterUrgence !== 'TOUTES' && t.urgence !== filterUrgence) return false;
    if (filterType !== 'TOUS' && t.typeDemande !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.reference.toLowerCase().includes(q) ||
        t.client?.nom?.toLowerCase().includes(q) ||
        t.adresseSite.toLowerCase().includes(q) ||
        t.techniciens.some(
          (tech) =>
            tech.nom.toLowerCase().includes(q) ||
            tech.prenom.toLowerCase().includes(q) ||
            tech.matricule.toLowerCase().includes(q),
        )
      );
    }
    return true;
  });

  return (
    <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg z-10">
      {/* Barre de recherche et filtres */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher client, référence, technicien..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#31525B] focus:ring-1 focus:ring-[#31525B]"
          />
        </div>

        {/* Sélecteurs avec icônes Lucide */}
        <div className="flex items-center gap-2">
          {/* Dropdown Urgence */}
          <div ref={urgenceRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setUrgenceDropdownOpen((prev) => !prev);
                setTypeDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <activeUrgence.icon className={`w-3.5 h-3.5 shrink-0 ${activeUrgence.color}`} />
                <span className="truncate">{activeUrgence.label}</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${urgenceDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {urgenceDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
                {URGENCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = filterUrgence === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        onFilterUrgenceChange(opt.id);
                        setUrgenceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#31525B]/10 text-[#31525B]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${opt.color}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#31525B]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dropdown Type */}
          <div ref={typeRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setTypeDropdownOpen((prev) => !prev);
                setUrgenceDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <activeType.icon className={`w-3.5 h-3.5 shrink-0 ${activeType.color}`} />
                <span className="truncate">{activeType.label}</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {typeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = filterType === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        onFilterTypeChange(opt.id);
                        setTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#31525B]/10 text-[#31525B]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${opt.color}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#31525B]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#31525B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Chargement de la supervision...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">Aucune intervention active correspondant aux filtres.</p>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            const statCfg = STATUT_LABELS[t.statutActuel] || {
              label: t.statutActuel,
              color: '#64748B',
            };
            const urgCfg = URGENCE_COLORS[t.urgence] || URGENCE_COLORS.NORMALE;

            return (
              <button
                type="button"
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className={`w-full p-3.5 rounded-2xl transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#31525B]/5 border-2 border-[#31525B] shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {t.reference}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${urgCfg.bg} ${urgCfg.text} ${urgCfg.border}`}
                    >
                      {urgCfg.label}
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${statCfg.color}15`, color: statCfg.color }}
                  >
                    ● {statCfg.label}
                  </span>
                </div>

                <p className="text-xs font-black text-slate-900 line-clamp-1 mb-1">
                  {t.client?.nom || 'Client non renseigné'}
                </p>

                <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1 mb-2">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {t.adresseSite}
                </p>

                {/* Barre de progression SLA */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Échéance SLA :</span>
                    <strong
                      className={
                        t.sla.isDepasse
                          ? 'text-red-600 font-extrabold'
                          : t.sla.isImminent
                            ? 'text-amber-600 font-bold'
                            : 'text-emerald-700 font-medium'
                      }
                    >
                      {t.sla.isDepasse ? 'DÉPASSÉ' : `${t.sla.remainingMinutes} min restantes`}
                    </strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        t.sla.isDepasse
                          ? 'bg-red-500'
                          : t.sla.isImminent
                            ? 'bg-amber-500'
                            : 'bg-[#31525B]'
                      }`}
                      style={{ width: `${t.sla.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Technicien en charge */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {t.techniciens.length > 0
                      ? t.techniciens.map((tech) => `${tech.prenom} ${tech.nom}`).join(', ')
                      : 'Aucun technicien'}
                  </span>

                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[#31525B] hover:text-[#FFA101] font-bold transition"
                  >
                    Ouvrir <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
