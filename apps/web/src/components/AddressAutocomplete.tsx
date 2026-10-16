'use client';

import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface LocationData {
  address: string;
  latitude?: string;
  longitude?: string;
}

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation?: (loc: LocationData) => void;
  placeholder?: string;
  error?: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
}

export function AddressAutocomplete({
  id = 'address-autocomplete',
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Saisissez un quartier, repère ou adresse (ex: Akwa, Douala)...',
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer la liste déroulante au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (!value || value.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = value.trim();
        // Recherche via Photon OpenStreetMap (service mondial gratuit sans clé)
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.features || []);
          setIsOpen(true);
        }
      } catch {
        // En cas d'indisponibilité réseau, laisser la saisie libre
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value, hasSelected]);

  const formatAddress = (feature: PhotonFeature): string => {
    const p = feature.properties;
    const parts = [
      p.name,
      p.street ? `${p.housenumber || ''} ${p.street}`.trim() : null,
      p.district,
      p.city,
      p.state,
      p.country,
    ].filter(Boolean);

    // Supprime les doublons consécutifs
    return Array.from(new Set(parts)).join(', ');
  };

  const handleSelect = (feature: PhotonFeature) => {
    const formatted = formatAddress(feature);
    const [lon, lat] = feature.geometry.coordinates;

    setHasSelected(true);
    onChange(formatted);
    setIsOpen(false);
    setSuggestions([]);

    onSelectLocation?.({
      address: formatted,
      latitude: lat.toString(),
      longitude: lon.toString(),
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            setHasSelected(false);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border ${
            error ? 'border-red-400' : 'border-slate-200'
          } rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#FFA101]" />}
          {value && !loading && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setHasSelected(false);
                setSuggestions([]);
                onSelectLocation?.({ address: '' });
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Liste déroulante des suggestions géographiques */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3 h-3 text-[#31525B]" />
            Suggestions de localisation (OpenStreetMap)
          </div>

          {suggestions.map((feature) => {
            const formatted = formatAddress(feature);
            const [lon, lat] = feature.geometry.coordinates;

            return (
              <button
                key={`${lat}-${lon}-${formatted}`}
                type="button"
                onClick={() => handleSelect(feature)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/50 transition-colors flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-[#31525B]/10 flex items-center justify-center text-[#31525B] shrink-0 mt-0.5 group-hover:bg-[#FFA101]/20 group-hover:text-[#FFA101]">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#31525B]">
                    {feature.properties.name || formatted}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{formatted}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-300 mt-1 shrink-0">
                  {lat.toFixed(3)}, {lon.toFixed(3)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
}
