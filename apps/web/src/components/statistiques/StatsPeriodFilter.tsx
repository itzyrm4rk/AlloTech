'use client';

import { PERIODE_OPTIONS, type Periode } from './types';

interface StatsPeriodFilterProps {
  periode: Periode;
  setPeriode: (p: Periode) => void;
  customStart: string;
  setCustomStart: (s: string) => void;
  customEnd: string;
  setCustomEnd: (s: string) => void;
}

export function StatsPeriodFilter({
  periode,
  setPeriode,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}: StatsPeriodFilterProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap items-center gap-3">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Période :</span>
      {PERIODE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setPeriode(opt.id)}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
            periode === opt.id
              ? 'bg-[#31525B] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setPeriode('custom')}
        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
          periode === 'custom'
            ? 'bg-[#FFA101] text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Personnalisé
      </button>
      {periode === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-medium"
          />
          <span className="text-slate-400 text-xs">au</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-medium"
          />
        </div>
      )}
    </div>
  );
}
