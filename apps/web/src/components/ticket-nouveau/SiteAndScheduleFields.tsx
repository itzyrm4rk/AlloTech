'use client';

import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Calendar, CheckCircle, Clock, Sun, SunMedium, X, Zap } from 'lucide-react';
import { formatFrenchDate } from './types';

interface SiteAndScheduleFieldsProps {
  adresseSite: string;
  latitudeSite: string;
  longitudeSite: string;
  onAddressChange: (val: string) => void;
  onSelectLocation: (loc: { address: string; latitude?: string; longitude?: string }) => void;
  addressError?: string;
  dateSouhaitee: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDate: () => void;
  onApplyDatePreset: (hoursToAdd: number, targetHour?: number) => void;
  commentaire: string;
  onCommentaireChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SiteAndScheduleFields({
  adresseSite,
  latitudeSite,
  longitudeSite,
  onAddressChange,
  onSelectLocation,
  addressError,
  dateSouhaitee,
  onDateChange,
  onClearDate,
  onApplyDatePreset,
  commentaire,
  onCommentaireChange,
}: SiteAndScheduleFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="adresseSite" className="block text-xs font-bold text-slate-600 mb-1.5">
          Adresse précise du site d'intervention *
        </label>
        <AddressAutocomplete
          id="adresseSite"
          value={adresseSite}
          onChange={onAddressChange}
          onSelectLocation={onSelectLocation}
          error={addressError}
          placeholder="Rechercher un quartier, carrefour ou adresse (ex: Akwa, Bonanjo, Douala)..."
        />
        {latitudeSite && longitudeSite && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Coordonnées GPS capturées ({Number.parseFloat(latitudeSite).toFixed(4)},{' '}
              {Number.parseFloat(longitudeSite).toFixed(4)}) — Itinéraire technicien optimisé
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date & Heure souhaitée améliorée */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="dateSouhaitee" className="block text-xs font-bold text-slate-600">
              Date &amp; Heure souhaitée
            </label>
            <span className="text-[11px] text-slate-400">Planification terrain</span>
          </div>

          {/* Raccourcis rapides */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onApplyDatePreset(2)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-[#31525B]/10 hover:text-[#31525B] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition cursor-pointer"
            >
              <Zap className="w-3 h-3 text-[#FFA101]" />
              +2h (Urgence)
            </button>
            <button
              type="button"
              onClick={() => onApplyDatePreset(24, 9)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-[#31525B]/10 hover:text-[#31525B] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition cursor-pointer"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              Demain 09h
            </button>
            <button
              type="button"
              onClick={() => onApplyDatePreset(24, 14)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-[#31525B]/10 hover:text-[#31525B] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition cursor-pointer"
            >
              <SunMedium className="w-3 h-3 text-amber-600" />
              Demain 14h
            </button>
            <button
              type="button"
              onClick={() => onApplyDatePreset(48, 9)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-[#31525B]/10 hover:text-[#31525B] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-sky-600" />
              Dans 48h
            </button>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="dateSouhaitee"
              type="datetime-local"
              value={dateSouhaitee}
              onChange={onDateChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition"
            />
          </div>

          {dateSouhaitee && (
            <div className="flex items-center justify-between text-xs text-[#31525B] bg-[#31525B]/5 px-3 py-2 rounded-xl border border-[#31525B]/15 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FFA101] shrink-0" />
                <span className="font-semibold capitalize">{formatFrenchDate(dateSouhaitee)}</span>
              </div>
              <button
                type="button"
                onClick={onClearDate}
                className="text-slate-400 hover:text-red-600 transition p-0.5 rounded cursor-pointer"
                title="Effacer la date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="commentaire" className="block text-xs font-bold text-slate-600 mb-1.5">
            Commentaire interne (optionnel)
          </label>
          <input
            id="commentaire"
            type="text"
            placeholder="Consignes particulières pour l'équipe..."
            value={commentaire}
            onChange={onCommentaireChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition"
          />
        </div>
      </div>
    </>
  );
}
