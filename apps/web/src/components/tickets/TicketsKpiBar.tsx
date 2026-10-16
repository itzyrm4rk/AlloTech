'use client';

import type { KPI, Statut, Urgence } from './types';

interface TicketsKpiBarProps {
  kpi: KPI;
  statutFilter: Statut | 'TOUS';
  onFilterChange: (statut: Statut | 'TOUS') => void;
  urgenceFilter?: Urgence | 'TOUTES';
  onUrgenceChange?: (urg: Urgence | 'TOUTES') => void;
}

export function TicketsKpiBar({
  kpi,
  statutFilter,
  onFilterChange,
  urgenceFilter,
  onUrgenceChange,
}: TicketsKpiBarProps) {
  const isCritiqueActive = urgenceFilter === 'CRITIQUE';

  const items = [
    {
      label: 'Total',
      value: kpi.total,
      color: 'text-slate-900',
      isActive: statutFilter === 'TOUS' && !isCritiqueActive,
      onClick: () => {
        onUrgenceChange?.('TOUTES');
        onFilterChange('TOUS');
      },
    },
    {
      label: 'Non assignés',
      value: kpi.creees,
      color: 'text-slate-600',
      isActive: statutFilter === 'CREEE',
      onClick: () => {
        onUrgenceChange?.('TOUTES');
        onFilterChange('CREEE');
      },
    },
    {
      label: 'En cours',
      value: kpi.enCours,
      color: 'text-amber-600',
      isActive: statutFilter === 'EN_COURS',
      onClick: () => {
        onUrgenceChange?.('TOUTES');
        onFilterChange('EN_COURS');
      },
    },
    {
      label: 'Critiques actives',
      value: kpi.critiques,
      color: 'text-red-600',
      isActive: isCritiqueActive,
      onClick: () => {
        if (isCritiqueActive) {
          onUrgenceChange?.('TOUTES');
        } else {
          onUrgenceChange?.('CRITIQUE');
          onFilterChange('TOUS');
        }
      },
    },
    {
      label: 'Terminés',
      value: kpi.terminees,
      color: 'text-emerald-600',
      isActive: statutFilter === 'TERMINEE' || statutFilter === 'CLOTUREE',
      onClick: () => {
        onUrgenceChange?.('TOUTES');
        onFilterChange('TERMINEE');
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((k) => (
        <button
          type="button"
          key={k.label}
          onClick={k.onClick}
          className={`bg-white border rounded-xl px-4 py-3 text-center transition-all group shadow-xs cursor-pointer ${
            k.isActive
              ? 'border-[#31525B] ring-2 ring-[#31525B]/20 bg-slate-50/50'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{k.label}</p>
        </button>
      ))}
    </div>
  );
}
