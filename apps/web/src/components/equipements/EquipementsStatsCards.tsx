'use client';

interface KPIStats {
  total: number;
  materiels: number;
  logiciels: number;
  enService: number;
  enPanne: number;
  enReforme: number;
  health: {
    excellent: number;
    surveillance: number;
    critique: number;
  };
}

interface EquipementsStatsCardsProps {
  kpis: KPIStats;
  statutFilter: 'TOUS' | 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME';
  onSelectStatut: (statut: 'TOUS' | 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME') => void;
}

export function EquipementsStatsCards({
  kpis,
  statutFilter,
  onSelectStatut,
}: EquipementsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Tous les équipements */}
      <button
        type="button"
        onClick={() => onSelectStatut('TOUS')}
        className={`p-4 rounded-2xl border text-left transition-all bg-white shadow-xs cursor-pointer ${
          statutFilter === 'TOUS'
            ? 'border-[#31525B] ring-2 ring-[#31525B]/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <p className="text-2xl font-black text-slate-900">{kpis.total}</p>
        <p className="text-xs font-bold text-slate-500 mt-0.5">Tous les équipements</p>
      </button>

      {/* En service */}
      <button
        type="button"
        onClick={() => onSelectStatut(statutFilter === 'EN_SERVICE' ? 'TOUS' : 'EN_SERVICE')}
        className={`p-4 rounded-2xl border text-left transition-all bg-white shadow-xs cursor-pointer ${
          statutFilter === 'EN_SERVICE'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <p className="text-2xl font-black text-emerald-700">{kpis.enService}</p>
        <p className="text-xs font-bold text-emerald-600 mt-0.5">En service opérationnel</p>
      </button>

      {/* En panne */}
      <button
        type="button"
        onClick={() => onSelectStatut(statutFilter === 'EN_PANNE' ? 'TOUS' : 'EN_PANNE')}
        className={`p-4 rounded-2xl border text-left transition-all bg-white shadow-xs cursor-pointer ${
          statutFilter === 'EN_PANNE'
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : 'border-slate-200 hover:border-rose-300'
        }`}
      >
        <p className="text-2xl font-black text-rose-700">{kpis.enPanne}</p>
        <p className="text-xs font-bold text-rose-600 mt-0.5">En panne / maintenance</p>
      </button>

      {/* Mis au rebut */}
      <button
        type="button"
        onClick={() => onSelectStatut(statutFilter === 'EN_REFORME' ? 'TOUS' : 'EN_REFORME')}
        className={`p-4 rounded-2xl border text-left transition-all bg-white shadow-xs cursor-pointer ${
          statutFilter === 'EN_REFORME'
            ? 'border-slate-500 ring-2 ring-slate-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <p className="text-2xl font-black text-slate-600">{kpis.enReforme}</p>
        <p className="text-xs font-bold text-slate-500 mt-0.5">Mis au rebut / Réforme</p>
      </button>
    </div>
  );
}
