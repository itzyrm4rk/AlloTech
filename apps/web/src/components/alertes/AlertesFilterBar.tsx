'use client';

import { ALERTE_TABS } from './types';

interface AlertesFilterBarProps {
  filterType: string;
  setFilterType: (type: string) => void;
  nonLuesOnly: boolean;
  setNonLuesOnly: (val: boolean) => void;
}

export function AlertesFilterBar({
  filterType,
  setFilterType,
  nonLuesOnly,
  setNonLuesOnly,
}: AlertesFilterBarProps) {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
      {/* Onglets par type */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ALERTE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#31525B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtre non lues */}
      <label
        htmlFor="alertes-non-lues"
        className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none"
      >
        <input
          id="alertes-non-lues"
          type="checkbox"
          checked={nonLuesOnly}
          onChange={(e) => setNonLuesOnly(e.target.checked)}
          className="rounded border-slate-300 text-[#31525B] focus:ring-[#31525B]"
        />
        <span>Non lues uniquement</span>
      </label>
    </div>
  );
}
