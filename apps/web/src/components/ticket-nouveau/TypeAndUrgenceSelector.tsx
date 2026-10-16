'use client';

import { AlertTriangle, Cpu } from 'lucide-react';
import { type TicketFormState, URGENCE_OPTIONS } from './types';

interface TypeAndUrgenceSelectorProps {
  typeDemande: 'PANNE' | 'INSTALLATION';
  onTypeChange: (type: 'PANNE' | 'INSTALLATION') => void;
  urgence: TicketFormState['urgence'];
  onUrgenceChange: (urg: TicketFormState['urgence']) => void;
}

export function TypeAndUrgenceSelector({
  typeDemande,
  onTypeChange,
  urgence,
  onUrgenceChange,
}: TypeAndUrgenceSelectorProps) {
  return (
    <>
      {/* Type de demande */}
      <div className="grid grid-cols-2 gap-3">
        {(['PANNE', 'INSTALLATION'] as const).map((type) => (
          <button
            key={type}
            type="button"
            id={`type-${type}`}
            onClick={() => onTypeChange(type)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition cursor-pointer ${
              typeDemande === type
                ? 'bg-[#31525B] border-[#31525B] text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {type === 'PANNE' ? (
              <AlertTriangle
                className={`w-4 h-4 ${typeDemande === type ? 'text-[#FFA101]' : ''}`}
              />
            ) : (
              <Cpu className={`w-4 h-4 ${typeDemande === type ? 'text-[#FFA101]' : ''}`} />
            )}
            {type === 'PANNE' ? 'Panne / Réparation' : 'Nouvelle Installation'}
          </button>
        ))}
      </div>

      {/* Urgence */}
      <div>
        <p className="block text-xs font-bold text-slate-600 mb-2">Niveau d'urgence (SLA) *</p>
        <div className="grid grid-cols-2 gap-2.5">
          {URGENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              id={`urgence-${opt.value}`}
              onClick={() => onUrgenceChange(opt.value as TicketFormState['urgence'])}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                urgence === opt.value
                  ? opt.color
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="text-[11px] mt-0.5 opacity-80 leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
